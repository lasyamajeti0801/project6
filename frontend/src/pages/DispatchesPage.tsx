import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, RefreshCw, FileDown, CheckCircle, Clock, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { DispatchOrder, SalesOrder } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/formatters';

export const DispatchesPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<DispatchOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Dispatch Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSo, setSelectedSo] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState('VRL Logistics Ltd');
  const [vehicleNo, setVehicleNo] = useState('MH-04-AZ-9214');
  const [driverName, setDriverName] = useState('Suresh Jadhav');
  const [driverPhone, setDriverPhone] = useState('+91 99201 55667');
  const [eWayBill, setEWayBill] = useState('241088921477');
  const [packageCount, setPackageCount] = useState('2');
  const [totalWeight, setTotalWeight] = useState('25.5');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const [dsps, sos] = await Promise.all([
        api.getDispatches({ status: statusFilter || undefined }),
        api.getSalesOrders({ status: 'reserved' }),
      ]);
      setDispatches(dsps);
      setSalesOrders(sos);
      if (sos.length > 0 && !selectedSo) setSelectedSo(sos[0].id.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createDispatch({
        sales_order: parseInt(selectedSo),
        dispatch_date: dispatchDate,
        transporter_name: transporter,
        vehicle_number: vehicleNo,
        driver_name: driverName,
        driver_phone: driverPhone,
        e_way_bill_number: eWayBill,
        package_count: parseInt(packageCount),
        total_weight_kg: parseFloat(totalWeight),
      });
      setCreateModalOpen(false);
      fetchDispatches();
    } catch (err: any) {
      setFormError(err.message || 'Failed to plan dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDispatch = async (id: number) => {
    if (confirm('Confirm dispatch? This will physically deduct units from warehouse inventory and write to the immutable stock movement ledger.')) {
      try {
        await api.confirmDispatch(id);
        fetchDispatches();
      } catch (err: any) {
        alert(err.message || 'Dispatch confirmation failed.');
      }
    }
  };

  const handleMarkDelivered = async (id: number) => {
    const notes = prompt('Enter customer proof of delivery acknowledgment / stamp details:', 'Signed by receiving dock manager');
    if (notes !== null) {
      try {
        await api.markDelivered(id, notes);
        fetchDispatches();
      } catch (err: any) {
        alert(err.message || 'Delivery confirmation failed.');
      }
    }
  };

  const getStatusBadge = (status: string, display?: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">{display || 'Delivered'}</Badge>;
      case 'dispatched':
        return <Badge variant="sage">{display || 'In Transit'}</Badge>;
      case 'picked':
      case 'packed':
        return <Badge variant="warning">{display || 'Packed'}</Badge>;
      case 'failed':
      case 'returned':
        return <Badge variant="danger">{display || 'Failed'}</Badge>;
      default:
        return <Badge variant="neutral">{display || 'Planned'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Dispatch &amp; Delivery Challans
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Rule 55 CGST delivery challans, vehicle assignments, transporter coordination, and proof-of-delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDispatches}
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
            Plan Dispatch
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="sm">
        <div className="w-full sm:w-72">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Dispatch Statuses</option>
            <option value="planned">Planned Only</option>
            <option value="dispatched">In Transit (Dispatched)</option>
            <option value="delivered">Delivered to Customer</option>
          </Select>
        </div>
      </Card>

      {/* Dispatches Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Dispatch Ref &amp; Challan</th>
                <th className="py-3 px-4">Sales Order / Customer</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Transporter &amp; Vehicle</th>
                <th className="py-3 px-4">E-Way Bill</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    Loading dispatch operations...
                  </td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    No active dispatches found.
                  </td>
                </tr>
              ) : (
                dispatches.map(dsp => (
                  <tr key={dsp.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-forest dark:text-accent">
                        {dsp.delivery_challan_number}
                      </span>
                      <p className="text-[10px] text-textMuted font-mono">Ref: {dsp.dispatch_number}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal-900 dark:text-white">{dsp.customer_name}</span>
                      <p className="text-[11px] text-textMuted">SO: {dsp.so_number}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {dsp.warehouse_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-charcoal-900 dark:text-white">{dsp.transporter_name || 'Direct'}</span>
                      <p className="font-mono text-[10px] text-textMuted">{dsp.vehicle_number || '—'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-textMuted">
                      {dsp.e_way_bill_number || 'Exempt / Internal'}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(dsp.dispatch_date)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(dsp.status, dsp.status_display)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {dsp.status === 'planned' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirmDispatch(dsp.id)}
                            icon={<Truck className="w-3.5 h-3.5" />}
                          >
                            Ship Out
                          </Button>
                        )}
                        {dsp.status === 'dispatched' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMarkDelivered(dsp.id)}
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                          >
                            Delivered
                          </Button>
                        )}
                        <a
                          href={api.downloadChallan_PDF_URL(dsp.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-charcoal-200 hover:border-forest text-textMuted hover:text-forest transition-colors"
                          title="Download Delivery Challan PDF (Rule 55)"
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

      {/* Plan Dispatch Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Plan Consignment Dispatch"
        subtitle="Generate a Rule 55 Delivery Challan against a reserved sales order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {formError}
            </div>
          )}

          <Select
            label="Eligible Reserved Sales Order"
            value={selectedSo}
            onChange={e => setSelectedSo(e.target.value)}
            required
          >
            {salesOrders.length === 0 ? (
              <option value="">No reserved sales orders ready for dispatch</option>
            ) : (
              salesOrders.map(so => (
                <option key={so.id} value={so.id}>
                  {so.so_number} - {so.customer_name} ({so.warehouse_name})
                </option>
              ))
            )}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dispatch Date"
              type="date"
              value={dispatchDate}
              onChange={e => setDispatchDate(e.target.value)}
              required
            />
            <Input
              label="Transporter / Carrier Agency"
              placeholder="e.g. VRL Logistics, Delhivery, TCI Express"
              value={transporter}
              onChange={e => setTransporter(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vehicle Number"
              placeholder="e.g. MH-04-AZ-9214"
              value={vehicleNo}
              onChange={e => setVehicleNo(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="E-Way Bill Number (12 Digits)"
              placeholder="241088921477"
              value={eWayBill}
              onChange={e => setEWayBill(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Driver Name"
              placeholder="Suresh Jadhav"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
            />
            <Input
              label="Driver Phone"
              placeholder="+91 99201 55667"
              value={driverPhone}
              onChange={e => setDriverPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Package / Carton Count"
              type="number"
              value={packageCount}
              onChange={e => setPackageCount(e.target.value)}
              required
            />
            <Input
              label="Total Gross Weight (Kg)"
              type="number"
              step="0.1"
              value={totalWeight}
              onChange={e => setTotalWeight(e.target.value)}
              required
            />
          </div>

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
              disabled={salesOrders.length === 0}
            >
              Generate Delivery Challan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
