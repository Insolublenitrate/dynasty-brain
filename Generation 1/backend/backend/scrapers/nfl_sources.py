import pandas as pd

class NFLVerseScraper:
    """
    Pulls NFL data directly from the nflverse GitHub releases (player_stats.parquet).
    Bypasses Cloudflare by directly downloading the parquet file.
    """
    def __init__(self):
        self.url = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet"
        self._df_cache = None

    def _load_data(self):
        if self._df_cache is None:
            print("[NFLVerse] Downloading historical stats parquet from GitHub...")
            self._df_cache = pd.read_parquet(self.url, engine='pyarrow')
            # Aggregate weekly data to seasonal data
            print("[NFLVerse] Aggregating weekly data to seasonal data...")
            agg_dict = {
                'games_played': ('week', 'count'),
                'pass_attempts': ('attempts', 'sum'),
                'passing_yards': ('passing_yards', 'sum'),
                'carries': ('carries', 'sum'),
                'rushing_yards': ('rushing_yards', 'sum'),
                'targets': ('targets', 'sum'),
                'receptions': ('receptions', 'sum'),
                'receiving_yards': ('receiving_yards', 'sum'),
                'rushing_tds': ('rushing_tds', 'sum'),
                'receiving_tds': ('receiving_tds', 'sum'),
                'passing_tds': ('passing_tds', 'sum'),
                'interceptions': ('interceptions', 'sum'),
                'fantasy_points_ppr': ('fantasy_points_ppr', 'sum'),
            }
            # Group by player, position, team, and season
            # Use 'position' (WR/RB/TE) not 'position_group' for correct position labels
            self._df_season = self._df_cache.groupby(
                ['player_display_name', 'position', 'recent_team', 'season'], 
                as_index=False
            ).agg(**agg_dict)
            
            # Clean up the name column to match our schema
            self._df_season.rename(columns={'player_display_name': 'player_name'}, inplace=True)
            
        return self._df_season

    def get_player_stats(self, year: int):
        print(f"[NFLVerse] Fetching aggregated NFL stats for {year}...")
        df = self._load_data()
        
        # Filter by year and skill positions only (QB, WR, RB, TE)
        df_year = df[
            (df['season'] == year) & 
            (df['position'].isin(['QB', 'WR', 'RB', 'TE', 'FB']))
        ].copy()
        
        # Convert to list of dicts
        all_data = df_year.to_dict(orient='records')
        
        return {
            "source": "nflverse",
            "year": year,
            "data": all_data
        }
