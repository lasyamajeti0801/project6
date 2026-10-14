import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, Filter, RefreshCw, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { api } from '../services/api';
import { StockItem, Warehouse, Product } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate } from '../utils/formatters';

export const InventoryPage: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjProduct, setAdjProduct] = useState('');
  const [adjWarehouse, setAdjWarehouse] = useState('');
  const [adjDelta, setAdjDelta] = useState('0');
  const [adjReason, setAdjReason] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);
  const [adjError, setAdjError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [items, whs, prods] = await Promise.all([
        api.getStockItems({
          warehouse: selectedWarehouse ? parseInt(selectedWarehouse) : undefined,
          search: searchQuery || undefined,
        }),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setStockItems(items);
      setWarehouses(whs);
      setProducts(prods);
      if (whs.length > 0 && !adjWarehouse) {
        setAdjWarehouse(whs[0].id.toString());
      }
      if (prods.length > 0 && !adjProduct) {
        setAdjProduct(prods[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, searchQuery]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError(null);
    setSubmittingAdj(true);
    try {
      await api.adjustStock({
        product: parseInt(adjProduct),
        warehouse: parseInt(adjWarehouse),
        quantity_delta: parseInt(adjDelta),
        reason: adjReason,
      });
      setAdjustModalOpen(false);
      setAdjDelta('0');
      setAdjReason('');
      fetchData();
    } catch (err: any) {
      setAdjError(err.message || 'Failed to adjust stock.');
    } finally {
      setSubmittingAdj(false);
    }
  };

  const totalValue = stockItems.reduce((acc, it) => acc + parseFloat(it.total_value.toString()), 0);
  const totalUnits = stockItems.reduce((acc, it) => acc + it.quantity_on_hand, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Inventory Balances &amp; Locations
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Real-time on-hand, reserved, and quarantined inventory across all warehouse bins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAdjustModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft">
          <span className="text-[11px] font-bold text-textMuted uppercase">Total Filtered Value</span>
          <p className="text-xl font-extrabold text-forest dark:text-accent mt-1">{formatINR(totalValue)}</p>
        </div>
        <div className="p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft">
          <span className="text-[11px] font-bold text-textMuted uppercase">Total Physical Units</span>
          <p className="text-xl font-extrabold text-charcoal-900 dark:text-white mt-1">{totalUnits} Units</p>
        </div>
        <div className="p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft">
          <span className="text-[11px] font-bold text-textMuted uppercase">Stocked SKU Records</span>
          <p className="text-xl font-extrabold text-charcoal-900 dark:text-white mt-1">{stockItems.length} Records</p>
        </div>
        <div className="p-4 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft">
          <span className="text-[11px] font-bold text-textMuted uppercase">Costing Methodology</span>
          <p className="text-sm font-bold text-charcoal-900 dark:text-white mt-1.5">Weighted Average Cost</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-72">
            <Select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
            >
              <option value="">All Connected Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search by SKU, Product Name, Bin Location, or Batch Number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              prefixIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Stock Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Product</th>
                <th className="py-3 px-4">Warehouse &amp; Bin</th>
                <th className="py-3 px-4">Batch / Expiry</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Reserved</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    Loading inventory records...
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                stockItems.map(item => (
                  <tr key={item.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                        {item.product_details?.sku}
                      </span>
                      <p className="text-[11px] text-textMuted truncate max-w-xs">{item.product_details?.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-charcoal-900 dark:text-white">{item.warehouse_name}</span>
                      <p className="font-mono text-[10px] text-forest dark:text-accent font-semibold">{item.bin_location || 'General Storage'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-textMuted">{item.batch_number || 'Standard'}</span>
                      {item.expiry_date && (
                        <p className="text-[10px] text-amber-warm">Exp: {formatDate(item.expiry_date)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {item.quantity_on_hand} {item.product_details?.unit_of_measure}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-warm">
                      {item.quantity_reserved}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-forest dark:text-accent">
                      {item.quantity_available}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-textMuted">
                      {formatINR(item.unit_cost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {formatINR(item.total_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          item.quantity_available <= 0
                            ? 'danger'
                            : item.quantity_available <= (item.product_details?.reorder_level || 20)
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {item.quantity_available <= 0
                          ? 'Out of Stock'
                          : item.quantity_available <= (item.product_details?.reorder_level || 20)
                          ? 'Low Stock'
                          : 'In Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Record Stock Adjustment"
        subtitle="Creates an auditable StockMovement transaction and updates on-hand balance"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {adjError && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {adjError}
            </div>
          )}

          <Select
            label="Target Product"
            value={adjProduct}
            onChange={e => setAdjProduct(e.target.value)}
            required
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </Select>

          <Select
            label="Warehouse Location"
            value={adjWarehouse}
            onChange={e => setAdjWarehouse(e.target.value)}
            required
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Input
            label="Quantity Adjustment (+ for additions, - for deductions)"
            type="number"
            value={adjDelta}
            onChange={e => setAdjDelta(e.target.value)}
            helperText="e.g. +10 for found stock, -5 for damaged write-off"
            required
          />

          <Input
            label="Mandatory Audit Justification Reason"
            placeholder="e.g. Verified during physical audit count discrepancy"
            value={adjReason}
            onChange={e => setAdjReason(e.target.value)}
            required
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submittingAdj}
            >
              Post Adjustment to Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
