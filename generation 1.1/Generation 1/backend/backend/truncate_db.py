import sqlite3

conn = sqlite3.connect('data/dynastybrain.db')
c = conn.cursor()

# Delete all existing data in player_advanced_stats
c.execute("DELETE FROM player_advanced_stats")
conn.commit()
print("Truncated player_advanced_stats")

# Delete all existing data in consensus_stats
c.execute("DELETE FROM consensus_stats")
conn.commit()
print("Truncated consensus_stats")

conn.close()
