import statistics

class ConsensusEngine:
    def __init__(self):
        self.source_weights = {
            "pfr": 1.0,
            "ftn": 0.9,
            "nflverse": 1.0,
            "cfbd": 1.0,
            "ncaa": 0.8
        }
        
    def cross_check(self, data_points: dict) -> dict:
        """
        data_points format:
        {
            "pfr": 4500.0,
            "ftn": 4500.0,
            "nflverse": 4480.0
        }
        Returns the consensus value, confidence score, and discrepancy flag.
        """
        if not data_points:
            return {"value": None, "confidence_score": 0.0, "discrepancy": False}
            
        values = list(data_points.values())
        
        # Check if all values are identical
        if len(set(values)) == 1:
            return {
                "value": values[0],
                "confidence_score": 100.0,
                "discrepancy": False
            }
            
        # Discrepancy found - calculate weighted average
        weighted_sum = 0
        weight_total = 0
        
        for source, val in data_points.items():
            w = self.source_weights.get(source, 0.5)
            weighted_sum += val * w
            weight_total += w
            
        consensus_val = weighted_sum / weight_total if weight_total > 0 else statistics.mean(values)
        
        # Calculate confidence score based on standard deviation and spread
        # Lower standard deviation = higher confidence
        std_dev = statistics.stdev(values) if len(values) > 1 else 0
        mean_val = statistics.mean(values)
        
        if mean_val == 0:
            confidence = 100.0 if std_dev == 0 else 0.0
        else:
            cv = std_dev / mean_val  # Coefficient of variation
            confidence = max(0.0, min(100.0, 100.0 - (cv * 100 * 2)))
            
        return {
            "value": round(consensus_val, 2),
            "confidence_score": round(confidence, 1),
            "discrepancy": True
        }

if __name__ == "__main__":
    engine = ConsensusEngine()
    test_data = {"pfr": 4500, "ftn": 4500, "nflverse": 4480}
    print("Testing:", test_data)
    print("Result:", engine.cross_check(test_data))
