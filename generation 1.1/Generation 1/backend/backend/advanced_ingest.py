import os
import pandas as pd
import requests
import json
from sqlalchemy.orm import Session
from database import engine, SessionLocal, init_db
from models import PlayerAdvancedStats, Base

DATA_DUMPS_DIR = "C:/Users/167856/OneDrive - LSI Industries/Documents/AntiGravity Projects/Fantasy Football Dashboard/Data Dumps"
YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

def get_sleeper_mappings():
    print("Fetching Sleeper players to build GSIS -> Sleeper ID mapping...")
    r = requests.get("https://api.sleeper.app/v1/players/nfl")
    players = r.json()
    
    print("Fetching DynastyProcess mappings...")
    df_ids = pd.read_csv('https://raw.githubusercontent.com/DynastyProcess/data/master/files/db_playerids.csv')
    
    gsis_to_sleeper = {}
    
    # 1. Populate from DynastyProcess
    for _, row in df_ids.iterrows():
        gsis = row.get('gsis_id')
        sleeper = row.get('sleeper_id')
        if pd.notna(gsis) and pd.notna(sleeper):
            s_id = str(int(sleeper)) if isinstance(sleeper, float) else str(sleeper)
            gsis_to_sleeper[str(gsis).strip()] = s_id
            
    # 2. Add any fallbacks from Sleeper directly
    for sleeper_id, p in players.items():
        gsis = p.get("gsis_id")
        if gsis and gsis.strip() not in gsis_to_sleeper:
            gsis_to_sleeper[gsis.strip()] = sleeper_id
            
    return gsis_to_sleeper, players

def process_file(filepath, season, gsis_to_sleeper, players_cache):
    print(f"Processing {filepath} for season {season}...")
    if not os.path.exists(filepath):
        print(f"File {filepath} not found!")
        return []
        
    df = pd.read_csv(filepath, low_memory=False)
    
    # Passing
    pass_df = df[(df['pass_attempt'] == 1) & (df['passer_player_id'].notna())]
    passing = pass_df.groupby('passer_player_id').agg(
        player_name=('passer_player_name', 'last'),
        recent_team=('posteam', 'last'),
        pass_epa_per_play=('epa', 'mean'),
        cpoe=('cpoe', 'mean'),
        pass_attempts=('pass_attempt', 'sum')
    ).reset_index()
    passing.rename(columns={'passer_player_id': 'gsis_id'}, inplace=True)
    passing['position'] = 'QB'
    
    # Receiving
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
    receiving.rename(columns={'receiver_player_id': 'gsis_id'}, inplace=True)
    receiving['position'] = 'WR/TE'
    
    # Rushing
    rush_df = df[(df['rush_attempt'] == 1) & (df['rusher_player_id'].notna())]
    rushing = rush_df.groupby('rusher_player_id').agg(
        player_name=('rusher_player_name', 'last'),
        recent_team=('posteam', 'last'),
        rush_attempts=('rush_attempt', 'sum'),
        redzone_rush_attempts=('yardline_100', lambda x: (x <= 20).sum()),
        rushing_yards=('yards_gained', 'sum'),
        rush_epa_per_attempt=('epa', 'mean')
    ).reset_index()
    rushing.rename(columns={'rusher_player_id': 'gsis_id'}, inplace=True)
    rushing['position'] = 'RB'
    
    # Defense
    def_stats = {}
    def add_def_stat(row, col_prefix, stat_name, weight=1.0):
        for i in [1, 2]:
            pid = row.get(f'{col_prefix}_{i}_player_id')
            pname = row.get(f'{col_prefix}_{i}_player_name')
            if pd.notna(pid):
                if pid not in def_stats:
                    def_stats[pid] = {'gsis_id': pid, 'player_name': pname, 'sacks': 0, 'qb_hits': 0, 'tackles_for_loss': 0, 'forced_fumbles': 0, 'pass_deflections': 0, 'recent_team': row.get('defteam')}
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
            gsis = str(row['gsis_id']).strip()
            # Only track players that map to Sleeper
            sleeper_id = gsis_to_sleeper.get(gsis)
            if not sleeper_id:
                continue
                
            if sleeper_id not in players_dict:
                sleeper_player = players_cache.get(sleeper_id, {})
                full_name = f"{sleeper_player.get('first_name', '')} {sleeper_player.get('last_name', '')}".strip()
                if not full_name:
                    full_name = row.get('player_name', '')
                
                pos = sleeper_player.get('position') or row.get('position', '')
                
                players_dict[sleeper_id] = {
                    'player_id': sleeper_id,
                    'player_name': full_name,
                    'recent_team': sleeper_player.get('team') or row.get('recent_team', ''),
                    'position': pos,
                    'season': season,
                    'data_source': 'real_pbp',
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
                if col not in ['player_name', 'position', 'recent_team'] and col in players_dict[sleeper_id] and pd.notna(row[col]):
                    players_dict[sleeper_id][col] = row[col]
                    
    merge_df(passing)
    merge_df(receiving)
    merge_df(rushing)
    if not defense.empty:
        merge_df(defense)
        
    # Fetch Sleeper seasonal stats to fill basic stats gaps
    print(f"Fetching Sleeper stats for {season}...")
    try:
        r = requests.get(f"https://api.sleeper.app/v1/stats/nfl/regular/{season}")
        if r.status_code == 200:
            sleeper_stats = r.json()
            for sleeper_id, s_stats in sleeper_stats.items():
                if sleeper_id in players_dict:
                    p = players_dict[sleeper_id]
                    p['fantasy_points_ppr'] = float(s_stats.get('pts_ppr', 0.0))
                    p['games_played'] = int(s_stats.get('gp', 0))
                    
                    off_snp = s_stats.get('off_snp', 0)
                    tm_off_snp = s_stats.get('tm_off_snp', 0)
                    if tm_off_snp > 0:
                        p['offense_pct'] = round((off_snp / tm_off_snp) * 100, 2)
                    p['offense_snaps'] = off_snp
    except Exception as e:
        print(f"Error fetching sleeper stats for {season}: {e}")
        
    return list(players_dict.values())

def ingest_all():
    init_db()
    db = SessionLocal()
    
    gsis_to_sleeper, players_cache = get_sleeper_mappings()
    
    print("Deleting all existing advanced stats...")
    db.query(PlayerAdvancedStats).delete()
    db.commit()
    
    total_inserted = 0
    
    for year in YEARS:
        filepath = os.path.join(DATA_DUMPS_DIR, f"pbp-{year}.csv")
        stats_list = process_file(filepath, year, gsis_to_sleeper, players_cache)
        
        valid_positions = ['QB', 'WR', 'RB', 'TE', 'FB', 'DEF']
        filtered_list = [s for s in stats_list if s['position'] in valid_positions]
        
        for s in filtered_list:
            for k, v in s.items():
                if pd.isna(v):
                    s[k] = 0.0 if isinstance(v, float) else None
            
            db.add(PlayerAdvancedStats(**s))
        
        db.commit()
        print(f"Inserted {len(filtered_list)} records for {year}")
        total_inserted += len(filtered_list)

    print(f"Ingestion complete! Total records: {total_inserted}")

if __name__ == "__main__":
    ingest_all()
