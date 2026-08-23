import os
import pandas as pd
import numpy as np
import urllib.request

data_cache = {}
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def fetch_parquet(url: str) -> pd.DataFrame:
    if url in data_cache:
        return data_cache[url]
        
    filename = url.split('/')[-1]
    local_path = os.path.join(DATA_DIR, filename)
    
    if not os.path.exists(local_path):
        print(f"Downloading {url} to {local_path}...")
        try:
            # Set User-Agent headers to prevent 403 on some hosts
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response, open(local_path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Download complete: {local_path}")
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return pd.DataFrame()
            
    try:
        print(f"Loading {local_path} into memory...")
        df = pd.read_parquet(local_path)
        
        # Replace NaN and Inf with None for clean JSON serialization
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notnull(df), None)
        
        data_cache[url] = df
        return df
    except Exception as e:
        print(f"Error reading parquet file {local_path}: {e}")
        return pd.DataFrame()
