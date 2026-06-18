import requests

r = requests.get('http://localhost:8000/api/quant/rookies?year=2026').json()
if r:
    pid = r[0]["player_id"]
    print(r[0])
    res = requests.get(f'http://localhost:8000/api/quant/rookie-analyzer/{pid}').json()
    print(res)
