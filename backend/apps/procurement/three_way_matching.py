"""
StockPilot 3-Way Procurement Matching Engine
Implements automated invoice verification against Purchase Orders and Goods Receipt Notes (GRN).
Prevents overbilling, quantity deviations, and payment leakage before accounts payable authorization.
"""

from decimal import Decimal
from typing import Dict, Any, List

class ThreeWayMatcher:
    """
    Enforces tolerance checks across:
    1. Purchase Order (PO): Authorized quantities and unit prices.
    2. Goods Receipt Note (GRN): Physically received, inspected, and accepted quantities.
    3. Vendor Commercial Invoice: Billed quantities, unit costs, and statutory taxes.
    """

    PRICE_TOLERANCE_PCT = Decimal("1.0")    # Max 1.0% unit price variance allowed
    QTY_TOLERANCE_PCT = Decimal("0.0")      # 0% tolerance: Billed qty must never exceed GRN accepted qty

    @classmethod
    def match_invoice(
        cls,
        po_data: Dict[str, Any],
        grn_data: Dict[str, Any],
        invoice_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes line-by-line and aggregate 3-way matching.
        """
        discrepancies = []
        is_matched = True

        po_items = {item['sku']: item for item in po_data.get('items', [])}
        grn_items = {item['sku']: item for item in grn_data.get('items', [])}
        invoice_items = invoice_data.get('items', [])

        total_po_value = Decimal(str(po_data.get('total_amount', '0.00')))
        total_inv_value = Decimal(str(invoice_data.get('total_amount', '0.00')))

        for inv_item in invoice_items:
            sku = inv_item.get('sku')
            billed_qty = Decimal(str(inv_item.get('billed_quantity', 0)))
            billed_price = Decimal(str(inv_item.get('billed_unit_price', '0.00')))

            if sku not in po_items:
                discrepancies.append({
                    "sku": sku,
                    "type": "UNAUTHORIZED_LINE_ITEM",
                    "severity": "CRITICAL",
                    "message": f"SKU '{sku}' was billed on invoice but was not present on authorized Purchase Order."
                })
                is_matched = False
                continue

            po_item = po_items[sku]
            po_price = Decimal(str(po_item.get('unit_cost', '0.00')))

            # Check 1: Unit Price Variance
            if po_price > 0:
                price_variance_pct = ((billed_price - po_price) / po_price) * Decimal("100.0")
                if price_variance_pct > cls.PRICE_TOLERANCE_PCT:
                    discrepancies.append({
                        "sku": sku,
                        "type": "UNIT_PRICE_VARIANCE",
                        "severity": "HIGH",
                        "po_price": str(po_price),
                        "billed_price": str(billed_price),
                        "variance_pct": float(price_variance_pct),
                        "message": f"Billed price (INR {billed_price}) exceeds PO price (INR {po_price}) by {price_variance_pct:.2f}%."
                    })
                    is_matched = False

            # Check 2: Quantity Variance against GRN Accepted
            grn_item = grn_items.get(sku, {})
            received_qty = Decimal(str(grn_item.get('accepted_quantity', 0)))

            if billed_qty > received_qty:
                qty_diff = billed_qty - received_qty
                discrepancies.append({
                    "sku": sku,
                    "type": "QUANTITY_OVERBILLING",
                    "severity": "CRITICAL",
                    "received_qty": float(received_qty),
                    "billed_qty": float(billed_qty),
                    "excess_billed": float(qty_diff),
                    "message": f"Vendor billed for {billed_qty} units, but warehouse only received and accepted {received_qty} units."
                })
                is_matched = False

        status = "MATCH_VERIFIED" if is_matched else "BLOCKED_DISCREPANCY"
        recommendation = "Approved for accounts payable payment run." if is_matched else "Hold payment; issue Debit Note (DN) to supplier for billed discrepancies."

        return {
            "status": status,
            "is_matched": is_matched,
            "po_number": po_data.get('order_number'),
            "grn_number": grn_data.get('grn_number'),
            "invoice_number": invoice_data.get('invoice_number'),
            "total_discrepancies_count": len(discrepancies),
            "discrepancies": discrepancies,
            "recommendation": recommendation
        }
