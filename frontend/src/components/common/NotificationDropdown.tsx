import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.slice(0, 8));
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // Ignore background error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // 45s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-alert shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-forest dark:text-accent shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-alert ring-2 ring-white dark:ring-charcoal-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-charcoal-800 rounded-xl shadow-elevated border border-charcoal-200 dark:border-charcoal-700/80 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-100 dark:border-charcoal-700/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-charcoal-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-alert-subtle text-alert px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-forest dark:text-accent hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-charcoal-100 dark:divide-charcoal-700/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-textMuted dark:text-charcoal-200">
                No new alerts or notifications.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 hover:bg-charcoal-50 dark:hover:bg-charcoal-700/30 transition-colors ${
                    !n.is_read ? 'bg-sage-50/50 dark:bg-charcoal-700/20' : ''
                  }`}
                >
                  <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal-900 dark:text-white truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-textMuted dark:text-charcoal-200 line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-textMuted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(n.created_at)}
                      </span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-forest dark:text-accent hover:underline flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-charcoal-100 dark:border-charcoal-700/60 bg-charcoal-50 dark:bg-charcoal-800/80 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-forest dark:text-accent hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
