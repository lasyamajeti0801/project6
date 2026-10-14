import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { RegisterPage } from './pages/RegisterPage';

// Authenticated Application Modules
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { DispatchesPage } from './pages/DispatchesPage';
import { BarcodeLabelsPage } from './pages/BarcodeLabelsPage';
import { StockAuditsPage } from './pages/StockAuditsPage';
import { DemandForecastingPage } from './pages/DemandForecastingPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserRolesPage } from './pages/UserRolesPage';
import { OrgSettingsPage } from './pages/OrgSettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Marketing & Onboarding Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected StockPilot Enterprise Workspace */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/movements" element={<StockMovementsPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/sales-orders" element={<SalesOrdersPage />} />
                <Route path="/dispatches" element={<DispatchesPage />} />
                <Route path="/barcodes" element={<BarcodeLabelsPage />} />
                <Route path="/audits" element={<StockAuditsPage />} />
                <Route path="/forecasting" element={<DemandForecastingPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/users" element={<UserRolesPage />} />
                <Route path="/settings" element={<OrgSettingsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
