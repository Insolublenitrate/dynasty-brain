import sqlite3
import os
try:
    path = r'C:\Users\167856\OneDrive - LSI Industries\Documents\GitHub\dynasty-brain\backend\data\dynastybrain.db'
    if not os.path.exists(path):
        print("DB DOES NOT EXIST!")
    else:
        conn = sqlite3.connect(path)
        print("Players in 2025:", conn.execute("SELECT count(*) FROM player_advanced_stats WHERE season=2025").fetchone()[0])
except Exception as e:
    print(e)
