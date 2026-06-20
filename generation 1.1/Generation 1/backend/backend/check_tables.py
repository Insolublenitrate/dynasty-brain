import sqlite3
conn = sqlite3.connect('data/dynastybrain.db')

# List all tables
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
print("Tables:", [t[0] for t in tables])

# Check consensus_stats schema if it exists
try:
    info = conn.execute("PRAGMA table_info(consensus_stats);").fetchall()
    print("\nconsensus_stats columns:", [col[1] for col in info])
except Exception as e:
    print("No consensus_stats:", e)

conn.close()
