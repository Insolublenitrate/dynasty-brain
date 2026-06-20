import sqlite3
import pandas as pd
import numpy as np
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dynastybrain.db')

def fetch_parquet(url):
    print(f"Downloading {url}...")
    return pd.read_parquet(url)

def enrich_database(year: int = 2024):
    print(f"Enriching database for season {year}...")
    
    # 1. Fetch player stats
    url_stats = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet"
    try:
        df_stats = fetch_parquet(url_stats)
        df_stats = df_stats[df_stats['season'] == year].copy()
    except Exception as e:
        print(f"Error fetching player_stats: {e}")
        return

    # Aggregate stats by player
    df_stats = df_stats.sort_values(by=['player_id', 'week'])
    agg_stats = {
        'fantasy_points_ppr': 'sum'
    }
    df_grouped = df_stats.groupby(['player_id']).agg(agg_stats).reset_index()
    
    # 2. Fetch snap counts
    url_snaps = f"https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_{year}.parquet"
    try:
        df_snaps = fetch_parquet(url_snaps)
        df_snaps_grouped = df_snaps.groupby('pfr_player_id').agg({
            'offense_snaps': 'sum',
            'offense_pct': 'mean'
        }).reset_index()
    except Exception as e:
        print(f"Error fetching snap_counts: {e}")
        df_snaps_grouped = pd.DataFrame(columns=['pfr_player_id', 'offense_snaps', 'offense_pct'])

    # Crosswalk player_id (gsis) to pfr_id to merge with snaps
    url_players = "https://github.com/nflverse/nflverse-data/releases/download/players/players.parquet"
    try:
        df_players = fetch_parquet(url_players)
        df_players_map = df_players[['gsis_id', 'pfr_id']].dropna().drop_duplicates(subset=['gsis_id'])
        df_grouped = pd.merge(df_grouped, df_players_map, left_on='player_id', right_on='gsis_id', how='left')
    except Exception as e:
        print(f"Error fetching players.parquet: {e}")
        df_grouped['pfr_id'] = None

    # Merge snap counts into df_grouped
    if not df_snaps_grouped.empty and 'pfr_id' in df_grouped.columns:
        df_grouped = pd.merge(df_grouped, df_snaps_grouped, left_on='pfr_id', right_on='pfr_player_id', how='left')
    else:
        df_grouped['offense_snaps'] = np.nan
        df_grouped['offense_pct'] = np.nan

    print("Updating SQLite database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    count = 0
    for _, row in df_grouped.iterrows():
        gsis_id = row['player_id']
        fantasy_points_ppr = row.get('fantasy_points_ppr', 0.0)
        offense_pct = row.get('offense_pct', 0.0)
        offense_snaps = row.get('offense_snaps', 0)
        
        if pd.isna(fantasy_points_ppr): fantasy_points_ppr = 0.0
        if pd.isna(offense_pct): offense_pct = 0.0
        if pd.isna(offense_snaps): offense_snaps = 0

        cursor.execute('''
            UPDATE player_advanced_stats 
            SET fantasy_points_ppr = ?, offense_pct = ?, offense_snaps = ?
            WHERE player_id = ?
        ''', (fantasy_points_ppr, offense_pct, offense_snaps, gsis_id))
        count += cursor.rowcount

    conn.commit()
    conn.close()
    print(f"Successfully updated {count} rows in the database for {year}.")

if __name__ == "__main__":
    enrich_database(2024)
