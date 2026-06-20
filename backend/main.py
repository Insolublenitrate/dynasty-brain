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
        roster_player_ids = roster.players or []
        stats = session.query(PlayerAdvancedStats).filter(
            PlayerAdvancedStats.player_id.in_(roster_player_ids),
            PlayerAdvancedStats.season >= 2022
        ).all()
        
        all_players_in_league = []
        for r in all_rosters:
            if r.players:
                all_players_in_league.extend(r.players)
                
        all_stats = session.query(PlayerAdvancedStats).filter(
            PlayerAdvancedStats.player_id.in_(all_players_in_league),
            PlayerAdvancedStats.season >= 2022
        ).all()
        
        def get_pos_scores(stat_list):
            pos_totals = {"QB": 0.0, "RB": 0.0, "WR": 0.0, "TE": 0.0, "FLEX": 0.0}
            player_avg = {}
            player_pos = {}
            for st in stat_list:
                pid = st.player_id
                pts = st.fantasy_points_ppr or 0.0
                if pid not in player_avg:
                    player_avg[pid] = []
                    player_pos[pid] = st.position
                player_avg[pid].append(pts)
                
            for pid, pts_list in player_avg.items():
                avg_pts = sum(pts_list) / len(pts_list)
                pos = player_pos[pid]
                if pos in pos_totals:
                    pos_totals[pos] += avg_pts
                if pos in ["RB", "WR", "TE"]:
                    pos_totals["FLEX"] += avg_pts
            return pos_totals

        team_pos_scores = get_pos_scores(stats)
        league_pos_scores = get_pos_scores(all_stats)
        num_teams = max(len(all_rosters), 1)

        positional_radar = [
            {"position": "QB", "team_score": round((team_pos_scores["QB"] / max(league_pos_scores["QB"]/num_teams, 1)) * 100), "league_avg": 100},
            {"position": "RB", "team_score": round((team_pos_scores["RB"] / max(league_pos_scores["RB"]/num_teams, 1)) * 100), "league_avg": 100},
            {"position": "WR", "team_score": round((team_pos_scores["WR"] / max(league_pos_scores["WR"]/num_teams, 1)) * 100), "league_avg": 100},
            {"position": "TE", "team_score": round((team_pos_scores["TE"] / max(league_pos_scores["TE"]/num_teams, 1)) * 100), "league_avg": 100},
            {"position": "FLEX", "team_score": round((team_pos_scores["FLEX"] / max(league_pos_scores["FLEX"]/num_teams, 1)) * 100), "league_avg": 100},
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
                if m.points == 0 and m.opponent_points == 0:
                    continue # Skip unplayed matchups (e.g. future weeks or byes)
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
                        most_dominated = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} ({diff:.1f})"
                    if -diff < min_diff_loss:
                        min_diff_loss = -diff
                        biggest_heartbreak = f"{other_teams_map.get(m.opponent_roster_id, 'Unknown')} ({diff:.1f})"
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
                
        # Biggest Rival (most matchups)
        rival_counts = {}
        for m in matchups:
            if m.opponent_roster_id:
                rival_counts[m.opponent_roster_id] = rival_counts.get(m.opponent_roster_id, 0) + 1
        
        biggest_rival = "N/A"
        if rival_counts:
            best_rival_id = max(rival_counts.keys(), key=lambda k: rival_counts[k])
            biggest_rival = f"{other_teams_map.get(best_rival_id, 'Unknown')} ({rival_counts[best_rival_id]} matchups)"

        # Biggest Trade Partner
        from models import SleeperTransaction
        trades = session.query(SleeperTransaction).filter(
            SleeperTransaction.league_id == league_id,
            SleeperTransaction.type == 'trade',
            SleeperTransaction.status == 'complete'
        ).all()
        
        trade_counts = {}
        for t in trades:
            consenters = t.consenter_roster_ids or []
            if roster.roster_id in consenters:
                for partner in consenters:
                    if partner != roster.roster_id:
                        trade_counts[partner] = trade_counts.get(partner, 0) + 1
        
        biggest_trade_partner = "No one (Hold strong)"
        if trade_counts:
            best_partner_id = max(trade_counts.keys(), key=lambda k: trade_counts[k])
            partner_roster = next((r for r in all_rosters if r.roster_id == best_partner_id), None)
            if partner_roster:
                p_name = partner_roster.user.display_name if partner_roster.user and partner_roster.user.display_name else f"Team {partner_roster.roster_id}"
                biggest_trade_partner = f"{p_name} ({trade_counts[best_partner_id]} trades)"

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
            "biggest_rival": biggest_rival,
            "biggest_trade_partner": biggest_trade_partner,
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

@app.get("/api/quant/weekly-studio/{league_id}")
def get_weekly_studio(league_id: str):
    session = SessionLocal()
    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        if not rosters:
            return {"error": "No rosters found"}
            
        roster_map = {r.roster_id: r for r in rosters}
        owner_name_map = {r.roster_id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in rosters}
        
        # 1. Bounty Board (Sorted by Roster FPTS / MAX_PF)
        from models import MatchupHistory
        import requests
        
        # Payout rules
        # 1st: $600, 2nd: $200, Season High: $60, Weekly Top: $10. Started in 2024.
        
        # Helper: fetch historical league brackets
        def get_historical_brackets(curr_league_id):
            if 'BRACKETS_CACHE' not in globals():
                globals()['BRACKETS_CACHE'] = {}
            if curr_league_id in globals()['BRACKETS_CACHE']:
                return globals()['BRACKETS_CACHE'][curr_league_id]
                
            brackets = {}
            curr = curr_league_id
            while curr:
                try:
                    resp = requests.get(f"https://api.sleeper.app/v1/league/{curr}", timeout=5)
                    if not resp.ok: break
                    league_data = resp.json()
                    season = league_data.get('season')
                    prev = league_data.get('previous_league_id')
                    
                    if int(season) >= 2024:
                        bracket_resp = requests.get(f"https://api.sleeper.app/v1/league/{curr}/winners_bracket", timeout=5)
                        if bracket_resp.ok:
                            bracket_data = bracket_resp.json()
                            champ_match = next((m for m in bracket_data if m.get('p') == 1), None)
                            if champ_match and champ_match.get('w'):
                                brackets[season] = {
                                    '1st': champ_match.get('w'),
                                    '2nd': champ_match.get('l')
                                }
                    curr = prev
                except:
                    break
            globals()['BRACKETS_CACHE'][curr_league_id] = brackets
            return brackets

        brackets = get_historical_brackets(league_id)
        
        # We need matchups grouped by season and week to find weekly highs and season highs.
        all_matchups = session.query(MatchupHistory).filter(MatchupHistory.roster_id.like(f"{league_id}_%")).all()
        
        # Calculate payouts
        manager_payouts = {r.roster_id: {"total": 0, "breakdown": []} for r in rosters}
        
        # Group by season
        season_matchups = {}
        for m in all_matchups:
            if not m.season or int(m.season) < 2024: continue
            if m.season not in season_matchups:
                season_matchups[m.season] = {}
            if m.week not in season_matchups[m.season]:
                season_matchups[m.season][m.week] = []
            season_matchups[m.season][m.week].append(m)
            
        weekly_history = [] # For the chart

        for season, weeks in season_matchups.items():
            season_roster_totals = {r.roster_id: 0.0 for r in rosters}
            
            # Find weekly highs
            for week, matchups_in_week in weeks.items():
                if not matchups_in_week: continue
                # Omit weeks where no points were scored (e.g. offseason)
                if all((m.points or 0.0) == 0 for m in matchups_in_week): continue
                
                top_matchup = max(matchups_in_week, key=lambda x: x.points or 0.0)
                r_id = int(top_matchup.roster_id.split('_')[1])
                
                if (top_matchup.points or 0.0) > 0:
                    if r_id in manager_payouts:
                        manager_payouts[r_id]["total"] += 10
                        manager_payouts[r_id]["breakdown"].append(f"{season} Wk {week} High ($10)")
                    
                    # expected points logic: if we don't have projections, we'll use a standard baseline or season average
                    weekly_history.append({
                        "season": season,
                        "week": week,
                        "roster_id": r_id,
                        "owner": owner_name_map.get(r_id, f"Team {r_id}"),
                        "actual": round(top_matchup.points or 0.0, 1),
                        "expected": round((top_matchup.points or 0.0) * 0.92, 1) # Mocked expected
                    })
                
                for m in matchups_in_week:
                    m_r_id = int(m.roster_id.split('_')[1])
                    if m_r_id in season_roster_totals:
                        season_roster_totals[m_r_id] += (m.points or 0.0)
            
            # Season High Points Winner ($60)
            if any(pts > 0 for pts in season_roster_totals.values()):
                season_high_roster = max(season_roster_totals.items(), key=lambda x: x[1])[0]
                if season_high_roster in manager_payouts:
                    manager_payouts[season_high_roster]["total"] += 60
                    manager_payouts[season_high_roster]["breakdown"].append(f"{season} Points Ldr ($60)")
            
            # 1st ($600) and 2nd ($200) Place
            if season in brackets:
                first_place = brackets[season].get('1st')
                second_place = brackets[season].get('2nd')
                if first_place and first_place in manager_payouts:
                    manager_payouts[first_place]["total"] += 600
                    manager_payouts[first_place]["breakdown"].append(f"{season} Champion ($600)")
                if second_place and second_place in manager_payouts:
                    manager_payouts[second_place]["total"] += 200
                    manager_payouts[second_place]["breakdown"].append(f"{season} Runner-Up ($200)")

        bounty_board = []
        for r_id, data in manager_payouts.items():
            bounty_board.append({
                "roster_id": r_id,
                "name": owner_name_map.get(r_id, f"Team {r_id}"),
                "cashWon": data["total"],
                "breakdown": data["breakdown"]
            })
            
        bounty_board = sorted(bounty_board, key=lambda x: x["cashWon"], reverse=True)[:5]
        weekly_history = sorted(weekly_history, key=lambda x: (int(x["season"]), int(x["week"])))
        
        # 2. Marquee Matchup
        latest_matchups = session.query(MatchupHistory).filter(MatchupHistory.roster_id.like(f"{league_id}_%")).order_by(MatchupHistory.week.desc()).limit(20).all()
        
        marquee_matchup = None
        if latest_matchups:
            # Group by matchup_id
            games = {}
            for m in latest_matchups:
                if m.matchup_id not in games:
                    games[m.matchup_id] = []
                games[m.matchup_id].append(m)
                
            # Find the closest or highest scoring game
            best_game = None
            max_combined = 0
            for mid, m_list in games.items():
                if len(m_list) == 2:
                    combined = m_list[0].points + m_list[1].points
                    if combined > max_combined:
                        max_combined = combined
                        best_game = m_list
            
            if best_game:
                team1 = best_game[0]
                team2 = best_game[1]
                t1_roster_id = int(team1.roster_id.split('_')[1])
                t2_roster_id = int(team2.roster_id.split('_')[1])
                
                marquee_matchup = {
                    "teamA": {"name": owner_name_map.get(t1_roster_id, "Unknown"), "proj": round(team1.points, 1)},
                    "teamB": {"name": owner_name_map.get(t2_roster_id, "Unknown"), "proj": round(team2.points, 1)},
                    "spread": round(abs(team1.points - team2.points), 1)
                }
                
        if not marquee_matchup:
            marquee_matchup = {
                "teamA": {"name": "No Upcoming Matchups", "proj": 0},
                "teamB": {"name": "Offseason Mode", "proj": 0},
                "spread": 0
            }
            
        # 3. Monday Autopsy (Find a manager who lost but had a high scoring bench player)
        monday_autopsy = None
        for m in latest_matchups:
            if m.is_win == 0 and m.points > 0 and m.opponent_points > 0:
                margin = m.opponent_points - m.points
                if m.starters and m.players and m.starters_points and m.players_points:
                    # Find bench players
                    bench_players = [p for p in m.players if p not in m.starters]
                    for bp in bench_players:
                        bp_pts = m.players_points.get(str(bp), 0.0)
                        # See if replacing the lowest scoring starter would win
                        min_starter = min(m.starters, key=lambda s: m.starters_points.get(str(s), 0.0) if m.starters_points else 0.0)
                        min_s_pts = m.starters_points.get(str(min_starter), 0.0) if m.starters_points else 0.0
                        if bp_pts - min_s_pts > margin:
                            r_id = int(m.roster_id.split('_')[1])
                            monday_autopsy = {
                                "victim": owner_name_map.get(r_id, "Unknown"),
                                "margin": round(margin, 1),
                                "started": {"name": str(min_starter), "points": round(min_s_pts, 1), "share": "N/A"},
                                "benched": {"name": str(bp), "points": round(bp_pts, 1), "share": "N/A"}
                            }
                            break
            if monday_autopsy:
                break
                
        if not monday_autopsy:
             monday_autopsy = {
                "victim": "No Major Blunders Detected",
                "margin": 0,
                "started": {"name": "N/A", "points": 0, "share": "0%"},
                "benched": {"name": "N/A", "points": 0, "share": "0%"}
            }
        
        return {
            "bounty_board": bounty_board,
            "weekly_history": weekly_history,
            "marquee_matchup": marquee_matchup,
            "monday_autopsy": monday_autopsy
        }
    finally:
        session.close()

@app.get("/api/quant/trades/{league_id}")
def get_trades(league_id: str):
    session = SessionLocal()
    try:
        from models import SleeperTransaction, Roster
        trades = session.query(SleeperTransaction).filter(
            SleeperTransaction.league_id == league_id,
            SleeperTransaction.type == 'trade',
            SleeperTransaction.status == 'complete'
        ).order_by(SleeperTransaction.week.desc()).limit(20).all()
        
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        owner_name_map = {r.roster_id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in rosters}
        
        results = []
        for t in trades:
            if t.adds:
                r_ids = list(set(t.adds.values()))
                teams = [owner_name_map.get(r_id, f"Team {r_id}") for r_id in r_ids]
                results.append({
                    "transaction_id": t.id,
                    "date": f"Week {t.week}, {t.season}",
                    "teams": teams
                })
        return results
    finally:
        session.close()

@app.get("/api/quant/trade-autopsy/{league_id}")
def get_trade_autopsy(league_id: str, transaction_id: str = None):
    session = SessionLocal()
    try:
        from models import SleeperTransaction, MatchupHistory, Roster
        
        query = session.query(SleeperTransaction).filter(
            SleeperTransaction.league_id == league_id,
            SleeperTransaction.type == 'trade',
            SleeperTransaction.status == 'complete'
        )
        
        if transaction_id:
            trade = query.filter(SleeperTransaction.id == transaction_id).first()
        else:
            trade = query.order_by(SleeperTransaction.week.desc()).first()
        
        if not trade or not trade.adds:
            return {"error": "No recent trades found"}
            
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        owner_name_map = {r.roster_id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in rosters}
        
        roster_ids = list(set(trade.adds.values()))
        if len(roster_ids) < 2:
            # Attempt to pull from draft_picks if adds is empty or one-sided
            if trade.draft_picks:
                roster_ids = list(set(dp.get("owner_id") for dp in trade.draft_picks) | set(dp.get("previous_owner_id") for dp in trade.draft_picks))
            if len(roster_ids) < 2:
                return {"error": "Trade only involved one known team"}
            
        team_a_id = roster_ids[0]
        team_b_id = roster_ids[1]
        
        team_a_assets = []
        team_b_assets = []
        
        import requests
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
        
        def get_name(pid):
            p = sp_cache.get(str(pid))
            if p: return f"{p.get('first_name', '')[0]}. {p.get('last_name', '')}"
            return str(pid)
            
        def calc_pts_since(roster_id, player_id, trade_week):
            global_r_id = f"{league_id}_{roster_id}"
            matchups = session.query(MatchupHistory).filter(
                MatchupHistory.roster_id == global_r_id,
                MatchupHistory.week > trade_week
            ).all()
            
            pts = 0.0
            for m in matchups:
                if m.players_points and str(player_id) in m.players_points:
                    pts += m.players_points[str(player_id)]
            return round(pts, 1)

        team_a_total = 0.0
        team_b_total = 0.0
        
        if trade.adds:
            for player_id, receiving_roster_id in trade.adds.items():
                pts = calc_pts_since(receiving_roster_id, player_id, trade.week or 0)
                asset_obj = {"name": get_name(player_id), "pointsSince": pts}
                
                if receiving_roster_id == team_a_id:
                    team_a_assets.append(asset_obj)
                    team_a_total += pts
                else:
                    team_b_assets.append(asset_obj)
                    team_b_total += pts
                
        if trade.draft_picks:
            for dp in trade.draft_picks:
                receiving_roster_id = dp.get("owner_id")
                asset_obj = {"name": f"{dp.get('season')} Round {dp.get('round')}", "pointsSince": 0.0}
                if receiving_roster_id == team_a_id:
                    team_a_assets.append(asset_obj)
                elif receiving_roster_id == team_b_id:
                    team_b_assets.append(asset_obj)

        net_diff = round(abs(team_a_total - team_b_total), 1)
        winner = team_a_id if team_a_total > team_b_total else team_b_id
        winner_name = owner_name_map.get(winner, "Unknown")
        
        return {
            "date": f"Week {trade.week}, {trade.season}",
            "teamA": owner_name_map.get(team_a_id, "Unknown"),
            "teamB": owner_name_map.get(team_b_id, "Unknown"),
            "assetsA": team_a_assets,
            "assetsB": team_b_assets,
            "netDifference": f"+{net_diff} Points",
            "winner_name": winner_name
        }
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
