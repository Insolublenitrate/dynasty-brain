import urllib.request, json
try:
    resp = urllib.request.urlopen("http://localhost:8000/api/stats/advanced_player_metrics?year=2025")
    data = json.loads(resp.read())
    offense = [p for p in data if p.get('position') in ['QB', 'RB', 'WR', 'TE']]
    with open('offense_test.json', 'w') as f:
        json.dump(offense[:3], f, indent=2)
except Exception as e:
    with open('offense_test.json', 'w') as f:
        f.write(str(e))
