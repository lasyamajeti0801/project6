import pytest
from decimal import Decimal
from apps.catalog.fixtures.indian_hsn_gst_master import calculate_tax_breakdown, HSN_REGISTRY, get_hsn_details


def test_hsn_directory_contains_key_chapters():
    """Verify HSN master directory includes statutory chapters."""
    assert len(HSN_REGISTRY) >= 20
    assert "84713010" in HSN_REGISTRY  # Personal computer laptops
    assert "85076000" in HSN_REGISTRY  # Lithium-ion batteries
    assert "39231010" in HSN_REGISTRY  # Plastic storage boxes


def test_intrastate_gst_calculation():
    """Verify intrastate transaction calculates equal CGST and SGST with 0 IGST."""
    result = calculate_tax_breakdown(Decimal("100000.00"), "84713010", is_interstate=False)
    assert result["rate"] == Decimal("18.0")
    assert result["cgst_rate"] == Decimal("9.0")
    assert result["sgst_rate"] == Decimal("9.0")
    assert result["cgst_amount"] == Decimal("9000.00")
    assert result["sgst_amount"] == Decimal("9000.00")
    assert result["igst_amount"] == Decimal("0.00")
    assert result["total_tax"] == Decimal("18000.00")
    assert result["total_amount"] == Decimal("118000.00")


def test_interstate_gst_calculation():
    """Verify interstate transaction assigns entire GST to IGST with 0 CGST/SGST."""
    result = calculate_tax_breakdown(Decimal("50000.00"), "84713010", is_interstate=True)
    assert result["rate"] == Decimal("18.0")
    assert result["cgst_amount"] == Decimal("0.00")
    assert result["sgst_amount"] == Decimal("0.00")
    assert result["igst_amount"] == Decimal("9000.00")
    assert result["total_tax"] == Decimal("9000.00")
    assert result["total_amount"] == Decimal("59000.00")
