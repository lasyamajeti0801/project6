import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Barcode, Edit, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/formatters';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    unit_of_measure: 'PCS',
    hsn_code: '',
    gst_rate: '18.00',
    cost_price: '0.00',
    selling_price: '0.00',
    reorder_level: 20,
    preferred_reorder_quantity: 100,
    lead_time_days: 7,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({
          category: selectedCategory ? parseInt(selectedCategory) : undefined,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        }),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      description: '',
      category: categories[0]?.id.toString() || '',
      brand: '',
      unit_of_measure: 'PCS',
      hsn_code: '85371000',
      gst_rate: '18.00',
      cost_price: '500.00',
      selling_price: '850.00',
      reorder_level: 20,
      preferred_reorder_quantity: 100,
      lead_time_days: 7,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      category: p.category.toString(),
      brand: p.brand || '',
      unit_of_measure: p.unit_of_measure,
      hsn_code: p.hsn_code || '',
      gst_rate: p.gst_rate.toString(),
      cost_price: p.cost_price.toString(),
      selling_price: p.selling_price.toString(),
      reorder_level: p.reorder_level,
      preferred_reorder_quantity: p.preferred_reorder_quantity,
      lead_time_days: p.lead_time_days,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        category: parseInt(formData.category),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        reorder_level: Number(formData.reorder_level),
        preferred_reorder_quantity: Number(formData.preferred_reorder_quantity),
        lead_time_days: Number(formData.lead_time_days),
        gst_rate: parseFloat(formData.gst_rate),
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Product &amp; SKU Catalog
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Manage product master records, HSN codes, GST rates, UOM, and replenishment thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All Product Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Inventory Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </Select>

          <Input
            placeholder="Search SKU, Product Name, Brand, HSN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Product Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 dark:bg-charcoal-850 text-textMuted font-bold border-b border-charcoal-100 dark:border-charcoal-700/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Product Name &amp; Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">HSN &amp; GST</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Reorder Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 dark:divide-charcoal-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-textMuted">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-charcoal-50/50 dark:hover:bg-charcoal-750 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-forest dark:text-accent">
                        {p.sku}
                      </span>
                      <p className="text-[10px] text-textMuted font-mono flex items-center gap-1 mt-0.5">
                        <Barcode className="w-3 h-3 text-textMuted" /> {p.barcode_value || p.sku}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-charcoal-900 dark:text-white">
                        {p.name}
                      </span>
                      <p className="text-[11px] text-textMuted">{p.brand || 'Standard Manufacturer'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-charcoal-800 dark:text-charcoal-200">
                        {p.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-textMuted">
                      <span>{p.hsn_code || '—'}</span>
                      <p className="text-[10px] text-forest dark:text-accent font-semibold">{p.gst_rate}% GST</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-textMuted">
                      {formatINR(p.cost_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900 dark:text-white">
                      {formatINR(p.selling_price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-forest dark:text-accent">
                        {p.available_stock} {p.unit_of_measure}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-textMuted">
                      {p.reorder_level} (ROQ: {p.preferred_reorder_quantity})
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(p)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add Master Product'}
        subtitle="Configure Indian SKU parameters, GST rates, and replenishment rules"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              required
            />
            <Input
              label="Product Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              label="Brand / Manufacturer"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
            />

            <Select
              label="Unit of Measure (UOM)"
              value={formData.unit_of_measure}
              onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })}
              options={[
                { value: 'PCS', label: 'Pieces (Pcs)' },
                { value: 'BOX', label: 'Box / Carton' },
                { value: 'KG', label: 'Kilogram (Kg)' },
                { value: 'LTR', label: 'Litre (Ltr)' },
                { value: 'ROLL', label: 'Roll' },
                { value: 'PKT', label: 'Packet' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="HSN Code"
              value={formData.hsn_code}
              onChange={e => setFormData({ ...formData, hsn_code: e.target.value })}
            />
            <Select
              label="Applicable GST %"
              value={formData.gst_rate}
              onChange={e => setFormData({ ...formData, gst_rate: e.target.value })}
              options={[
                { value: '0.00', label: '0% (Exempt)' },
                { value: '5.00', label: '5% GST' },
                { value: '12.00', label: '12% GST' },
                { value: '18.00', label: '18% GST' },
                { value: '28.00', label: '28% GST' },
              ]}
            />
            <Input
              label="Cost Price (INR)"
              type="number"
              step="0.01"
              value={formData.cost_price}
              onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
              required
            />
            <Input
              label="Selling Price (INR)"
              type="number"
              step="0.01"
              value={formData.selling_price}
              onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Reorder Level (ROP)"
              type="number"
              value={formData.reorder_level}
              onChange={e => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
              helperText="Trigger when stock drops to this"
              required
            />
            <Input
              label="Preferred Reorder Qty"
              type="number"
              value={formData.preferred_reorder_quantity}
              onChange={e => setFormData({ ...formData, preferred_reorder_quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Lead Time (Days)"
              type="number"
              value={formData.lead_time_days}
              onChange={e => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
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
              {editingProduct ? 'Save Product Changes' : 'Create Master Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
