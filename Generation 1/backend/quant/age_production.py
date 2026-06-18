import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict

@dataclass
class PlayerStat:
    player_id: str
    name: str
    position: str
    age: float
    fantasy_points: float

# Mock age curve models (e.g., peak ages and cliff ages)
POSITION_AGE_PARAMETERS = {
    'RB': {'peak_age': 24.0, 'cliff_age': 27.0, 'decline_rate': 0.15},
    'WR': {'peak_age': 26.5, 'cliff_age': 30.5, 'decline_rate': 0.10},
    'QB': {'peak_age': 29.0, 'cliff_age': 35.0, 'decline_rate': 0.08},
    'TE': {'peak_age': 27.0, 'cliff_age': 31.0, 'decline_rate': 0.12}
}

def expected_age_multiplier(position: str, age: float) -> float:
    """
    Calculate an age multiplier based on distance from peak and cliffs.
    Multiplier < 1.0 means production is expected to be lower due to age.
    """
    params = POSITION_AGE_PARAMETERS.get(position.upper())
    if not params:
        return 1.0 # Default if position not found

    peak = params['peak_age']
    cliff = params['cliff_age']
    decline = params['decline_rate']

    if age <= peak:
        # Ascending to peak: a simplified curve
        # Example: 80% at age 20, 100% at peak
        growth_years = peak - 20
        if growth_years <= 0: return 1.0
        return min(1.0, 0.8 + 0.2 * ((age - 20) / growth_years))
    elif age <= cliff:
        # Plateau / slow decline
        return 1.0 - ((age - peak) * 0.02)
    else:
        # Post-cliff rapid decline
        years_past_cliff = age - cliff
        base_at_cliff = 1.0 - ((cliff - peak) * 0.02)
        multiplier = base_at_cliff * ((1.0 - decline) ** years_past_cliff)
        return max(0.1, multiplier)

def flag_aging_cliffs(players: pd.DataFrame) -> pd.DataFrame:
    """
    Identify players approaching or past their aging cliff.
    Input DataFrame must have columns: 'name', 'position', 'age'
    """
    df = players.copy()
    
    def get_cliff_status(row):
        pos = row['position'].upper()
        params = POSITION_AGE_PARAMETERS.get(pos)
        if not params:
            return 'Unknown'
            
        cliff = params['cliff_age']
        if row['age'] >= cliff:
            return 'Past Cliff'
        elif row['age'] >= cliff - 1.0:
            return 'Approaching Cliff'
        else:
            return 'Safe'
            
    df['cliff_status'] = df.apply(get_cliff_status, axis=1)
    df['age_multiplier'] = df.apply(lambda row: expected_age_multiplier(row['position'], row['age']), axis=1)
    
    return df
