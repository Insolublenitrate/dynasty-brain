import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

class BaseScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        
    def _delay(self):
        pass

class CFBDScraper(BaseScraper):
    """CollegeFootballData.com API Scraper"""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('CFBD_API_KEY')
        if self.api_key:
            self.headers['Authorization'] = f'Bearer {self.api_key}'
            
    def get_player_stats(self, year: int):
        if not self.api_key:
            print(f"[CFBD] Skipping {year} - No CFBD_API_KEY provided.")
            return {"source": "cfbd", "year": year, "data": []}
            
        print(f"[CFBD] Fetching official NCAA stats for {year} via API...")
        url = f"https://api.collegefootballdata.com/stats/player/season?year={year}&seasonType=both"
        resp = requests.get(url, headers=self.headers, timeout=10)
        
        if resp.status_code != 200:
            print(f"[CFBD] Failed to fetch data: {resp.status_code}")
            return {"source": "cfbd", "year": year, "data": []}
            
        all_data = []
        # The API returns a list of dictionaries with player stats across different categories
        # We need to pivot this so each player has one dictionary of stats
        raw_data = resp.json()
        
        # Group by player_id
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
                    "passing_yards": 0,
                    "passing_tds": 0,
                    "rushing_yards": 0,
                    "rushing_tds": 0,
                    "receptions": 0,
                    "receiving_yards": 0,
                    "receiving_tds": 0,
                    "games_played": 12 # approximation as API doesn't always provide GP cleanly
                }
                
            cat = row.get("category")
            stat_type = row.get("statType")
            val = row.get("stat", 0)
            
            try:
                val = float(val)
            except:
                val = 0
                
            if cat == "passing":
                if stat_type == "YDS": players[pid]["passing_yards"] += val
                elif stat_type == "TD": players[pid]["passing_tds"] += val
            elif cat == "rushing":
                if stat_type == "YDS": players[pid]["rushing_yards"] += val
                elif stat_type == "TD": players[pid]["rushing_tds"] += val
            elif cat == "receiving":
                if stat_type == "REC": players[pid]["receptions"] += val
                elif stat_type == "YDS": players[pid]["receiving_yards"] += val
                elif stat_type == "TD": players[pid]["receiving_tds"] += val

        return {
            "source": "cfbd",
            "year": year,
            "data": list(players.values())
        }

