# StockPilot — Standard Operating Procedures (SOP) Manual
## Enterprise Warehouse Logistics & Inventory Management

---

### SOP 01: Inbound Receiving & Goods Receipt Note (GRN) Creation
1. **Unloading & Document Handover:**
   - The transport driver must present the physical consignment note, e-way bill copy, and vendor commercial tax invoice.
   - The Receiving Incharge checks the external seals, package counts, and carton integrity.
2. **System Lookup:**
   - In StockPilot, navigate to **Procurement &gt; Purchase Orders**.
   - Search for the authorized Purchase Order (e.g. `PO-2026-0001`).
3. **Physical Verification & Tally:**
   - Scan SKU barcodes using the barcode scanner (`/barcodes`).
   - Log accepted units, shortages, and damaged cartons.
4. **GRN Issuance:**
   - Enter accepted counts and generate the local Goods Receipt Note (`GRN`).
   - The stock ledger automatically logs positive stock movement (`PURCHASE_RECEIPT`) and updates the weighted-average cost basis.

---

### SOP 02: Warehouse Putaway & Bin Assignment
1. **Location Determination:**
   - Products are assigned based on the ABC-XYZ velocity matrix:
     - Class A fast-movers: Waist-height racks in Zone A near the outbound dock.
     - Class B medium-movers: Zone B mid-bay shelving.
     - Class C slow-movers: Zone C upper pallet racking.
2. **Barcode Bin Scanning:**
   - Operator scans the product barcode label and the destination bin barcode (e.g. `WH-BHW-01/Z-A/A01/R02/S01/BIN-03`).
3. **Confirmation:**
   - Stock movement is confirmed in StockPilot, ensuring real-time bin availability.

---

### SOP 03: Sales Order Allocation & Atomic Stock Reservation
1. **Order Booking:**
   - Sales managers book orders via **Sales Orders &gt; Create Order**.
2. **Availability Check:**
   - StockPilot validates that `Quantity Requested <= (Quantity On Hand - Quantity Reserved - Quantity Quarantined)`.
3. **Atomic Reservation:**
   - Upon confirmation, an atomic row lock reserves the inventory, preventing concurrent orders from overselling the same stock.

---

### SOP 04: Order Picking, Packing & Staging
1. **Pick List Generation:**
   - The fulfillment supervisor generates optimized wave pick lists grouped by warehouse zone and aisle coordinates.
2. **Picking Execution:**
   - Pickers retrieve items from assigned bins using First-Expiry-First-Out (FEFO) order.
3. **Packing & Weight Validation:**
   - Items are verified at packing stations, placed in corrugated cartons, and sealed with tamper-evident tape.
   - Weight and package counts are logged on the dispatch order.

---

### SOP 05: Outbound Dispatch & Rule 55 Delivery Challan
1. **Transporter Allocation:**
   - Assign registered Indian carrier (Delhivery, VRL Logistics, BlueDart, TCI Express) and enter vehicle registration number.
2. **Statutory E-Way Bill Check:**
   - If consignment value exceeds INR 50,000, verify the e-way bill reference number.
3. **Challan Download:**
   - Print the Rule 55 CGST compliant Delivery Challan PDF locally from StockPilot.
4. **Dispatch Confirmation:**
   - Clicking **Confirm Dispatch** deducts the reserved inventory permanently from the stock ledger and logs movement `SALES_ISSUE`.

---

### SOP 06: Blind Cycle Counting & Audit Reconciliation
1. **Session Creation:**
   - The stock auditor launches an audit session for designated zones with **Blind Count Mode** enabled.
2. **Floor Physical Tally:**
   - Field counters tally items without visibility into system expected numbers.
3. **Variance Review:**
   - The warehouse manager reviews variances in physical units and monetary INR value.
4. **Ledger Adjustment:**
   - Approved variances generate auditable adjustment records (`AUDIT_ADJUSTMENT`), restoring exact balance synchronization.

---

### SOP 07: AI Demand Forecasting & Replenishment Review
1. **Forecasting Engine Run:**
   - In **Demand Forecasting**, trigger the local Pandas & NumPy engine.
   - The system aggregates historical sales velocity, computes Holt-Winters exponential smoothing, and compares error metrics (MAE & WAPE).
2. **Safety Stock Evaluation:**
   - Safety stock is evaluated dynamically: `SS = 1.65 * sigma_d * sqrt(L)` (95% service level).
3. **One-Click PO Approval:**
   - Supervisors review recommended order quantities and click **Approve to Draft PO** to generate procurement orders directly.

---

### SOP 08: Statutory GST & HSN Compliance
1. **Tax Slab Configuration:**
   - Verify applicable GST tax rates (0%, 5%, 12%, 18%, 28%) and statutory 8-digit HSN codes on every product SKU.
2. **Tax Invoicing:**
   - Local PDF tax invoices display split CGST and SGST for intra-state dispatches and IGST for inter-state dispatches.
