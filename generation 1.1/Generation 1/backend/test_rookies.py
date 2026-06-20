import sys
sys.path.append('.')
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Testing 2024...")
resp = client.get('/api/stats/advanced_player_metrics?year=2024')
print(resp.status_code)
try:
    print(len(resp.json()))
except:
    print(resp.text)

print("Testing 2023...")
resp = client.get('/api/stats/advanced_player_metrics?year=2023')
print(resp.status_code)
try:
    print(len(resp.json()))
except:
    print(resp.text)
