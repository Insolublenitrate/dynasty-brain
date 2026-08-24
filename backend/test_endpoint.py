import sys
sys.path.append("d:/AntiGravity Projects/dynasty-brain/backend")
from api.routers.league import get_league_schedule

# Test 2026 (Upcoming)
sched_2026 = get_league_schedule("1312567432052760576", season="2026")
print("=== 2026 SCHEDULE RESULTS ===")
print("Season:", sched_2026.get("season"))
print("Available Seasons:", sched_2026.get("available_seasons"))
print("Current Week:", sched_2026.get("current_week"))
print("Franchises count:", len(sched_2026.get("franchises", [])))
for f in sched_2026.get("franchises", [])[:3]:
    print(f"  {f['team_name']}: {f['wins']}W-{f['losses']}L | PF: {f['points_for']} | PA: {f['points_against']} | AllPlay: {f['all_play_record']} ({f['all_play_win_pct']}%)")

# Test 2025 (Completed)
sched_2025 = get_league_schedule("1312567432052760576", season="2025")
print("\n=== 2025 SCHEDULE RESULTS ===")
print("Season:", sched_2025.get("season"))
print("Franchises count:", len(sched_2025.get("franchises", [])))
for f in sched_2025.get("franchises", [])[:3]:
    print(f"  {f['team_name']}: {f['wins']}W-{f['losses']}L | PF: {f['points_for']} | PA: {f['points_against']} | AllPlay: {f['all_play_record']} ({f['all_play_win_pct']}%)")
