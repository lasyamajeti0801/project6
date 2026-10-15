"""
Unit tests for the Indian Statutory Compliance and Tax Validator Suite.
Validates:
- GSTIN format, state code extraction, and Modulo-36 check digit computation
- PAN entity classification (Individual, Company, Firm, etc.)
- TAN tax collection identification format
- PIN code validation and numeric bounds
- Intra-state (CGST + SGST) vs Inter-state (IGST) split calculation
"""

import pytest
from decimal import Decimal
from apps.common.statutory_validators import (
    validate_gstin,
    validate_pan,
    validate_tan,
    validate_pincode,
    calculate_gstin_checksum,
    get_state_by_gstin,
    is_interstate_transaction,
    calculate_gst_breakdown,
    INDIAN_GST_STATE_CODES,
    PAN_ENTITY_TYPES,
)


class TestStatutoryValidators:

    def test_gstin_valid_standard_formats(self):
        # Valid Maharashtra GSTIN
        valid_mh, err = validate_gstin("27AABCB1234F1Z8")
        assert valid_mh is True
        assert err is None

        # Valid Haryana GSTIN
        valid_hr, err = validate_gstin("06AAAAA0000A1Z5")
        assert valid_hr is True
        assert err is None

        # Valid Karnataka GSTIN (embedded PAN has 'C' for Company)
        valid_ka, err = validate_gstin("29AABCB1234F1Z5")
        assert valid_ka is True
        assert err is None

    def test_gstin_invalid_formats(self):
        # Too short
        is_val, err = validate_gstin("27AABCB1234F1Z")
        assert is_val is False
        assert "must be exactly 15 characters" in err

        # Invalid state code 99 is valid, 00 is invalid
        is_val, err = validate_gstin("00AABCB1234F1Z8")
        assert is_val is False
        assert "Invalid state code" in err

        # Empty or None
        is_val, err = validate_gstin(None)
        assert is_val is False
        assert "cannot be empty" in err

    def test_gstin_modulo36_checksum_algorithm(self):
        # Test algorithmic check digit computation
        # Prefix: 27AABCB1234F1Z
        check_digit = calculate_gstin_checksum("27AABCB1234F1Z")
        assert check_digit in "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        # Validating with strict_checksum=True against the computed check digit
        full_gstin = f"27AABCB1234F1Z{check_digit}"
        is_valid, err = validate_gstin(full_gstin, strict_checksum=True)
        assert is_valid is True
        assert err is None

        # Deliberately corrupted checksum
        bad_check = 'X' if check_digit != 'X' else 'Y'
        is_valid, err = validate_gstin(f"27AABCB1234F1Z{bad_check}", strict_checksum=True)
        assert is_valid is False
        assert "checksum mismatch" in err

    def test_pan_validation_and_entity_types(self):
        # Company PAN
        valid, entity, err = validate_pan("AABCB1234F")
        assert valid is True
        assert entity == "Company"
        assert err is None

        # Individual PAN (4th character is 'P')
        valid, entity, err = validate_pan("ABCPD1234F")
        assert valid is True
        assert entity == "Individual"

        # Partnership Firm PAN
        valid, entity, err = validate_pan("ABCFE1234F")
        assert valid is True
        assert entity == "Partnership Firm / LLP"

        # Invalid 4th character ('Z' is not a valid tax entity code)
        valid, entity, err = validate_pan("ABCZE1234F")
        assert valid is False
        assert "Invalid 4th character" in err

        # Malformed format (too many digits)
        valid, _, err = validate_pan("ABC123456F")
        assert valid is False
        assert "invalid" in err.lower()

    def test_tan_validation(self):
        # Valid Mumbai TAN
        valid, err = validate_tan("MUMR12345A")
        assert valid is True
        assert err is None

        # Valid Bangalore TAN
        valid, err = validate_tan("BLRK54321B")
        assert valid is True

        # Invalid: 5 letters instead of 4
        valid, err = validate_tan("MUMRA1234A")
        assert valid is False
        assert "invalid" in err.lower()

    def test_pincode_validation(self):
        # Valid Mumbai PIN
        valid, err = validate_pincode("400069")
        assert valid is True
        assert err is None

        # Valid Gurgaon PIN
        valid, err = validate_pincode(122001)
        assert valid is True

        # Cannot start with zero
        valid, err = validate_pincode("012345")
        assert valid is False
        assert "Invalid PIN code" in err

        # Too short
        valid, err = validate_pincode("40006")
        assert valid is False

    def test_state_resolution_and_tax_split(self):
        # Resolve state from GSTIN
        assert get_state_by_gstin("27AABCB1234F1Z8") == "Maharashtra"
        assert get_state_by_gstin("06AAAAA0000A1Z5") == "Haryana"
        assert get_state_by_gstin("29ABCDE1234F1Z5") == "Karnataka"

        # Inter-state determination
        mh_gstin = "27AABCB1234F1Z8"
        hr_gstin = "06AAAAA0000A1Z5"
        same_mh_gstin = "27XYZAB9999C1Z2"

        # Different states -> Inter-state
        assert is_interstate_transaction(mh_gstin, hr_gstin) is True
        # Same state -> Intra-state
        assert is_interstate_transaction(mh_gstin, same_mh_gstin) is False

        # Intra-state GST Calculation (18% split into 9% CGST + 9% SGST)
        taxable = Decimal("100000.00")
        intra_split = calculate_gst_breakdown(taxable, Decimal("18.00"), is_interstate=False)
        assert intra_split['cgst_rate'] == Decimal("9.00")
        assert intra_split['cgst_amount'] == Decimal("9000.00")
        assert intra_split['sgst_rate'] == Decimal("9.00")
        assert intra_split['sgst_amount'] == Decimal("9000.00")
        assert intra_split['igst_amount'] == Decimal("0.00")
        assert intra_split['total_tax'] == Decimal("18000.00")
        assert intra_split['total_amount'] == Decimal("118000.00")

        # Inter-state GST Calculation (18% IGST only)
        inter_split = calculate_gst_breakdown(taxable, Decimal("18.00"), is_interstate=True)
        assert inter_split['cgst_amount'] == Decimal("0.00")
        assert inter_split['sgst_amount'] == Decimal("0.00")
        assert inter_split['igst_rate'] == Decimal("18.00")
        assert inter_split['igst_amount'] == Decimal("18000.00")
        assert inter_split['total_amount'] == Decimal("118000.00")
