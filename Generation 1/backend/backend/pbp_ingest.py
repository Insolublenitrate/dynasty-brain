import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import glob
from models import PlayerAdvancedStats, Base

from database import engine, SessionLocal, init_db
from models import PlayerAdvancedStats, Base

DATA_DUMPS_DIR = "../Data Dumps"

def process_file(filepath):
    print(f"Processing {filepath}...")
    # Extract season from filename (e.g., pbp-2025.csv)
    basename = os.path.basename(filepath)
    season_str = basename.replace('pbp-', '').replace('.csv', '')
    try:
        season = int(season_str)
    except:
        season = 2025 # Fallback
        
    df = pd.read_csv(filepath, low_memory=False)
    
    # 1. Passing
    pass_df = df[(df['pass_attempt'] == 1) & (df['passer_player_id'].notna())]
    passing = pass_df.groupby('passer_player_id').agg(
        player_name=('passer_player_name', 'last'),
        recent_team=('posteam', 'last'),
        pass_epa_per_play=('epa', 'mean'),
        cpoe=('cpoe', 'mean'),
        pass_attempts=('pass_attempt', 'sum')
    ).reset_index()
    passing.rename(columns={'passer_player_id': 'player_id'}, inplace=True)
    passing['position'] = 'QB' # Approximate
    
    # 2. Receiving
    rec_df = df[(df['pass_attempt'] == 1) & (df['receiver_player_id'].notna())]
    receiving = rec_df.groupby('receiver_player_id').agg(
        player_name=('receiver_player_name', 'last'),
        recent_team=('posteam', 'last'),
        targets=('pass_attempt', 'sum'),
        redzone_targets=('yardline_100', lambda x: (x <= 20).sum()),
        receptions=('complete_pass', 'sum'),
        receiving_yards=('yards_gained', 'sum'),
        air_yards_per_target=('air_yards', 'mean'),
        yac_per_reception=('yards_after_catch', lambda x: x[x.notna()].mean() if len(x[x.notna()]) > 0 else 0),
        rec_epa_per_target=('epa', 'mean')
    ).reset_index()
    receiving.rename(columns={'receiver_player_id': 'player_id'}, inplace=True)
    receiving['position'] = 'WR/TE' # Approximate
    
    # 3. Rushing
    rush_df = df[(df['rush_attempt'] == 1) & (df['rusher_player_id'].notna())]
    rushing = rush_df.groupby('rusher_player_id').agg(
        player_name=('rusher_player_name', 'last'),
        recent_team=('posteam', 'last'),
        rush_attempts=('rush_attempt', 'sum'),
        redzone_rush_attempts=('yardline_100', lambda x: (x <= 20).sum()),
        rushing_yards=('yards_gained', 'sum'),
        rush_epa_per_attempt=('epa', 'mean')
    ).reset_index()
    rushing.rename(columns={'rusher_player_id': 'player_id'}, inplace=True)
    rushing['position'] = 'RB' # Approximate
    
    # 4. Defense (Sacks, QB Hits, TFL, FF, PD)
    def_stats = {}
    
    def add_def_stat(row, col_prefix, stat_name, weight=1.0):
        for i in [1, 2]:
            pid = row.get(f'{col_prefix}_{i}_player_id')
            pname = row.get(f'{col_prefix}_{i}_player_name')
            if pd.notna(pid):
                if pid not in def_stats:
                    def_stats[pid] = {'player_id': pid, 'player_name': pname, 'sacks': 0, 'qb_hits': 0, 'tackles_for_loss': 0, 'forced_fumbles': 0, 'pass_deflections': 0, 'recent_team': row.get('defteam')}
                def_stats[pid][stat_name] += weight

    for _, row in df.iterrows():
        sack_val = row.get('sack', 0)
        if sack_val == 1:
            p1 = row.get('tackle_for_loss_1_player_id')
            p2 = row.get('tackle_for_loss_2_player_id')
            weight = 0.5 if pd.notna(p1) and pd.notna(p2) else 1.0
            add_def_stat(row, 'tackle_for_loss', 'sacks', weight)
            
        if row.get('qb_hit', 0) == 1:
            add_def_stat(row, 'qb_hit', 'qb_hits', 1.0)
            
        if row.get('tackled_for_loss', 0) == 1 and sack_val == 0:
            add_def_stat(row, 'tackle_for_loss', 'tackles_for_loss', 1.0)
            
        if row.get('fumble_forced', 0) == 1:
            add_def_stat(row, 'forced_fumble_player', 'forced_fumbles', 1.0)
            
        if pd.notna(row.get('pass_defense_1_player_id')):
            add_def_stat(row, 'pass_defense', 'pass_deflections', 1.0)

    defense = pd.DataFrame(list(def_stats.values()))
    if not defense.empty:
        defense['position'] = 'DEF'
    
    players_dict = {}
    
    def merge_df(source_df):
        for _, row in source_df.iterrows():
            pid = row['player_id']
            if pid not in players_dict:
                players_dict[pid] = {
                    'player_id': pid,
                    'player_name': row.get('player_name', ''),
                    'recent_team': row.get('recent_team', ''),
                    'position': row.get('position', ''),
                    'season': season,
                    'pass_epa_per_play': 0.0,
                    'cpoe': 0.0,
                    'pass_attempts': 0,
                    'targets': 0,
                    'redzone_targets': 0,
                    'receptions': 0,
                    'receiving_yards': 0,
                    'air_yards_per_target': 0.0,
                    'yac_per_reception': 0.0,
                    'rec_epa_per_target': 0.0,
                    'rush_attempts': 0,
                    'redzone_rush_attempts': 0,
                    'rushing_yards': 0,
                    'rush_epa_per_attempt': 0.0,
                    'sacks': 0.0,
                    'qb_hits': 0.0,
                    'tackles_for_loss': 0.0,
                    'forced_fumbles': 0.0,
                    'pass_deflections': 0.0
                }
            for col in row.index:
                if col in players_dict[pid] and pd.notna(row[col]):
                    players_dict[pid][col] = row[col]
                    
    merge_df(passing)
    merge_df(receiving)
    merge_df(rushing)
    if not defense.empty:
        merge_df(defense)
        
    return list(players_dict.values())

def ingest_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    files = [os.path.join(DATA_DUMPS_DIR, "pbp-2025.csv")]
    
    # Clear existing advanced stats
    db.query(PlayerAdvancedStats).delete()
    db.commit()
    
    for f in files:
        stats_list = process_file(f)
        for s in stats_list:
            for k, v in s.items():
                if pd.isna(v):
                    s[k] = 0.0 if isinstance(v, float) else None
            
            db.add(PlayerAdvancedStats(**s))
        db.commit()
        print(f"Inserted {len(stats_list)} records for {f}")

if __name__ == "__main__":
    ingest_all()
    print("Ingestion complete!")
