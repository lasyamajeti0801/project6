"""
StockPilot Quality & Quarantine Lifecycle Engine
Manages batch inspection, First-Expiry-First-Out (FEFO) picking priority,
damaged goods quarantine, and auditable release/disposition workflows.
"""

from datetime import date, timedelta
from typing import List, Dict, Any, Optional

class QuarantineManager:
    """
    Enforces quality assurance protocols across warehouse storage bins.
    Controls transition of stock between AVAILABLE, QUARANTINE, DAMAGED, and RECALLED states.
    """

    REASONS = {
        "DAMAGED_IN_TRANSIT": "Goods received from carrier with physical packaging breakage",
        "QUALITY_INSPECTION_PENDING": "Mandatory QA sampling pending laboratory / QA supervisor clearance",
        "NEAR_EXPIRY": "Batch has breached minimum shelf-life threshold for distribution",
        "TEMPERATURE_DEVIATION": "Cold-chain temperature excursion logged during transit",
        "MANUFACTURER_RECALL": "Statutory or vendor quality alert requiring stock isolation",
        "PHYSICAL_AUDIT_DISCREPANCY": "Discrepancy identified during blind cycle count"
    }

    @staticmethod
    def evaluate_fefo_priority(batches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sorts active batches by First-Expiry-First-Out (FEFO) principle.
        Batches with nearest expiration date must be picked first, provided
        they have not crossed the minimum allowable customer shelf life.
        """
        valid_batches = [b for b in batches if b.get('quantity_available', 0) > 0 and not b.get('is_quarantined', False)]

        # Sort by expiry_date ascending (None dates pushed to the end)
        sorted_batches = sorted(
            valid_batches,
            key=lambda x: (x.get('expiry_date') is None, x.get('expiry_date') or date.max)
        )
        return sorted_batches

    @staticmethod
    def check_shelf_life_compliance(batch_expiry: date, min_shelf_life_days: int = 90) -> Dict[str, Any]:
        """
        Validates if a batch meets minimum shelf-life requirements for customer dispatch.
        """
        today = date.today()
        days_remaining = (batch_expiry - today).days

        if days_remaining <= 0:
            return {
                "status": "EXPIRED",
                "days_remaining": days_remaining,
                "allow_dispatch": False,
                "action_required": "Auto-quarantine batch to Bio-Hazard / Scrap bay for disposal."
            }
        elif days_remaining < min_shelf_life_days:
            return {
                "status": "NEAR_EXPIRY",
                "days_remaining": days_remaining,
                "allow_dispatch": False,
                "action_required": f"Threshold {min_shelf_life_days} days breached ({days_remaining}d remaining). Quarantine or clearance discount approval required."
            }
        else:
            return {
                "status": "HEALTHY",
                "days_remaining": days_remaining,
                "allow_dispatch": True,
                "action_required": "Standard FEFO picking allowable."
            }

    @staticmethod
    def generate_disposition_record(
        batch_number: str,
        sku: str,
        warehouse_code: str,
        quantity: int,
        reason_code: str,
        supervisor_id: int,
        action: str = "SCRAP"
    ) -> Dict[str, Any]:
        """
        Generates an auditable stock disposition log for destroyed, returned, or salvaged inventory.
        """
        reason_desc = QuarantineManager.REASONS.get(reason_code, "General Quality Deviation")
        return {
            "disposition_id": f"DISP-{date.today().strftime('%Y%m')}-{batch_number}",
            "batch_number": batch_number,
            "sku": sku,
            "warehouse_code": warehouse_code,
            "quarantined_quantity": quantity,
            "reason_code": reason_code,
            "reason_description": reason_desc,
            "supervisor_id": supervisor_id,
            "action": action, # 'SCRAP', 'RETURN_TO_VENDOR', 'REWORK', 'RELEASE_TO_STOCK'
            "requires_gst_reversal": True if action == "SCRAP" else False, # Under Section 17(5)(h) of CGST Act
            "timestamp": date.today().isoformat()
        }
