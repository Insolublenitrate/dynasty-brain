import pandas as pd
import numpy as np

def test_aggregation():
    print("Fetching player_stats...")
    df_ps = pd.read_parquet("https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet")
    df_ps = df_ps[df_ps['season'] == 2023]
    
    print("Fetching ftn_charting...")
    df_ftn = pd.read_parquet("https://github.com/nflverse/nflverse-data/releases/download/ftn_charting/ftn_charting_2023.parquet")
    
    print("Fetching pbp_participation...")
    df_pbp = pd.read_parquet("https://github.com/nflverse/nflverse-data/releases/download/pbp_participation/pbp_participation_2023.parquet")

    # Let's inspect ftn_charting columns
    print("FTN Columns:", df_ftn.columns.tolist())
    print("PBP Columns:", df_pbp.columns.tolist())
    
    print("\nSample PBP offense_players:")
    print(df_pbp['offense_players'].head(2).tolist())
    print("\nSample PBP route:")
    print(df_pbp['route'].head(2).tolist())
    print("\nSample PBP offense_names:")
    print(df_pbp['offense_names'].head(2).tolist())

if __name__ == "__main__":
    test_aggregation()
