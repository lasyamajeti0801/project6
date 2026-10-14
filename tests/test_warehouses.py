import pytest
from apps.warehouses.models import Warehouse, Zone, Aisle, Rack, Shelf, Bin


def test_warehouse_model_fields():
    """Verify warehouse model definitions and fields."""
    field_names = [f.name for f in Warehouse._meta.get_fields()]
    assert "code" in field_names
    assert "name" in field_names
    assert "state" in field_names
    assert "address" in field_names
    assert "total_capacity_sqft" in field_names


def test_warehouse_hierarchy_structure():
    """Verify 3D coordinate hierarchy relationships."""
    assert hasattr(Zone, "warehouse")
    assert hasattr(Aisle, "zone")
    assert hasattr(Rack, "aisle")
    assert hasattr(Shelf, "rack")
    assert hasattr(Bin, "shelf")
