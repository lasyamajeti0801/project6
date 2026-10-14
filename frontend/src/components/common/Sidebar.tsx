import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Package,
  Layers,
  Warehouse as WarehouseIcon,
  ArrowLeftRight,
  ShoppingCart,
  Building2,
  FileText,
  Truck,
  QrCode,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  Bell,
  Users,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, organization } = useAuth();

  const navSections = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Inventory', path: '/inventory', icon: Boxes },
        { name: 'Products', path: '/products', icon: Package },
        { name: 'Categories', path: '/categories', icon: Layers },
        { name: 'Warehouses', path: '/warehouses', icon: WarehouseIcon },
        { name: 'Stock Movements', path: '/movements', icon: ArrowLeftRight },
      ],
    },
    {
      title: 'Procurement & Sales',
      items: [
        { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
        { name: 'Suppliers', path: '/suppliers', icon: Building2 },
        { name: 'Sales Orders', path: '/sales-orders', icon: FileText },
        { name: 'Dispatches', path: '/dispatches', icon: Truck },
      ],
    },
    {
      title: 'Warehouse Intelligence',
      items: [
        { name: 'Barcode & Labels', path: '/barcodes', icon: QrCode },
        { name: 'Stock Audits', path: '/audits', icon: ClipboardCheck },
        { name: 'Demand Forecasting', path: '/forecasting', icon: TrendingUp, badge: 'AI' },
        { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Management',
      items: [
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Users & Roles', path: '/users', icon: Users },
        { name: 'Org Settings', path: '/settings', icon: Settings },
        { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-charcoal-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-charcoal-900 border-r border-charcoal-200 dark:border-charcoal-800 transition-all duration-300 ease-in-out flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-charcoal-100 dark:border-charcoal-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center text-white font-black shadow-soft shrink-0">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-charcoal-900 dark:text-white leading-tight tracking-tight">
                  Stock<span className="text-forest dark:text-accent">Pilot</span>
                </span>
                <span className="text-[10px] text-textMuted dark:text-charcoal-200 uppercase tracking-widest font-semibold">
                  {organization?.code || 'WMS Enterprise'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg text-textMuted hover:text-charcoal-900 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!collapsed && (
                <div className="px-3 mb-2 text-[11px] font-bold text-textMuted dark:text-charcoal-200 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none ${
                          isActive
                            ? 'bg-emerald-subtle text-forest dark:bg-emerald/20 dark:text-accent font-semibold shadow-soft'
                            : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-100 dark:text-charcoal-200 dark:hover:text-white dark:hover:bg-charcoal-800'
                        } ${collapsed ? 'justify-center px-0' : ''}`
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-accent/20 text-forest-dark dark:text-accent font-bold px-1.5 py-0.5 rounded-md">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer profile summary */}
        {!collapsed && user && (
          <div className="p-3 border-t border-charcoal-100 dark:border-charcoal-800">
            <div className="flex items-center gap-3 p-2 bg-charcoal-50 dark:bg-charcoal-800/60 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-forest text-white font-bold flex items-center justify-center text-xs">
                {user.first_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-charcoal-900 dark:text-white truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[11px] text-textMuted dark:text-charcoal-200 truncate capitalize">
                  {user.role_display}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
