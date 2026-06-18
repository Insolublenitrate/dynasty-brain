import requests
r = requests.get('http://localhost:8000/api/stats/advanced_player_metrics?year=2024')
print("Status:", r.status_code)
print("Text:", r.text[:500])
