import sys
import requests
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import League, User, Roster, DraftPick, MatchupHistory, SleeperTransaction

def fetch_sleeper_data(league_id: str):
    base_url = "https://api.sleeper.app/v1/league"
    
    # Fetch League
    print(f"Fetching league info for {league_id}...")
    resp = requests.get(f"{base_url}/{league_id}")
    if resp.status_code != 200:
        print(f"Error fetching league: {resp.status_code}")
        return None
    league_data = resp.json()

    # Fetch Users
    print("Fetching users...")
    resp = requests.get(f"{base_url}/{league_id}/users")
    users_data = resp.json() if resp.status_code == 200 else []

    # Fetch Rosters
    print("Fetching rosters...")
    resp = requests.get(f"{base_url}/{league_id}/rosters")
    rosters_data = resp.json() if resp.status_code == 200 else []

    # Fetch Traded Picks
    print("Fetching traded picks...")
    resp = requests.get(f"{base_url}/{league_id}/traded_picks")
    traded_picks_data = resp.json() if resp.status_code == 200 else []

    # Fetch Matchups and Transactions for weeks 1-18
    print("Fetching matchups and transactions...")
    matchups_data = {}
    transactions_data = {}
    for week in range(1, 19):
        m_resp = requests.get(f"{base_url}/{league_id}/matchups/{week}")
        if m_resp.status_code == 200:
            matchups_data[week] = m_resp.json()
            
        t_resp = requests.get(f"{base_url}/{league_id}/transactions/{week}")
        if t_resp.status_code == 200:
            transactions_data[week] = t_resp.json()

    return league_data, users_data, rosters_data, traded_picks_data, matchups_data, transactions_data

def ingest_data(league_id: str):
    init_db()
    data = fetch_sleeper_data(league_id)
    if not data:
        return
    league_data, users_data, rosters_data, traded_picks_data, matchups_data, transactions_data = data

    db: Session = SessionLocal()

    try:
        # 1. Upsert League
        league = db.query(League).filter(League.league_id == league_id).first()
        if not league:
            league = League(league_id=league_id)
            db.add(league)
        
        league.name = league_data.get("name")
        league.season = league_data.get("season")
        league.status = league_data.get("status")
        league.roster_positions = league_data.get("roster_positions")
        league.scoring_settings = league_data.get("scoring_settings")
        league.settings = league_data.get("settings")

        db.commit()

        # 2. Upsert Users
        for u in users_data:
            user_id = str(u.get("user_id"))
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                user = User(user_id=user_id)
                db.add(user)
            user.display_name = u.get("display_name")
            user.avatar = u.get("avatar")
            # Can store other user info later
        db.commit()

        # 3. Upsert Rosters
        for r in rosters_data:
            r_id_int = r.get("roster_id")
            global_r_id = f"{league_id}_{r_id_int}"
            
            roster = db.query(Roster).filter(Roster.id == global_r_id).first()
            if not roster:
                roster = Roster(id=global_r_id)
                db.add(roster)
            
            roster.roster_id = r_id_int
            roster.league_id = league_id
            roster.owner_id = str(r.get("owner_id")) if r.get("owner_id") else None
            
            settings = r.get("settings", {})
            roster.wins = settings.get("wins", 0)
            roster.losses = settings.get("losses", 0)
            roster.ties = settings.get("ties", 0)
            roster.fpts = settings.get("fpts", 0.0) + (settings.get("fpts_decimal", 0.0) / 100.0)
            
            roster.players = r.get("players", [])
            roster.starters = r.get("starters", [])
            roster.reserve = r.get("reserve", [])
            roster.taxi = r.get("taxi", [])
            roster.settings = settings
            
        db.commit()

        # 4. Upsert Draft Picks
        # First, clear existing picks for this league to avoid duplicates during updates
        # Alternatively, could update them, but clearing and recreating is easier
        db.query(DraftPick).filter(DraftPick.league_id == league_id).delete()
        
        draft_rounds = league_data.get("settings", {}).get("draft_rounds", 3) # default 3 if not specified
        current_season = int(league_data.get("season", 2024))
        
        # Determine all native picks
        # Typically you draft up to 3 years out in dynasty
        seasons_to_project = [str(current_season), str(current_season + 1), str(current_season + 2)]
        
        # Generate baseline picks for all rosters
        for r in rosters_data:
            r_id_int = r.get("roster_id")
            global_r_id = f"{league_id}_{r_id_int}"
            
            for season in seasons_to_project:
                for rnd in range(1, draft_rounds + 1):
                    dp = DraftPick(
                        league_id=league_id,
                        season=season,
                        round=rnd,
                        roster_id=global_r_id, # Original owner
                        owner_id=global_r_id   # Current owner (default)
                    )
                    db.add(dp)
        
        db.flush()

        # Apply traded picks logic
        for tp in traded_picks_data:
            # tp looks like: {"season": "2024", "round": 1, "roster_id": 1, "owner_id": 2, "previous_owner_id": 1}
            # roster_id is the ORIGINAL owner's roster_id.
            # owner_id is the NEW owner's roster_id.
            season = tp.get("season")
            rnd = tp.get("round")
            orig_r_id_int = tp.get("roster_id")
            new_r_id_int = tp.get("owner_id")
            
            orig_global_r_id = f"{league_id}_{orig_r_id_int}"
            new_global_r_id = f"{league_id}_{new_r_id_int}"
            
            # Find the pick and update its owner
            pick = db.query(DraftPick).filter_by(
                league_id=league_id,
                season=season,
                round=rnd,
                roster_id=orig_global_r_id
            ).first()
            
            if pick:
                pick.owner_id = new_global_r_id

        # Ingest Matchups
        print("Ingesting Matchups...")
        db.query(MatchupHistory).filter(MatchupHistory.league_id == league_id, MatchupHistory.season == str(current_season)).delete()
        for week, matchups in matchups_data.items():
            for m in matchups:
                if m.get("roster_id"):
                    db.add(MatchupHistory(
                        league_id=league_id,
                        season=str(current_season),
                        week=week,
                        roster_id=f"{league_id}_{m.get('roster_id')}",
                        matchup_id=m.get("matchup_id"),
                        points=m.get("points", 0.0),
                        starters=m.get("starters", []),
                        starters_points=m.get("starters_points", []),
                        players=m.get("players", []),
                        players_points=m.get("players_points", {})
                    ))
                    
        # Ingest Transactions
        print("Ingesting Transactions...")
        for week, transactions in transactions_data.items():
            for t in transactions:
                t_id = t.get("transaction_id")
                # Only add if it doesn't exist
                if not db.query(SleeperTransaction).filter_by(id=t_id).first():
                    db.add(SleeperTransaction(
                        id=t_id,
                        league_id=league_id,
                        season=str(current_season),
                        week=week,
                        type=t.get("type"),
                        status=t.get("status"),
                        adds=t.get("adds"),
                        drops=t.get("drops"),
                        draft_picks=t.get("draft_picks"),
                        creator_roster_id=t.get("creator")[0] if isinstance(t.get("creator"), list) else None,
                        consenter_roster_ids=t.get("consenter_roster_ids")
                    ))

        db.commit()
        print("Data successfully ingested!")

    except Exception as e:
        print(f"Error during ingestion: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        league_id = sys.argv[1]
    else:
        # Default testing league
        league_id = "1103525203001847808"
    
    ingest_data(league_id)
