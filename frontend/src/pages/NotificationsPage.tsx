import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  CheckCheck,
  Filter,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { formatDateTime } from '../utils/formatters';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered = notifications.filter((n) => {
    const matchesSeverity = severityFilter === 'ALL' || n.severity === severityFilter;
    const matchesUnread = unreadOnly ? !n.is_read : true;
    return matchesSeverity && matchesUnread;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-alert-600 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-emerald-700 shrink-0" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <Badge variant="danger">Critical Alert</Badge>;
      case 'WARNING':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="success">Information</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">Notification & Alert Center</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-alert-100 text-alert-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-secondary mt-1">
            Real-time warehouse threshold alerts, replenishment notices, delayed POs, and audit discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-1.5 border-forest-200 text-charcoal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-1.5 bg-forest-800 hover:bg-forest-900 text-white"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 border-forest-100 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                severityFilter === sev
                  ? 'bg-emerald-800 text-white'
                  : 'bg-forest-50 text-secondary hover:bg-forest-100 hover:text-charcoal'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-charcoal cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-forest-300 text-emerald-700 focus:ring-emerald-500"
          />
          Show Unread Only
        </label>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center text-sm text-secondary border-forest-100 bg-white">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading alert center...
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-secondary border-forest-100 bg-white">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-charcoal">No notifications match your filter.</p>
            <p className="text-xs text-secondary mt-1">All warehouse operational streams are clear.</p>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`p-4 border transition-all ${
                item.is_read
                  ? 'bg-white border-forest-100 opacity-80'
                  : 'bg-emerald-50/20 border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          item.is_read ? 'text-charcoal' : 'text-emerald-950 font-bold'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {getSeverityBadge(item.severity)}
                      {(item.category || item.notification_type) && (
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-forest-100 text-secondary rounded">
                          {item.category || item.notification_type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 text-[11px] text-secondary/70 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.link!)}
                      className="text-xs h-7 px-2.5 border-forest-200 text-emerald-800 hover:bg-forest-50"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      title="Mark as read"
                      className="p-1.5 text-secondary hover:text-emerald-800 rounded-md hover:bg-forest-100"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
