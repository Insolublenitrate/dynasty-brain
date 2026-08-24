import sys
sys.path.append("d:/AntiGravity Projects/dynasty-brain/backend")
import requests
from database import SessionLocal
from models import MatchupHistory, League, Roster, User

session = SessionLocal()
current_league_id = "1312567432052760576"

# Trace previous leagues
chain = []
curr_id = current_league_id
while curr_id:
    r = requests.get(f"https://api.sleeper.app/v1/league/{curr_id}")
    if r.status_code != 200:
        break
    data = r.json()
    if not data:
        break
    chain.append({
        "league_id": curr_id,
        "season": data.get("season"),
        "name": data.get("name"),
        "previous_league_id": data.get("previous_league_id")
    })
    curr_id = data.get("previous_league_id")

print("Found League Chain:")
for c in chain:
    print(f"  Season {c['season']}: league_id={c['league_id']}")

# Backfill matchups for all seasons with complete matchup_id and starters!
for c in chain:
    s_lg_id = c["league_id"]
    season = str(c["season"])
    print(f"\nFetching matchups for Season {season} (League ID: {s_lg_id})...")
    
    # Delete old incomplete rows for this league_id & season
    session.query(MatchupHistory).filter(
        MatchupHistory.league_id == current_league_id,
        MatchupHistory.season == season
    ).delete()
    
    added_count = 0
    for week in range(1, 19):
        m_resp = requests.get(f"https://api.sleeper.app/v1/league/{s_lg_id}/matchups/{week}")
        if m_resp.status_code == 200:
            m_list = m_resp.json() or []
            for m in m_list:
                r_id = m.get("roster_id")
                if r_id:
                    session.add(MatchupHistory(
                        league_id=current_league_id,
                        season=season,
                        week=week,
                        roster_id=f"{current_league_id}_{r_id}",
                        matchup_id=m.get("matchup_id"),
                        points=float(m.get("points") or 0.0),
                        starters=m.get("starters") or [],
                        starters_points=m.get("starters_points") or [],
                        players=m.get("players") or [],
                        players_points=m.get("players_points") or {}
                    ))
                    added_count += 1
    session.commit()
    print(f"  Ingested {added_count} complete matchups for Season {season}!")

session.close()
