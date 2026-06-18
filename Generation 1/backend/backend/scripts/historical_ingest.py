import sys
import os
import requests

# Add parent directory to path so we can import from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, init_db
from models import League, Roster, MatchupHistory, LeagueHistory

def ingest_historical_data(current_league_id: str):
    init_db()
    db = SessionLocal()

    base_url = "https://api.sleeper.app/v1/league"
    league_id = current_league_id
    
    # We will traverse backwards
    try:
        while league_id:
            print(f"Processing league ID: {league_id}")
            
            # 1. Fetch league info
            resp = requests.get(f"{base_url}/{league_id}")
            if resp.status_code != 200:
                print(f"Failed to fetch league {league_id}. Stopping.")
                break
            
            league_data = resp.json()
            if not league_data:
                break
                
            season = league_data.get("season")
            previous_league_id = league_data.get("previous_league_id")
            
            # For historical matchups, we just map them by roster_id. 
            # In Sleeper Dynasty, roster_id 1 is always roster_id 1 across years.
            # We map it to the CURRENT league's global roster ID so we can query easily.
            
            # 2. Fetch Matchups (weeks 1 to 18)
            db.query(MatchupHistory).filter(MatchupHistory.season == season).delete()
            
            for week in range(1, 19):
                m_resp = requests.get(f"{base_url}/{league_id}/matchups/{week}")
                if m_resp.status_code != 200:
                    continue
                matchups = m_resp.json()
                if not matchups:
                    break # No more weeks
                
                paired = {}
                for m in matchups:
                    m_id = m.get("matchup_id")
                    if m_id not in paired:
                        paired[m_id] = []
                    paired[m_id].append(m)
                
                for m_id, teams in paired.items():
                    if len(teams) == 2:
                        team_a, team_b = teams[0], teams[1]
                        
                        r_id_a = team_a.get("roster_id")
                        r_id_b = team_b.get("roster_id")
                        pts_a = team_a.get("points")
                        pts_b = team_b.get("points")
                        
                        global_r_a = f"{current_league_id}_{r_id_a}"
                        global_r_b = f"{current_league_id}_{r_id_b}"
                        
                        win_a = 1 if pts_a > pts_b else (0 if pts_a < pts_b else -1)
                        win_b = 1 if pts_b > pts_a else (0 if pts_b < pts_a else -1)
                        
                        db.add(MatchupHistory(
                            league_id=current_league_id,
                            season=season,
                            week=week,
                            roster_id=global_r_a,
                            opponent_roster_id=global_r_b,
                            points=pts_a,
                            opponent_points=pts_b,
                            is_win=win_a
                        ))
                        
                        db.add(MatchupHistory(
                            league_id=current_league_id,
                            season=season,
                            week=week,
                            roster_id=global_r_b,
                            opponent_roster_id=global_r_a,
                            points=pts_b,
                            opponent_points=pts_a,
                            is_win=win_b
                        ))

            # 3. Fetch Brackets for Champions / Worst Performers
            wb_resp = requests.get(f"{base_url}/{league_id}/winners_bracket")
            lb_resp = requests.get(f"{base_url}/{league_id}/losers_bracket")
            
            champion_roster_id = None
            last_place_roster_id = None
            
            if wb_resp.status_code == 200:
                wb = wb_resp.json()
                if wb:
                    championship_match = next((m for m in wb if m.get("p") == 1), None)
                    if championship_match:
                        winner = championship_match.get("w")
                        if winner:
                            champion_roster_id = f"{current_league_id}_{winner}"
                            
            if lb_resp.status_code == 200:
                lb = lb_resp.json()
                if lb:
                    max_p = max((m.get("p", 0) for m in lb), default=0)
                    if max_p > 0:
                        toilet_bowl = next((m for m in lb if m.get("p") == max_p), None)
                        if toilet_bowl:
                            loser = toilet_bowl.get("l")
                            if loser:
                                last_place_roster_id = f"{current_league_id}_{loser}"

            db.query(LeagueHistory).filter(LeagueHistory.season == season).delete()
            db.add(LeagueHistory(
                league_id=current_league_id,
                season=season,
                champion_roster_id=champion_roster_id,
                last_place_roster_id=last_place_roster_id
            ))
            
            db.commit()
            print(f"Finished {season}")
            league_id = previous_league_id
            
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        league_id = sys.argv[1]
    else:
        league_id = "1312567432052760576"
    print(f"Starting historical ingest for {league_id}")
    ingest_historical_data(league_id)
