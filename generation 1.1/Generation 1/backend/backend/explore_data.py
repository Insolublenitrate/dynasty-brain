import pandas as pd

urls = {
    "player_stats": "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.parquet",
    "pfr_rec": "https://github.com/nflverse/nflverse-data/releases/download/pfr_advanced_stats/advstats_season_rec.parquet",
    "snap_counts": "https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts.parquet",
    "ftn_charting": "https://github.com/nflverse/nflverse-data/releases/download/ftn_charting/ftn_charting_2023.parquet",
    "ngs_rec": "https://github.com/nflverse/nflverse-data/releases/download/nextgen_stats/ngs_2023_receiving.parquet"
}

def analyze():
    with open("data_exploration_results.txt", "w") as f:
        for name, url in urls.items():
            f.write(f"--- {name} ---\n")
            try:
                df = pd.read_parquet(url)
                if 'season' in df.columns:
                    df = df[df['season'] == 2023]
                f.write(f"Columns: {', '.join(df.columns.tolist())}\n")
            except Exception as e:
                f.write(f"Failed to fetch {name}: {e}\n\n")

if __name__ == "__main__":
    analyze()
