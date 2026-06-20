import os
import requests
from dotenv import load_dotenv
from database import SessionLocal, init_db
from models import NCAAStats

def ingest_ncaa_stats():
    load_dotenv()
    api_key = os.environ.get("CFBD_API_KEY")
    if not api_key:
        print("Error: No CFBD_API_KEY found in .env")
        return
        
    db = SessionLocal()
    headers = {
        'Authorization': f'Bearer {api_key}',
        'User-Agent': 'Mozilla/5.0'
    }
    
    years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    total_inserted = 0
    
    # First, let's delete all existing records to ensure a fresh clean ingestion
    print("Clearing old NCAAStats data...")
    db.query(NCAAStats).delete()
    db.commit()
    
    for year in years:
        print(f"[CFBD] Fetching stats for {year}...")
        url = f"https://api.collegefootballdata.com/stats/player/season?year={year}&seasonType=both"
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                print(f"Failed to fetch {year}: {resp.status_code}")
                continue
                
            raw_data = resp.json()
            players = {}
            
            for row in raw_data:
                pid = row.get("playerId")
                if not pid:
                    continue
                    
                if pid not in players:
                    players[pid] = {
                        "player_id": str(pid),
                        "player_name": row.get("player"),
                        "college": row.get("team"),
                        "season": year,
                        "data_source": "cfbstats",
                        "games_played": 12, # CFBD doesn't reliably give games played
                        "passing_yards": 0,
                        "passing_tds": 0,
                        "rushing_yards": 0,
                        "rushing_tds": 0,
                        "receptions": 0,
                        "receiving_yards": 0,
                        "receiving_tds": 0,
                    }
                    
                cat = row.get("category")
                stat_type = row.get("statType")
                val = row.get("stat", 0)
                
                try:
                    val = float(val)
                except:
                    val = 0
                    
                if cat == "passing":
                    if stat_type == "YDS": players[pid]["passing_yards"] += int(val)
                    elif stat_type == "TD": players[pid]["passing_tds"] += int(val)
                elif cat == "rushing":
                    if stat_type == "YDS": players[pid]["rushing_yards"] += int(val)
                    elif stat_type == "TD": players[pid]["rushing_tds"] += int(val)
                elif cat == "receiving":
                    if stat_type == "REC": players[pid]["receptions"] += int(val)
                    elif stat_type == "YDS": players[pid]["receiving_yards"] += int(val)
                    elif stat_type == "TD": players[pid]["receiving_tds"] += int(val)
                    
            for pid, data in players.items():
                db.add(NCAAStats(**data))
            
            db.commit()
            count = len(players)
            total_inserted += count
            print(f"Inserted {count} players for {year}")
            
        except Exception as e:
            print(f"Error fetching {year}: {e}")
            
    print(f"NCAA Ingestion Complete! Total records inserted: {total_inserted}")
    db.close()

if __name__ == "__main__":
    ingest_ncaa_stats()
