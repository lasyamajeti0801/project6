import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin, Phone, Mail, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Warehouse } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectWarehouse, setInspectWarehouse] = useState<Warehouse | null>(null);

  // Add Warehouse Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouse_type: 'fulfillment_center',
    address: '',
    city: 'Mumbai',
    district: 'Thane',
    state: 'Maharashtra',
    pin_code: '421302',
    contact_person: '',
    phone_number: '+91 ',
    total_capacity_sqft: '25000.00',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await api.getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createWarehouse({
        ...formData,
        code: formData.code.toUpperCase(),
        total_capacity_sqft: parseFloat(formData.total_capacity_sqft),
      });
      setModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to create warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Multi-Warehouse Hubs &amp; Coordinates
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Manage regional fulfillment centers, distribution hubs, storage capacities, and multi-tier bin locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWarehouses}
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
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(w => {
          const utilPct = w.utilization_percentage || 65;
          return (
            <Card key={w.id} padding="none">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-sage-100 dark:bg-charcoal-700/50 rounded-xl text-forest dark:text-accent">
                    <WarehouseIcon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-bold bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 px-2.5 py-1 rounded">
                    {w.code}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-white">
                    {w.name}
                  </h3>
                  <p className="text-xs text-textMuted dark:text-charcoal-200 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-forest dark:text-accent shrink-0" />
                    {w.city}, {w.state} - {w.pin_code}
                  </p>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-charcoal-100 dark:border-charcoal-750">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-textMuted">Capacity Utilization</span>
                    <span className="text-forest dark:text-accent font-bold">{utilPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-charcoal-100 dark:bg-charcoal-700 overflow-hidden">
                    <div
                      className="h-full bg-forest dark:bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-textMuted pt-0.5">
                    <span>Total: {parseFloat(w.total_capacity_sqft.toString()).toLocaleString('en-IN')} sqft</span>
                    <span>Bins: {w.total_bins_count || 32} Configured</span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-750 text-xs text-textMuted space-y-1">
                  <p className="font-semibold text-charcoal-800 dark:text-charcoal-200">
                    Contact: {w.contact_person}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-forest dark:text-accent" /> {w.phone_number}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setInspectWarehouse(w)}
                >
                  View Storage Hierarchy (Zones &amp; Bins)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Inspect Warehouse Modal */}
      {inspectWarehouse && (
        <Modal
          isOpen={!!inspectWarehouse}
          onClose={() => setInspectWarehouse(null)}
          title={`Location Hierarchy: ${inspectWarehouse.name}`}
          subtitle={`Multi-tier coordinate schema for ${inspectWarehouse.code}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-sage-50/60 dark:bg-charcoal-900 rounded-xl border border-sage-200 dark:border-charcoal-700 text-xs">
              <span className="font-bold text-forest dark:text-accent">Coordinate Format:</span>
              <p className="font-mono text-charcoal-800 dark:text-charcoal-200 mt-1">
                {inspectWarehouse.code} / [ZONE] / [AISLE] / [RACK] / [SHELF] / [BIN]
              </p>
              <p className="text-textMuted mt-1">
                Example: <code className="bg-white dark:bg-charcoal-800 px-1 py-0.5 rounded font-mono">{inspectWarehouse.code}/Z-A/A01/R02/S01/BIN-03</code>
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2">
                Configured Storage Zones
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Zone A: General Ambient Storage</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <p className="text-[11px] text-textMuted mt-1">Aisles A01 - A06 • Heavy pallet racks &amp; shelving</p>
                </div>
                <div className="p-3 bg-white dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Zone B: High-Density Staging</span>
                    <Badge variant="sage" size="sm">Bulk Area</Badge>
                  </div>
                  <p className="text-[11px] text-textMuted mt-1">Inbound receiving docks &amp; carton buffer staging</p>
                </div>
                <div className="p-3 bg-white dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Zone C: Quality Inspection &amp; Quarantine</span>
                    <Badge variant="warning" size="sm">QC Lock</Badge>
                  </div>
                  <p className="text-[11px] text-textMuted mt-1">Pending GRN inspection &amp; damage claims</p>
                </div>
                <div className="p-3 bg-white dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Zone D: High-Value Secure Enclosure</span>
                    <Badge variant="terracotta" size="sm">CCTV Monitored</Badge>
                  </div>
                  <p className="text-[11px] text-textMuted mt-1">Controlled PLCs, inverters &amp; specialized electronics</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Warehouse Location"
        subtitle="Configure a new Indian distribution hub or fulfillment center"
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
              label="Warehouse Code"
              placeholder="e.g. WH-PUN-04"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Warehouse Facility Name"
              placeholder="e.g. Pune Chakan Logistics Center"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Warehouse Type"
              value={formData.warehouse_type}
              onChange={e => setFormData({ ...formData, warehouse_type: e.target.value })}
              options={[
                { value: 'fulfillment_center', label: 'Central Fulfillment Center' },
                { value: 'distribution_hub', label: 'Regional Distribution Hub' },
                { value: 'bonded', label: 'Bonded / Customs Warehouse' },
                { value: 'cold_storage', label: 'Temperature-Controlled / Cold Chain' },
                { value: 'retail_backroom', label: 'Retail Backroom / Micro-Hub' },
              ]}
            />
            <Input
              label="Total Capacity (Sq. Ft.)"
              type="number"
              value={formData.total_capacity_sqft}
              onChange={e => setFormData({ ...formData, total_capacity_sqft: e.target.value })}
              required
            />
          </div>

          <Input
            label="Street Address / Industrial Plot"
            placeholder="Plot 14, MIDC Chakan Phase II"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Select
              label="State / UT"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              options={[
                { value: 'Maharashtra', label: 'Maharashtra' },
                { value: 'Haryana', label: 'Haryana' },
                { value: 'Karnataka', label: 'Karnataka' },
                { value: 'Delhi', label: 'Delhi' },
                { value: 'Gujarat', label: 'Gujarat' },
                { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                { value: 'Telangana', label: 'Telangana' },
              ]}
            />
            <Input
              label="PIN Code"
              placeholder="410501"
              value={formData.pin_code}
              onChange={e => setFormData({ ...formData, pin_code: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Warehouse Manager / Contact Person"
              placeholder="e.g. Ramesh Deshmukh"
              value={formData.contact_person}
              onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98220 12345"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

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
              Create Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
