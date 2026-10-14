import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Filter, RefreshCw, FileDown, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../services/api';
import { AuditSession, Warehouse } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate } from '../utils/formatters';

export const StockAuditsPage: React.FC = () => {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // New Audit Session Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [auditType, setAuditType] = useState('cycle_count');
  const [isBlind, setIsBlind] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Count & Reconcile Modal
  const [activeSession, setActiveSession] = useState<AuditSession | null>(null);
  const [countInputs, setCountInputs] = useState<Record<number, number>>({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState<Record<number, string>>({});
  const [reconciling, setReconciling] = useState(false);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const [auds, whs] = await Promise.all([
        api.getAuditSessions(),
        api.getWarehouses(),
      ]);
      setSessions(auds);
      setWarehouses(whs);
      if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAuditSession({
        warehouse: parseInt(selectedWarehouse),
        audit_type: auditType,
        is_blind_count: isBlind,
        notes,
      });
      setCreateModalOpen(false);
      fetchAudits();
    } catch (err: any) {
      alert(err.message || 'Failed to create audit session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCountModal = (session: AuditSession) => {
    setActiveSession(session);
    const initialCounts: Record<number, number> = {};
    const initialReasons: Record<number, string> = {};
    session.items?.forEach(it => {
      initialCounts[it.id] = it.physical_quantity || 0;
      initialReasons[it.id] = it.discrepancy_reason || '';
    });
    setCountInputs(initialCounts);
    setDiscrepancyReasons(initialReasons);
  };

  const handleSaveCount = async (itemId: number) => {
    if (!activeSession) return;
    try {
      await api.recordAuditCount(activeSession.id, {
        audit_item_id: itemId,
        physical_quantity: countInputs[itemId] || 0,
        discrepancy_reason: discrepancyReasons[itemId] || '',
      });
      fetchAudits();
    } catch (err: any) {
      alert(err.message || 'Failed to record count');
    }
  };

  const handleReconcile = async () => {
    if (!activeSession) return;
    if (confirm('Approve physical count reconciliation? This will adjust system inventory balances and write auditable transactions to the stock movement ledger.')) {
      setReconciling(true);
      try {
        await api.reconcileAudit(activeSession.id);
        setActiveSession(null);
        fetchAudits();
      } catch (err: any) {
        alert(err.message || 'Reconciliation failed.');
      } finally {
        setReconciling(false);
      }
    }
  };

  const getStatusBadge = (status: string, display?: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">{display || 'Reconciled'}</Badge>;
      case 'pending_review':
        return <Badge variant="warning">{display || 'Review Pending'}</Badge>;
      case 'in_progress':
        return <Badge variant="sage">{display || 'In Progress'}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{display || 'Rejected'}</Badge>;
      default:
        return <Badge variant="neutral">{display || 'Scheduled'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Physical Stock Audits &amp; Reconciliation
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Physical cycle counts, blind stocktaking, variance calculations, and supervisor ledger adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAudits}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Audit Session
          </Button>
        </div>
      </div>

      {/* Audits Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Audit Ref</th>
                <th className="py-3 px-4">Warehouse Facility</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4 text-center">Blind Count</th>
                <th className="py-3 px-4 text-right">Items Verified</th>
                <th className="py-3 px-4 text-right">Net Variance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    Loading stock audit sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    No physical audit sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map(aud => (
                  <tr key={aud.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                        {aud.audit_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {aud.warehouse_name}
                    </td>
                    <td className="py-3 px-4 capitalize text-textMuted">
                      {aud.audit_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(aud.scheduled_date)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={aud.is_blind_count ? 'sage' : 'neutral'} size="sm">
                        {aud.is_blind_count ? 'Masked' : 'Transparent'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-textMuted">
                      {aud.total_items_count} SKUs
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${aud.total_variance_units !== 0 ? 'text-amber-warm' : 'text-forest dark:text-accent'}`}>
                      {aud.total_variance_units > 0 ? `+${aud.total_variance_units}` : aud.total_variance_units} units ({formatINR(aud.total_variance_value)})
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(aud.status, aud.status_display)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenCountModal(aud)}
                          icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                        >
                          {aud.status === 'approved' ? 'Inspect' : 'Count & Verify'}
                        </Button>
                        <a
                          href={api.downloadAudit_PDF_URL(aud.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-charcoal-200 hover:border-forest text-textMuted hover:text-forest transition-colors"
                          title="Download Variance Reconciliation Report PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Count & Reconcile Modal */}
      {activeSession && (
        <Modal
          isOpen={!!activeSession}
          onClose={() => setActiveSession(null)}
          title={`Physical Stocktake: ${activeSession.audit_number}`}
          subtitle={`${activeSession.warehouse_name} • ${activeSession.is_blind_count ? 'Blind Counting Active' : 'System Counts Visible'}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-sage-50/70 dark:bg-charcoal-850 rounded-xl border border-sage-200 dark:border-charcoal-700 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-forest dark:text-accent">Audit Session Status:</span> {activeSession.status_display}
                <p className="text-textMuted text-[11px] mt-0.5">Enter physical counts for each bin. Click 'Save' per item or 'Approve Reconciliation' when counting is complete.</p>
              </div>
              {activeSession.status !== 'approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReconcile}
                  loading={reconciling}
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Approve &amp; Reconcile Ledger
                </Button>
              )}
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 dark:bg-charcoal-800 text-textMuted font-bold border-b border-charcoal-200">
                  <tr>
                    <th className="py-2.5 px-3">Product / SKU</th>
                    <th className="py-2.5 px-3">Bin Location</th>
                    {!activeSession.is_blind_count && <th className="py-2.5 px-3 text-right">System Snapshot</th>}
                    <th className="py-2.5 px-3 text-right">Physical Count</th>
                    <th className="py-2.5 px-3">Discrepancy Notes</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
                  {activeSession.items?.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-forest dark:text-accent">{item.product_sku}</span>
                        <p className="text-[11px] text-textMuted truncate max-w-xs">{item.product_name}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-textMuted">
                        {item.bin_code || 'General Bin'}
                      </td>
                      {!activeSession.is_blind_count && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {item.system_quantity}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={countInputs[item.id] !== undefined ? countInputs[item.id] : item.physical_quantity}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setCountInputs(prev => ({ ...prev, [item.id]: val }));
                          }}
                          disabled={activeSession.status === 'approved'}
                          className="w-20 px-2 py-1 text-right font-mono font-bold rounded border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. 1 carton damaged"
                          value={discrepancyReasons[item.id] !== undefined ? discrepancyReasons[item.id] : (item.discrepancy_reason || '')}
                          onChange={e => {
                            const val = e.target.value;
                            setDiscrepancyReasons(prev => ({ ...prev, [item.id]: val }));
                          }}
                          disabled={activeSession.status === 'approved'}
                          className="w-full px-2 py-1 text-xs rounded border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {activeSession.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveCount(item.id)}
                          >
                            Save
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* New Audit Session Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Stocktake Audit Session"
        subtitle="Freeze system snapshot and configure physical counting protocol"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Warehouse Facility to Audit"
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            required
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Audit Protocol Type"
            value={auditType}
            onChange={e => setAuditType(e.target.value)}
            options={[
              { value: 'cycle_count', label: 'Periodic Cycle Count (Recommended)' },
              { value: 'full', label: 'Full Physical Facility Stocktake' },
              { value: 'spot_check', label: 'High-Value Spot Check' },
            ]}
          />

          <div className="p-3 bg-sage-50/70 dark:bg-charcoal-800 rounded-xl border border-sage-200 dark:border-charcoal-700">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-charcoal-900 dark:text-white">
              <input
                type="checkbox"
                checked={isBlind}
                onChange={e => setIsBlind(e.target.checked)}
                className="rounded border-charcoal-300 text-forest focus:ring-forest"
              />
              <span>Blind Counting (Hide system quantities from counting staff)</span>
            </label>
            <p className="text-[11px] text-textMuted mt-1 pl-6">
              Ensures unbiased physical counts by preventing auditors from anchoring to theoretical system numbers.
            </p>
          </div>

          <Input
            label="Audit Session Notes / Scope"
            placeholder="e.g. Zone A High velocity sensors & PLC bins"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-charcoal-100 dark:border-charcoal-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              Launch Audit Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
