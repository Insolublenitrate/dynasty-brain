import sys
import os
import time
import logging
from sqlalchemy.orm import Session

# Setup path and logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

from backend.database import SessionLocal
from backend.models import ConsensusStat
from backend.scrapers.cfb_scraper import CFBScraper
from backend.scrapers.pfr_scraper import PFRScraper
from backend.data_engine.consensus import ConsensusEngine

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class HistoricalWorker:
    def __init__(self):
        self.cfb = CFBScraper()
        self.pfr = PFRScraper()
        self.engine = ConsensusEngine()
        self.db: Session = next(get_db())
        
        self.years_to_scrape = list(range(2016, 2027))
        # Example target players to bootstrap the queue
        self.target_players = ["Caleb Williams", "Patrick Mahomes", "Josh Allen", "Marvin Harrison Jr.", "Bijan Robinson"]
        
    def run(self):
        logging.info("Starting Historical Scraper Worker (2016-2026)")
        logging.info("Press Ctrl+C to stop the worker safely.")
        
        try:
            for year in self.years_to_scrape:
                logging.info(f"=== Scraping Season {year} ===")
                for player in self.target_players:
                    self.process_player_season(player, year)
                    
            logging.info("Finished scraping all target players and years.")
        except KeyboardInterrupt:
            logging.info("Worker interrupted by user. Shutting down gracefully...")
        except Exception as e:
            logging.error(f"Worker encountered an error: {e}")
        finally:
            self.db.close()
            
    def process_player_season(self, player_name: str, season: int):
        # 1. Fetch from CFB
        cfb_data = self.cfb.fetch_player_season(player_name, season)
        
        # 2. Fetch from PFR
        pfr_data = self.pfr.fetch_player_season(player_name, season)
        
        # 3. Simulate FTN or NFLverse Data
        ftn_data = {
            "source": "ftn",
            "player": player_name,
            "season": season,
            "passing_yards": pfr_data.get("passing_yards", 0) * 1.01, # Introduce slight discrepancy
            "passing_tds": pfr_data.get("passing_tds", 0)
        }
        
        # 4. Cross-check Passing Yards
        py_points = {
            "cfbd": cfb_data.get("passing_yards", 0),
            "pfr": pfr_data.get("passing_yards", 0),
            "ftn": ftn_data.get("passing_yards", 0)
        }
        py_consensus = self.engine.cross_check(py_points)
        
        # 5. Cross-check Passing TDs
        ptd_points = {
            "cfbd": cfb_data.get("passing_tds", 0),
            "pfr": pfr_data.get("passing_tds", 0),
            "ftn": ftn_data.get("passing_tds", 0)
        }
        ptd_consensus = self.engine.cross_check(ptd_points)
        
        # 6. Save to Database
        self.save_consensus_stat(player_name, season, "passing_yards", py_consensus)
        self.save_consensus_stat(player_name, season, "passing_tds", ptd_consensus)
        
    def save_consensus_stat(self, player_name: str, season: int, metric: str, consensus_data: dict):
        # Check if exists
        stat = self.db.query(ConsensusStat).filter(
            ConsensusStat.player_id == player_name,
            ConsensusStat.season == season,
            ConsensusStat.metric_name == metric
        ).first()
        
        if not stat:
            stat = ConsensusStat(
                player_id=player_name,
                season=season,
                metric_name=metric
            )
            self.db.add(stat)
            
        stat.metric_value = consensus_data["value"]
        stat.sources_used = "cfbd,pfr,ftn"
        stat.confidence_score = consensus_data["confidence_score"]
        stat.discrepancy_flag = consensus_data["discrepancy"]
        
        self.db.commit()
        logging.info(f"Saved {metric} for {player_name} ({season}) - Confidence: {stat.confidence_score}%")

if __name__ == "__main__":
    worker = HistoricalWorker()
    worker.run()
