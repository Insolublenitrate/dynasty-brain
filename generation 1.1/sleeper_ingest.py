import sys
import requests
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import League, User, Roster, DraftPick

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

    return league_data, users_data, rosters_data, traded_picks_data

def ingest_data(league_id: str):
    init_db()
    data = fetch_sleeper_data(league_id)
    if not data:
        return
    league_data, users_data, rosters_data, traded_picks_data = data

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
