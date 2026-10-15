"""
StockPilot Statutory Tax & Compliance Validation Suite
Provides rigorous validation for:
- Indian Goods and Services Tax Identification Number (GSTIN) with Modulo-36 Checksum
- Permanent Account Number (PAN) with Entity Classification
- Tax Deduction and Collection Account Number (TAN)
- Indian Postal PIN Codes (6 digits)
- GSTIN State Code Resolution and Inter-state / Intra-state Tax Determination
"""

import re
from decimal import Decimal
from typing import Dict, Optional, Tuple

# Official Indian State & Union Territory GST Codes
INDIAN_GST_STATE_CODES: Dict[str, str] = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
    '99': 'Center Jurisdiction'
}

PAN_ENTITY_TYPES: Dict[str, str] = {
    'A': 'Association of Persons (AOP)',
    'B': 'Body of Individuals (BOI)',
    'C': 'Company',
    'F': 'Partnership Firm / LLP',
    'G': 'Government Agency',
    'H': 'Hindu Undivided Family (HUF)',
    'J': 'Artificial Juridical Person',
    'L': 'Local Authority',
    'P': 'Individual',
    'T': 'Trust'
}

# Base-36 Character set for GSTIN checksum verification
GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def calculate_gstin_checksum(first_14_chars: str) -> str:
    """
    Computes the 15th check digit for a 14-character GSTIN prefix using
    the official Indian Goods and Services Tax Modulo-36 algorithm.
    """
    total = 0
    for idx, char in enumerate(first_14_chars):
        char_val = GSTIN_CHARS.index(char)
        # Multiplier alternates: 1 for even indices, 2 for odd indices (0-based)
        multiplier = 1 if (idx % 2 == 0) else 2
        product = char_val * multiplier
        quotient = product // 36
        remainder = product % 36
        total += (quotient + remainder)

    check_val = (36 - (total % 36)) % 36
    return GSTIN_CHARS[check_val]


def validate_gstin(gstin: Optional[str], strict_checksum: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Validates an Indian 15-character GSTIN.
    Format: 2 digits (State) + 10 chars (PAN) + 1 entity num + 'Z' + 1 checksum char.

    Args:
        gstin: GSTIN string to validate
        strict_checksum: If True, enforces strict Modulo-36 algorithmic checksum

    Returns:
        (is_valid: bool, error_message: Optional[str])
    """
    if not gstin or not isinstance(gstin, str):
        return False, "GSTIN cannot be empty."

    cleaned = gstin.strip().upper()

    if len(cleaned) != 15:
        return False, f"GSTIN must be exactly 15 characters (received {len(cleaned)})."

    pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    if not re.match(pattern, cleaned):
        return False, f"GSTIN format '{cleaned}' does not match standard Indian GSTIN syntax (2 state digits + 10 PAN chars + 1 entity number + 'Z' + check character)."

    # State code validation
    state_code = cleaned[:2]
    if state_code not in INDIAN_GST_STATE_CODES:
        return False, f"Invalid state code '{state_code}' in GSTIN. Must match valid Indian GST state code (01-38, 97, 99)."

    # Embedded PAN validation
    embedded_pan = cleaned[2:12]
    pan_valid, entity_type, pan_err = validate_pan(embedded_pan)
    if not pan_valid:
        return False, f"Embedded PAN '{embedded_pan}' in GSTIN is invalid: {pan_err}"

    if strict_checksum:
        expected_check = calculate_gstin_checksum(cleaned[:14])
        actual_check = cleaned[14]
        if actual_check != expected_check:
            return False, f"GSTIN checksum mismatch. Calculated check digit is '{expected_check}', but received '{actual_check}'."

    return True, None


def validate_pan(pan: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates an Indian Permanent Account Number (PAN).
    Format: 5 letters + 4 digits + 1 letter (e.g., AABCB1234F).
    4th character designates entity type.

    Returns:
        (is_valid: bool, entity_type: Optional[str], error_message: Optional[str])
    """
    if not pan or not isinstance(pan, str):
        return False, None, "PAN cannot be empty."

    cleaned = pan.strip().upper()

    if len(cleaned) != 10:
        return False, None, f"PAN must be exactly 10 characters (received {len(cleaned)})."

    pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
    if not re.match(pattern, cleaned):
        return False, None, f"PAN format '{cleaned}' is invalid. Must be 5 uppercase letters, 4 digits, and 1 letter."

    entity_code = cleaned[3]
    entity_desc = PAN_ENTITY_TYPES.get(entity_code)
    if not entity_desc:
        return False, None, f"Invalid 4th character '{entity_code}' in PAN. Must identify an authorized Indian tax entity (e.g. 'P' for Individual, 'C' for Company, 'F' for Firm)."

    return True, entity_desc, None


def validate_tan(tan: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validates an Indian Tax Deduction and Collection Account Number (TAN).
    Format: 4 letters + 5 digits + 1 letter (e.g., MUMR12345A).
    """
    if not tan or not isinstance(tan, str):
        return False, "TAN cannot be empty."

    cleaned = tan.strip().upper()
    if len(cleaned) != 10:
        return False, f"TAN must be exactly 10 characters (received {len(cleaned)})."

    pattern = r"^[A-Z]{4}[0-9]{5}[A-Z]{1}$"
    if not re.match(pattern, cleaned):
        return False, f"TAN format '{cleaned}' is invalid. Must be 4 uppercase letters, 5 digits, and 1 letter."

    return True, None


def validate_pincode(pincode: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validates a 6-digit Indian Postal Index Number (PIN Code).
    PIN code cannot start with 0.
    """
    if not pincode:
        return False, "PIN Code cannot be empty."

    cleaned = str(pincode).strip()
    pattern = r"^[1-9][0-9]{5}$"
    if not re.match(pattern, cleaned):
        return False, f"Invalid PIN code '{cleaned}'. Must be a 6-digit number starting with 1-9."

    return True, None


def get_state_by_gstin(gstin: str) -> Optional[str]:
    """
    Extracts and resolves the Indian state/UT name from a GSTIN.
    """
    if not gstin or len(gstin.strip()) < 2:
        return None
    code = gstin.strip()[:2]
    return INDIAN_GST_STATE_CODES.get(code)


def is_interstate_transaction(supplier_gstin: Optional[str], recipient_gstin: Optional[str]) -> bool:
    """
    Determines if a transaction between supplier and recipient is Inter-state (IGST)
    or Intra-state (CGST + SGST) based on the first 2 digits of their GSTINs.
    Returns True for inter-state (different states), False for intra-state (same state).
    """
    if not supplier_gstin or not recipient_gstin:
        return False

    sup_state = supplier_gstin.strip()[:2]
    rec_state = recipient_gstin.strip()[:2]
    return sup_state != rec_state


def calculate_gst_breakdown(
    taxable_amount: Decimal,
    gst_rate: Decimal,
    is_interstate: bool
) -> Dict[str, Decimal]:
    """
    Calculates GST components (CGST, SGST, IGST) accurately to 2 decimal places.
    """
    rate = Decimal(str(gst_rate))
    amount = Decimal(str(taxable_amount))
    total_tax = (amount * rate / Decimal("100")).quantize(Decimal("0.01"))

    if is_interstate:
        return {
            'cgst_rate': Decimal("0.00"),
            'cgst_amount': Decimal("0.00"),
            'sgst_rate': Decimal("0.00"),
            'sgst_amount': Decimal("0.00"),
            'igst_rate': rate,
            'igst_amount': total_tax,
            'total_tax': total_tax,
            'total_amount': amount + total_tax
        }
    else:
        half_rate = (rate / Decimal("2")).quantize(Decimal("0.01"))
        half_tax = (total_tax / Decimal("2")).quantize(Decimal("0.01"))
        return {
            'cgst_rate': half_rate,
            'cgst_amount': half_tax,
            'sgst_rate': half_rate,
            'sgst_amount': half_tax,
            'igst_rate': Decimal("0.00"),
            'igst_amount': Decimal("0.00"),
            'total_tax': total_tax,
            'total_amount': amount + total_tax
        }
