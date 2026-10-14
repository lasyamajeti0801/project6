import React, { useState } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Leaf,
  Warehouse as WarehouseIcon,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
}) => {
  const { user, organization, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-accent" />;
    if (theme === 'sage') return <Leaf className="w-4 h-4 text-forest" />;
    return <Sun className="w-4 h-4 text-amber" />;
  };

  return (
    <header className="h-16 bg-white dark:bg-charcoal-900 border-b border-charcoal-200 dark:border-charcoal-800 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger & Active Warehouse */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Warehouse Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sage-50 dark:bg-charcoal-800 border border-sage-200/60 dark:border-charcoal-700 text-xs">
          <WarehouseIcon className="w-3.5 h-3.5 text-forest dark:text-accent" />
          <span className="font-semibold text-charcoal-800 dark:text-charcoal-100">
            {user?.warehouse_name || 'All Warehouses Connected'}
          </span>
          <span className="text-[10px] bg-forest/10 dark:bg-accent/20 text-forest dark:text-accent font-bold px-1.5 py-0.5 rounded">
            Online
          </span>
        </div>
      </div>

      {/* Center: Global Search Button */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-charcoal-50 dark:bg-charcoal-800/80 hover:bg-charcoal-100 dark:hover:bg-charcoal-750 text-textMuted dark:text-charcoal-200 rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search SKU, Bin, PO, Challan...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-charcoal-700 rounded border border-charcoal-200 dark:border-charcoal-600 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Theme switcher, Notifications, User profile */}
      <div className="flex items-center gap-2">
        {/* Mobile search icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme mode toggle */}
        <div className="relative group">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors flex items-center gap-1.5"
            title={`Current theme: ${theme}. Click to switch theme.`}
          >
            {getThemeIcon()}
            <span className="text-xs font-semibold capitalize hidden xl:inline text-charcoal-700 dark:text-charcoal-200">
              {theme}
            </span>
          </button>
        </div>

        {/* Notification bell */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-charcoal-200 dark:bg-charcoal-700 mx-1" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-forest text-white font-bold flex items-center justify-center text-xs shadow-soft">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-charcoal-900 dark:text-white leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-textMuted dark:text-charcoal-200 capitalize">
                {user?.role_display}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-textMuted hidden sm:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-charcoal-800 rounded-xl shadow-elevated border border-charcoal-200 dark:border-charcoal-700/80 py-1.5 z-50"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-4 py-2 border-b border-charcoal-100 dark:border-charcoal-700/60">
                <p className="text-xs font-bold text-charcoal-900 dark:text-white">
                  {organization?.name || 'Bharat DistroLogix'}
                </p>
                <p className="text-[11px] text-textMuted truncate">
                  GSTIN: {organization?.gstin || '27AABCB1234F1Z8'}
                </p>
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-xs text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50"
              >
                <Settings className="w-4 h-4 text-textMuted" /> Organization Settings
              </Link>
              <Link
                to="/users"
                className="flex items-center gap-2 px-4 py-2 text-xs text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/50"
              >
                <UserIcon className="w-4 h-4 text-textMuted" /> Users & Permissions
              </Link>

              <div className="border-t border-charcoal-100 dark:border-charcoal-700/60 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-alert hover:bg-alert-subtle dark:hover:bg-alert/10 font-semibold"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
