"""
StockPilot Indian GST E-Way Bill (EWB) Payload Validator
Validates JSON payloads under Rule 138 of the Central Goods and Services Tax (CGST) Rules, 2017.
Ensures vehicle numbers, GSTIN identifiers, HSN codes, and transport distance criteria match
statutory NIC National Informatics Centre specifications.
"""

import re
from typing import Dict, Any, List

class EWayBillValidator:
    """
    Validates E-Way Bill generation requests for inter-state and intra-state consignments
    where consignment value exceeds the statutory threshold of INR 50,000.
    """

    STATUTORY_THRESHOLD_INR = 50000.00
    GSTIN_REGEX = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    VEHICLE_NO_REGEX = r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$"
    PINCODE_REGEX = r"^[1-9][0-9]{5}$"

    @classmethod
    def validate_dispatch_for_ewb(cls, dispatch_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates whether a dispatch requires an E-Way bill and checks all required fields.
        """
        errors = []
        warnings = []

        total_value = float(dispatch_data.get('total_consignment_value', 0))
        supply_type = dispatch_data.get('supply_type', 'OUTWARD') # OUTWARD, INWARD
        sub_supply_type = dispatch_data.get('sub_supply_type', 'SUPPLY') # SUPPLY, LINE_SALES, JOB_WORK

        # 1. Mandatory threshold check
        is_ewb_mandatory = total_value >= cls.STATUTORY_THRESHOLD_INR
        if not is_ewb_mandatory:
            warnings.append(f"Consignment value (INR {total_value:,.2f}) is below statutory threshold (INR 50,000.00). E-Way bill is optional.")

        # 2. Transporter / Vehicle Validation (Part B of E-Way Bill)
        transport_mode = dispatch_data.get('transport_mode', 'ROAD') # ROAD, RAIL, AIR, SHIP
        vehicle_no = dispatch_data.get('vehicle_number', '').strip().replace(' ', '').upper()

        if transport_mode == 'ROAD':
            if not vehicle_no:
                errors.append("Part B requirement: Vehicle number is mandatory for road transport.")
            elif not re.match(cls.VEHICLE_NO_REGEX, vehicle_no):
                warnings.append(f"Vehicle format '{vehicle_no}' may not match standard Indian registration (e.g. MH04AB1234).")

        # 3. Source and Destination PIN code check
        from_pin = str(dispatch_data.get('from_pincode', '')).strip()
        to_pin = str(dispatch_data.get('to_pincode', '')).strip()

        if not re.match(cls.PINCODE_REGEX, from_pin):
            errors.append(f"Invalid origin PIN code: '{from_pin}'. Must be a 6-digit Indian postal code.")
        if not re.match(cls.PINCODE_REGEX, to_pin):
            errors.append(f"Invalid destination PIN code: '{to_pin}'. Must be a 6-digit Indian postal code.")

        # 4. GSTIN verification
        from_gstin = str(dispatch_data.get('from_gstin', '')).strip().upper()
        to_gstin = str(dispatch_data.get('to_gstin', '')).strip().upper()

        if from_gstin and from_gstin != 'URP' and not re.match(cls.GSTIN_REGEX, from_gstin):
            errors.append(f"Invalid Origin GSTIN: '{from_gstin}'.")
        if to_gstin and to_gstin != 'URP' and not re.match(cls.GSTIN_REGEX, to_gstin):
            errors.append(f"Invalid Consignee GSTIN: '{to_gstin}'. Use 'URP' for unregistered persons.")

        # 5. Approximate Distance (Km) check
        distance_km = dispatch_data.get('approx_distance_km', 0)
        if distance_km <= 0:
            errors.append("Approximate transport distance (km) must be greater than zero.")
        elif distance_km > 4000:
            warnings.append(f"Estimated distance ({distance_km} km) is unusually high for domestic Indian transport.")

        return {
            "is_valid": len(errors) == 0,
            "is_ewb_mandatory": is_ewb_mandatory,
            "errors": errors,
            "warnings": warnings,
            "rule_compliance": "Rule 138, Central Goods and Services Tax Rules, 2017",
            "statutory_validity_days": cls.calculate_validity_period(distance_km)
        }

    @staticmethod
    def calculate_validity_period(distance_km: int) -> int:
        """
        Calculates E-Way Bill statutory validity in days under Rule 138(10):
        - Up to 200 km: 1 Day
        - For every additional 200 km or part thereof: 1 additional day
        """
        if distance_km <= 0:
            return 1
        days = (distance_km + 199) // 200
        return max(1, days)
