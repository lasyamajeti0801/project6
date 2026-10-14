import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, RefreshCw, FileDown, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { api } from '../services/api';
import { SalesOrder, Customer, Warehouse, Product } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate } from '../utils/formatters';

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create SO Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchDate, setDispatchDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState<Array<{ product: number; quantity: number; price: number; gst: number }>>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [sos, custs, whs, prods] = await Promise.all([
        api.getSalesOrders({ status: statusFilter || undefined }),
        api.getCustomers(),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setOrders(sos);
      setCustomers(custs);
      setWarehouses(whs);
      setProducts(prods);

      if (custs.length > 0 && !selectedCustomer) setSelectedCustomer(custs[0].id.toString());
      if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id.toString());
      if (prods.length > 0 && lineItems.length === 0) {
        setLineItems([{ product: prods[0].id, quantity: 5, price: parseFloat(prods[0].selling_price.toString()), gst: parseFloat(prods[0].gst_rate.toString()) }]);
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
      const p = products[0];
      setLineItems(prev => [
        ...prev,
        { product: p.id, quantity: 5, price: parseFloat(p.selling_price.toString()), gst: parseFloat(p.gst_rate.toString()) }
      ]);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, prodId: number) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    setLineItems(prev => {
      const copy = [...prev];
      copy[index] = {
        product: prodId,
        quantity: copy[index].quantity || 5,
        price: parseFloat(p.selling_price.toString()),
        gst: parseFloat(p.gst_rate.toString()),
      };
      return copy;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      setFormError('Please add at least one line item.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createSalesOrder({
        customer: parseInt(selectedCustomer),
        source_warehouse: parseInt(selectedWarehouse),
        order_date: orderDate,
        expected_dispatch_date: dispatchDate,
        notes,
        items: lineItems.map(item => ({
          product: item.product,
          quantity_ordered: item.quantity,
          unit_price: item.price,
          gst_rate: item.gst,
        })),
      });
      setCreateModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create sales order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (id: number) => {
    try {
      await api.confirmSalesOrder(id);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Confirmation failed. Available stock was insufficient.');
    }
  };

  const handleCancelOrder = async (id: number) => {
    if (confirm('Are you sure you want to cancel this order and release stock reservations?')) {
      try {
        await api.cancelSalesOrder(id);
        fetchOrders();
      } catch (err: any) {
        alert(err.message || 'Cancel failed.');
      }
    }
  };

  const getStatusBadge = (status: string, display?: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">{display || 'Delivered'}</Badge>;
      case 'dispatched':
        return <Badge variant="sage">{display || 'Dispatched'}</Badge>;
      case 'reserved':
      case 'picking':
      case 'packed':
        return <Badge variant="warning">{display || 'Stock Reserved'}</Badge>;
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
            Customer Sales Orders &amp; Reservations
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Manage customer demands, trigger atomic stock reservations, and prevent inventory overselling.
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
            Create Sales Order
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
            <option value="">All Sales Order Statuses</option>
            <option value="draft">Draft Only</option>
            <option value="reserved">Stock Reserved</option>
            <option value="picking">Picking in Progress</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SO Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Fulfillment Hub</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Dispatch Target</th>
                <th className="py-3 px-4 text-right">Total Amount (INR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-textMuted">
                    No sales orders found matching filter.
                  </td>
                </tr>
              ) : (
                orders.map(so => (
                  <tr key={so.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-charcoal-900 dark:text-white">
                        {so.so_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal-900 dark:text-white">{so.customer_name}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {so.warehouse_name}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(so.order_date)}
                    </td>
                    <td className="py-3 px-4 text-textMuted">
                      {formatDate(so.expected_dispatch_date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {formatINR(so.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(so.status, so.status_display)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {so.status === 'draft' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirmOrder(so.id)}
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                          >
                            Reserve Stock
                          </Button>
                        )}
                        {['draft', 'reserved'].includes(so.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-alert hover:text-red-700"
                            onClick={() => handleCancelOrder(so.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <a
                          href={api.downloadSO_PDF_URL(so.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-charcoal-200 hover:border-forest text-textMuted hover:text-forest transition-colors"
                          title="Download Tax Invoice PDF"
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

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Customer Sales Order"
        subtitle="Verify inventory availability and lock reservation upon confirmation"
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
              label="Customer Account"
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              required
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </Select>

            <Select
              label="Source Warehouse Hub"
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
              label="Order Date"
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              required
            />

            <Input
              label="Expected Dispatch Date"
              type="date"
              value={dispatchDate}
              onChange={e => setDispatchDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 dark:text-charcoal-200">
                Order Items &amp; Quantities
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Line Item
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
                          {p.sku} - {p.name} (Avail: {p.available_stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-textMuted block mb-0.5">Quantity Ordered</label>
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
                    <label className="text-[10px] text-textMuted block mb-0.5">Selling Price (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setLineItems(prev => {
                          const copy = [...prev];
                          copy[index].price = val;
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
            label="Customer Notes &amp; Shipping Instructions"
            placeholder="e.g. Standard dispatch via local delivery van"
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
              Create Draft Sales Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
