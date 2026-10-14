import pytest
from datetime import date, timedelta
from apps.inventory.abc_xyz_analysis import AbcXyzClassifier
from apps.inventory.quarantine_engine import QuarantineManager


def test_abc_classification():
    """Verify Pareto ABC classification logic."""
    classifier = AbcXyzClassifier(a_threshold=0.80, b_threshold=0.95)
    items = [
        {"sku": "SKU-A", "unit_price": 1000, "annual_demand": 80},  # 80,000 -> Class A
        {"sku": "SKU-B", "unit_price": 150, "annual_demand": 100},  # 15,000 -> Class B
        {"sku": "SKU-C", "unit_price": 50, "annual_demand": 100},   # 5,000 -> Class C
    ]
    results = classifier.classify_abc(items)
    sku_classes = {r["sku"]: r["abc_class"] for r in results}
    assert sku_classes["SKU-A"] == "A"
    assert sku_classes["SKU-B"] == "B"
    assert sku_classes["SKU-C"] == "C"


def test_xyz_classification():
    """Verify demand variance XYZ matrix logic."""
    classifier = AbcXyzClassifier()
    series_dict = {
        "SKU-STEADY": [100.0, 102.0, 99.0, 101.0, 100.0],       # CV < 0.20 -> X
        "SKU-VOLATILE": [10.0, 200.0, 5.0, 180.0, 20.0],        # CV >= 0.50 -> Z
    }
    xyz_results = classifier.classify_xyz(series_dict)
    assert xyz_results["SKU-STEADY"] == "X"
    assert xyz_results["SKU-VOLATILE"] == "Z"


def test_fefo_priority_sorting():
    """Verify First-Expiry-First-Out (FEFO) sorting mechanism."""
    today = date.today()
    batches = [
        {"batch_no": "B002", "expiry_date": today + timedelta(days=60), "quantity_available": 50, "is_quarantined": False},
        {"batch_no": "B001", "expiry_date": today + timedelta(days=10), "quantity_available": 30, "is_quarantined": False},
        {"batch_no": "B003", "expiry_date": today + timedelta(days=120), "quantity_available": 40, "is_quarantined": False},
        {"batch_no": "B004_QUAR", "expiry_date": today + timedelta(days=5), "quantity_available": 10, "is_quarantined": True},
    ]
    sorted_batches = QuarantineManager.evaluate_fefo_priority(batches)
    # B004 is quarantined, so excluded.
    # B001 expires first (10 days), B002 second (60 days), B003 third (120 days).
    assert len(sorted_batches) == 3
    assert sorted_batches[0]["batch_no"] == "B001"
    assert sorted_batches[1]["batch_no"] == "B002"
    assert sorted_batches[2]["batch_no"] == "B003"
