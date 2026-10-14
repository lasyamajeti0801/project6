import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Table,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface ReportMeta {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('current_stock');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Data
  const [columns, setColumns] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadReportList();
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      loadReportData(selectedReportId);
    }
  }, [selectedReportId]);

  const loadReportList = async () => {
    try {
      setLoadingList(true);
      const list = await api.getReportList();
      setReports(list);
      if (list.length > 0 && !selectedReportId) {
        setSelectedReportId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load report directory', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadReportData = async (reportId: string) => {
    try {
      setLoadingData(true);
      const res = await api.getReportData(reportId);
      setColumns(res.columns || []);
      setDataRows(res.data || []);
    } catch (err) {
      console.error('Failed to load report data', err);
      setColumns([]);
      setDataRows([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedReportId) return;
    const url = api.downloadReportCSV_URL(selectedReportId);
    window.open(url, '_blank');
  };

  const categories = ['ALL', 'Inventory', 'Financials', 'Procurement', 'Sales', 'Fulfillment', 'Auditing', 'Intelligence', 'Security'];

  const filteredReports = reports.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeReportMeta = reports.find((r) => r.id === selectedReportId);

  // Filtered rows for active report table
  const filteredRows = dataRows.filter((row) => {
    if (!filterQuery) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-800" />
            Enterprise Reports & Analytics
          </h1>
          <p className="text-sm text-secondary mt-1">
            Real-time compliance, ledger, procurement, stock valuation, and operational audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => loadReportData(selectedReportId)}
            disabled={loadingData}
            className="flex items-center gap-2 border-forest-200 text-charcoal hover:bg-forest-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>

          <Button
            variant="primary"
            onClick={handleDownloadCSV}
            disabled={loadingData || dataRows.length === 0}
            className="flex items-center gap-2 bg-forest-800 hover:bg-forest-900 text-white shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Selector (1/3) & Right Data Table (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Report Directory Pane */}
        <Card className="p-4 border-forest-100 bg-white lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal">Report Catalog (16)</span>
            <Badge variant="neutral">{filteredReports.length} available</Badge>
          </div>

          {/* Search Directory */}
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white'
                    : 'bg-forest-50 text-secondary hover:bg-forest-100 hover:text-charcoal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Report Item List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="p-6 text-center text-xs text-secondary">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondary">No matching reports found</div>
            ) : (
              filteredReports.map((r) => {
                const isSelected = r.id === selectedReportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReportId(r.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50/40 bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-emerald-950 font-bold' : 'text-charcoal'
                          }`}
                        >
                          {r.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary truncate mt-0.5">{r.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-emerald-800 translate-x-0.5' : 'text-forest-300 group-hover:text-forest-600'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Report Output Viewer Pane */}
        <Card className="p-5 border-forest-100 bg-white lg:col-span-8 space-y-4">
          {activeReportMeta && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-charcoal">{activeReportMeta.name}</h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-forest-100 text-emerald-900 rounded">
                    {activeReportMeta.category}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1">{activeReportMeta.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Filter records..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-secondary px-1">
            <span>
              Showing <strong className="text-charcoal">{filteredRows.length}</strong> records of{' '}
              <strong className="text-charcoal">{dataRows.length}</strong>
            </span>
            <span>Real-time snapshot generated via Indian Business Ledger</span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-forest-100 rounded-lg">
            {loadingData ? (
              <div className="p-12 text-center text-sm text-secondary">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                Aggregating ledger data...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-12 text-center text-sm text-secondary">
                No records found matching current criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-forest-50/70 text-secondary uppercase tracking-wider border-b border-forest-100">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-100">
                  {filteredRows.slice(0, 50).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-forest-50/30 transition-colors">
                      {columns.map((col, colIdx) => {
                        const cellVal = row[col];
                        const isNumber = typeof cellVal === 'number';
                        return (
                          <td
                            key={colIdx}
                            className={`py-2 px-3 whitespace-nowrap text-charcoal ${
                              isNumber ? 'font-mono' : ''
                            }`}
                          >
                            {cellVal !== null && cellVal !== undefined ? String(cellVal) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredRows.length > 50 && (
            <p className="text-center text-[11px] text-secondary">
              Showing first 50 rows on screen. Use <strong>Export to CSV</strong> for the full dataset.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
