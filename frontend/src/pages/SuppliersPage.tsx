import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Mail, MapPin, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { Supplier } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/formatters';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Supplier Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone_number: '+91 ',
    email: '',
    billing_address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin_code: '400001',
    gstin: '',
    pan: '',
    payment_terms: 'net_30',
    lead_time_days: 7,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createSupplier({
        ...formData,
        code: formData.code.toUpperCase(),
        lead_time_days: Number(formData.lead_time_days),
      });
      setModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to register supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Supplier &amp; Vendor Directory
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Registered Indian B2B suppliers, GSTIN identifiers, payment terms, and computed on-time fulfillment rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuppliers}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <Card key={s.id} padding="none">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-sage-100 dark:bg-charcoal-700/50 rounded-xl text-forest dark:text-accent">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs font-bold bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 px-2 py-0.5 rounded">
                  {s.code}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-white">
                  {s.name}
                </h3>
                <p className="text-xs text-textMuted dark:text-charcoal-200 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-forest dark:text-accent shrink-0" />
                  {s.city}, {s.state} - {s.pin_code}
                </p>
              </div>

              {/* GSTIN & Tax Identifiers */}
              <div className="p-2.5 bg-charcoal-50 dark:bg-charcoal-850 rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-textMuted">GSTIN:</span>
                  <span className="font-bold text-forest dark:text-accent">{s.gstin || 'Unregistered'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">PAN:</span>
                  <span className="font-bold text-charcoal-800 dark:text-charcoal-200">{s.pan || '—'}</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-750 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-textMuted text-[11px] block">On-Time Delivery</span>
                  <span className="font-bold text-forest dark:text-accent text-sm">
                    {s.on_time_delivery_rate}%
                  </span>
                </div>
                <div>
                  <span className="text-textMuted text-[11px] block">Total Purchases</span>
                  <span className="font-bold text-charcoal-900 dark:text-white text-sm">
                    {formatINR(s.total_purchases_value)}
                  </span>
                </div>
              </div>

              {/* Contact and terms */}
              <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-750 text-xs text-textMuted space-y-1">
                <p className="font-semibold text-charcoal-800 dark:text-charcoal-200">
                  {s.contact_person}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-forest dark:text-accent" /> {s.phone_number}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-warm" /> Lead Time: {s.lead_time_days} days ({s.payment_terms_display})
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Vendor / Supplier"
        subtitle="Add a new Indian supplier profile with tax identifiers and terms"
        maxWidth="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Supplier Code"
              placeholder="e.g. SUP-MUM-05"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Supplier / Business Name"
              placeholder="e.g. Siemens Automation India Ltd"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Rakesh Verma"
              value={formData.contact_person}
              onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98200 44556"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Email"
              type="email"
              placeholder="sales@siemens-distro.in"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="GSTIN (15 Characters)"
              placeholder="27AABCS1234F1Z9"
              value={formData.gstin}
              onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Select
              label="State"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              options={[
                { value: 'Maharashtra', label: 'Maharashtra' },
                { value: 'Delhi', label: 'Delhi' },
                { value: 'Karnataka', label: 'Karnataka' },
                { value: 'Gujarat', label: 'Gujarat' },
                { value: 'Haryana', label: 'Haryana' },
                { value: 'Tamil Nadu', label: 'Tamil Nadu' },
              ]}
            />
            <Input
              label="PIN Code"
              placeholder="400001"
              value={formData.pin_code}
              onChange={e => setFormData({ ...formData, pin_code: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
              options={[
                { value: 'net_15', label: 'Net 15 Days' },
                { value: 'net_30', label: 'Net 30 Days' },
                { value: 'net_45', label: 'Net 45 Days' },
                { value: 'immediate', label: 'Cash on Delivery / Immediate' },
                { value: 'advance', label: '100% Advance Payment' },
              ]}
            />
            <Input
              label="Standard Lead Time (Days)"
              type="number"
              value={formData.lead_time_days}
              onChange={e => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Billing & Dispatch Address"
            placeholder="Plot 8, MIDC Industrial Area"
            value={formData.billing_address}
            onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
            required
          />

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-charcoal-100 dark:border-charcoal-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              Register Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
