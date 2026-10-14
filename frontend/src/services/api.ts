import {
  User,
  Organization,
  Category,
  Product,
  Warehouse,
  Bin,
  StockItem,
  StockMovement,
  Supplier,
  PurchaseOrder,
  Customer,
  SalesOrder,
  DispatchOrder,
  ForecastResult,
  ReorderRecommendation,
  AuditSession,
  AuditItem,
  NotificationItem,
  AuditLogItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('stockpilot_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Clear token and notify
      localStorage.removeItem('stockpilot_token');
      localStorage.removeItem('stockpilot_user');
      window.dispatchEvent(new Event('stockpilot:auth_expired'));
    }

    if (!response.ok) {
      let errMessage = 'An unexpected server error occurred';
      try {
        const errorData = await response.json();
        errMessage = errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch {
        errMessage = response.statusText || errMessage;
      }
      throw new Error(errMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth & Org
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User; organization: Organization; message: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: Record<string, any>) {
    return this.request<{ token: string; user: User; organization: Organization }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<{ user: User; organization: Organization }>('/auth/profile/');
  }

  async updateTheme(theme_preference: 'light' | 'dark' | 'sage') {
    return this.request<User>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify({ theme_preference }),
    });
  }

  async getOrganization() {
    return this.request<Organization>('/auth/organization/');
  }

  async updateOrganization(data: Partial<Organization>) {
    return this.request<Organization>('/auth/organization/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUsers() {
    return this.request<{ results: User[] } | User[]>('/auth/users/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createUser(data: Record<string, any>) {
    return this.request<User>('/auth/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Catalog
  async getProducts(params?: { category?: number; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ results: Product[] } | Product[]>(`/catalog/products/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async createProduct(data: Partial<Product>) {
    return this.request<Product>('/catalog/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: Partial<Product>) {
    return this.request<Product>(`/catalog/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCategories() {
    return this.request<{ results: Category[] } | Category[]>('/catalog/categories/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createCategory(data: { name: string; code: string; parent?: number; description?: string }) {
    return this.request<Category>('/catalog/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLowStockProducts() {
    return this.request<Product[]>('/catalog/products/low_stock/');
  }

  // Warehouses
  async getWarehouses() {
    return this.request<{ results: Warehouse[] } | Warehouse[]>('/warehouses/locations/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createWarehouse(data: Partial<Warehouse>) {
    return this.request<Warehouse>('/warehouses/locations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBins(warehouseId?: number) {
    const qs = warehouseId ? `?warehouse=${warehouseId}` : '';
    return this.request<{ results: Bin[] } | Bin[]>(`/warehouses/bins/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  // Inventory
  async getStockItems(params?: { warehouse?: number; product?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.warehouse) query.append('warehouse', params.warehouse.toString());
    if (params?.product) query.append('product', params.product.toString());
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ results: StockItem[] } | StockItem[]>(`/inventory/items/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async getStockSummary() {
    return this.request<{
      total_units_on_hand: number;
      total_units_reserved: number;
      total_units_available: number;
      total_stock_value: number;
      unique_items_count: number;
    }>('/inventory/items/summary/');
  }

  async getStockMovements(params?: { warehouse?: number; product?: number; movement_type?: string }) {
    const query = new URLSearchParams();
    if (params?.warehouse) query.append('warehouse', params.warehouse.toString());
    if (params?.product) query.append('product', params.product.toString());
    if (params?.movement_type) query.append('movement_type', params.movement_type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ results: StockMovement[] } | StockMovement[]>(`/inventory/movements/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async adjustStock(data: { product: number; warehouse: number; bin?: number; quantity_delta: number; reason: string }) {
    return this.request<{ message: string; stock_item: StockItem; movement: StockMovement }>('/inventory/adjust/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Suppliers
  async getSuppliers() {
    return this.request<{ results: Supplier[] } | Supplier[]>('/suppliers/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createSupplier(data: Partial<Supplier>) {
    return this.request<Supplier>('/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Procurement
  async getPurchaseOrders(params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : '';
    return this.request<{ results: PurchaseOrder[] } | PurchaseOrder[]>(`/procurement/orders/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async createPurchaseOrder(data: Record<string, any>) {
    return this.request<PurchaseOrder>('/procurement/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitPO(id: number) {
    return this.request<PurchaseOrder>(`/procurement/orders/${id}/submit_for_approval/`, { method: 'POST' });
  }

  async approvePO(id: number) {
    return this.request<PurchaseOrder>(`/procurement/orders/${id}/approve/`, { method: 'POST' });
  }

  async rejectPO(id: number, reason: string) {
    return this.request<PurchaseOrder>(`/procurement/orders/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async sendPO(id: number) {
    return this.request<PurchaseOrder>(`/procurement/orders/${id}/send_to_supplier/`, { method: 'POST' });
  }

  downloadPO_PDF_URL(id: number) {
    return `${API_BASE}/procurement/orders/${id}/download_pdf/`;
  }

  async createGRN(data: Record<string, any>) {
    return this.request<any>('/procurement/receipts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sales
  async getCustomers() {
    return this.request<{ results: Customer[] } | Customer[]>('/sales/customers/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createCustomer(data: Partial<Customer>) {
    return this.request<Customer>('/sales/customers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalesOrders(params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : '';
    return this.request<{ results: SalesOrder[] } | SalesOrder[]>(`/sales/orders/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async createSalesOrder(data: Record<string, any>) {
    return this.request<SalesOrder>('/sales/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmSalesOrder(id: number) {
    return this.request<SalesOrder>(`/sales/orders/${id}/confirm/`, { method: 'POST' });
  }

  async cancelSalesOrder(id: number) {
    return this.request<SalesOrder>(`/sales/orders/${id}/cancel/`, { method: 'POST' });
  }

  downloadSO_PDF_URL(id: number) {
    return `${API_BASE}/sales/orders/${id}/download_pdf/`;
  }

  // Dispatches
  async getDispatches(params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : '';
    return this.request<{ results: DispatchOrder[] } | DispatchOrder[]>(`/dispatch/orders/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async createDispatch(data: Record<string, any>) {
    return this.request<DispatchOrder>('/dispatch/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmDispatch(id: number) {
    return this.request<DispatchOrder>(`/dispatch/orders/${id}/confirm_dispatch/`, { method: 'POST' });
  }

  async markDelivered(id: number, notes?: string) {
    return this.request<DispatchOrder>(`/dispatch/orders/${id}/mark_delivered/`, {
      method: 'POST',
      body: JSON.stringify({ proof_of_delivery_notes: notes }),
    });
  }

  downloadChallan_PDF_URL(id: number) {
    return `${API_BASE}/dispatch/orders/${id}/download_challan/`;
  }

  // Barcodes
  async lookupBarcode(code: string) {
    return this.request<{ type: string; data: any }>(`/barcodes/lookup/?code=${encodeURIComponent(code)}`);
  }

  async generateBarcode(text: string, type: 'code128' | 'qr' = 'code128') {
    return this.request<{ data_url: string; text: string; type: string }>(`/barcodes/generate/?text=${encodeURIComponent(text)}&type=${type}`);
  }

  printLabels_PDF_URL(productId: number, count = 12) {
    return `${API_BASE}/barcodes/print-labels/?product=${productId}&count=${count}`;
  }

  // Audits
  async getAuditSessions() {
    return this.request<{ results: AuditSession[] } | AuditSession[]>('/audits/sessions/').then(res => Array.isArray(res) ? res : res.results);
  }

  async createAuditSession(data: { warehouse: number; zone?: number; audit_type?: string; is_blind_count?: boolean; notes?: string }) {
    return this.request<AuditSession>('/audits/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordAuditCount(sessionId: number, data: { audit_item_id: number; physical_quantity: number; discrepancy_reason?: string }) {
    return this.request<AuditItem>(`/audits/sessions/${sessionId}/record_count/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reconcileAudit(sessionId: number) {
    return this.request<AuditSession>(`/audits/sessions/${sessionId}/approve_and_reconcile/`, { method: 'POST' });
  }

  downloadAudit_PDF_URL(sessionId: number) {
    return `${API_BASE}/audits/sessions/${sessionId}/download_report/`;
  }

  // Forecasting
  async getForecastResults() {
    return this.request<{ results: ForecastResult[] } | ForecastResult[]>('/forecasting/results/').then(res => Array.isArray(res) ? res : res.results);
  }

  async getReorderRecommendations(status?: string) {
    const qs = status ? `?status=${status}` : '';
    return this.request<{ results: ReorderRecommendation[] } | ReorderRecommendation[]>(`/forecasting/recommendations/${qs}`).then(res => Array.isArray(res) ? res : res.results);
  }

  async triggerForecastEngine(product?: number, warehouse?: number) {
    return this.request<any>('/forecasting/recommendations/trigger_engine/', {
      method: 'POST',
      body: JSON.stringify({ product, warehouse }),
    });
  }

  async approveRecommendationToPO(id: number) {
    return this.request<{ message: string; purchase_order_id: number; recommendation: ReorderRecommendation }>(`/forecasting/recommendations/${id}/approve_to_po/`, {
      method: 'POST',
    });
  }

  async rejectRecommendation(id: number, reason: string) {
    return this.request<ReorderRecommendation>(`/forecasting/recommendations/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getDemandHistory(productId: number, days = 30) {
    return this.request<Array<{ date: string; demanded: number; fulfilled: number; lost: number }>>(`/forecasting/history/?product=${productId}&days=${days}`);
  }

  // Reports
  async getReportList() {
    return this.request<Array<{ id: string; name: string; category: string; description: string }>>('/reports/list/');
  }

  async getReportData(reportId: string) {
    return this.request<{ report_id: string; columns: string[]; data: any[]; total_rows: number; generated_at: string }>(`/reports/${reportId}/`);
  }

  downloadReportCSV_URL(reportId: string) {
    const token = this.getToken();
    return `${API_BASE}/reports/${reportId}/?export=csv&token=${token}`;
  }

  // Notifications
  async getNotifications() {
    return this.request<{ results: NotificationItem[] } | NotificationItem[]>('/notifications/').then(res => Array.isArray(res) ? res : res.results);
  }

  async getUnreadCount() {
    return this.request<{ unread_count: number }>('/notifications/unread_count/');
  }

  async markNotificationRead(id: number) {
    return this.request<NotificationItem>(`/notifications/${id}/mark_read/`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/mark_all_read/', { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs() {
    return this.request<{ results: AuditLogItem[] } | AuditLogItem[]>('/auditlog/').then(res => Array.isArray(res) ? res : res.results);
  }

  // Health
  async checkHealth() {
    return this.request<{ status: string; application: string; version: string; timezone: string }>('/health/');
  }
}

export const api = new ApiService();
