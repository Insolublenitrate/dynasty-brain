import sys
sys.path.append("d:/AntiGravity Projects/dynasty-brain/backend")
from database import SessionLocal
from models import MatchupHistory, League, Roster, User, PlayerAdvancedStats
from api.routers.league import get_sleeper_players_cache
import numpy as np

session = SessionLocal()
sp_cache = get_sleeper_players_cache()

# Build player PPG lookup from latest PlayerAdvancedStats
pas_rows = session.query(PlayerAdvancedStats).filter(PlayerAdvancedStats.season >= 2023).all()
player_ppg = {}
for p in pas_rows:
    if p.games_played and p.games_played >= 4 and p.fantasy_points_ppr:
        ppg = p.fantasy_points_ppr / p.games_played
        # Prefer more recent season
        if p.player_name not in player_ppg or p.season == 2024:
            player_ppg[p.player_name] = round(ppg, 2)

def get_player_projected_pts(pid):
    p_info = sp_cache.get(str(pid), {})
    p_name = p_info.get("full_name") or f"Player {pid}"
    pos = p_info.get("position") or "FLEX"
    
    if p_name in player_ppg:
        return player_ppg[p_name], p_name, pos, p_info.get("team") or "NFL"
    
    # Position baselines
    baselines = {
        "QB": 17.5,
        "RB": 12.5,
        "WR": 12.0,
        "TE": 8.5,
        "K": 8.0,
        "DEF": 7.5
    }
    return baselines.get(pos, 10.0), p_name, pos, p_info.get("team") or "NFL"

# Test for roster 1 in 2026 week 1
m1 = session.query(MatchupHistory).filter(MatchupHistory.league_id == "1312567432052760576", MatchupHistory.season == "2026", MatchupHistory.week == 1).first()
if m1 and m1.starters:
    print(f"Roster {m1.roster_id} starters in Week 1:")
    total_proj = 0
    for s_id in m1.starters:
        pts, name, pos, tm = get_player_projected_pts(s_id)
        total_proj += pts
        print(f"  {pos:4s} | {name:22s} ({tm:3s}): {pts:.1f} proj pts")
    print(f"Total Projected Starter Score: {total_proj:.2f} pts")

session.close()
