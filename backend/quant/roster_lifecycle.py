import pandas as pd
import numpy as np
from typing import List, Dict

def classify_roster_lifecycle(
    max_pf: float,
    capital_score: float,
    median_pf: float,
    median_cap: float
) -> str:
    """
    Classify a roster into exact 4-quadrant states based on Starter Max PF and Future Draft Capital.
    """
    if max_pf >= median_pf:
        if capital_score >= median_cap:
            return "Dynasty Juggernaut"
        else:
            return "All-In Contender"
    else:
        if capital_score >= median_cap:
            return "Rebuilding"
        else:
            return "Purgatory"

def analyze_league_rosters(rosters_df: pd.DataFrame) -> pd.DataFrame:
    """
    Analyze all rosters in a league dataframe and harmonize lifecycle states with quadrant coordinates.
    """
    df = rosters_df.copy()
    
    if df.empty:
        return df
        
    median_pf = float(df['max_pf'].median()) if 'max_pf' in df else 2600.0
    median_cap = float(df['future_capital_score'].median()) if 'future_capital_score' in df else 15000.0
    
    df['lifecycle_state'] = df.apply(
        lambda row: classify_roster_lifecycle(
            row['max_pf'],
            row['future_capital_score'],
            median_pf,
            median_cap
        ), axis=1
    )
    
    def buy_sell_recommendation(row):
        state = row['lifecycle_state']
        if state == 'All-In Contender':
            return 'WIN-NOW: PROTECT CONTENDING WINDOW'
        elif state == 'Rebuilding':
            return 'ACCUMULATE: CAPITALIZE ON PICKS'
        elif state == 'Dynasty Juggernaut':
            return 'DOMINATE: CONSOLIDATE INTO SUPERSTARS'
        elif state == 'Purgatory':
            return 'RETOOL: LIQUIDATE AGING ASSETS'
        return 'HOLD / EVALUATE'
        
    df['action_recommendation'] = df.apply(buy_sell_recommendation, axis=1)
    
    # Advanced AI Coaching Metrics
    all_in_teams = df[df['lifecycle_state'] == 'All-In Contender']['team_name'].tolist()
    rebuild_teams = df[df['lifecycle_state'] == 'Rebuilding']['team_name'].tolist()
    juggernaut_teams = df[df['lifecycle_state'] == 'Dynasty Juggernaut']['team_name'].tolist()
    purgatory_teams = df[df['lifecycle_state'] == 'Purgatory']['team_name'].tolist()
    
    def generate_ai_coaching(row):
        insights = []
        state = row['lifecycle_state']
        
        if state == 'Rebuilding':
            if all_in_teams or juggernaut_teams:
                targets = (all_in_teams + juggernaut_teams)[:2]
                insights.append(f"Trade Path: Engage {', '.join(targets)}. They need immediate starter points and will pay up with future picks for producing veterans.")
            else:
                insights.append("Trade Path: Hold high-upside youth and accumulate 2025/2026 1st-round draft capital.")
        elif state == 'All-In Contender':
            if rebuild_teams or purgatory_teams:
                targets = (rebuild_teams + purgatory_teams)[:2]
                insights.append(f"Trade Path: Your championship window is open. Target {', '.join(targets)} for producing weekly starters.")
        elif state == 'Dynasty Juggernaut':
            if purgatory_teams:
                insights.append(f"Trade Path: You control both points and draft equity. Target {', '.join(purgatory_teams[:2])} for superstar consolidation.")
        elif state == 'Purgatory':
            if rebuild_teams or juggernaut_teams:
                targets = (rebuild_teams + juggernaut_teams)[:2]
                insights.append(f"Trade Path: Low points with limited future capital. Initiate a strategic teardown with {', '.join(targets)}.")
                
        return " | ".join(insights) if insights else "Hold current roster structure."

    df['ai_coaching'] = df.apply(generate_ai_coaching, axis=1)
    
    return df
