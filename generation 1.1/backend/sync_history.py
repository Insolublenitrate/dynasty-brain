import requests
import sys
from database import SessionLocal
from models import LeagueHistory

def sync_history(current_league_id):
    session = SessionLocal()
    
    league_info = requests.get(f"https://api.sleeper.app/v1/league/{current_league_id}").json()
    if not league_info:
        print("League not found.")
        return
        
    print(f"Syncing history for league chain starting at {current_league_id}...")
    
    # We trace backwards
    curr_id = current_league_id
    
    while curr_id:
        league = requests.get(f"https://api.sleeper.app/v1/league/{curr_id}").json()
        if not league:
            break
            
        season = league.get("season")
        
        print(f"Processing Season {season} (League ID: {curr_id})...")
        
        winners = requests.get(f"https://api.sleeper.app/v1/league/{curr_id}/winners_bracket").json()
        losers = requests.get(f"https://api.sleeper.app/v1/league/{curr_id}/losers_bracket").json()
        
        champion = None
        second = None
        third = None
        last = None
        
        if winners and type(winners) == list:
            for m in winners:
                if m.get("p") == 1:
                    champion = m.get("w")
                    second = m.get("l")
                elif m.get("p") == 3:
                    third = m.get("w")
                    
        if losers and type(losers) == list:
            max_p = -1
            for m in losers:
                p_val = m.get("p")
                if p_val is not None and p_val > max_p:
                    max_p = p_val
            
            for m in losers:
                if m.get("p") == max_p:
                    last = m.get("l")
                    break
        
        if champion or last:
            history_record = session.query(LeagueHistory).filter(
                LeagueHistory.league_id == current_league_id,
                LeagueHistory.season == str(season)
            ).first()
            
            if not history_record:
                history_record = LeagueHistory(
                    league_id=current_league_id,
                    season=str(season)
                )
                session.add(history_record)
            
            if champion: history_record.champion_roster_id = f"{current_league_id}_{champion}"
            if second: history_record.second_place_roster_id = f"{current_league_id}_{second}"
            if third: history_record.third_place_roster_id = f"{current_league_id}_{third}"
            if last: history_record.last_place_roster_id = f"{current_league_id}_{last}"
            
        curr_id = league.get("previous_league_id")
        
    session.commit()
    session.close()
    print("League history successfully synchronized.")

if __name__ == "__main__":
    target = "1312567432052760576"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    sync_history(target)
