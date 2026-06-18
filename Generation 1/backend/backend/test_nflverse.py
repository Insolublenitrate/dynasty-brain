import pandas as pd

url = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet"
df = pd.read_parquet(url, engine='pyarrow')
# Check what positions exist and the position vs position_group columns
print("Position unique values:", df['position'].unique()[:20])
print("Position group unique:", df['position_group'].unique()[:20])
# Check a specific WR player
ja = df[df['player_display_name'] == "Ja'Marr Chase"]
print(ja[['player_display_name', 'position', 'position_group', 'season']].drop_duplicates().head())
