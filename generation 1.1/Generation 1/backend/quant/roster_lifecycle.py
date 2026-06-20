import pandas as pd
from typing import List, Dict

def classify_roster_lifecycle(
    expected_points: float, 
    actual_points: float, 
    league_median_points: float,
    roster_age_score: float,
    future_capital_score: float,
    max_pf: float
) -> str:
    """
    Classify a roster into one of four states based on points and age/capital.
    - Contender: High actual points/Max PF, good expected points.
    - Fraud: High actual points (lucky), but low Max PF / low expected points.
    - Rebuild: Low points, but good future capital / young roster.
    - Purgatory: Middle/low points, old roster, lack of future capital.
    """
    
    # Simple heuristic thresholds (these would be tuned with data)
    is_scoring_well = actual_points > league_median_points * 1.05
    is_max_pf_high = max_pf > league_median_points * 1.10
    has_good_future = (future_capital_score > 5000) or (roster_age_score < 26.0) # arbitrary thresholds for mock
    
    if is_scoring_well:
        if is_max_pf_high and expected_points >= actual_points * 0.9:
            return "Contender"
        else:
            return "Fraud"
    else:
        if has_good_future:
            return "Rebuild"
        else:
            return "Purgatory"

def analyze_league_rosters(rosters_df: pd.DataFrame) -> pd.DataFrame:
    """
    Analyze all rosters in a league dataframe.
    Expected columns: 
    'roster_id', 'expected_points', 'actual_points', 'max_pf', 'roster_age_score', 'future_capital_score'
    """
    df = rosters_df.copy()
    
    median_pts = df['actual_points'].median()
    
    df['lifecycle_state'] = df.apply(
        lambda row: classify_roster_lifecycle(
            row['expected_points'],
            row['actual_points'],
            median_pts,
            row['roster_age_score'],
            row['future_capital_score'],
            row['max_pf']
        ), axis=1
    )
    
    # Proactive Decision Intelligence: Buy/Sell Indicators
    # If Expected > Actual -> Buy indicator
    # If Actual > Expected -> Sell indicator (overperforming)
    df['point_differential'] = df['actual_points'] - df['expected_points']
    
    def buy_sell_recommendation(row):
        if row['lifecycle_state'] == 'Fraud':
            return 'SELL (Overperforming/Old)'
        elif row['lifecycle_state'] == 'Rebuild' and row['point_differential'] < -50:
            return 'BUY (Underperforming Youth)'
        elif row['lifecycle_state'] == 'Contender':
            return 'HOLD/BUY VETS'
        elif row['lifecycle_state'] == 'Purgatory':
            return 'LIQUIDATE'
        return 'HOLD'
        
    df['action_recommendation'] = df.apply(buy_sell_recommendation, axis=1)
    
    return df
