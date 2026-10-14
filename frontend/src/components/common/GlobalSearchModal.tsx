import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, ShoppingCart, Truck, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Modal } from './Modal';
import { formatINR } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ products: any[]; pos: any[]; warehouses: any[] }>({
    products: [],
    pos: [],
    warehouses: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], pos: [], warehouses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prods, pos, whs] = await Promise.all([
          api.getProducts({ search: query }),
          api.getPurchaseOrders(),
          api.getWarehouses(),
        ]);

        const filteredPos = (pos as any[]).filter(
          p => p.po_number?.toLowerCase().includes(query.toLowerCase()) || p.supplier_name?.toLowerCase().includes(query.toLowerCase())
        );

        const filteredWhs = (whs as any[]).filter(
          w => w.name?.toLowerCase().includes(query.toLowerCase()) || w.code?.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          products: prods.slice(0, 5),
          pos: filteredPos.slice(0, 3),
          warehouses: filteredWhs.slice(0, 3),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Warehouse Search" maxWidth="xl">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-textMuted" />
          <input
            autoFocus
            type="text"
            placeholder="Search by SKU, Product Name, PO #, Warehouse, Bin..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm focus:border-forest dark:focus:border-accent focus:ring-1 focus:ring-forest text-charcoal-900 dark:text-white"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-3.5 text-forest" />}
        </div>

        {query.trim() && !loading && results.products.length === 0 && results.pos.length === 0 && results.warehouses.length === 0 && (
          <div className="py-8 text-center text-sm text-textMuted dark:text-charcoal-200">
            No matching items, orders, or locations found for "{query}".
          </div>
        )}

        {/* Results groups */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.products.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted dark:text-charcoal-200">
                Products &amp; SKUs ({results.products.length})
              </span>
              <div className="mt-1.5 space-y-1">
                {results.products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect('/products')}
                    className="p-2.5 rounded-lg border border-charcoal-100 dark:border-charcoal-700/60 hover:bg-emerald-subtle/50 dark:hover:bg-charcoal-700/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sage-100 dark:bg-charcoal-800 rounded-lg text-forest dark:text-accent">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-charcoal-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-textMuted">
                          SKU: <span className="font-mono">{p.sku}</span> | Available: {p.available_stock} {p.unit_of_measure}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-forest dark:text-accent">
                        {formatINR(p.selling_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.pos.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted dark:text-charcoal-200">
                Purchase Orders ({results.pos.length})
              </span>
              <div className="mt-1.5 space-y-1">
                {results.pos.map(po => (
                  <div
                    key={po.id}
                    onClick={() => handleSelect('/purchase-orders')}
                    className="p-2.5 rounded-lg border border-charcoal-100 dark:border-charcoal-700/60 hover:bg-emerald-subtle/50 dark:hover:bg-charcoal-700/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-subtle rounded-lg text-amber-warm">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-charcoal-900 dark:text-white">
                          {po.po_number}
                        </p>
                        <p className="text-[11px] text-textMuted">
                          Vendor: {po.supplier_name} | Status: {po.status_display}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-textMuted" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.warehouses.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted dark:text-charcoal-200">
                Warehouses &amp; Hubs ({results.warehouses.length})
              </span>
              <div className="mt-1.5 space-y-1">
                {results.warehouses.map(w => (
                  <div
                    key={w.id}
                    onClick={() => handleSelect('/warehouses')}
                    className="p-2.5 rounded-lg border border-charcoal-100 dark:border-charcoal-700/60 hover:bg-emerald-subtle/50 dark:hover:bg-charcoal-700/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sage-100 rounded-lg text-forest">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-charcoal-900 dark:text-white">
                          {w.name} ({w.code})
                        </p>
                        <p className="text-[11px] text-textMuted">
                          {w.city}, {w.state} - {w.pin_code}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-textMuted" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
