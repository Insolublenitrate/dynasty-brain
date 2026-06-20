import sqlite3

conn = sqlite3.connect('data/dynastybrain.db')
cursor = conn.cursor()

cursor.execute("SELECT * FROM player_advanced_stats WHERE season = 2025")
rows = cursor.fetchall()
col_names = [description[0] for description in cursor.description]

if not rows:
    print("No 2025 data found to duplicate.")
else:
    insert_cols = [c for c in col_names if c != 'id']
    placeholders = ', '.join(['?' for _ in insert_cols])
    
    # We need to map the values to the insert_cols
    for target_year in [2026, 2024, 2023]:
        # Delete existing first to avoid duplicate accumulation
        cursor.execute(f"DELETE FROM player_advanced_stats WHERE season = {target_year}")
        for row in rows:
            row_dict = dict(zip(col_names, row))
            row_dict['season'] = target_year
            values = [row_dict[c] for c in insert_cols]
            cursor.execute(f"INSERT INTO player_advanced_stats ({', '.join(insert_cols)}) VALUES ({placeholders})", values)
        print(f"Copied 2025 data to {target_year}.")

conn.commit()
conn.close()
