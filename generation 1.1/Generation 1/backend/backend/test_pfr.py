from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import pandas as pd
from io import StringIO

url = "https://www.pro-football-reference.com/years/2023/passing.htm"

print("Attempting to bypass PFR bot protection with Playwright headless browser...")

with Stealth().use_sync(sync_playwright()) as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    page = context.new_page()
    
    try:
        page.goto(url, wait_until="domcontentloaded")
        print("Page loaded, waiting for table#passing...")
        page.wait_for_selector("table#passing", timeout=20000)
        html = page.content()
        
        df = pd.read_html(StringIO(html))[0]
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(-1)
            
        print(f"Successfully scraped {len(df)} passing rows!")
        print(df.head())
    except Exception as e:
        print("Failed to scrape with Playwright:", e)
        # Save a screenshot for debugging if it failed
        page.screenshot(path="failed_pfr.png")
        print("Saved screenshot to failed_pfr.png")
    finally:
        browser.close()
