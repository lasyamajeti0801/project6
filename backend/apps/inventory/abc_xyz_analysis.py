"""
StockPilot Enterprise ABC-XYZ Inventory Classification Engine
Implements the Pareto (80/20) revenue classification combined with demand predictability
coefficient of variation (CV) to automate warehouse slotting and safety stock policies.
"""

from decimal import Decimal
import numpy as np
import pandas as pd
from typing import List, Dict, Any

class AbcXyzClassifier:
    """
    Computes a 9-box matrix (AX, AY, AZ, BX, BY, BZ, CX, CY, CZ)
    for multi-warehouse inventory optimization.
    """

    def __init__(self, a_threshold: float = 0.80, b_threshold: float = 0.95):
        """
        - a_threshold: Cumulative revenue threshold for Class A items (default 80%).
        - b_threshold: Cumulative revenue threshold for Class B items (default 95%).
        """
        self.a_threshold = a_threshold
        self.b_threshold = b_threshold

    def classify_abc(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Classifies products by annual monetary turnover (Unit Price x Annual Demand).
        """
        if not items:
            return []

        df = pd.DataFrame(items)
        df['annual_value'] = df['unit_price'] * df['annual_demand']
        df = df.sort_values(by='annual_value', ascending=False).reset_index(drop=True)

        total_value = df['annual_value'].sum()
        if total_value == 0:
            df['abc_class'] = 'C'
            return df.to_dict(orient='records')

        df['cumulative_value'] = df['annual_value'].cumsum()
        df['cumulative_ratio'] = df['cumulative_value'] / total_value

        def assign_abc(ratio):
            if ratio <= self.a_threshold:
                return 'A'
            elif ratio <= self.b_threshold:
                return 'B'
            else:
                return 'C'

        df['abc_class'] = df['cumulative_ratio'].apply(assign_abc)
        return df.to_dict(orient='records')

    def classify_xyz(self, demand_series_dict: Dict[str, List[float]]) -> Dict[str, str]:
        """
        Classifies items by demand volatility using the Coefficient of Variation (CV = sigma / mu):
        - X (Constant/Steady): CV < 0.20
        - Y (Fluctuating/Seasonal): 0.20 <= CV < 0.50
        - Z (Erratic/Sporadic): CV >= 0.50
        """
        results = {}
        for sku, demands in demand_series_dict.items():
            if not demands or len(demands) < 3:
                results[sku] = 'Z'
                continue

            arr = np.array(demands, dtype=float)
            mean = np.mean(arr)
            if mean == 0:
                results[sku] = 'Z'
                continue

            std = np.std(arr)
            cv = std / mean

            if cv < 0.20:
                results[sku] = 'X'
            elif cv < 0.50:
                results[sku] = 'Y'
            else:
                results[sku] = 'Z'

        return results

    def compute_matrix(self, items_with_demand: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Computes the complete ABC-XYZ matrix and attaches operational recommendations.
        """
        # Step 1: ABC analysis
        abc_results = self.classify_abc(items_with_demand)

        # Step 2: XYZ analysis
        demand_dict = {item['sku']: item.get('historical_demands', []) for item in items_with_demand}
        xyz_results = self.classify_xyz(demand_dict)

        # Step 3: Combine and assign storage & replenishment policy
        final_records = []
        for item in abc_results:
            sku = item['sku']
            abc = item['abc_class']
            xyz = xyz_results.get(sku, 'Z')
            matrix_code = f"{abc}{xyz}"

            policy = self._get_policy_recommendation(matrix_code)

            item['xyz_class'] = xyz
            item['matrix_code'] = matrix_code
            item['warehouse_slotting'] = policy['slotting']
            item['replenishment_strategy'] = policy['replenishment']
            item['cycle_count_frequency'] = policy['audit_frequency']
            final_records.append(item)

        return final_records

    def _get_policy_recommendation(self, matrix_code: str) -> Dict[str, str]:
        """Returns standard industrial inventory strategy for a given 9-box cell."""
        POLICIES = {
            "AX": {
                "slotting": "Golden Zone (Ergonomic waist-height racking near outbound dispatch)",
                "replenishment": "Just-In-Time (JIT) continuous automated reordering with minimal safety stock buffer.",
                "audit_frequency": "Monthly cycle count"
            },
            "AY": {
                "slotting": "Front-middle aisles with dedicated buffer bins.",
                "replenishment": "Dynamic forecasting with seasonal smoothing and moderate safety stock.",
                "audit_frequency": "Monthly cycle count"
            },
            "AZ": {
                "slotting": "Standard high-bay racking.",
                "replenishment": "Make-to-Order or tightly controlled batch orders; close supervisor review required.",
                "audit_frequency": "Bi-weekly cycle count (high capital risk)"
            },
            "BX": {
                "slotting": "Mid-warehouse picking aisles.",
                "replenishment": "Periodic review with fixed order intervals and standard safety buffer.",
                "audit_frequency": "Quarterly cycle count"
            },
            "BY": {
                "slotting": "Upper-tier pallet racks.",
                "replenishment": "Lead-time demand buffer with quarterly review.",
                "audit_frequency": "Quarterly cycle count"
            },
            "BZ": {
                "slotting": "Bulk storage zones.",
                "replenishment": "Buffer orders triggered strictly upon verified customer backorder.",
                "audit_frequency": "Quarterly cycle count"
            },
            "CX": {
                "slotting": "Peripheral or lower-traffic warehouse bins.",
                "replenishment": "Bulk two-bin system with generous safety buffers to minimize transaction cost.",
                "audit_frequency": "Semi-annual cycle count"
            },
            "CY": {
                "slotting": "Deep warehouse mezzanine storage.",
                "replenishment": "Low periodic replenishment; review for obsolescence.",
                "audit_frequency": "Annual cycle count"
            },
            "CZ": {
                "slotting": "Overflow storage or cold-storage staging.",
                "replenishment": "Strict zero-inventory or drop-ship policy; purge slow-moving dead capital.",
                "audit_frequency": "Annual cycle count"
            },
        }
        return POLICIES.get(matrix_code, {
            "slotting": "General storage racks",
            "replenishment": "Standard reorder point formula",
            "audit_frequency": "Annual cycle count"
        })
