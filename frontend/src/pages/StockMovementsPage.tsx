import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { api } from '../services/api';
import { StockMovement, Warehouse } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatINR, formatDateTime } from '../utils/formatters';

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const [movData, whData] = await Promise.all([
        api.getStockMovements({
          warehouse: selectedWarehouse ? parseInt(selectedWarehouse) : undefined,
          movement_type: movementType || undefined,
        }),
        api.getWarehouses(),
      ]);
      setMovements(movData);
      setWarehouses(whData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedWarehouse, movementType]);

  const getBadgeVariant = (mType: string) => {
    if (mType.includes('receipt') || mType.includes('transfer_in') || mType.includes('opening')) return 'success';
    if (mType.includes('dispatch') || mType.includes('transfer_out')) return 'terracotta';
    if (mType.includes('damage') || mType.includes('quarantine')) return 'danger';
    if (mType.includes('adjustment')) return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Immutable Stock Movement Ledger
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Traceable physical inventory audit log. Every transaction maintains strict before-and-after balances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMovements}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Ledger
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            value={movementType}
            onChange={e => setMovementType(e.target.value)}
          >
            <option value="">All Movement Types</option>
            <option value="purchase_receipt">Purchase Receipt (GRN)</option>
            <option value="sales_dispatch">Sales Dispatch (Challan)</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="stock_adjustment">Audit Stock Adjustment</option>
            <option value="opening_balance">Opening Balance</option>
          </Select>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Movement ID &amp; Ref</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Delta Qty</th>
                <th className="py-3 px-4 text-right">Prev Bal</th>
                <th className="py-3 px-4 text-right">New Bal</th>
                <th className="py-3 px-4">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    Reading immutable ledger records...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    No movement records match the active filters.
                  </td>
                </tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4 text-textMuted whitespace-nowrap">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                        {m.movement_id}
                      </span>
                      {m.reference_document && (
                        <p className="font-mono text-[10px] text-textMuted">Doc: {m.reference_document}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-forest dark:text-accent">{m.product_sku}</span>
                      <p className="text-[11px] text-textMuted truncate max-w-xs">{m.product_name}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {m.warehouse_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getBadgeVariant(m.movement_type)} size="sm">
                        {m.movement_type_display}
                      </Badge>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${m.quantity > 0 ? 'text-forest dark:text-accent' : 'text-alert'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-textMuted">
                      {m.previous_balance}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {m.resulting_balance}
                    </td>
                    <td className="py-3 px-4 text-textMuted max-w-xs truncate" title={m.reason}>
                      {m.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
