import React, { useState, useEffect } from 'react';
import { Layers, Plus, RefreshCw, FolderTree, Package, Check } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createCategory({
        name: catName,
        code: catCode.toUpperCase(),
        description: catDesc,
      });
      setModalOpen(false);
      setCatName('');
      setCatCode('');
      setCatDesc('');
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Product Categories &amp; Hierarchies
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Organize products into logical industry verticals and parent-child taxonomy trees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
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
            New Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(c => (
          <Card key={c.id} padding="none">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-sage-100 dark:bg-charcoal-700/50 rounded-xl text-forest dark:text-accent">
                  <FolderTree className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 px-2 py-0.5 rounded font-bold">
                  {c.code}
                </span>
              </div>

              <h3 className="font-bold text-base text-charcoal-900 dark:text-white mt-4">
                {c.name}
              </h3>
              <p className="text-xs text-textMuted dark:text-charcoal-200 line-clamp-2 mt-1">
                {c.description || 'General commercial classification.'}
              </p>

              <div className="mt-4 pt-3 border-t border-charcoal-100 dark:border-charcoal-750 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-textMuted">
                  <Package className="w-4 h-4 text-forest dark:text-accent" />
                  {c.products_count} Active Products
                </span>
                <span className="text-[11px] text-forest dark:text-accent font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Product Category"
        subtitle="Define a new organizational vertical for inventory categorization"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-alert-subtle border border-alert/30 rounded-lg text-xs text-alert font-medium">
              {error}
            </div>
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Solar & Renewable Storage"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            required
          />

          <Input
            label="Category Code"
            placeholder="e.g. SOLAR-EN"
            value={catCode}
            onChange={e => setCatCode(e.target.value)}
            helperText="Short enterprise abbreviation"
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Solar inverters, MPPT charge controllers, lithium storage cells"
            value={catDesc}
            onChange={e => setCatDesc(e.target.value)}
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
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
