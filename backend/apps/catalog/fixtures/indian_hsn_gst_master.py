"""
StockPilot Indian HSN & GST Statutory Rate Directory
Comprehensive reference registry of Harmonized System of Nomenclature (HSN) codes,
statutory descriptions, and GST tax brackets under the Central Goods and Services Tax Act.
"""

from decimal import Decimal

# Comprehensive HSN Classification Registry
HSN_REGISTRY = {
    # Chapter 84: Nuclear reactors, boilers, machinery and mechanical appliances
    "84713010": {"description": "Personal computer laptops, notebooks, sub-notebooks", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84713090": {"description": "Other portable automatic data processing machines", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84714110": {"description": "Micro computer processing units", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84714190": {"description": "Other digital automatic data processing units", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84714900": {"description": "Other data processing systems presented in form of systems", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84715000": {"description": "Processing units other than those of sub-headings 847141 or 847149", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716010": {"description": "Combined input or output units (Keyboards and mouse)", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716024": {"description": "Thermal receipt and label printers for warehouse logistics", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716025": {"description": "Inkjet color label and packing slip printers", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716026": {"description": "Laser high-throughput fulfillment invoice printers", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716040": {"description": "Keyboards and ergonomic input hardware", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716050": {"description": "Scanners and optical character recognition devices", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84716060": {"description": "Mouse and cursor manipulation tracking hardware", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84717010": {"description": "Floppy disc drives and optical reader hardware", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84717020": {"description": "Hard disc drives (HDD) internal and external", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84717030": {"description": "Solid state storage drives (NVMe SSD)", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84718000": {"description": "Other units of automatic data processing machines", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84719000": {"description": "Optical readers, barcode scanners, and data transcribers", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84733010": {"description": "Printed circuit board assemblies for computing units", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84733020": {"description": "Computer graphic processors and accelerator cards", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84733030": {"description": "Computer memory modules (DDR4 / DDR5 RAM)", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "NOS"},
    "84733099": {"description": "Other parts and accessories of automatic data processing machines", "gst_rate": Decimal("18.0"), "chapter": "84", "uom": "KGS"},

    # Chapter 85: Electrical machinery and equipment and parts thereof
    "85044010": {"description": "Electric power inverters and distribution modules", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85044020": {"description": "Battery chargers and power supply units (SMPS)", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85044030": {"description": "Static converters for telecommunication and warehouse servers", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85044090": {"description": "Other electrical converters and industrial rectifiers", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85071000": {"description": "Lead-acid storage accumulators for forklifts and pallet trucks", "gst_rate": Decimal("28.0"), "chapter": "85", "uom": "NOS"},
    "85076000": {"description": "Lithium-ion batteries and battery management packs", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85176210": {"description": "Routers, switches, and industrial wireless access points", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85176290": {"description": "Other machines for the transmission or regeneration of voice and data", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85183000": {"description": "Headphones, wireless headsets, and operator dispatch earphones", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85285200": {"description": "Monitors capable of connecting directly to computing units", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "NOS"},
    "85444220": {"description": "Ethernet Cat6 / Cat6A networking cables with connectors", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "MTR"},
    "85444299": {"description": "Other electric conductors fitted with connectors", "gst_rate": Decimal("18.0"), "chapter": "85", "uom": "MTR"},

    # Chapter 39: Plastics and articles thereof (Industrial Packing & Bins)
    "39231010": {"description": "Plastic storage boxes, crates, and warehouse bins", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "NOS"},
    "39231090": {"description": "Other boxes, cases, crates and similar articles of plastics", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "NOS"},
    "39232100": {"description": "Polyethylene bags and dispatch envelopes", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "KGS"},
    "39232990": {"description": "Sacks and bags of other plastics for material containment", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "KGS"},
    "39239010": {"description": "Insulated delivery boxes for temperature-sensitive fulfillment", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "NOS"},
    "39239090": {"description": "Other articles for the conveyance or packing of goods", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "KGS"},
    "39269099": {"description": "Other plastic articles including cable ties and safety seal tags", "gst_rate": Decimal("18.0"), "chapter": "39", "uom": "NOS"},

    # Chapter 48: Paper and paperboard (Corrugated Cartons & Barcode Labels)
    "48191010": {"description": "Cartons, boxes and cases of corrugated paper or paperboard", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "NOS"},
    "48191090": {"description": "Other boxes and cases of corrugated paper for dispatch", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "NOS"},
    "48192010": {"description": "Non-corrugated folding cartons and retail packaging", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "NOS"},
    "48211010": {"description": "Self-adhesive paper labels printed with barcodes or QR codes", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "NOS"},
    "48211020": {"description": "Thermal paper label rolls for direct thermal barcode printers", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "ROLL"},
    "48219090": {"description": "Other paper identification tags and dispatch stickers", "gst_rate": Decimal("12.0"), "chapter": "48", "uom": "NOS"},

    # Chapter 73: Articles of iron or steel (Warehouse Racks & Shelving)
    "73089090": {"description": "Heavy industrial steel pallet racking and mezzanine structures", "gst_rate": Decimal("18.0"), "chapter": "73", "uom": "KGS"},
    "73269099": {"description": "Other articles of iron or steel wire, clips, and rack pins", "gst_rate": Decimal("18.0"), "chapter": "73", "uom": "NOS"},
    "76169990": {"description": "Aluminum warehouse ladders, mobile stairways, and step stools", "gst_rate": Decimal("18.0"), "chapter": "76", "uom": "NOS"},

    # Chapter 87: Vehicles other than railway (Material Handling Equipment)
    "87091100": {"description": "Electrical powered pallet trucks and pedestrian reach trucks", "gst_rate": Decimal("18.0"), "chapter": "87", "uom": "NOS"},
    "87091900": {"description": "Hydraulic manual hand pallet trucks and drum handlers", "gst_rate": Decimal("18.0"), "chapter": "87", "uom": "NOS"},
    "87168000": {"description": "Manual warehouse order-picking platform trolleys and carts", "gst_rate": Decimal("18.0"), "chapter": "87", "uom": "NOS"},
}

def get_hsn_details(hsn_code: str):
    """Retrieve statutory description, GST tax rate, and chapter for an HSN code."""
    cleaned = str(hsn_code).strip()
    return HSN_REGISTRY.get(cleaned, {
        "description": "General Merchandise",
        "gst_rate": Decimal("18.0"),
        "chapter": "99",
        "uom": "NOS"
    })

def calculate_tax_breakdown(base_amount: Decimal, hsn_code: str, is_interstate: bool = False):
    """
    Calculate statutory Indian GST tax components (CGST + SGST or IGST).
    - Intra-state (e.g. Maharashtra to Maharashtra): CGST (half) + SGST (half)
    - Inter-state (e.g. Maharashtra to Karnataka): IGST (full rate)
    """
    details = get_hsn_details(hsn_code)
    rate = details["gst_rate"]

    tax_amount = (base_amount * rate) / Decimal("100.0")

    if is_interstate:
        return {
            "rate": rate,
            "cgst_rate": Decimal("0.0"),
            "cgst_amount": Decimal("0.00"),
            "sgst_rate": Decimal("0.0"),
            "sgst_amount": Decimal("0.00"),
            "igst_rate": rate,
            "igst_amount": tax_amount.quantize(Decimal("0.01")),
            "total_tax": tax_amount.quantize(Decimal("0.01")),
            "total_amount": (base_amount + tax_amount).quantize(Decimal("0.01"))
        }
    else:
        half_rate = rate / Decimal("2.0")
        half_tax = (tax_amount / Decimal("2.0")).quantize(Decimal("0.01"))
        return {
            "rate": rate,
            "cgst_rate": half_rate,
            "cgst_amount": half_tax,
            "sgst_rate": half_rate,
            "sgst_amount": half_tax,
            "igst_rate": Decimal("0.0"),
            "igst_amount": Decimal("0.00"),
            "total_tax": (half_tax * 2).quantize(Decimal("0.01")),
            "total_amount": (base_amount + (half_tax * 2)).quantize(Decimal("0.01"))
        }
