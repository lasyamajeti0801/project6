"""
StockPilot Automated Cycle Count Scheduler
Generates continuous physical inventory counting sessions based on ABC velocity stratification,
ensuring high-value (Class A) inventory is counted frequently while minimizing operational disruption.
"""

from datetime import date, timedelta
from typing import List, Dict, Any

class CycleCountScheduler:
    """
    Schedules cycle counts throughout the operational year:
    - Class A items: Counted every 30 days (12 times / year)
    - Class B items: Counted every 90 days (4 times / year)
    - Class C items: Counted every 180 days (2 times / year)
    """

    INTERVALS = {
        'A': 30,  # days
        'B': 90,  # days
        'C': 180  # days
    }

    @classmethod
    def generate_daily_schedule(cls, product_inventory: List[Dict[str, Any]], target_date: date = None) -> Dict[str, Any]:
        """
        Calculates which products and bins are due for physical counting on a given operational date.
        """
        if target_date is None:
            target_date = date.today()

        due_items = []
        for item in product_inventory:
            abc_class = item.get('abc_class', 'C')
            last_counted = item.get('last_counted_date')

            if last_counted is None:
                # Never counted: prioritize immediately
                due_items.append({
                    **item,
                    "reason": "Initial inventory baseline count",
                    "priority": "HIGH"
                })
            else:
                interval_days = cls.INTERVALS.get(abc_class, 180)
                next_count_due = last_counted + timedelta(days=interval_days)

                if target_date >= next_count_due:
                    days_overdue = (target_date - next_count_due).days
                    due_items.append({
                        **item,
                        "reason": f"Class {abc_class} interval ({interval_days}d) reached",
                        "days_overdue": max(0, days_overdue),
                        "priority": "URGENT" if days_overdue > 14 else "NORMAL"
                    })

        # Sort: Class A first, then overdue items
        sorted_due = sorted(
            due_items,
            key=lambda x: (
                0 if x['priority'] == 'URGENT' else (1 if x.get('abc_class') == 'A' else 2),
                -x.get('days_overdue', 0)
            )
        )

        return {
            "schedule_date": target_date.isoformat(),
            "total_items_in_warehouse": len(product_inventory),
            "items_due_today": len(sorted_due),
            "recommended_batch_size": min(len(sorted_due), 25), # Recommended daily workload per auditor
            "items_to_audit": sorted_due[:25]
        }
