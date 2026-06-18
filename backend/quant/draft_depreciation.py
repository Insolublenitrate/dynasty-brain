import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class DraftPick:
    year: int
    round: int
    pick_number: Optional[int] = None # 1 to 12 or 14
    
    # Optional projected pick context, e.g. 'early', 'mid', 'late'
    projection: str = 'mid'

def calculate_base_pick_value(pick_round: int, projection: str = 'mid') -> float:
    """Mock base values for draft picks (e.g. KeepTradeCut style values)"""
    base_values = {
        1: {'early': 6000, 'mid': 5000, 'late': 4000},
        2: {'early': 2500, 'mid': 2000, 'late': 1500},
        3: {'early': 1000, 'mid': 800, 'late': 500},
        4: {'early': 300, 'mid': 200, 'late': 100}
    }
    
    if pick_round not in base_values:
        return 0.0
        
    return base_values[pick_round].get(projection, base_values[pick_round]['mid'])

def calculate_pick_depreciation(pick: DraftPick, current_year: int, discount_rate: float = 0.15) -> float:
    """
    Calculate the present value of a future draft pick.
    discount_rate: Rate at which future picks depreciate per year.
    """
    base_value = calculate_base_pick_value(pick.round, pick.projection)
    
    years_out = max(0, pick.year - current_year)
    
    # Time value of money formula: PV = FV / (1 + r)^n
    present_value = base_value / ((1 + discount_rate) ** years_out)
    
    return present_value

def evaluate_pick_portfolio(picks: List[DraftPick], current_year: int, discount_rate: float = 0.15) -> float:
    """Calculate the total depreciated value of a portfolio of draft picks."""
    total_value = sum(calculate_pick_depreciation(pick, current_year, discount_rate) for pick in picks)
    return total_value
