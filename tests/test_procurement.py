import pytest
from apps.procurement.three_way_matching import ThreeWayMatcher


def test_three_way_matcher_perfect():
    """Verify perfect match between PO, GRN, and Invoice passes."""
    po_data = {
        "total_amount": "50000.00",
        "items": [
            {"sku": "SKU-LAP-001", "unit_cost": "500.00", "quantity": 100}
        ]
    }
    grn_data = {
        "items": [
            {"sku": "SKU-LAP-001", "accepted_quantity": 100}
        ]
    }
    inv_data = {
        "total_amount": "50000.00",
        "items": [
            {"sku": "SKU-LAP-001", "billed_unit_price": "500.00", "billed_quantity": 100}
        ]
    }

    match_result = ThreeWayMatcher.match_invoice(po_data, grn_data, inv_data)
    assert match_result["is_matched"] is True
    assert len(match_result["discrepancies"]) == 0


def test_three_way_matcher_unauthorized_sku():
    """Verify unauthorized SKU causes discrepancy."""
    po_data = {
        "total_amount": "50000.00",
        "items": [
            {"sku": "SKU-LAP-001", "unit_cost": "500.00", "quantity": 100}
        ]
    }
    grn_data = {
        "items": [
            {"sku": "SKU-LAP-001", "accepted_quantity": 100}
        ]
    }
    inv_data = {
        "total_amount": "55000.00",
        "items": [
            {"sku": "SKU-UNKNOWN-999", "billed_unit_price": "500.00", "billed_quantity": 10}
        ]
    }

    match_result = ThreeWayMatcher.match_invoice(po_data, grn_data, inv_data)
    assert match_result["is_matched"] is False
    assert len(match_result["discrepancies"]) > 0
