import sqlite3

conn = sqlite3.connect('dynastybrain.db')
print("Tables:", [t[0] for t in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()])

try:
    print("Players in 2025:", conn.execute("SELECT count(*) FROM playerstats WHERE season=2025").fetchone()[0])
    print("Offensive players in 2025:", conn.execute("SELECT count(*) FROM playerstats WHERE position IN ('QB', 'RB', 'WR', 'TE') AND season=2025").fetchone()[0])
except Exception as e:
    print(e)
