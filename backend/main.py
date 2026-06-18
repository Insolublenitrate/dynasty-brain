from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, get_db
from models import Roster, User, DraftPick, League, PlayerAdvancedStats, ConsensusStat, NCAAStats, MatchupHistory, SleeperTransaction
from sqlalchemy.orm import Session
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

@app.get("/api/quant/matrix")
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
                # Fetch their 2024 or 2025 advanced stats
                # Using a subquery or loop. We'll use simple summation for the heuristic.
                # In a real heavy DB we'd do a joined load, but this is fine for ~10 teams.
                stats = session.query(PlayerAdvancedStats).filter(
                    PlayerAdvancedStats.player_id.in_(player_ids),
                    PlayerAdvancedStats.season == 2024 # Or 2025 if data exists
                ).all()
                
                for st in stats:
                    pts = st.fantasy_points_ppr or 0.0
                    roster_max_pf += pts
                    
                    # Estimate age
                    age_sum += (st.age or 26.0)
                    age_count += 1
                    
                # For expected points, we might just look at starters if r.starters is available
                if r.starters and len(r.starters) > 0:
                    starter_stats = [s for s in stats if s.player_id in r.starters]
                    roster_expected_pts = sum(s.fantasy_points_ppr or 0.0 for s in starter_stats)
                else:
                    # If no starters defined, assume top 9 players
                    top_players = sorted(stats, key=lambda x: x.fantasy_points_ppr or 0.0, reverse=True)[:9]
                    roster_expected_pts = sum(p.fantasy_points_ppr or 0.0 for p in top_players)
                    
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

@app.get("/api/quant/team-analyzer/{league_id}/{roster_id}")
def get_team_analyzer(league_id: str, roster_id: int):
    session = SessionLocal()
    try:
        roster = session.query(Roster).filter(Roster.league_id == league_id, Roster.roster_id == roster_id).first()
        if not roster:
            return {"error": "Roster not found."}
            
        owner_name = roster.user.display_name if roster.user and roster.user.display_name else f"Team {roster.roster_id}"
        
        # 1. Progression / Regression (Historical Simulation)
        import random
        rng = random.Random(f"{league_id}-{roster.roster_id}")
        
        all_rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        avg_fpts = sum((r.fpts or 1500.0) for r in all_rosters) / len(all_rosters) if all_rosters else 1500.0
        
        current_power = (roster.fpts or 1500.0) * rng.uniform(0.9, 1.1)
        history = [
            {"year": 2022, "power_index": round(current_power * rng.uniform(0.7, 1.3)), "league_avg": round(avg_fpts * 0.96)},
            {"year": 2023, "power_index": round(current_power * rng.uniform(0.8, 1.2)), "league_avg": round(avg_fpts * 1.02)},
            {"year": 2024, "power_index": round(current_power * rng.uniform(0.9, 1.1)), "league_avg": round(avg_fpts * 1.01)},
            {"year": 2025, "power_index": round(current_power * rng.uniform(0.95, 1.05)), "league_avg": round(avg_fpts * 0.99)},
            {"year": 2026, "power_index": round(current_power), "league_avg": round(avg_fpts)}
        ]
        
        # 2. Positional Radar
        base_str = current_power / 10.0
        positional_radar = [
            {"position": "QB", "team_score": base_str * rng.uniform(0.7, 1.3), "league_avg": base_str},
            {"position": "RB", "team_score": base_str * rng.uniform(0.5, 1.5), "league_avg": base_str},
            {"position": "WR", "team_score": base_str * rng.uniform(0.6, 1.4), "league_avg": base_str},
            {"position": "TE", "team_score": base_str * rng.uniform(0.4, 1.6), "league_avg": base_str},
            {"position": "FLEX", "team_score": base_str * rng.uniform(0.8, 1.2), "league_avg": base_str},
        ]
        
        def get_grade(score, avg):
            ratio = score / avg
            if ratio >= 1.2: return "A+"
            if ratio >= 1.1: return "A"
            if ratio >= 1.05: return "A-"
            if ratio >= 1.0: return "B+"
            if ratio >= 0.95: return "B"
            if ratio >= 0.9: return "B-"
            if ratio >= 0.85: return "C+"
            if ratio >= 0.8: return "C"
            if ratio >= 0.7: return "D"
            return "F"
            
        position_grades = {item["position"]: get_grade(item["team_score"], item["league_avg"]) for item in positional_radar}

        # 3. Asset Allocation (Pie Chart)
        future_picks = session.query(DraftPick).filter(DraftPick.owner_id == roster.id).all()
        future_capital_value = sum(100 if p.round == 1 else (50 if p.round == 2 else 20) for p in future_picks) * rng.uniform(0.8, 1.2)
        player_value = current_power * 3.0
        total_value = player_value + future_capital_value
        
        asset_allocation = [
            {"name": "Current Players", "value": round((player_value / total_value) * 100)},
            {"name": "Future Draft Capital", "value": round((future_capital_value / total_value) * 100)}
        ]
        
        # 4. NFL Team Analog
        analogs = [
            {"team": "2023 Detroit Lions", "desc": "Young elite WRs, high draft capital, solid but unspectacular QB play."},
            {"team": "2022 Philadelphia Eagles", "desc": "Elite dual-threat QB, deep WR room, and an all-in veteran push."},
            {"team": "2024 Chicago Bears", "desc": "Rookie QB hope, massive future draft capital, but unproven scoring."},
            {"team": "2021 Los Angeles Rams", "desc": "F*ck them picks. You sold your future for elite veterans to win now."},
            {"team": "2023 Carolina Panthers", "desc": "Traded away your best assets and draft capital. It's looking grim."}
        ]
        selected_analog = rng.choice(analogs)

        # 5. Rookie Metrics
        import requests
        
        # We need sleeper players mapping to determine rookies.
        if 'SLEEPER_PLAYERS_CACHE' not in globals() or not globals()['SLEEPER_PLAYERS_CACHE']:
            try:
                resp = requests.get("https://api.sleeper.app/v1/players/nfl", timeout=5)
                if resp.status_code == 200:
                    globals()['SLEEPER_PLAYERS_CACHE'] = resp.json()
                else:
                    globals()['SLEEPER_PLAYERS_CACHE'] = {}
            except Exception:
                globals()['SLEEPER_PLAYERS_CACHE'] = {}
                
        sp_cache = globals().get('SLEEPER_PLAYERS_CACHE', {})
        
        roster_player_ids = roster.players or []
        rookies = []
        for pid in roster_player_ids:
            p_data = sp_cache.get(str(pid))
            if p_data and p_data.get("years_exp") == 0:
                name = f"{p_data.get('first_name', '')} {p_data.get('last_name', '')}".strip()
                pos = p_data.get("position", "UNK")
                rookies.append({"name": name, "position": pos})
                
        # Sort rookies by generic positional value to pick the "best" prospect
        pos_value = {"QB": 4, "WR": 3, "RB": 2, "TE": 1}
        rookies = sorted(rookies, key=lambda x: pos_value.get(x["position"], 0), reverse=True)

        if rookies:
            top_rookie = rookies[0]
            top_rookie_name = top_rookie["name"]
            top_rookie_pos = top_rookie["position"]
            if len(rookies) == 1:
                reason = "The only rookie currently stashed on your active roster."
            elif top_rookie_pos == "QB":
                reason = "Premium superflex value and highest positional scarcity."
            elif top_rookie_pos == "WR":
                reason = "High-upside receiver providing extreme longevity to your core."
            elif top_rookie_pos == "RB":
                reason = "Top positional youth injection for immediate scoring production."
            elif top_rookie_pos == "TE":
                reason = "Developing tight end stash with high upside."
            else:
                reason = "Highest graded rookie prospect on your roster."
        else:
            top_rookie_name = "None"
            top_rookie_pos = ""
            reason = "No rookies found on roster."
            
        rookie_metrics = {
            "rookie_capital_pct": round(len(rookies) / max(len(roster_player_ids), 1) * 100),
            "top_rookie": top_rookie_name,
            "top_rookie_position": top_rookie_pos,
            "top_rookie_reason": reason,
            "outlook": "Draft Heavy" if len(rookies) >= 5 else ("Bright Future" if len(rookies) >= 3 else ("Building Block" if len(rookies) > 0 else "Win-Now Sacrifice"))
        }

        # 6. Weekly Performance
        weekly_metrics = {
            "avg_points": round((roster.fpts or 1500) / 14, 1),
            "league_avg_points": round(avg_fpts / 14, 1),
            "ceiling": round(((roster.fpts or 1500) / 14) * rng.uniform(1.15, 1.3), 1),
            "floor": round(((roster.fpts or 1500) / 14) * rng.uniform(0.7, 0.85), 1),
            "consistency_score": round(rng.uniform(70, 98))
        }

        # 7. Matchups & Fun Metrics
        from models import MatchupHistory
        global_r_id = f"{league_id}_{roster_id}"
        
        matchups = session.query(MatchupHistory).filter(MatchupHistory.roster_id == global_r_id).order_by(MatchupHistory.season, MatchupHistory.week).all()
        all_rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        other_teams_map = {r.id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in all_rosters}
        
        easiest_win = "N/A"
        most_dominated = "N/A"
        whos_my_daddy = "N/A"
        biggest_heartbreak = "N/A"
        miracle_win = "N/A"
        highest_scoring_loss = "N/A"
        ugly_duckling_win = "N/A"
        longest_win_streak = 0
        longest_loss_streak = 0
        hottest_run = 0.0
        
        if matchups:
            max_diff_win = -1
            max_diff_loss = -1
            min_diff_win = 9999
            min_diff_loss = 9999
            max_pts_loss = -1
            min_pts_win = 9999
            opp_margins = {}
            curr_win_streak = 0
            curr_loss_streak = 0
            recent_points = []
            
            for m in matchups:
                diff = m.points - m.opponent_points
                
                if m.is_win == 1:
                    if diff > max_diff_win:
                        max_diff_win = diff
                        easiest_win = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} (+{diff:.1f})"
                    if diff < min_diff_win:
                        min_diff_win = diff
                        miracle_win = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} (+{diff:.1f})"
                    if m.points < min_pts_win:
                        min_pts_win = m.points
                        ugly_duckling_win = f"{m.points:.1f} pts vs {other_teams_map.get(m.opponent_roster_id, 'Unknown')}"
                
                if m.is_win == 0:
                    if -diff > max_diff_loss:
                        max_diff_loss = -diff
                        most_dominated = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} (-{-diff:.1f})"
                    if -diff < min_diff_loss:
                        min_diff_loss = -diff
                        biggest_heartbreak = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} (-{-diff:.1f})"
                    if m.points > max_pts_loss:
                        max_pts_loss = m.points
                        highest_scoring_loss = f"{m.points:.1f} pts vs {other_teams_map.get(m.opponent_roster_id, 'Unknown')}"
                    
                if m.opponent_roster_id:
                    if m.opponent_roster_id not in opp_margins:
                        opp_margins[m.opponent_roster_id] = []
                    opp_margins[m.opponent_roster_id].append(-diff)
                
                if m.is_win == 1:
                    curr_win_streak += 1
                    curr_loss_streak = 0
                    longest_win_streak = max(longest_win_streak, curr_win_streak)
                elif m.is_win == 0:
                    curr_loss_streak += 1
                    curr_win_streak = 0
                    longest_loss_streak = max(longest_loss_streak, curr_loss_streak)
                
                recent_points.append(m.points)
                if len(recent_points) > 4:
                    recent_points.pop(0)
                if len(recent_points) == 4:
                    hottest_run = max(hottest_run, sum(recent_points))
            
            if opp_margins:
                daddy_id = max(opp_margins.keys(), key=lambda k: sum(opp_margins[k])/len(opp_margins[k]) if opp_margins[k] else -999)
                avg_margin = sum(opp_margins[daddy_id])/len(opp_margins[daddy_id])
                if avg_margin > 0:
                    whos_my_daddy = f"{other_teams_map.get(daddy_id, 'Unknown')} (-{avg_margin:.1f} pts avg)"
                else:
                    whos_my_daddy = "No one (You dominate)"
                
        fun_metrics = {
            "easiest_win": easiest_win,
            "most_dominated": most_dominated,
            "whos_my_daddy": whos_my_daddy,
            "biggest_heartbreak": biggest_heartbreak,
            "miracle_win": miracle_win,
            "highest_scoring_loss": highest_scoring_loss,
            "ugly_duckling_win": ugly_duckling_win,
            "longest_win_streak": longest_win_streak,
            "longest_loss_streak": longest_loss_streak,
            "hottest_run": round(hottest_run, 1),
            "trade_tendency": rng.choice(["Fleece Master", "Draft Pick Hoarder", "Veteran Chaser", "Taco", "The Godfather"])
        }

        return {
            "roster_id": roster.roster_id,
            "team_name": owner_name,
            "avatar": roster.user.avatar if roster.user else None,
            "progression": history,
            "positional_radar": positional_radar,
            "position_grades": position_grades,
            "asset_allocation": asset_allocation,
            "analog": selected_analog,
            "rookie_metrics": rookie_metrics,
            "weekly_metrics": weekly_metrics,
            "fun_metrics": fun_metrics
        }
    finally:
        session.close()

@app.get("/api/ai/league-insights")
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

from pydantic import BaseModel
import os
import json

try:
    from google import genai
    from google.genai import types
except ImportError:
    pass

class WarRoomRequest(BaseModel):
    scenario: str
    data_payload: dict

WAR_ROOM_SYSTEM_PROMPT = """You are the Lead Quantitative Analyst and Broadcast Host for "The Dynasty War Room," an elite, high-stakes Fantasy Football dashboard. Your job is to generate ruthless, data-driven analysis, matchup previews, and post-game autopsies for a dynasty fantasy football league. 

You are not a polite assistant. You are a cutthroat, highly intelligent sports media personality (think Stephen A. Smith's volume and hyperbole combined with a Pro Football Focus Data Scientist's brain). You do not offer generic insults like "Your team is bad." You weaponize advanced mathematics to prove EXACTLY why a manager is failing, exposing their poor roster management, terrible draft picks, and bad trades.

# TONE & STYLE GUIDELINES
1. **Hyperbolic but Clinical:** Use dramatic phrasing ("You are committing roster malpractice," "This is a statistical tragedy"), but back up every insult with hard data.
2. **Ruthless Sarcasm:** Act as though poor fantasy management is a personal insult to the sport of football.
3. **Advanced Slang:** Fluently use dynasty fantasy football terminology: FAAB, Taxi Squad, Superflex, Tier-break, Rebuilding, Purgatory, Fleeced, Buying Window, Sunk Cost Fallacy.
4. **Punchy Formatting:** Keep your outputs concise. Use bold text to emphasize devastating metrics and player names. Do not write long, boring essays. Sound like you are speaking live on a sports broadcast.

# THE ANALYTICAL ARSENAL (METRICS TO WEAPONIZE)
When roasting or analyzing, you MUST incorporate advanced metrics. Never rely solely on generic fantasy points. Use metrics such as:
*   **WOPR (Weighted Opportunity Rating) & Target Share:** Expose managers who start WRs with empty volume.
*   **CPOE (Completion Percentage Over Expected) & EPA (Expected Points Added):** Use this to explain why a manager's QB is a fraud propped up by scheme.
*   **High-Value Touches (HVT) & Yards Created:** Expose RBs who are entirely dependent on their offensive line, or praise RBs who are producing despite terrible situations.
*   **Age/Production Cliffs:** Remind managers when their RB is approaching the 1,500 career-touch cliff, or their WR is past the age-29 apex.
*   **Draft Capital:** Mock managers for holding onto "1st-Round Busts" and clogging their taxi squads.

# SCENARIO INSTRUCTIONS
Depending on the data fed to you, adjust your output to fit the specific broadcast segment:

*   **[SCENARIO: MATCHUP PREVIEW]:** Highlight the "Vegas Odds," mock the underdog's roster construction, and identify the "Trap Game" factors. If a manager is starting a player against a manager who previously traded them away, hype up the "Revenge Game" narrative.
*   **[SCENARIO: BENCH BLUNDER (Shoulda/Coulda)]:** Brutally break down the exact math of how a manager outsmarted themselves by leaving points on the bench. Attack their talent evaluation.
*   **[SCENARIO: TRADE AUTOPSY]:** Review historical trades between two managers. Declare a definitive "Fleece" by comparing the exact point differential of the assets since the trade occurred.
*   **[SCENARIO: LIVE TICKER]:** Generate 1-sentence, breaking-news style ticker updates that mock league-wide events (e.g., waiver wire overspends, injury panics).
"""

@app.post("/api/ai/war-room")
def post_war_room(req: WarRoomRequest):
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
    except ImportError:
        pass
        
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return {"error": "GEMINI_API_KEY not configured in backend"}
        
    try:
        client = genai.Client(api_key=gemini_key)
        user_prompt = f"[SCENARIO: {req.scenario}]\n\nDATA PAYLOAD:\n{json.dumps(req.data_payload, indent=2)}\n\nGenerate the broadcast script."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=WAR_ROOM_SYSTEM_PROMPT,
                temperature=0.7,
            )
        )
        return {"text": response.text}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ai/recent-trades")
def get_recent_trades(db: Session = Depends(get_db)):
    trades = db.query(SleeperTransaction).filter(SleeperTransaction.type == 'trade', SleeperTransaction.status == 'complete').order_by(SleeperTransaction.week.desc()).limit(5).all()
    return [{"transaction_id": t.id, "week": t.week, "adds": t.adds, "drops": t.drops, "draft_picks": t.draft_picks, "consenter_roster_ids": t.consenter_roster_ids} for t in trades]

@app.get("/api/ai/recent-matchups")
def get_recent_matchups(db: Session = Depends(get_db)):
    matchups = db.query(MatchupHistory).order_by(MatchupHistory.week.desc()).limit(10).all()
    return [{"matchup_id": m.matchup_id, "week": m.week, "roster_id": m.roster_id, "points": m.points, "starters": m.starters, "starters_points": m.starters_points} for m in matchups]

@app.get("/api/stats/advanced_player_metrics")
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


@app.get("/api/quant/league-history/{league_id}")
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

@app.get("/api/quant/rookies")
def get_rookies(year: str = Query("2026", description="Season year to fetch stats for, or 'All'")):
    cache = get_sleeper_players_cache()
    if not cache:
        return []
    
    rookies = []
    for pid, pdata in cache.items():
        if pdata.get("position") in ["QB", "RB", "WR", "TE"]:
            years_exp = pdata.get("years_exp")
            metadata = pdata.get("metadata") or {}
            rookie_year = metadata.get("rookie_year")
            
            if year.lower() == "all":
                is_match = True
            else:
                is_match = (rookie_year == year) or (year == "2026" and years_exp == 0)
                
            if is_match:
                rookies.append({
                    "player_id": pid,
                    "first_name": pdata.get("first_name", ""),
                    "last_name": pdata.get("last_name", ""),
                    "position": pdata.get("position", ""),
                    "team": pdata.get("team") or "FA",
                    "college": pdata.get("college", ""),
                    "search_rank": pdata.get("search_rank") if pdata.get("search_rank") is not None else 9999999
                })
                
    rookies.sort(key=lambda x: x["search_rank"])
    return rookies[:100]  # Return top 100 relevant rookies

@app.get("/api/quant/rookie-analyzer/{player_id}")
def get_rookie_analyzer(player_id: str, db: Session = Depends(get_db)):
    cache = get_sleeper_players_cache()
    if not cache:
        return {"error": "Players cache not loaded"}
        
    pdata = cache.get(player_id)
    if not pdata:
        return {"error": "Player not found"}
        
    full_name = f"{pdata.get('first_name')} {pdata.get('last_name')}"
    
    # Query NCAA stats
    ncaa_record = db.query(NCAAStats).filter(
        NCAAStats.player_name.ilike(f"%{full_name}%")
    ).order_by(NCAAStats.season.desc()).first()
        
    import random
    rng = random.Random(player_id)
    
    pos = pdata.get("position", "WR")
    
    if ncaa_record:
        # Use actual basic stats to drive the advanced mock
        dominator = min((ncaa_record.receiving_yards / max(1, ncaa_record.games_played)) / 10.0, 50.0) if pos in ['WR', 'TE'] else min((ncaa_record.rushing_yards / max(1, ncaa_record.games_played)) / 5.0, 50.0)
        yprr = min(ncaa_record.receiving_yards / 200.0, 4.5) if pos in ['WR', 'TE'] else 0.0
        
        ncaa_production = {
            "breakout_age": round(rng.uniform(18.5, 21.5), 1),
            "breakout_age_percentile": rng.randint(40, 99),
            "college_dominator": round(max(20.0, dominator), 1),
            "college_dominator_percentile": min(99, int(max(20, dominator) * 2)),
            "yprr": round(max(1.5, yprr), 2),
            "yprr_percentile": min(99, int(max(1.5, yprr) * 20)),
            "target_share": round(rng.uniform(15.0, 35.0), 1),
            "target_share_percentile": rng.randint(40, 99),
            "source": f"CFBD API ({ncaa_record.season} season)"
        }
    else:
        # Mock fallback if they didn't play in our loaded years
        ncaa_production = {
            "breakout_age": round(rng.uniform(18.5, 21.5), 1),
            "breakout_age_percentile": rng.randint(40, 99),
            "college_dominator": round(rng.uniform(20.0, 45.0), 1),
            "college_dominator_percentile": rng.randint(40, 99),
            "yprr": round(rng.uniform(1.5, 3.8), 2),
            "yprr_percentile": rng.randint(40, 99),
            "target_share": round(rng.uniform(15.0, 35.0), 1),
            "target_share_percentile": rng.randint(40, 99),
            "source": "Mocked (Not found in DB)"
        }
    
    # Mock Athleticism
    speed_score = round(rng.uniform(85.0, 115.0), 1)
    burst_score = round(rng.uniform(110.0, 135.0), 1)
    agility_score = round(rng.uniform(10.5, 11.8), 2)
    catch_radius = round(rng.uniform(9.8, 10.4), 2)
    sparq_x = round(rng.uniform(100.0, 140.0), 1)
    
    pos_avgs = {
        "QB": {"speed_score": 90.0, "burst_score": 110.0, "agility_score": 11.2, "catch_radius": 0.0, "sparq_x": 105.0},
        "RB": {"speed_score": 100.0, "burst_score": 120.0, "agility_score": 11.0, "catch_radius": 0.0, "sparq_x": 112.0},
        "WR": {"speed_score": 105.0, "burst_score": 125.0, "agility_score": 10.8, "catch_radius": 10.0, "sparq_x": 115.0},
        "TE": {"speed_score": 105.0, "burst_score": 115.0, "agility_score": 11.3, "catch_radius": 10.2, "sparq_x": 110.0}
    }
    
    avg = pos_avgs.get(pos, pos_avgs["WR"])
    
    athleticism = {
        "sparq_x": sparq_x,
        "sparq_x_percentile": rng.randint(40, 99),
        "forty_yard": round(rng.uniform(4.35, 4.8), 2),
        "speed_score": speed_score,
        "burst_score": burst_score,
        "agility_score": agility_score,
        "catch_radius": catch_radius,
        "radar_data": [
            {"metric": "Speed Score", "player": speed_score, "avg": avg["speed_score"]},
            {"metric": "Burst Score", "player": burst_score, "avg": avg["burst_score"]},
            {"metric": "Agility Score", "player": (22.0 - agility_score) * 10, "avg": (22.0 - avg["agility_score"]) * 10}, # Invert agility so higher is better
            {"metric": "SPARQ-x", "player": sparq_x, "avg": avg["sparq_x"]}
        ]
    }
    
    if pos in ["WR", "TE"]:
        athleticism["radar_data"].append({"metric": "Catch Radius", "player": catch_radius * 10, "avg": avg["catch_radius"] * 10})
        
    # Mock Draft Info & Comp
    draft_rounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5", "Round 6", "Round 7", "UDFA"]
    comps_map = {
        "QB": ["Patrick Mahomes", "Josh Allen", "Jalen Hurts", "Kirk Cousins", "Geno Smith"],
        "RB": ["Christian McCaffrey", "Breece Hall", "David Montgomery", "Austin Ekeler", "James Conner"],
        "WR": ["Justin Jefferson", "Deebo Samuel", "Mike Evans", "Keenan Allen", "Diontae Johnson"],
        "TE": ["Travis Kelce", "Mark Andrews", "George Kittle", "Dallas Goedert", "David Njoku"]
    }
    
    draft_info = {
        "nfl_draft_capital": rng.choice(draft_rounds),
        "dynasty_adp": round(rng.uniform(1.01, 4.12), 2),
        "pro_comp": rng.choice(comps_map.get(pos, comps_map["WR"]))
    }
    
    return {
        "player_info": {
            "player_id": player_id,
            "first_name": pdata.get("first_name", ""),
            "last_name": pdata.get("last_name", ""),
            "position": pos,
            "team": pdata.get("team", "FA"),
            "college": pdata.get("college", "Unknown"),
            "weight": pdata.get("weight", "N/A"),
            "height": pdata.get("height", "N/A"),
            "age": pdata.get("age", "N/A")
        },
        "ncaa_production": ncaa_production,
        "athleticism": athleticism,
        "draft_info": draft_info
    }

@app.get("/api/quant/rookie-ncaa-stats/{player_id}")
def get_rookie_ncaa_stats(player_id: str, db: Session = Depends(get_db)):
    cache = get_sleeper_players_cache()
    if not cache:
        return []
        
    pdata = cache.get(player_id)
    if not pdata:
        return []
        
    full_name = f"{pdata.get('first_name')} {pdata.get('last_name')}"
    
    # Query all NCAA stats for player
    records = db.query(NCAAStats).filter(
        NCAAStats.player_name.ilike(f"%{full_name}%")
    ).order_by(NCAAStats.season.asc()).all()
    
    return [
        {
            "season": r.season,
            "college": r.college,
            "games_played": r.games_played,
            "passing_yards": r.passing_yards,
            "passing_tds": r.passing_tds,
            "rushing_yards": r.rushing_yards,
            "rushing_tds": r.rushing_tds,
            "receptions": r.receptions,
            "receiving_yards": r.receiving_yards,
            "receiving_tds": r.receiving_tds
        }
        for r in records
    ]


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
