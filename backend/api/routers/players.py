from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import os
from database import SessionLocal, get_db
from models import Roster, User, DraftPick, League, PlayerAdvancedStats, ConsensusStat, NCAAStats, MatchupHistory, SleeperTransaction
from sleeper_ingest import ingest_data
from quant.roster_lifecycle import analyze_league_rosters
from quant.draft_depreciation import DraftPick as QuantDraftPick, evaluate_pick_portfolio
from services.utils import fetch_parquet

router = APIRouter()

@router.get("/api/stats/season")
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
    df_agg = df_agg.replace({np.nan: None})
    
    return df_agg.to_dict(orient="records")


@router.get("/api/stats/advanced_receiving")
def get_advanced_receiving(year: int = 2023):
    # PFR advanced receiving stats
    url = "https://github.com/nflverse/nflverse-data/releases/download/pfr_advstats/advstats_season_rec.parquet"
    df = fetch_parquet(url)
    if df.empty:
        return []
    df_year = df[df['season'] == year]
    df_year = df_year.replace({np.nan: None})
    
    return df_year.to_dict(orient="records")


@router.get("/api/players")
def get_players():
    url = "https://github.com/nflverse/nflverse-data/releases/download/players/players.parquet"
    df = fetch_parquet(url)
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")


@router.get("/api/stats/advanced_player_metrics")
def get_advanced_player_metrics(year: str = Query("2025", description="Season year to fetch stats for, or 'All'"), db: Session = Depends(get_db)):
    if year.lower() == "all":
        stats = db.query(PlayerAdvancedStats).all()
        c_stats = db.query(ConsensusStat).all()
    else:
        try:
            year_int = int(year)
            stats = db.query(PlayerAdvancedStats).filter(PlayerAdvancedStats.season == year_int).all()
            c_stats = db.query(ConsensusStat).filter(ConsensusStat.season == year_int).all()
        except ValueError:
            stats = []
            c_stats = []
            
    # Map consensus stats by (player_name, season) and metric_name
    c_map = {}
    for cs in c_stats:
        key = (cs.player_id, cs.season)
        if key not in c_map:
            c_map[key] = {}
        c_map[key][cs.metric_name] = cs.metric_value
            
    # Apply Consensus overrides
    for stat in stats:
        key = (stat.player_name, stat.season)
        if key in c_map:
            for metric, val in c_map[key].items():
                setattr(stat, metric, val)
                
    # Aggregate stats if "all"
    if year.lower() == "all":
        aggregated = {}
        for stat in stats:
            pid = stat.player_id
            if pid not in aggregated:
                aggregated[pid] = {
                    "player_id": pid,
                    "player_name": stat.player_name,
                    "position": stat.position,
                    "recent_team": stat.recent_team,
                    "season": "All",
                    "games_played": 0,
                    "targets": 0,
                    "redzone_targets": 0,
                    "receptions": 0,
                    "receiving_yards": 0,
                    "air_yards_per_target": [],
                    "yac_per_reception": [],
                    "rec_epa_per_target": [],
                    "fantasy_points_ppr": 0,
                    "offense_snaps": 0,
                    "offense_pct": [],
                    "pass_epa_per_play": [],
                    "cpoe": [],
                    "pass_attempts": 0,
                    "rush_attempts": 0,
                    "redzone_rush_attempts": 0,
                    "rushing_yards": 0,
                    "rush_epa_per_attempt": [],
                    "sacks": 0,
                    "qb_hits": 0,
                    "tackles_for_loss": 0,
                    "forced_fumbles": 0,
                    "pass_deflections": 0
                }
            agg = aggregated[pid]
            agg["games_played"] += (stat.games_played or 17)
            agg["targets"] += getattr(stat, "targets", 0)
            agg["redzone_targets"] += getattr(stat, "redzone_targets", 0)
            agg["receptions"] += getattr(stat, "receptions", 0)
            agg["receiving_yards"] += getattr(stat, "receiving_yards", 0)
            agg["fantasy_points_ppr"] += getattr(stat, "fantasy_points_ppr", 0)
            agg["offense_snaps"] += getattr(stat, "offense_snaps", 0)
            agg["pass_attempts"] += getattr(stat, "pass_attempts", 0)
            agg["rush_attempts"] += getattr(stat, "rush_attempts", 0)
            agg["redzone_rush_attempts"] += getattr(stat, "redzone_rush_attempts", 0)
            agg["rushing_yards"] += getattr(stat, "rushing_yards", 0)
            agg["sacks"] += getattr(stat, "sacks", 0)
            agg["qb_hits"] += getattr(stat, "qb_hits", 0)
            agg["tackles_for_loss"] += getattr(stat, "tackles_for_loss", 0)
            agg["forced_fumbles"] += getattr(stat, "forced_fumbles", 0)
            agg["pass_deflections"] += getattr(stat, "pass_deflections", 0)
            
            # Keep lists for averages
            if stat.air_yards_per_target: agg["air_yards_per_target"].append(stat.air_yards_per_target)
            if stat.yac_per_reception: agg["yac_per_reception"].append(stat.yac_per_reception)
            if stat.rec_epa_per_target: agg["rec_epa_per_target"].append(stat.rec_epa_per_target)
            if stat.offense_pct: agg["offense_pct"].append(stat.offense_pct)
            if stat.pass_epa_per_play: agg["pass_epa_per_play"].append(stat.pass_epa_per_play)
            if stat.cpoe: agg["cpoe"].append(stat.cpoe)
            if stat.rush_epa_per_attempt: agg["rush_epa_per_attempt"].append(stat.rush_epa_per_attempt)
            
        def avg(lst):
            return sum(lst) / len(lst) if lst else 0

        result = []
        for pid, agg in aggregated.items():
            catch_rate = (agg["receptions"] / agg["targets"]) if agg["targets"] > 0 else 0
            total_yards = agg["receiving_yards"] + agg["rushing_yards"]
            ppg = agg["fantasy_points_ppr"] / agg["games_played"] if agg["games_played"] > 0 else 0
            yprr_approx = agg["receiving_yards"] / (agg["offense_snaps"] * 0.6) if agg["offense_snaps"] > 0 else 0
            target_rate = agg["targets"] / agg["offense_snaps"] if agg["offense_snaps"] > 0 else 0
            
            result.append({
                "player_id": pid,
                "player_name": agg["player_name"],
                "position": agg["position"],
                "recent_team": agg["recent_team"],
                "season": "All",
                "games_played": agg["games_played"],
                "targets": agg["targets"],
                "redzone_targets": agg["redzone_targets"],
                "receptions": agg["receptions"],
                "receiving_yards": agg["receiving_yards"],
                "air_yards_per_target": avg(agg["air_yards_per_target"]),
                "yac_per_reception": avg(agg["yac_per_reception"]),
                "rec_epa_per_target": avg(agg["rec_epa_per_target"]),
                "total_yards": total_yards,
                "fantasy_points_ppr": agg["fantasy_points_ppr"],
                "ppg": ppg,
                "yprr_approx": yprr_approx,
                "catch_rate": catch_rate,
                "offense_pct": avg(agg["offense_pct"]),
                "target_rate": target_rate,
                "pass_epa_per_play": avg(agg["pass_epa_per_play"]),
                "cpoe": avg(agg["cpoe"]),
                "pass_attempts": agg["pass_attempts"],
                "rush_attempts": agg["rush_attempts"],
                "redzone_rush_attempts": agg["redzone_rush_attempts"],
                "rushing_yards": agg["rushing_yards"],
                "rush_epa_per_attempt": avg(agg["rush_epa_per_attempt"]),
                "sacks": agg["sacks"],
                "qb_hits": agg["qb_hits"],
                "tackles_for_loss": agg["tackles_for_loss"],
                "forced_fumbles": agg["forced_fumbles"],
                "pass_deflections": agg["pass_deflections"]
            })
    else:
        result = []
        for stat in stats:
            catch_rate = (stat.receptions / stat.targets) if getattr(stat, "targets", 0) > 0 else 0
            total_yards = (getattr(stat, "receiving_yards", 0) or 0) + (getattr(stat, "rushing_yards", 0) or 0)
            
            games = stat.games_played if getattr(stat, "games_played", 0) > 0 else 17
            fantasy_pts = getattr(stat, "fantasy_points_ppr", 0)
            ppg = fantasy_pts / games
            
            offense_snaps = getattr(stat, "offense_snaps", 0)
            yprr_approx = getattr(stat, "receiving_yards", 0) / (offense_snaps * 0.6) if offense_snaps > 0 else 0
            target_rate = getattr(stat, "targets", 0) / offense_snaps if offense_snaps > 0 else 0
            
            result.append({
                "player_id": stat.player_id,
                "player_name": stat.player_name,
                "position": stat.position,
                "recent_team": stat.recent_team,
                "season": stat.season,
                "games_played": games,
                "targets": getattr(stat, "targets", 0),
                "redzone_targets": getattr(stat, "redzone_targets", 0),
                "receptions": getattr(stat, "receptions", 0),
                "receiving_yards": getattr(stat, "receiving_yards", 0),
                "air_yards_per_target": getattr(stat, "air_yards_per_target", 0.0),
                "yac_per_reception": getattr(stat, "yac_per_reception", 0.0),
                "rec_epa_per_target": getattr(stat, "rec_epa_per_target", 0.0),
                "total_yards": total_yards,
                "fantasy_points_ppr": fantasy_pts,
                "ppg": ppg,
                "yprr_approx": yprr_approx,
                "catch_rate": catch_rate,
                "offense_pct": getattr(stat, "offense_pct", 0.0),
                "target_rate": target_rate,
                "pass_epa_per_play": getattr(stat, "pass_epa_per_play", 0.0),
                "cpoe": getattr(stat, "cpoe", 0.0),
                "pass_attempts": getattr(stat, "pass_attempts", 0),
                "rush_attempts": getattr(stat, "rush_attempts", 0),
                "redzone_rush_attempts": getattr(stat, "redzone_rush_attempts", 0),
                "rushing_yards": getattr(stat, "rushing_yards", 0),
                "rush_epa_per_attempt": getattr(stat, "rush_epa_per_attempt", 0.0),
                "sacks": getattr(stat, "sacks", 0.0),
                "qb_hits": getattr(stat, "qb_hits", 0.0),
                "tackles_for_loss": getattr(stat, "tackles_for_loss", 0.0),
                "forced_fumbles": getattr(stat, "forced_fumbles", 0.0),
                "pass_deflections": getattr(stat, "pass_deflections", 0.0)
            })
            
    return result



