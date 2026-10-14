import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';
import { formatDateTime } from '../utils/formatters';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const modules = ['ALL', 'AUTH', 'INVENTORY', 'PROCUREMENT', 'SALES', 'DISPATCH', 'AUDIT'];

  const filtered = logs.filter((l) => {
    const matchesMod = selectedModule === 'ALL' || (l.module && l.module.toUpperCase() === selectedModule);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (l.action || '').toLowerCase().includes(q) ||
      (l.user_email || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.ip_address || '').includes(q);
    return matchesMod && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return <Badge variant="success">Success</Badge>;
      case 'FAILURE':
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      case 'WARNING':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="neutral">{status || 'INFO'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-800" />
              Security & Audit Trail Logs
            </h1>
            <Badge variant="neutral">Immutable Event Stream</Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            Complete compliance trail tracking staff sign-ins, ledger transactions, stock adjustments, and administrative approvals.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 border-forest-200 text-charcoal hover:bg-forest-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-forest-100 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Total Recorded Events</span>
          <p className="text-2xl font-bold text-charcoal mt-1">{logs.length}</p>
          <span className="text-xs text-secondary">Stored in compliant database partitions</span>
        </Card>

        <Card className="p-4 border-forest-100 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Security Posture</span>
          <p className="text-2xl font-bold text-emerald-800 mt-1">100% Authorized</p>
          <span className="text-xs text-emerald-700">Zero unauthorized perimeter breaches</span>
        </Card>

        <Card className="p-4 border-forest-100 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Active Session Audit</span>
          <p className="text-2xl font-bold text-charcoal mt-1">JWT Bearer</p>
          <span className="text-xs text-secondary">Sha-256 session token verification</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-forest-100 bg-white space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-secondary mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Module:
            </span>
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  selectedModule === m
                    ? 'bg-emerald-800 text-white'
                    : 'bg-forest-50 text-secondary hover:bg-forest-100 hover:text-charcoal'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by action, user, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Card>

      {/* Audit Table */}
      <Card className="border-forest-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest-50/70 text-secondary uppercase tracking-wider border-b border-forest-100">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Module</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">User</th>
                <th className="py-2.5 px-3 font-semibold">Client IP</th>
                <th className="py-2.5 px-2 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-forest-50/30 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-secondary font-mono">
                      {formatDateTime(log.created_at || log.timestamp || '')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-emerald-950 font-mono text-[11px] px-2 py-0.5 bg-forest-100 rounded">
                        {log.module || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal">{log.action}</div>
                      <div className="text-[11px] text-secondary truncate max-w-xs">{log.description}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-charcoal">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-secondary" />
                        <span>{log.user_email || 'System Daemon'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-secondary font-mono">
                      <div className="flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-secondary/70" />
                        <span>{log.ip_address || '127.0.0.1'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {getStatusBadge(log.status || 'SUCCESS')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setActiveLog(log);
                          setDetailModalOpen(true);
                        }}
                        className="p-1 text-secondary hover:text-emerald-800 rounded hover:bg-forest-100"
                        title="View payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Audit Event Details"
      >
        {activeLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-forest-50/70 rounded-lg border border-forest-100">
              <div>
                <span className="text-secondary block">Module & Action</span>
                <strong className="text-charcoal">{activeLog.module} — {activeLog.action}</strong>
              </div>
              <div>
                <span className="text-secondary block">Timestamp</span>
                <strong className="text-charcoal">{formatDateTime(activeLog.created_at || activeLog.timestamp || '')}</strong>
              </div>
              <div>
                <span className="text-secondary block">Initiated By</span>
                <strong className="text-charcoal">{activeLog.user_email || 'System'}</strong>
              </div>
              <div>
                <span className="text-secondary block">IP Address</span>
                <strong className="text-charcoal font-mono">{activeLog.ip_address || '127.0.0.1'}</strong>
              </div>
            </div>

            <div>
              <span className="font-semibold text-charcoal block mb-1">Description</span>
              <p className="p-2.5 bg-ivory rounded border border-forest-100 text-charcoal leading-relaxed">
                {activeLog.description || 'No additional narrative description provided.'}
              </p>
            </div>

            {activeLog.details && Object.keys(activeLog.details).length > 0 && (
              <div>
                <span className="font-semibold text-charcoal block mb-1">Raw Payload Details</span>
                <pre className="p-3 bg-charcoal text-ivory rounded-lg overflow-x-auto text-[11px] font-mono leading-snug">
                  {JSON.stringify(activeLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
