import pytest
from apps.dispatch.eway_bill_validator import EWayBillValidator


def test_eway_bill_mandatory_threshold():
    """Verify consignment below threshold produces advisory warning."""
    dispatch_data = {
        "total_consignment_value": 25000.00,
        "transport_mode": "ROAD",
        "vehicle_number": "KA01AB1234",
        "from_pincode": "560001",
        "to_pincode": "400001",
        "from_gstin": "29AABCB1234F1Z5",
        "to_gstin": "27AAACB2234F1Z8",
        "approx_distance_km": 350
    }
    result = EWayBillValidator.validate_dispatch_for_ewb(dispatch_data)
    assert len(result["errors"]) == 0
    assert len(result["warnings"]) > 0


def test_eway_bill_invalid_pin_rejected():
    """Verify invalid pin codes are flagged as errors."""
    dispatch_data = {
        "total_consignment_value": 75000.00,
        "transport_mode": "ROAD",
        "vehicle_number": "KA01AB1234",
        "from_pincode": "INVALID_PIN",
        "to_pincode": "400001",
        "from_gstin": "29AABCB1234F1Z5",
        "to_gstin": "27AAACB2234F1Z8",
        "approx_distance_km": 350
    }
    result = EWayBillValidator.validate_dispatch_for_ewb(dispatch_data)
    assert len(result["errors"]) > 0
    assert any("PIN code" in err for err in result["errors"])
