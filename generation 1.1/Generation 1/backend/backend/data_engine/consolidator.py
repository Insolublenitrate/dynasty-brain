import os
import sys
import argparse

# Add backend directory to sys.path to allow importing from scrapers and database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.nfl_sources import NFLVerseScraper
from scrapers.ncaa_sources import CFBDScraper

from database import SessionLocal
from models import PlayerAdvancedStats, NCAAStats

class DataConsolidationEngine:
    def __init__(self):
        self.nfl_scrapers = {
            "nflverse": NFLVerseScraper()
        }
        self.ncaa_scrapers = {
            "cfbd": CFBDScraper()
        }
        
    def resolve_conflicts(self, metric_name, values_dict):
        """
        Resolves conflicts between different sources for the same metric.
        values_dict looks like: {"pfr": 1000, "ftn": 1002}
        """
        if not values_dict:
            return None
            
        # Priority mapping
        if "nflverse" in values_dict and metric_name in ["receiving_yards", "receptions", "rushing_yards"]:
            return values_dict["nflverse"]
            
        if "ftn" in values_dict and metric_name in ["air_yards_per_target", "yac_per_reception"]:
            return values_dict["ftn"]
            
        # Default to average for numeric conflicts if priority doesn't dictate
        vals = [v for v in values_dict.values() if isinstance(v, (int, float))]
        if vals:
            return sum(vals) / len(vals)
            
        # Fallback to the first available string/non-numeric value
        return list(values_dict.values())[0]

    def run_nfl_sync(self, start_year: int, end_year: int):
        print(f"=== Starting NFL Sync ({start_year}-{end_year}) ===")
        session = SessionLocal()
        try:
            for year in range(start_year, end_year + 1):
                raw_data = {}
                # 1. Gather
                for source, scraper in self.nfl_scrapers.items():
                    try:
                        # Call the respective method (using duck typing / getattr)
                        method = getattr(scraper, "get_player_stats", getattr(scraper, "get_advanced_stats", getattr(scraper, "query_stats", None)))
                        if method:
                            res = method(year)
                            raw_data[source] = res.get("data", [])
                    except Exception as e:
                        print(f"Error scraping {source} for {year}: {e}")

                # We only have nflverse right now, so no complex conflict resolution
                nflverse_data = raw_data.get("nflverse", [])
                print(f"Found {len(nflverse_data)} player records from nflverse for {year}")
                
                for pdata in nflverse_data:
                    # Check if already exists
                    existing = session.query(PlayerAdvancedStats).filter_by(
                        player_name=pdata["player_name"], 
                        season=year
                    ).first()
                    
                    def _int(v):
                        try: return int(v or 0)
                        except: return 0
                    def _flt(v):
                        try: return float(v or 0)
                        except: return 0.0

                    fields = dict(
                        position=pdata.get("position", ""),
                        recent_team=pdata.get("recent_team", ""),
                        data_source="nflverse",
                        games_played=_int(pdata.get("games_played")),
                        pass_attempts=_int(pdata.get("pass_attempts")),
                        targets=_int(pdata.get("targets")),
                        receptions=_int(pdata.get("receptions")),
                        receiving_yards=_int(pdata.get("receiving_yards")),
                        rush_attempts=_int(pdata.get("carries")),
                        rushing_yards=_int(pdata.get("rushing_yards")),
                        fantasy_points_ppr=_flt(pdata.get("fantasy_points_ppr")),
                    )
                    
                    if not existing:
                        stat_row = PlayerAdvancedStats(
                            player_name=pdata["player_name"],
                            season=year,
                            offense_pct=0.0,
                            offense_snaps=0,
                            pass_epa_per_play=0.0,
                            cpoe=0.0,
                            redzone_targets=0,
                            air_yards_per_target=0.0,
                            yac_per_reception=0.0,
                            rec_epa_per_target=0.0,
                            redzone_rush_attempts=0,
                            rush_epa_per_attempt=0.0,
                            sacks=0.0,
                            qb_hits=0.0,
                            tackles_for_loss=0.0,
                            forced_fumbles=0.0,
                            pass_deflections=0.0,
                            **fields
                        )
                        session.add(stat_row)
                    else:
                        for k, v in fields.items():
                            setattr(existing, k, v)
                
                session.commit()
                print(f"Committed {year} data to DB.")
                
            print("NFL Sync Complete.")
        finally:
            session.close()

    def run_ncaa_sync(self, start_year: int, end_year: int):
        print(f"=== Starting NCAA Sync ({start_year}-{end_year}) ===")
        session = SessionLocal()
        try:
            for year in range(start_year, end_year + 1):
                raw_data = {}
                for source, scraper in self.ncaa_scrapers.items():
                    try:
                        method = getattr(scraper, "get_player_stats", getattr(scraper, "get_split_stats", getattr(scraper, "get_historical_production", None)))
                        if method:
                            res = method(year)
                            raw_data[source] = res.get("data", [])
                    except Exception as e:
                        print(f"Error scraping {source} for {year}: {e}")
                        
                print(f"Consolidating {len(raw_data)} sources for {year}...")
                
                # We only have CFBD right now, so no complex conflict resolution
                cfbd_data = raw_data.get("cfbd", [])
                print(f"Found {len(cfbd_data)} player records from CFBD for {year}")
                
                for pdata in cfbd_data:
                    # Check if already exists
                    existing = session.query(NCAAStats).filter_by(
                        player_id=pdata["player_id"], 
                        season=year
                    ).first()
                    
                    if not existing:
                        stat_row = NCAAStats(
                            player_id=pdata["player_id"],
                            player_name=pdata["player_name"],
                            season=pdata["season"],
                            college=pdata["college"],
                            data_source="cfbd",
                            passing_yards=pdata["passing_yards"],
                            passing_tds=pdata["passing_tds"],
                            rushing_yards=pdata["rushing_yards"],
                            rushing_tds=pdata["rushing_tds"],
                            receptions=pdata["receptions"],
                            receiving_yards=pdata["receiving_yards"],
                            receiving_tds=pdata["receiving_tds"],
                            games_played=pdata["games_played"]
                        )
                        session.add(stat_row)
                    else:
                        existing.passing_yards = pdata["passing_yards"]
                        existing.passing_tds = pdata["passing_tds"]
                        existing.rushing_yards = pdata["rushing_yards"]
                        existing.rushing_tds = pdata["rushing_tds"]
                        existing.receptions = pdata["receptions"]
                        existing.receiving_yards = pdata["receiving_yards"]
                        existing.receiving_tds = pdata["receiving_tds"]
                        existing.games_played = pdata["games_played"]
                
                session.commit()
                print(f"Committed {year} data to DB.")
                
            print("NCAA Sync Complete.")
        finally:
            session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multi-Source Data Consolidator")
    parser.add_argument("--league", choices=["nfl", "ncaa", "all"], default="all", help="Which league to sync")
    parser.add_argument("--start", type=int, default=2016, help="Start year")
    parser.add_argument("--end", type=int, default=2026, help="End year")
    
    args = parser.parse_args()
    
    engine = DataConsolidationEngine()
    
    if args.league in ["nfl", "all"]:
        engine.run_nfl_sync(args.start, args.end)
        
    if args.league in ["ncaa", "all"]:
        engine.run_ncaa_sync(args.start, args.end)
