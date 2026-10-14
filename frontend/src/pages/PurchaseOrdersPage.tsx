import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Filter, RefreshCw, FileDown, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import { api } from '../services/api';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate } from '../utils/formatters';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create PO Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState<Array<{ product: number; quantity: number; cost: number; gst: number }>>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [pos, sups, whs, prods] = await Promise.all([
        api.getPurchaseOrders({ status: statusFilter || undefined }),
        api.getSuppliers(),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setOrders(pos);
      setSuppliers(sups);
      setWarehouses(whs);
      setProducts(prods);

      if (sups.length > 0 && !selectedSupplier) setSelectedSupplier(sups[0].id.toString());
      if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id.toString());
      if (prods.length > 0 && lineItems.length === 0) {
        setLineItems([{ product: prods[0].id, quantity: 20, cost: parseFloat(prods[0].cost_price.toString()), gst: parseFloat(prods[0].gst_rate.toString()) }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleAddLineItem = () => {
    if (products.length > 0) {
      const firstProd = products[0];
      setLineItems(prev => [
        ...prev,
        {
          product: firstProd.id,
          quantity: 10,
          cost: parseFloat(firstProd.cost_price.toString()),
          gst: parseFloat(firstProd.gst_rate.toString()),
        },
      ]);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setLineItems(prev => {
      const copy = [...prev];
      copy[index] = {
        product: prodId,
        quantity: copy[index].quantity || 10,
        cost: parseFloat(prod.cost_price.toString()),
        gst: parseFloat(prod.gst_rate.toString()),
      };
      return copy;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      setFormError('Please add at least one product line item.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createPurchaseOrder({
        supplier: parseInt(selectedSupplier),
        destination_warehouse: parseInt(selectedWarehouse),
        order_date: orderDate,
        expected_delivery_date: expectedDate,
        notes,
        items: lineItems.map(item => ({
          product: item.product,
          quantity_ordered: item.quantity,
          unit_cost: item.cost,
          gst_rate: item.gst,
        })),
      });
      setCreateModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: 'submit' | 'approve' | 'send', id: number) => {
    try {
      if (action === 'submit') await api.submitPO(id);
      if (action === 'approve') await api.approvePO(id);
      if (action === 'send') await api.sendPO(id);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string, display?: string) => {
    switch (status) {
      case 'received':
        return <Badge variant="success">{display || 'Received'}</Badge>;
      case 'partially_received':
        return <Badge variant="warning">{display || 'Partially Received'}</Badge>;
      case 'approved':
      case 'sent':
        return <Badge variant="sage">{display || 'Approved'}</Badge>;
      case 'pending_approval':
        return <Badge variant="terracotta">{display || 'Pending Approval'}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{display || 'Cancelled'}</Badge>;
      default:
        return <Badge variant="neutral">{display || 'Draft'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Purchase Orders &amp; Procurement
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Full procurement lifecycle: Supplier PO drafting, approval workflows, goods receipt verification, and GST billing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
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
            Create Purchase Order
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
            <option value="">All PO Statuses</option>
            <option value="draft">Draft Only</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent to Supplier</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Fully Received</option>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Destination Warehouse</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-right">Total Amount (INR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    Loading procurement orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    No purchase orders found matching active filter.
                  </td>
                </tr>
              ) : (
                orders.map(po => (
                  <tr key={po.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                        {po.po_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal-900 dark:text-white">{po.supplier_name}</span>
                      <p className="text-[11px] text-textMuted">{po.payment_terms}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {po.warehouse_name}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(po.order_date)}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(po.expected_delivery_date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {formatINR(po.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(po.status, po.status_display)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === 'draft' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction('submit', po.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {po.status === 'pending_approval' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction('approve', po.id)}
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                        )}
                        {po.status === 'approved' && (
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => handleAction('send', po.id)}
                            icon={<Send className="w-3.5 h-3.5" />}
                          >
                            Send
                          </Button>
                        )}
                        {/* Download PDF PO button */}
                        <a
                          href={api.downloadPO_PDF_URL(po.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-charcoal-200 hover:border-forest text-textMuted hover:text-forest transition-colors"
                          title="Download Official PO PDF"
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

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Purchase Order"
        subtitle="Specify vendor, destination warehouse, line items, and GST configuration"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select
              label="Supplier / Vendor"
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              required
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>

            <Select
              label="Destination Warehouse"
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

            <Input
              label="PO Date"
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              required
            />

            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDate}
              onChange={e => setExpectedDate(e.target.value)}
              required
            />
          </div>

          {/* Line items section */}
          <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 dark:text-charcoal-200">
                Purchase Order Line Items
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Item Line
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-2.5 bg-charcoal-50 dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700 items-center text-xs">
                  <div className="col-span-5">
                    <label className="text-[10px] text-textMuted block mb-0.5">Product SKU</label>
                    <select
                      value={item.product}
                      onChange={e => handleProductSelect(index, parseInt(e.target.value))}
                      className="w-full rounded-md border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 py-1.5 px-2 text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted block mb-0.5">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setLineItems(prev => {
                          const copy = [...prev];
                          copy[index].quantity = val;
                          return copy;
                        });
                      }}
                      className="w-full rounded-md border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 py-1.5 px-2 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted block mb-0.5">Unit Cost (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.cost}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setLineItems(prev => {
                          const copy = [...prev];
                          copy[index].cost = val;
                          return copy;
                        });
                      }}
                      className="w-full rounded-md border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 py-1.5 px-2 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted block mb-0.5">GST Rate %</label>
                    <select
                      value={item.gst}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setLineItems(prev => {
                          const copy = [...prev];
                          copy[index].gst = val;
                          return copy;
                        });
                      }}
                      className="w-full rounded-md border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 py-1.5 px-2 text-xs"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="text-alert hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Internal Notes / Payment Terms Reference"
            placeholder="e.g. Net 30 Days after inspection. Deliver to Bay 2 Mankoli Hub."
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
              Generate Draft Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
