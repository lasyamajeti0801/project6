import re
import uuid
from decimal import Decimal

def format_inr(amount):
    """
    Format a number into Indian Rupee format, e.g. 2456800 -> ₹24,56,800.00
    """
    if amount is None:
        return "₹0.00"
    try:
        val = float(amount)
    except (ValueError, TypeError):
        return f"₹{amount}"
    
    is_negative = val < 0
    val = abs(val)
    
    parts = f"{val:.2f}".split('.')
    integer_part = parts[0]
    decimal_part = parts[1]
    
    if len(integer_part) <= 3:
        formatted = integer_part
    else:
        last_three = integer_part[-3:]
        remaining = integer_part[:-3]
        # Group in pairs of 2 from right to left
        groups = []
        while remaining:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        formatted = ",".join(groups) + "," + last_three
        
    result = f"₹{'-' if is_negative else ''}{formatted}.{decimal_part}"
    return result

def generate_code(prefix, sequence_num=None):
    """
    Generate an enterprise reference code like PO-2026-00124 or WH-MUM-01
    """
    if sequence_num is not None:
        return f"{prefix}-{sequence_num:05d}"
    return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"
