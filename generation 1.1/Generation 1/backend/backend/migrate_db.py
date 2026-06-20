import sqlite3
conn = sqlite3.connect('data/dynastybrain.db')

migrations = [
    "ALTER TABLE consensus_stats ADD COLUMN player_name VARCHAR",
]

for sql in migrations:
    try:
        conn.execute(sql)
        print(f"OK: {sql}")
    except Exception as e:
        print(f"Skip ({e}): {sql}")

conn.commit()
conn.close()
print("Done.")
