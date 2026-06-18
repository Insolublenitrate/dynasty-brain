import requests

for y in [2026, 2025, 2024, 2023, 2022]:
    r = requests.get(f'http://localhost:8000/api/stats/advanced_player_metrics?year={y}')
    if r.status_code == 200:
        data = r.json()
        print(f"Year: {y}, Total Players: {len(data)}")
        if len(data) > 0:
            print(f"  Sample: {data[0]['player_name']} - {data[0]['season']}")
    else:
        print(f"Year {y}: Error {r.status_code}")
