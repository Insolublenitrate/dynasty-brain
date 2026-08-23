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

@router.post("/api/league/ingest/{league_id}")
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


@router.get("/api/quant/matrix")
def get_power_matrix(league_id: str = "1312567432052760576"):
    session = SessionLocal()
    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        if not rosters:
            return {"error": "No rosters found for this league."}
            
        data = []
        for r in rosters:
            owner_name = (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}")
            
            # Get picks owned by this roster
            picks = session.query(DraftPick).filter(DraftPick.owner_id == r.id).all()
            
            # Map DB picks to Quant DraftPicks
            quant_picks = []
            for p in picks:
                quant_picks.append(QuantDraftPick(year=int(p.season), round=p.round))
                
            future_capital_score = evaluate_pick_portfolio(quant_picks, current_year=2024)
            
            # Calculate expected points and max_pf based on actual player data in the roster
            roster_expected_pts = 0.0
            roster_max_pf = 0.0
            age_sum = 0.0
            age_count = 0
            
            # Since players is a list of player IDs
            if r.players and len(r.players) > 0:
                player_ids = r.players
                # Fetch their advanced stats from 2022 onwards (historical dynasty timeline)
                stats = session.query(PlayerAdvancedStats).filter(
                    PlayerAdvancedStats.player_id.in_(player_ids),
                    PlayerAdvancedStats.season >= 2022
                ).all()
                
                # Aggregate historical points by player
                player_pts = {}
                player_age = {}
                for st in stats:
                    pid = st.player_id
                    pts = st.fantasy_points_ppr or 0.0
                    if pid not in player_pts:
                        player_pts[pid] = []
                        player_age[pid] = []
                    player_pts[pid].append(pts)
                    player_age[pid].append(26.0) # PlayerAdvancedStats doesn't have age, we default to 26
                    
                for pid, pts_list in player_pts.items():
                    avg_pts = sum(pts_list) / len(pts_list)
                    roster_max_pf += avg_pts
                    age_sum += (sum(player_age[pid]) / len(player_age[pid]))
                    age_count += 1
                    
                # For expected points, we might just look at starters if r.starters is available
                if r.starters and len(r.starters) > 0:
                    roster_expected_pts = sum((sum(player_pts[pid])/len(player_pts[pid])) for pid in r.starters if pid in player_pts)
                else:
                    # If no starters defined, assume top 9 players
                    avg_player_pts = [(sum(pts)/len(pts)) for pts in player_pts.values()]
                    top_players = sorted(avg_player_pts, reverse=True)[:9]
                    roster_expected_pts = sum(top_players)
                    
            if roster_max_pf == 0: roster_max_pf = 1500.0
            if roster_expected_pts == 0: roster_expected_pts = 1200.0
            
            actual_pts = r.fpts or roster_expected_pts
            expected_pts = roster_expected_pts
            max_pf = roster_max_pf
            point_differential = actual_pts - expected_pts
            age_score = (age_sum / age_count) if age_count > 0 else 26.5
            
            # Mock Manager Habits (Still heuristic since we lack trade history DB)
            import random
            rng = random.Random(f"{league_id}-{r.roster_id}")
            trade_frequency = rng.uniform(0, 40) # 0 to 40 trades a year
            draft_success_rate = rng.uniform(0.1, 0.6) # 10% to 60% hit rate
            
            # X-Axis: Current Power Index (Weighted aggregate in "points" scale)
            power_index = (max_pf * 0.6) + (expected_pts * 0.3) + (point_differential * 0.1)
            
            # Y-Axis: Dynasty Health Score (0-100 scale)
            # Roster Age (40%): Scale age to a 0-100 score. 24 is 100, 29 is 0.
            age_normalized = max(0, min(100, (29.0 - age_score) * 20))
            # Draft Capital (30%): Scale future capital (0 - 10000 typically)
            capital_normalized = min(100, (future_capital_score / 10000.0) * 100)
            # Manager Trade Frequency (15%): Scale 0-30 trades to 0-100
            trade_normalized = min(100, (trade_frequency / 30.0) * 100)
            # Draft Success (15%): Scale to 0-100
            draft_normalized = min(100, (draft_success_rate / 0.6) * 100)
            
            health_score = (age_normalized * 0.4) + (capital_normalized * 0.3) + (trade_normalized * 0.15) + (draft_normalized * 0.15)
            
            data.append({
                "roster_id": r.roster_id,
                "team_name": owner_name,
                "expected_points": expected_pts,
                "actual_points": actual_pts,
                "max_pf": max_pf,
                "point_differential": point_differential,
                "roster_age_score": age_score,
                "future_capital_score": future_capital_score,
                "trade_frequency": trade_frequency,
                "draft_success_rate": draft_success_rate,
                "power_index": power_index,
                "health_score": health_score,
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


@router.get("/api/ai/league-insights")
def get_league_insights(league_id: str = "1312567432052760576"):
    # Generate heuristic mock insights simulating Gemini AI
    # These act as Trade Paths, Player Warnings, and Bye Week Conflicts
    session = SessionLocal()
    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        if not rosters:
            return {"error": "No rosters found"}
            
        import random
        # Ensure consistent AI recommendations per league instead of changing on every refresh
        rng = random.Random(league_id)
        
        actions = []
        
        # 1. Trade Path (Buy Low on an aging receiver)
        buy_low_target = rng.choice(rosters)
        buy_low_name = buy_low_target.user.display_name if buy_low_target.user and buy_low_target.user.display_name else f"Team {buy_low_target.roster_id}"
        actions.append({
            "id": f"trade-{buy_low_target.roster_id}",
            "type": "opportunity",
            "title": f"Trade Path: Buy Low from {buy_low_name}",
            "description": f"{buy_low_name} is starting to rebuild. They hold valuable aging assets that don't fit their timeline. Send an offer for their top WR with a 2nd round pick.",
            "timestamp": "AI Engine"
        })
        
        # 2. Player Warning
        actions.append({
            "id": f"warning-{rng.randint(100, 999)}",
            "type": "alert",
            "title": "Player Trade Warning",
            "description": "A player on your roster has a severely declining efficiency profile. Their target share dropped by 14% over the last 3 weeks while their snap count remained stable. Sell before the market adjusts.",
            "timestamp": "AI Engine"
        })
        
        # 3. Bye Week Conflict
        actions.append({
            "id": f"bye-{rng.randint(100, 999)}",
            "type": "alert",
            "title": "Bye Week Conflict (Week 7)",
            "description": "You have 4 starting players on Bye in Week 7 (including your QB1 and TE1). You are projected to lose that week by 30 points. Consider addressing this in a future trade.",
            "timestamp": "AI Engine"
        })
        
        return actions
    finally:
        session.close()


@router.get("/api/quant/league-history/{league_id}")
def get_league_history(league_id: str):
    session = SessionLocal()
    try:
        from models import LeagueHistory, Roster
        history_records = session.query(LeagueHistory).filter(LeagueHistory.league_id == league_id).order_by(LeagueHistory.season.desc()).all()
        
        all_rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        roster_map = {r.id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in all_rosters}
        
        result = []
        for h in history_records:
            result.append({
                "season": h.season,
                "champion": roster_map.get(h.champion_roster_id, "Unknown") if h.champion_roster_id else "TBD",
                "second_place": roster_map.get(h.second_place_roster_id, "Unknown") if h.second_place_roster_id else "TBD",
                "third_place": roster_map.get(h.third_place_roster_id, "Unknown") if h.third_place_roster_id else "TBD",
                "worst_performer": roster_map.get(h.last_place_roster_id, "Unknown") if h.last_place_roster_id else "TBD"
            })
            
        return result
    finally:
        session.close()

import requests

def get_sleeper_players_cache():
    if 'SLEEPER_PLAYERS_CACHE' not in globals() or not globals()['SLEEPER_PLAYERS_CACHE']:
        try:
            resp = requests.get("https://api.sleeper.app/v1/players/nfl", timeout=5)
            if resp.status_code == 200:
                globals()['SLEEPER_PLAYERS_CACHE'] = resp.json()
            else:
                globals()['SLEEPER_PLAYERS_CACHE'] = {}
        except Exception:
            globals()['SLEEPER_PLAYERS_CACHE'] = {}
            
    return globals().get('SLEEPER_PLAYERS_CACHE', {})


