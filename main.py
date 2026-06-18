from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from models import Roster, User, DraftPick, League
from quant.roster_lifecycle import analyze_league_rosters
from quant.draft_depreciation import DraftPick as QuantDraftPick, evaluate_pick_portfolio
from sleeper_ingest import ingest_data
import pandas as pd
import numpy as np

import os
import urllib.request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_cache = {}
DATA_DIR = "data"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def fetch_parquet(url: str):
    if url in data_cache:
        return data_cache[url]
        
    filename = url.split('/')[-1]
    local_path = os.path.join(DATA_DIR, filename)
    
    if not os.path.exists(local_path):
        print(f"Downloading {url} to {local_path}...")
        try:
            urllib.request.urlretrieve(url, local_path)
            print("Download complete.")
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            raise e
            
    print(f"Loading {local_path} into memory...")
    df = pd.read_parquet(local_path)
    
    # Replace NaN and Inf with None for JSON serialization
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)
    
    data_cache[url] = df
    return df

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/league/ingest/{league_id}")
def ingest_league(league_id: str):
    try:
        ingest_data(league_id)
        
        # Verify it was actually saved
        session = SessionLocal()
        league = session.query(League).filter(League.league_id == league_id).first()
        session.close()
        
        if not league:
            return {"error": "Failed to ingest league or league not found."}
            
        return {"status": "success", "league_name": league.name}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/stats/season")
def get_season_stats(year: int = 2023):
    url = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet"
    df = fetch_parquet(url)
    df_year = df[df['season'] == year]
    
    # Aggregate season stats
    agg_dict = {
        'passing_yards': 'sum',
        'passing_tds': 'sum',
        'interceptions': 'sum',
        'rushing_yards': 'sum',
        'rushing_tds': 'sum',
        'receiving_yards': 'sum',
        'receiving_tds': 'sum',
        'receptions': 'sum',
        'targets': 'sum',
        'fantasy_points_ppr': 'sum'
    }
    
    df_agg = df_year.groupby(['player_id', 'player_name', 'recent_team']).agg(agg_dict).reset_index()
    df_agg = df_agg.sort_values(by="fantasy_points_ppr", ascending=False).head(200)
    
    return df_agg.to_dict(orient="records")

@app.get("/api/stats/advanced_receiving")
def get_advanced_receiving(year: int = 2023):
    # PFR advanced receiving stats
    url = "https://github.com/nflverse/nflverse-data/releases/download/pfr_advanced_stats/advstats_season_rec.parquet"
    df = fetch_parquet(url)
    df_year = df[df['season'] == year]
    
    return df_year.to_dict(orient="records")

@app.get("/api/players")
def get_players():
    url = "https://github.com/nflverse/nflverse-data/releases/download/players/players.parquet"
    df = fetch_parquet(url)
    return df.to_dict(orient="records")

@app.get("/api/stats/advanced_player_metrics")
def get_advanced_player_metrics(year: int = 2023):
    # 1. Fetch player stats
    url_stats = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet"
    df_stats = fetch_parquet(url_stats)
    df_stats = df_stats[df_stats['season'] == year]
    
    # 2. Fetch snap counts
    url_snaps = f"https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_{year}.parquet"
    try:
        df_snaps = fetch_parquet(url_snaps)
    except Exception:
        df_snaps = pd.DataFrame() # Fallback if snaps fail
        
    # Aggregate stats by player
    df_stats = df_stats.sort_values(by=['player_id', 'week']) # Ensure chronological order for 'recent_team'
    agg_stats = {
        'week': 'count', # count of weeks is games played
        'passing_yards': 'sum',
        'rushing_yards': 'sum',
        'receiving_yards': 'sum',
        'targets': 'sum',
        'receptions': 'sum',
        'fantasy_points_ppr': 'sum',
        'recent_team': 'last' # Get the most recent team they played for
    }
    
    # Group by player id and name
    df_grouped = df_stats.groupby(['player_id', 'player_name', 'position']).agg(agg_stats).reset_index()
    df_grouped.rename(columns={'week': 'games_played'}, inplace=True)
    
    # Crosswalk player_id (gsis) to pfr_id to merge with snaps
    url_players = "https://github.com/nflverse/nflverse-data/releases/download/players/players.parquet"
    try:
        df_players = fetch_parquet(url_players)
        df_players_map = df_players[['gsis_id', 'pfr_id']].dropna().drop_duplicates(subset=['gsis_id'])
        df_grouped = pd.merge(df_grouped, df_players_map, left_on='player_id', right_on='gsis_id', how='left')
    except Exception:
        df_grouped['pfr_id'] = None
    
    # Aggregate snap counts if available
    if not df_snaps.empty:
        df_snaps_grouped = df_snaps.groupby('pfr_player_id').agg({
            'offense_snaps': 'sum',
            'offense_pct': 'mean'
        }).reset_index()
        
        df_grouped = pd.merge(df_grouped, df_snaps_grouped, left_on='pfr_id', right_on='pfr_player_id', how='left')
    else:
        df_grouped['offense_snaps'] = np.nan
        df_grouped['offense_pct'] = np.nan

    # Calculate advanced metrics
    df_grouped['ppg'] = df_grouped['fantasy_points_ppr'] / df_grouped['games_played']
    df_grouped['total_yards'] = df_grouped['rushing_yards'] + df_grouped['receiving_yards'] + df_grouped['passing_yards']
    df_grouped['yards_per_game'] = df_grouped['total_yards'] / df_grouped['games_played']
    
    # Catch Rate
    df_grouped['catch_rate'] = np.where(df_grouped['targets'] > 0, df_grouped['receptions'] / df_grouped['targets'], 0)
    
    # On Field Percentage (approx from offense_pct mean)
    df_grouped['on_field_pct'] = df_grouped['offense_pct']
    
    # Target Rate (approximate: targets / offense_snaps. Since we don't have routes run easily, we use snaps)
    df_grouped['target_rate'] = np.where(df_grouped['offense_snaps'] > 0, df_grouped['targets'] / df_grouped['offense_snaps'], 0)
    
    # YPRR (approximate: receiving yards / (offense_snaps * 0.6) assuming 60% pass rate)
    df_grouped['yprr_approx'] = np.where(df_grouped['offense_snaps'] > 0, df_grouped['receiving_yards'] / (df_grouped['offense_snaps'] * 0.6), 0)
    
    # First Read Rate (stub for now, requires FTN integration)
    df_grouped['first_read_rate'] = np.nan
    
    # Drop 'player' column from snap counts since we have 'player_name'
    if 'player' in df_grouped.columns:
        df_grouped.drop(columns=['player'], inplace=True)
        
    # Clean up for JSON serialization
    df_grouped = df_grouped.replace([np.inf, -np.inf], np.nan)
    # Using astype(object).where(pd.notnull, None) is most robust in pandas for mixing types with None
    df_grouped = df_grouped.astype(object).where(pd.notnull(df_grouped), None)
    
    return df_grouped.to_dict(orient="records")

@app.get("/api/quant/matrix")
def get_power_matrix(league_id: str = "1312567432052760576"):
    session = SessionLocal()
    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        if not rosters:
            return {"error": "No rosters found for this league."}
            
        data = []
        for r in rosters:
            owner_name = r.user.display_name if r.user else f"Team {r.roster_id}"
            
            # Get picks owned by this roster
            picks = session.query(DraftPick).filter(DraftPick.owner_id == r.id).all()
            
            # Map DB picks to Quant DraftPicks
            quant_picks = []
            for p in picks:
                quant_picks.append(QuantDraftPick(year=int(p.season), round=p.round))
                
            future_capital_score = evaluate_pick_portfolio(quant_picks, current_year=2024)
            
            # Mock expected points, actual points, and age score based on fpts
            # Since we don't have historical weekly logs in DB yet, we use heuristic mocks
            actual_pts = r.fpts or 1500.0
            
            # Simple mock heuristic to generate interesting variance for the UI chart
            import random
            expected_pts = actual_pts * random.uniform(0.85, 1.15)
            max_pf = actual_pts * random.uniform(1.0, 1.1)
            age_score = random.uniform(24.0, 29.0) # mock avg age
            
            data.append({
                "roster_id": r.id,
                "team_name": owner_name,
                "expected_points": expected_pts,
                "actual_points": actual_pts,
                "max_pf": max_pf,
                "roster_age_score": age_score,
                "future_capital_score": future_capital_score,
                "avatar": r.user.avatar if r.user else None
            })
            
        df = pd.DataFrame(data)
        analyzed_df = analyze_league_rosters(df)
        
        # Replace NaN with None for JSON
        analyzed_df = analyzed_df.replace([np.inf, -np.inf], np.nan)
        analyzed_df = analyzed_df.astype(object).where(pd.notnull(analyzed_df), None)
        
        return analyzed_df.to_dict(orient="records")
    finally:
        session.close()

