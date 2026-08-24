import requests
import json

league_id = "1312567432052760576"
# Let's get league info from Sleeper
resp = requests.get(f"https://api.sleeper.app/v1/league/{league_id}")
league_data = resp.json()
print("Sleeper League Info:")
print("  Name:", league_data.get("name"))
print("  Season:", league_data.get("season"))
print("  Status:", league_data.get("status"))
print("  Previous League ID:", league_data.get("previous_league_id"))

# Check week 1 matchups on Sleeper
m_resp = requests.get(f"https://api.sleeper.app/v1/league/{league_id}/matchups/1")
m_data = m_resp.json()
print(f"\nWeek 1 Matchups Count on Sleeper: {len(m_data)}")
for m in m_data[:4]:
    print(" ", {k: m.get(k) for k in ["roster_id", "matchup_id", "points", "custom_points"]})

# If previous league ID exists, let's inspect that!
prev_id = league_data.get("previous_league_id")
if prev_id:
    prev_resp = requests.get(f"https://api.sleeper.app/v1/league/{prev_id}")
    prev_lg = prev_resp.json()
    print(f"\nPrevious League ({prev_id}):")
    print("  Name:", prev_lg.get("name"))
    print("  Season:", prev_lg.get("season"))
    print("  Status:", prev_lg.get("status"))
    print("  Previous League ID:", prev_lg.get("previous_league_id"))
    
    prev_m_resp = requests.get(f"https://api.sleeper.app/v1/league/{prev_id}/matchups/1")
    prev_m_data = prev_m_resp.json()
    print(f"  Previous League Week 1 Matchups Count: {len(prev_m_data)}")
    for pm in prev_m_data[:4]:
        print("   ", {k: pm.get(k) for k in ["roster_id", "matchup_id", "points", "custom_points"]})
