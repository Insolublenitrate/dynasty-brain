import sqlite3
conn = sqlite3.connect('data/dynastybrain.db')
c = conn.cursor()
c.execute("SELECT player_name, season, data_source FROM player_advanced_stats WHERE player_name LIKE '%Barkley%'")
print(c.fetchall())
