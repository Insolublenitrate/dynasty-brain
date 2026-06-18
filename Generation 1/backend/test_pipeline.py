import sys
sys.path.append('.')

from backend.scrapers.cfb_scraper import CFBScraper
from backend.scrapers.pfr_scraper import PFRScraper
from backend.data_engine.consensus import ConsensusEngine

def test_pipeline():
    print("Initializing scrapers...")
    cfb = CFBScraper()
    pfr = PFRScraper()
    engine = ConsensusEngine()
    
    player_name = "Caleb Williams"
    season = 2023
    
    print(f"\n--- Scraping {player_name} for {season} ---")
    
    # Simulate parallel/async scraping
    cfbd_data = cfb.fetch_player_season(player_name, season)
    print("CFBD Data:", cfbd_data)
    
    pfr_data = pfr.fetch_player_season(player_name, season)
    print("PFR Data:", pfr_data)
    
    # Let's say FTN or NFLverse gave us slightly different data
    ftn_data = {
        "source": "ftn",
        "player": player_name,
        "season": season,
        "passing_yards": 4515.0, # Slight discrepancy
        "passing_tds": 42.0
    }
    
    print("\n--- Running Consensus Engine ---")
    # Cross-check Passing Yards
    py_points = {
        "cfbd": cfbd_data["passing_yards"],
        "pfr": pfr_data["passing_yards"],
        "ftn": ftn_data["passing_yards"]
    }
    
    py_consensus = engine.cross_check(py_points)
    print("Passing Yards Consensus:", py_consensus)
    
    # Cross-check Passing TDs
    ptd_points = {
        "cfbd": cfbd_data["passing_tds"],
        "pfr": pfr_data["passing_tds"],
        "ftn": ftn_data["passing_tds"]
    }
    
    ptd_consensus = engine.cross_check(ptd_points)
    print("Passing TDs Consensus:", ptd_consensus)

if __name__ == "__main__":
    test_pipeline()
