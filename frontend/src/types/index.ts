export type UserRole =
  | 'super_admin'
  | 'org_owner'
  | 'warehouse_manager'
  | 'inventory_manager'
  | 'procurement_officer'
  | 'sales_manager'
  | 'dispatch_operator'
  | 'stock_auditor'
  | 'finance_viewer'
  | 'read_only';

export type ThemeMode = 'light' | 'dark' | 'sage';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone?: string;
  role: UserRole | string;
  role_display?: string;
  organization?: number;
  organization_name?: string;
  assigned_warehouse?: number;
  warehouse_name?: string;
  theme_preference: ThemeMode;
  is_active: boolean;
  date_joined: string;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  business_type?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  registered_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  contact_email?: string;
  contact_phone?: string;
  currency?: string;
  financial_year_start_month?: number;
}

export interface Category {
  id: number;
  name: string;
  code: string;
  parent?: number;
  description?: string;
  is_active: boolean;
  subcategories: Category[];
  products_count: number;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  internal_code?: string;
  name: string;
  description?: string;
  category: number;
  category_name?: string;
  brand?: string;
  unit_of_measure: string;
  unit_of_measure_display?: string;
  hsn_code?: string;
  gst_rate: string | number;
  cost_price: string | number;
  selling_price: string | number;
  reorder_level: number;
  preferred_reorder_quantity: number;
  lead_time_days: number;
  barcode_value?: string;
  has_batch_tracking: boolean;
  has_expiry: boolean;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  total_stock: number;
  available_stock: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  warehouse_type: string;
  warehouse_type_display?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pin_code: string;
  contact_person: string;
  phone_number: string;
  email?: string;
  total_capacity_sqft: string | number;
  utilized_capacity_sqft: string | number;
  utilization_percentage: number;
  is_active: boolean;
  notes?: string;
  zones?: Zone[];
  total_bins_count?: number;
}

export interface Zone {
  id: number;
  code: string;
  name: string;
  zone_type: string;
  zone_type_display?: string;
  warehouse: number;
  aisles?: Aisle[];
}

export interface Aisle {
  id: number;
  code: string;
  racks?: Rack[];
}

export interface Rack {
  id: number;
  code: string;
  shelves?: Shelf[];
}

export interface Shelf {
  id: number;
  code: string;
  bins?: Bin[];
}

export interface Bin {
  id: number;
  code: string;
  full_location_code: string;
  barcode_value?: string;
  max_weight_kg: string | number;
}

export interface StockItem {
  id: number;
  warehouse: number;
  warehouse_name: string;
  warehouse_code: string;
  bin?: number;
  bin_location?: string;
  product: number;
  product_details: Product;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_quarantined: number;
  quantity_available: number;
  batch_number?: string;
  expiry_date?: string;
  unit_cost: string | number;
  total_value: string | number;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  movement_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number;
  warehouse_name: string;
  movement_type: string;
  movement_type_display: string;
  quantity: number;
  previous_balance: number;
  resulting_balance: number;
  unit_cost: string | number;
  reference_document?: string;
  reason: string;
  user_name: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  billing_address: string;
  city: string;
  state: string;
  pin_code: string;
  gstin?: string;
  pan?: string;
  payment_terms: string;
  payment_terms_display?: string;
  lead_time_days: number;
  total_purchases_value: string | number;
  on_time_delivery_rate: number;
  is_active: boolean;
}

export interface PurchaseOrderItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  product_uom?: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: string | number;
  gst_rate: string | number;
  total_cost?: string | number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name?: string;
  destination_warehouse: number;
  warehouse_name?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  status_display?: string;
  order_date: string;
  expected_delivery_date: string;
  subtotal: string | number;
  tax_amount: string | number;
  freight_charges: string | number;
  total_amount: string | number;
  payment_terms: string;
  notes?: string;
  rejection_reason?: string;
  created_by_name?: string;
  approved_by_name?: string;
  items: PurchaseOrderItem[];
  created_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  billing_address: string;
  shipping_address: string;
  city: string;
  state: string;
  pin_code: string;
  gstin?: string;
  credit_limit: string | number;
}

export interface SalesOrderItem {
  id?: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity_ordered: number;
  quantity_reserved?: number;
  unit_price: string | number;
  gst_rate: string | number;
  total_price?: string | number;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  customer: number;
  customer_name?: string;
  source_warehouse: number;
  warehouse_name?: string;
  status: 'draft' | 'confirmed' | 'reserved' | 'picking' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
  status_display?: string;
  payment_status: 'pending' | 'partially_paid' | 'paid';
  order_date: string;
  expected_dispatch_date: string;
  subtotal: string | number;
  tax_amount: string | number;
  shipping_charges: string | number;
  total_amount: string | number;
  items: SalesOrderItem[];
  created_at: string;
}

export interface DispatchItem {
  id: number;
  product_sku: string;
  product_name: string;
  quantity_dispatched: number;
}

export interface DispatchOrder {
  id: number;
  dispatch_number: string;
  delivery_challan_number: string;
  sales_order: number;
  so_number?: string;
  customer_name?: string;
  customer_city?: string;
  warehouse: number;
  warehouse_name?: string;
  status: 'planned' | 'picking' | 'picked' | 'packed' | 'dispatched' | 'delivered' | 'failed' | 'returned';
  status_display?: string;
  dispatch_date: string;
  transporter_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  e_way_bill_number?: string;
  package_count: number;
  total_weight_kg: string | number;
  proof_of_delivery_notes?: string;
  dispatched_by_name?: string;
  items: DispatchItem[];
}

export interface ForecastResult {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  horizon_days: number;
  method_used: string;
  method_display: string;
  avg_daily_demand: string | number;
  projected_demand: string | number;
  mae_error: string | number;
  wape_error: string | number;
  confidence_score: string | number;
  explanation: string;
  forecast_date: string;
}

export interface ReorderRecommendation {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_cost: string | number;
  warehouse: number;
  warehouse_name: string;
  supplier?: number;
  supplier_name?: string;
  current_on_hand: number;
  current_stock?: number;
  current_reserved: number;
  current_available: number;
  incoming_on_order: number;
  lead_time_days: number;
  supplier_lead_time_days?: number;
  expected_lead_time_demand: string | number;
  avg_daily_demand?: number;
  safety_stock_required: number;
  safety_stock?: number;
  reorder_point: number;
  recommended_order_quantity: number;
  suggested_order_date: string;
  estimated_stockout_date?: string;
  status: 'pending_review' | 'approved_to_po' | 'rejected' | 'deferred' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  status_display?: string;
  resulting_po_number?: string;
  explanation: string;
  rejection_reason?: string;
}

export interface AuditSession {
  id: number;
  audit_number: string;
  warehouse: number;
  warehouse_name: string;
  audit_type: string;
  status: 'scheduled' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | string;
  status_display: string;
  is_blind_count: boolean;
  scheduled_date: string;
  auditor_name?: string;
  supervisor_name?: string;
  notes?: string;
  total_items_count: number;
  total_variance_units: number;
  total_variance_value: string | number;
  items?: AuditItem[];
}

export interface AuditItem {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  bin_code?: string;
  system_quantity: number;
  physical_quantity: number;
  variance: number;
  unit_cost: string | number;
  variance_value: string | number;
  status: string;
  discrepancy_reason?: string;
}

export interface NotificationItem {
  id: number;
  notification_type?: string;
  notification_type_display?: string;
  category?: string;
  severity: 'critical' | 'warning' | 'info' | 'CRITICAL' | 'WARNING' | 'INFO' | string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  timestamp?: string;
  created_at?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  module: string;
  description: string;
  ip_address?: string;
  status?: string;
  details?: Record<string, any>;
}
