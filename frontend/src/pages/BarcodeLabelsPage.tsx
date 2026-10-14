import React, { useState, useEffect } from 'react';
import { QrCode, Barcode, Printer, Search, Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatINR } from '../utils/formatters';

export const BarcodeLabelsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [labelCount, setLabelCount] = useState('12');
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // Scanner & Lookup
  const [scanInput, setScanInput] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts().then(prods => {
      setProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0].id.toString());
    });
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === parseInt(selectedProduct));
    if (!prod) return;

    // Fetch local generated barcodes
    api.generateBarcode(prod.sku, 'code128').then(res => setBarcodePreview(res.data_url)).catch(() => {});
    api.generateBarcode(prod.sku, 'qr').then(res => setQrPreview(res.data_url)).catch(() => {});
  }, [selectedProduct, products]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await api.lookupBarcode(scanInput.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err.message || 'No matching product, bin location, or order found.');
    } finally {
      setLookupLoading(false);
    }
  };

  const currentProd = products.find(p => p.id === parseInt(selectedProduct));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
            Barcode Generation &amp; Warehouse Scanner
          </h1>
          <p className="text-xs text-textMuted dark:text-charcoal-200 mt-0.5">
            Local Code 128 &amp; QR label generator, printable A4 sticker sheets, and scanner lookup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Barcode & Label Sheet Generator */}
        <Card
          title="Printable Barcode &amp; Shelf Labels"
          subtitle="Generate high-density product stickers and warehouse bin tags"
        >
          <div className="space-y-4 pt-2">
            <Select
              label="Select Product SKU for Labels"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Number of Labels to Print"
                type="number"
                value={labelCount}
                onChange={e => setLabelCount(e.target.value)}
                helperText="Formatted for 3x8 A4 sticker sheet (max 48)"
              />
              <div className="pt-6">
                {currentProd && (
                  <a
                    href={api.printLabels_PDF_URL(currentProd.id, parseInt(labelCount) || 12)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-forest hover:bg-forest-light text-white font-bold rounded-lg shadow-soft text-sm transition-all"
                  >
                    <Printer className="w-4 h-4" /> Download PDF Label Sheet
                  </a>
                )}
              </div>
            </div>

            {/* Live Visual Label Preview */}
            {currentProd && (
              <div className="mt-4 p-5 bg-charcoal-50 dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted block mb-3">
                  Live Thermal Label Preview (50mm × 25mm)
                </span>

                <div className="max-w-sm mx-auto p-4 bg-white dark:bg-charcoal-900 border-2 border-charcoal-300 dark:border-charcoal-600 rounded-lg shadow-soft text-charcoal-900 dark:text-white space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-forest dark:text-accent uppercase tracking-tight">
                        Bharat DistroLogix
                      </p>
                      <p className="font-bold text-xs truncate max-w-[190px]">{currentProd.name}</p>
                      <p className="font-mono text-xs font-bold text-charcoal-800 dark:text-charcoal-200">
                        SKU: {currentProd.sku}
                      </p>
                      <p className="text-[11px] font-bold text-terracotta mt-1">
                        MRP: {formatINR(currentProd.selling_price)}
                      </p>
                    </div>
                    {qrPreview && (
                      <img src={qrPreview} alt="QR Code" className="w-14 h-14 border border-charcoal-200 rounded p-0.5" />
                    )}
                  </div>

                  {barcodePreview && (
                    <div className="pt-2 text-center border-t border-charcoal-100 dark:border-charcoal-800 flex justify-center">
                      <img src={barcodePreview} alt="Code 128" className="h-10 max-w-full" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Barcode Lookup & Wedge Scanner */}
        <Card
          title="Warehouse Barcode Lookup &amp; Scanner"
          subtitle="Point USB wedge scanner or type SKU / Bin barcode to inspect location and balance"
        >
          <div className="space-y-4 pt-2">
            <form onSubmit={handleLookup} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Scan or enter SKU (e.g. PLC-MOD-24V) or Bin (BIN-000001)..."
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  prefixIcon={<Barcode className="w-4 h-4" />}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  loading={lookupLoading}
                  icon={<Search className="w-4 h-4" />}
                >
                  Lookup
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-textMuted">
                <span>Quick demo codes:</span>
                <button
                  type="button"
                  onClick={() => { setScanInput('PLC-MOD-24V'); handleLookup(); }}
                  className="px-1.5 py-0.5 bg-charcoal-100 dark:bg-charcoal-800 font-mono rounded hover:text-forest"
                >
                  PLC-MOD-24V
                </button>
                <button
                  type="button"
                  onClick={() => { setScanInput('SOL-INV-5KW'); handleLookup(); }}
                  className="px-1.5 py-0.5 bg-charcoal-100 dark:bg-charcoal-800 font-mono rounded hover:text-forest"
                >
                  SOL-INV-5KW
                </button>
                <button
                  type="button"
                  onClick={() => { setScanInput('PO-2026-00041'); handleLookup(); }}
                  className="px-1.5 py-0.5 bg-charcoal-100 dark:bg-charcoal-800 font-mono rounded hover:text-forest"
                >
                  PO-2026-00041
                </button>
              </div>
            </form>

            {lookupError && (
              <div className="p-3.5 bg-alert-subtle border border-alert/30 rounded-xl flex items-start gap-2.5 text-xs text-alert font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Scanned Result Card */}
            {lookupResult && (
              <div className="p-4 bg-sage-50/70 dark:bg-charcoal-850 rounded-xl border border-sage-200 dark:border-charcoal-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-accent">
                    Matched Entity: {lookupResult.type?.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-forest text-white font-bold">
                    Found in System
                  </span>
                </div>

                {lookupResult.type === 'product' && (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-extrabold text-sm text-charcoal-900 dark:text-white">
                      {lookupResult.data.name}
                    </p>
                    <p className="font-mono text-textMuted">SKU: {lookupResult.data.sku} | HSN: {lookupResult.data.hsn_code}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-charcoal-200/60 dark:border-charcoal-700">
                      <div>
                        <span className="text-textMuted block text-[11px]">Available Stock</span>
                        <span className="font-mono font-extrabold text-forest dark:text-accent text-sm">
                          {lookupResult.data.available_stock} {lookupResult.data.unit_of_measure}
                        </span>
                      </div>
                      <div>
                        <span className="text-textMuted block text-[11px]">Selling Price</span>
                        <span className="font-mono font-bold text-charcoal-900 dark:text-white text-sm">
                          {formatINR(lookupResult.data.selling_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {lookupResult.type === 'purchase_order' && (
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm text-charcoal-900 dark:text-white">
                      PO #{lookupResult.data.po_number}
                    </p>
                    <p className="text-textMuted">Supplier: {lookupResult.data.supplier_name}</p>
                    <p className="text-textMuted">Status: {lookupResult.data.status_display}</p>
                    <p className="font-bold text-forest dark:text-accent text-sm mt-1">
                      Total: {formatINR(lookupResult.data.total_amount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
