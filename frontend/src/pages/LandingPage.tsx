import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Zap,
  TrendingUp,
  ShieldCheck,
  Warehouse as WarehouseIcon,
  Truck,
  ArrowRight,
  CheckCircle2,
  QrCode,
  FileText,
  ChevronDown,
  Layers,
  Activity,
  BarChart3,
  Moon,
  Sun,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/formatters';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inventory' | 'forecasting' | 'dispatch'>('inventory');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Animated metric counter simulation
  const [liveOrders, setLiveOrders] = useState(148);
  const [liveAccuracy, setLiveAccuracy] = useState(99.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveOrders(prev => prev + Math.floor(Math.random() * 2));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const faqs = [
    {
      q: "How does StockPilot differ from generic accounting or admin templates?",
      a: "StockPilot is purpose-built for Indian distribution hubs, manufacturers, and multi-warehouse operations. It features an immutable double-entry style stock ledger, genuine multi-tier warehouse location encoding (Zone/Aisle/Rack/Shelf/Bin), GST and HSN compliance, and a local Python-powered demand forecasting engine that prevents overselling and optimizes working capital."
    },
    {
      q: "Does the Demand Forecasting engine rely on external cloud AI APIs?",
      a: "No. StockPilot runs a 100% local forecasting engine built with Python, Pandas, and NumPy. It computes exponential smoothing, moving averages, and backtested error metrics (MAE and WAPE) entirely inside your own infrastructure—keeping your proprietary sales velocities secure and private."
    },
    {
      q: "Can StockPilot prevent unauthorized overselling during sales spikes?",
      a: "Yes. StockPilot enforces strict atomic database locks during Sales Order confirmation. Available stock is calculated dynamically (On Hand minus Reserved minus Quarantined). If a customer order exceeds available units, the transaction is rejected to prevent stockouts unless an authorized backorder policy is invoked."
    },
    {
      q: "How does the physical stock audit and reconciliation process work?",
      a: "Supervisors can launch blind stocktake sessions where system balances are masked from auditors. Once physical counts are entered, the system calculates variances and unit values. Approved variances automatically generate auditable stock adjustment ledger records."
    },
    {
      q: "Are Indian tax fields like GSTIN, PAN, and HSN supported on dispatch challans?",
      a: "Yes. All procurement orders, tax invoices, and Rule 55 Delivery Challans generate formatted local PDFs displaying state codes, GST rates (5%, 12%, 18%, 28%), HSN codes, vehicle numbers, and transporter references."
    }
  ];

  return (
    <div className="min-h-screen bg-ivory text-charcoal-900 dark:bg-charcoal-950 dark:text-white transition-colors overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-200/80 dark:border-charcoal-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-white shadow-soft">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-charcoal-900 dark:text-white">
                Stock<span className="text-forest dark:text-accent">Pilot</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-textMuted bg-sage-100 dark:bg-charcoal-800 px-2 py-0.5 rounded-full text-forest dark:text-accent">
                India Enterprise
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-charcoal-700 dark:text-charcoal-200">
            <a href="#capabilities" className="hover:text-forest dark:hover:text-accent transition-colors">Capabilities</a>
            <a href="#workflows" className="hover:text-forest dark:hover:text-accent transition-colors">Workflows</a>
            <a href="#forecasting" className="hover:text-forest dark:hover:text-accent transition-colors">Forecasting</a>
            <a href="#faq" className="hover:text-forest dark:hover:text-accent transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
              title="Toggle Appearance Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-accent" /> : theme === 'sage' ? <Leaf className="w-4 h-4 text-forest" /> : <Sun className="w-4 h-4 text-amber" />}
            </button>
            <Link
              to="/signin"
              className="px-4 py-2 text-sm font-semibold text-charcoal-800 dark:text-charcoal-100 hover:text-forest transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-forest hover:bg-forest-light rounded-lg shadow-soft transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Subtle background ambient gradients - strictly NO BLUE */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-subtle/50 dark:bg-emerald/5 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-subtle/40 dark:bg-amber/5 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100 dark:bg-charcoal-800/80 border border-sage-200/80 dark:border-charcoal-700 text-xs font-semibold text-forest dark:text-accent mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Empowering Indian Distributors, Wholesalers &amp; Manufacturers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal-900 dark:text-white max-w-4xl mx-auto leading-tight"
          >
            Take Control of Every <span className="text-forest dark:text-accent">Stock Movement</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-textMuted dark:text-charcoal-200 max-w-2xl mx-auto leading-relaxed"
          >
            “Every Item Accounted For. Every Warehouse Connected.”
            Intelligent inventory ledger, automated procurement, dispatch tracking, and empirical demand forecasting designed specifically for Indian business operations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="px-6 py-3.5 bg-forest hover:bg-forest-light text-white font-bold rounded-xl shadow-card transition-all active:scale-95 flex items-center gap-2 group text-base"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signin"
              className="px-6 py-3.5 bg-white dark:bg-charcoal-800 hover:bg-charcoal-50 dark:hover:bg-charcoal-750 text-charcoal-900 dark:text-white font-bold rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft transition-all text-base"
            >
              Explore Live Demo
            </Link>
          </motion.div>

          {/* Interactive Live Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto bg-white dark:bg-charcoal-900 rounded-2xl shadow-elevated border border-charcoal-200/90 dark:border-charcoal-800 overflow-hidden text-left"
          >
            {/* Window bar */}
            <div className="px-4 py-3 bg-charcoal-50 dark:bg-charcoal-850 border-b border-charcoal-200/70 dark:border-charcoal-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-textMuted">
                  stockpilot.app/dashboard • Bharat DistroLogix Pvt Ltd
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-forest/10 dark:bg-accent/20 text-forest dark:text-accent font-semibold">
                  WH-BHW-01 (Bhiwandi Central)
                </span>
              </div>
            </div>

            {/* Dashboard interactive body */}
            <div className="p-6 space-y-6">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-charcoal-100 dark:border-charcoal-800 pb-3">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'inventory'
                      ? 'bg-forest text-white'
                      : 'text-textMuted hover:text-charcoal-900 dark:hover:text-white'
                  }`}
                >
                  Live Inventory &amp; Stock Ledger
                </button>
                <button
                  onClick={() => setActiveTab('forecasting')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'forecasting'
                      ? 'bg-forest text-white'
                      : 'text-textMuted hover:text-charcoal-900 dark:hover:text-white'
                  }`}
                >
                  AI Demand Forecasting (MAE: 1.4)
                </button>
                <button
                  onClick={() => setActiveTab('dispatch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'dispatch'
                      ? 'bg-forest text-white'
                      : 'text-textMuted hover:text-charcoal-900 dark:hover:text-white'
                  }`}
                >
                  Indian Dispatch &amp; Delivery Challans
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-sage-50/60 dark:bg-charcoal-800 rounded-xl border border-sage-200/60 dark:border-charcoal-700">
                      <span className="text-[11px] font-semibold text-textMuted uppercase">Stock Valuation</span>
                      <p className="text-xl font-extrabold text-forest dark:text-accent mt-0.5">{formatINR(3480500)}</p>
                      <span className="text-[10px] text-forest dark:text-accent font-medium">+14.2% vs last month</span>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                      <span className="text-[11px] font-semibold text-textMuted uppercase">Available Units</span>
                      <p className="text-xl font-extrabold text-charcoal-900 dark:text-white mt-0.5">1,420 Pcs</p>
                      <span className="text-[10px] text-textMuted">Across 3 Hubs</span>
                    </div>
                    <div className="p-3.5 bg-amber-subtle/50 dark:bg-charcoal-800 rounded-xl border border-amber/20 dark:border-charcoal-700">
                      <span className="text-[11px] font-semibold text-amber-warm uppercase">Low Stock Alerts</span>
                      <p className="text-xl font-extrabold text-amber-warm mt-0.5">2 Items</p>
                      <span className="text-[10px] text-amber-warm font-medium">Auto Replenish Active</span>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700">
                      <span className="text-[11px] font-semibold text-textMuted uppercase">Active Warehouses</span>
                      <p className="text-xl font-extrabold text-charcoal-900 dark:text-white mt-0.5">3 Locations</p>
                      <span className="text-[10px] text-textMuted">Mumbai, NCR, BLR</span>
                    </div>
                  </div>

                  {/* Stock Ledger Sample View */}
                  <div className="border border-charcoal-200 dark:border-charcoal-800 rounded-xl overflow-hidden">
                    <div className="px-3.5 py-2 bg-charcoal-50 dark:bg-charcoal-850 text-xs font-bold text-textMuted border-b border-charcoal-200 dark:border-charcoal-800 flex justify-between">
                      <span>SKU / Product</span>
                      <span>Location</span>
                      <span>On Hand</span>
                      <span>Reserved</span>
                      <span>Status</span>
                    </div>
                    <div className="divide-y divide-charcoal-100 dark:divide-charcoal-800 text-xs">
                      <div className="px-3.5 py-2.5 flex items-center justify-between hover:bg-charcoal-50/50">
                        <div>
                          <span className="font-mono font-bold text-forest dark:text-accent">PLC-MOD-24V</span>
                          <p className="text-textMuted text-[11px]">Omron Compatible Modular PLC 24VDC</p>
                        </div>
                        <span className="font-mono text-[11px] bg-charcoal-100 dark:bg-charcoal-800 px-2 py-0.5 rounded">
                          WH-BHW-01/Z-A/A01/BIN-01
                        </span>
                        <span className="font-bold">85 PCS</span>
                        <span className="text-amber-warm font-semibold">12 PCS</span>
                        <span className="px-2 py-0.5 bg-emerald-subtle text-forest dark:bg-emerald/20 dark:text-accent text-[10px] font-bold rounded-full">IN STOCK</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex items-center justify-between hover:bg-charcoal-50/50">
                        <div>
                          <span className="font-mono font-bold text-forest dark:text-accent">SOL-INV-5KW</span>
                          <p className="text-textMuted text-[11px]">Hybrid Solar Inverter 5kVA Pure Sine Wave</p>
                        </div>
                        <span className="font-mono text-[11px] bg-charcoal-100 dark:bg-charcoal-800 px-2 py-0.5 rounded">
                          WH-BHW-01/Z-B/A02/BIN-03
                        </span>
                        <span className="font-bold">18 PCS</span>
                        <span className="text-amber-warm font-semibold">5 PCS</span>
                        <span className="px-2 py-0.5 bg-amber-subtle text-amber-warm text-[10px] font-bold rounded-full">LOW STOCK</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'forecasting' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sage-50/60 dark:bg-charcoal-800 rounded-xl border border-sage-200/80 dark:border-charcoal-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-forest dark:text-accent uppercase">
                          Empirical Forecasting Model
                        </span>
                        <p className="text-sm font-semibold text-charcoal-900 dark:text-white mt-0.5">
                          Exponential Smoothing (Holt-Winters) • Backtested WAPE: 4.8%
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-forest text-white rounded-lg text-xs font-bold shadow-soft">
                        95% Service Level
                      </span>
                    </div>
                    <p className="text-xs text-textMuted dark:text-charcoal-200 mt-2">
                      Historical 90-day demand velocity computed with lead time safety stock: <code className="font-mono bg-white dark:bg-charcoal-900 px-1.5 py-0.5 rounded">Safety Stock = 1.65 × σ × √LeadTime</code>. Reorder recommendation generated automatically before stockout date.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-charcoal-850 rounded-xl border border-charcoal-200 dark:border-charcoal-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-white">SOL-INV-5KW Replenishment Recommendation:</span>
                      <p className="text-textMuted text-[11px]">Current Avail: 13 | Reorder Point: 25 | Suggested Order: 30 Units | Vendor: Sahyadri Power Midc</p>
                    </div>
                    <button className="px-3 py-1.5 bg-forest text-white font-bold rounded-lg hover:bg-forest-light text-xs">
                      Convert to Draft PO
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'dispatch' && (
                <div className="space-y-4">
                  <div className="p-4 bg-charcoal-50 dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-white">
                        Delivery Challan: DC-2026-00045 (Rule 55 CGST)
                      </span>
                      <p className="text-textMuted text-[11px] mt-0.5">
                        Consignee: Reliance Retail Hub Ghansoli • Transporter: VRL Logistics (MH-04-AZ-9214) • E-Way Bill: 241088921477
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-subtle text-forest dark:bg-emerald/20 dark:text-accent font-bold rounded-full">
                      DELIVERED &amp; STAMPED
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Business Metrics */}
      <section className="py-12 bg-white dark:bg-charcoal-900 border-y border-charcoal-200 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest dark:text-accent">
                {liveAccuracy}%
              </p>
              <p className="text-xs sm:text-sm font-semibold text-textMuted mt-1">
                Audit Inventory Accuracy
              </p>
              <span className="text-[10px] text-textMuted italic">Sample metric</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest dark:text-accent">
                0%
              </p>
              <p className="text-xs sm:text-sm font-semibold text-textMuted mt-1">
                Unauthorized Overselling
              </p>
              <span className="text-[10px] text-textMuted italic">Enforced by reservation locks</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest dark:text-accent">
                {liveOrders}+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-textMuted mt-1">
                Daily Indian Dispatches
              </p>
              <span className="text-[10px] text-textMuted italic">Simulated throughput</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest dark:text-accent">
                100%
              </p>
              <p className="text-xs sm:text-sm font-semibold text-textMuted mt-1">
                Local Zero-Cloud Dependency
              </p>
              <span className="text-[10px] text-textMuted italic">Self-contained Python &amp; Postgres</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-accent">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 dark:text-white mt-2">
              Everything Your Warehouse Needs to Run at Scale
            </h2>
            <p className="text-base text-textMuted dark:text-charcoal-200 mt-4">
              Engineered from the ground up for Indian wholesale distributors, supply chain operators, and fast-moving fulfillment hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-charcoal-800 flex items-center justify-center text-forest dark:text-accent mb-4">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Immutable Stock Ledger
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                Every purchase receipt, sales issue, warehouse transfer, or damage adjustment generates a traceable transaction ID with before-and-after balances and weighted average costing.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-subtle dark:bg-charcoal-800 flex items-center justify-center text-amber-warm mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Intelligent Demand Forecasting
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                Python Pandas/NumPy backtested algorithms analyze 90-day demand velocities, compute safety stocks for 95% service levels, and generate reviewable draft purchase orders.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-charcoal-800 flex items-center justify-center text-forest dark:text-accent mb-4">
                <WarehouseIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Multi-Tier Bin Encoding
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                Track products at exact warehouse coordinates: <code className="text-xs font-mono">WH-BHW-01 / Z-A / R-03 / S-02 / BIN-014</code>. Calculate warehouse volumetric and square-foot utilization in real-time.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-terracotta-subtle dark:bg-charcoal-800 flex items-center justify-center text-terracotta mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Dispatch &amp; Delivery Challans
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                Complete picking, packing, and dispatch planning with transporter assignments (VRL, Delhivery), vehicle numbers, e-way bill references, and local printable A4 delivery challans.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-charcoal-800 flex items-center justify-center text-forest dark:text-accent mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Local Barcode &amp; Label Printing
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                Generate local Code 128 and QR labels without external API calls. Supports USB/keyboard-wedge scanners, mobile camera lookup, and printable multi-up label sheets.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-charcoal-800 flex items-center justify-center text-forest dark:text-accent mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Audits &amp; Role-Based Security
              </h3>
              <p className="text-sm text-textMuted dark:text-charcoal-200 mt-2 leading-relaxed">
                10 distinct role authorization tiers (Super Admin, Org Owner, Warehouse Manager, Auditor). Physical stocktake sessions with blind counting and supervisor reconciliation workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflows Section */}
      <section id="workflows" className="py-20 bg-charcoal-50/70 dark:bg-charcoal-900/50 border-y border-charcoal-200 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-accent">
              Operational Lifecycles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 dark:text-white mt-2">
              From Procurement to Delivery in Full Control
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Procurement lifecycle card */}
            <div className="p-8 bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-forest text-white font-bold flex items-center justify-center text-sm">
                  1
                </span>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-white">
                  Purchase-to-Stock Lifecycle
                </h3>
              </div>
              <p className="text-sm text-textMuted dark:text-charcoal-200">
                Purchase Order Draft → Pending Approval → Sent to Vendor → Goods Receipt Note (GRN) with Damaged/Shortage Recording → Ledger Balance &amp; Average Cost Update.
              </p>
              <div className="p-4 bg-sage-50 dark:bg-charcoal-900 rounded-xl border border-sage-200/80 dark:border-charcoal-700 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-forest dark:text-accent font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Multi-tier Approval Gates
                </div>
                <div className="flex items-center gap-2 text-forest dark:text-accent font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Batch &amp; Expiry Date Traceability
                </div>
                <div className="flex items-center gap-2 text-forest dark:text-accent font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Local PDF Purchase Orders &amp; GRNs
                </div>
              </div>
            </div>

            {/* Sales-to-dispatch lifecycle card */}
            <div className="p-8 bg-white dark:bg-charcoal-800 rounded-2xl border border-charcoal-200 dark:border-charcoal-700 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber text-charcoal-900 font-bold flex items-center justify-center text-sm">
                  2
                </span>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-white">
                  Sales-to-Dispatch Lifecycle
                </h3>
              </div>
              <p className="text-sm text-textMuted dark:text-charcoal-200">
                Sales Order Created → Atomic Stock Reservation Locks → Picking List by Bin Coordinates → Packing Verification → Delivery Challan Issued → Proof-of-Delivery Confirmation.
              </p>
              <div className="p-4 bg-amber-subtle/50 dark:bg-charcoal-900 rounded-xl border border-amber/20 dark:border-charcoal-700 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-amber-warm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Zero-Overselling Concurrency Protection
                </div>
                <div className="flex items-center gap-2 text-amber-warm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Indian Transporter &amp; Vehicle Numbers
                </div>
                <div className="flex items-center gap-2 text-amber-warm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Official Rule 55 Delivery Challan PDFs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-accent">
              Clarity &amp; Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 dark:text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-200 dark:border-charcoal-800 overflow-hidden shadow-soft"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between font-bold text-base text-charcoal-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-textMuted transition-transform ${
                      openFaq === idx ? 'rotate-180 text-forest dark:text-accent' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-textMuted dark:text-charcoal-200 leading-relaxed border-t border-charcoal-100 dark:border-charcoal-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-forest text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-bold uppercase tracking-wider">
            Ready for Production Deployment
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Connect Every Warehouse. Account For Every Item.
          </h2>
          <p className="text-base sm:text-lg text-emerald-subtle/80 max-w-2xl mx-auto">
            Experience the benchmark for Indian warehouse management software. Explore our live demonstration environment or configure your organization in minutes.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-accent hover:bg-green-400 text-charcoal-950 font-bold rounded-xl shadow-elevated transition-all active:scale-95 text-base"
            >
              Get Started Now
            </Link>
            <Link
              to="/signin"
              className="px-8 py-3.5 bg-forest-dark hover:bg-forest text-white font-bold rounded-xl border border-white/20 transition-all text-base"
            >
              Explore Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-charcoal-900 text-charcoal-200 border-t border-charcoal-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-white">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base">
                Stock<span className="text-accent">Pilot</span>
              </span>
              <p className="text-[11px] text-textMuted">
                Intelligent Warehouse &amp; Inventory Management System
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-textMuted">
              Designed &amp; Engineered for Indian Distributors, Wholesalers &amp; Manufacturers.
            </p>
            <p className="text-[11px] text-textMuted mt-1">
              Strictly adheres to forest green, sage, amber, and charcoal palette. Zero external API dependencies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
