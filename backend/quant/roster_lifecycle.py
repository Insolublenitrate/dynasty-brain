import pandas as pd
from typing import List, Dict

def classify_roster_lifecycle(
    power_index: float,
    health_score: float,
    median_power: float
) -> str:
    """
    Classify a roster into one of states based on Current Power Index and Dynasty Health Score.
    """
    # Adjusted thresholds to match expected distribution:
    # Top contenders
    if power_index > median_power * 1.10:
        if health_score > 60.0:
            return "Dynasty Juggernaut"
        else:
            return "All-In Contender"
    # Rebuilds
    elif power_index < median_power * 0.90:
        if health_score > 55.0:
            return "Rebuilding"
        else:
            return "Purgatory"
    # The mixed pack
    else:
        return "Middle of the Pack"

def analyze_league_rosters(rosters_df: pd.DataFrame) -> pd.DataFrame:
    """
    Analyze all rosters in a league dataframe.
    """
    df = rosters_df.copy()
    
    if df.empty:
        return df
        
    median_power = df['power_index'].median()
    
    df['lifecycle_state'] = df.apply(
        lambda row: classify_roster_lifecycle(
            row['power_index'],
            row['health_score'],
            median_power
        ), axis=1
    )
    
    def buy_sell_recommendation(row):
        state = row['lifecycle_state']
        if state == 'All-In Contender':
            return 'SELL PICKS FOR WIN-NOW VETS'
        elif state == 'Rebuilding':
            return 'BUY (Underperforming Youth)'
        elif state == 'Dynasty Juggernaut':
            return 'HOLD / CONSOLIDATE'
        elif state == 'Purgatory':
            return 'LIQUIDATE'
        elif state == 'Middle of the Pack':
            return 'EVALUATE MARKET OPTIONS'
        return 'HOLD'
        
    df['action_recommendation'] = df.apply(buy_sell_recommendation, axis=1)
    
    # Advanced AI Coaching Metrics
    all_in_teams = df[df['lifecycle_state'] == 'All-In Contender']['team_name'].tolist()
    rebuild_teams = df[df['lifecycle_state'] == 'Rebuilding']['team_name'].tolist()
    juggernaut_teams = df[df['lifecycle_state'] == 'Dynasty Juggernaut']['team_name'].tolist()
    purgatory_teams = df[df['lifecycle_state'] == 'Purgatory']['team_name'].tolist()
    middle_teams = df[df['lifecycle_state'] == 'Middle of the Pack']['team_name'].tolist()
    
    def generate_ai_coaching(row):
        insights = []
        state = row['lifecycle_state']
        
        # Trade Path Recommendations
        if state == 'Rebuilding':
            if all_in_teams or juggernaut_teams:
                targets = (all_in_teams + juggernaut_teams)[:2]
                insights.append(f"Trade Path: Seek out {', '.join(targets)}. They are contending and may overpay with future picks for your producing veterans.")
            else:
                insights.append("Trade Path: Hold youth and accumulate draft capital.")
        elif state == 'All-In Contender':
            if rebuild_teams or purgatory_teams:
                targets = (rebuild_teams + purgatory_teams)[:2]
                insights.append(f"Trade Path: Your window is now. Consider trading away future picks to {', '.join(targets)} for producing veterans to secure a championship.")
        elif state == 'Dynasty Juggernaut':
            if purgatory_teams:
                insights.append(f"Trade Path: You are set up for long-term success. Target {', '.join(purgatory_teams[:2])} who might be willing to liquidate elite but older assets.")
        elif state == 'Purgatory':
            if rebuild_teams or juggernaut_teams:
                targets = (rebuild_teams + juggernaut_teams)[:2]
                insights.append(f"Trade Path: You are stuck in the middle. Initiate a tear-down by trading with {', '.join(targets)} to acquire young talent and picks.")
        elif state == 'Middle of the Pack':
            insights.append("Trade Path: You are in the mixed pack. Decide to either package depth for a superstar to push for a title, or sell off aging assets to re-tool.")
                
        return " | ".join(insights) if insights else "No immediate urgent actions."

    df['ai_coaching'] = df.apply(generate_ai_coaching, axis=1)
    
    return df
