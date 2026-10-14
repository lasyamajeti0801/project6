import React, { useState } from 'react';
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
  BarChart3,
  Moon,
  Sun,
  Leaf,
  Package,
  Search,
  Bell,
  Check,
  Info,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
  ClipboardList,
  Building2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { formatINR } from '../utils/formatters';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Demand & Sales Trend chart data matching the reference image (green bars + orange line)
  const trendData = [
    { date: 'Apr 1', sales: 450, forecast: 420 },
    { date: 'Apr 5', sales: 620, forecast: 580 },
    { date: 'Apr 10', sales: 850, forecast: 890 },
    { date: 'Apr 15', sales: 1100, forecast: 1050 },
    { date: 'Apr 20', sales: 980, forecast: 1150 },
    { date: 'Apr 25', sales: 1350, forecast: 1280 },
    { date: 'Apr 30', sales: 1580, forecast: 1490 },
  ];

  const faqs = [
    {
      q: 'Can I manage multiple warehouses?',
      a: 'Yes! StockPilot natively supports multi-warehouse distribution networks across Indian states (Bhiwandi, Gurugram, Bengaluru, etc.) with multi-tier coordinate hierarchy: Zone, Aisle, Rack, Shelf, and Bin.',
    },
    {
      q: 'How does the demand forecasting work?',
      a: 'StockPilot runs a 100% local Python, Pandas & NumPy time-series forecasting engine utilizing Holt-Winters exponential smoothing, lead-time demand velocity, and dynamic safety stock formulas without sending your data to external APIs.',
    },
    {
      q: 'Does StockPilot support GST and Indian tax formats?',
      a: 'Yes. StockPilot includes native HSN code tracking, GST rates (0%, 5%, 12%, 18%, 28%), state codes, GSTIN/PAN validations, and generates Rule 55 Delivery Challan PDFs compliant with CGST rules.',
    },
    {
      q: 'Can I import my existing product data?',
      a: 'Absolutely. You can import and export existing catalog, vendor, and customer records via standardized CSV and Excel spreadsheets tailored for Indian distribution businesses.',
    },
    {
      q: 'Is there a mobile version of the application?',
      a: 'Yes. StockPilot is fully responsive and optimized for mobile browsers and tablets, including camera-based barcode scanning for stock counting, order picking, and goods receipts on the warehouse floor.',
    },
    {
      q: 'What kind of support do you provide?',
      a: 'We provide dedicated onboarding support, technical documentation, operational training guides, and an internal issue tracker for warehouse logistics teams.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-charcoal dark:bg-[#1F2933] dark:text-[#FAFAF7] transition-colors selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#FAFAF7]/95 dark:bg-[#1F2933]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-charcoal-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-forest-800 flex items-center justify-center text-white shadow-xs">
              <Boxes className="w-5 h-5 text-accent-400 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-charcoal dark:text-white">
              Stock<span className="text-forest-700 dark:text-accent-400">Pilot</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-charcoal/80 dark:text-ivory/80">
            <Link to="/" className="relative text-forest-800 dark:text-accent-400 font-bold">
              Home
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-forest-800 dark:bg-accent-400 rounded-full" />
            </Link>
            <a href="#features" className="hover:text-forest-800 dark:hover:text-accent-400 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-forest-800 dark:hover:text-accent-400 transition-colors">
              Pricing
            </a>
            <a href="#about" className="hover:text-forest-800 dark:hover:text-accent-400 transition-colors">
              About
            </a>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-forest-800 dark:hover:text-accent-400 transition-colors">
              <span>Resources</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-forest-200 dark:border-charcoal-700 hover:bg-forest-50 dark:hover:bg-charcoal-800 transition-colors text-charcoal dark:text-ivory"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-accent-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            <Link
              to="/signin"
              className="px-5 py-2 text-xs font-bold rounded-full border border-forest-300 dark:border-charcoal-600 text-charcoal dark:text-ivory hover:bg-forest-50 dark:hover:bg-charcoal-800 transition-colors"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-5 py-2 text-xs font-bold rounded-full bg-forest-800 hover:bg-forest-900 text-white shadow-xs transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Decorative botanical leaf accents */}
        <div className="absolute top-12 left-4 w-32 h-32 opacity-25 pointer-events-none select-none text-forest-700">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C70 30 90 40 100 50 C70 60 60 80 50 100 C40 80 30 60 0 50 C30 40 40 20 50 0 Z" opacity="0.4" />
          </svg>
        </div>
        <div className="absolute top-36 right-6 w-40 h-40 opacity-20 pointer-events-none select-none text-emerald-800">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C80 20 100 50 100 50 C100 50 70 80 50 100 C30 70 0 50 0 50 C0 50 20 20 50 0 Z" opacity="0.5" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Green Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7F2E8] border border-[#C6DEC9] text-xs font-bold text-forest-800">
                <Leaf className="w-3.5 h-3.5 text-forest-700" />
                Intelligent Warehouse Management
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-charcoal dark:text-white leading-[1.12]">
                Take Control of Every <br />
                <span className="text-forest-800 dark:text-accent-400">Stock Movement.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-secondary dark:text-ivory/70 max-w-lg leading-relaxed">
                Track inventory, manage warehouses, streamline operations and make smarter replenishment decisions — all in one powerful platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/dashboard"
                  className="px-6 py-3 rounded-full bg-white dark:bg-charcoal-800 hover:bg-forest-50 dark:hover:bg-charcoal-700 text-charcoal dark:text-ivory font-bold text-sm border border-forest-300 dark:border-charcoal-600 shadow-xs transition-colors"
                >
                  Explore Dashboard
                </Link>
              </div>

              {/* 4 Feature Tags Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-forest-100 dark:border-charcoal-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal dark:text-ivory">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="leading-tight">Real-time Inventory Visibility</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal dark:text-ivory">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-4 h-4" />
                  </div>
                  <span className="leading-tight">Multi-Warehouse Management</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal dark:text-ivory">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="leading-tight">Smart Reorder Forecasting</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal dark:text-ivory">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="leading-tight">Barcode &amp; Label Generation</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic: Realistic StockPilot Dashboard Mockup & Warehouse Visual */}
            <div className="lg:col-span-6 relative">
              {/* Warehouse Racks & Forklift Photo Mockup Backdrop */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-forest-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900">
                {/* Header Window Bar */}
                <div className="px-4 py-2.5 bg-forest-900 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <span className="font-mono text-[11px] opacity-80 pl-2">stockpilot.in/dashboard</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-800 px-2 py-0.5 rounded text-white">
                    WH-BHW-01 (Bhiwandi Central)
                  </span>
                </div>

                {/* Simulated Dashboard UI matching reference screenshot */}
                <div className="flex text-left">
                  {/* Miniature Dark Green Sidebar */}
                  <div className="w-28 bg-[#14532D] text-white p-2.5 space-y-2 text-[10px] font-medium hidden sm:block shrink-0">
                    <div className="flex items-center gap-1 font-bold text-xs pb-2 border-b border-forest-700">
                      <Boxes className="w-3.5 h-3.5 text-accent-400" />
                      <span>StockPilot</span>
                    </div>
                    <div className="space-y-1">
                      <div className="px-2 py-1 rounded bg-forest-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400"></span> Dashboard
                      </div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Inventory</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Products</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Categories</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Warehouses</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Purchase Orders</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Sales Orders</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Dispatches</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Reports</div>
                      <div className="px-2 py-0.5 opacity-70 hover:opacity-100">Settings</div>
                    </div>
                  </div>

                  {/* Main Preview Board */}
                  <div className="flex-1 p-3.5 space-y-3 bg-[#FAFAF7] dark:bg-charcoal-900 overflow-hidden">
                    {/* Top Search & Profile Bar */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-forest-100 dark:border-charcoal-800">
                      <div className="relative w-44">
                        <Search className="w-3 h-3 text-secondary absolute left-2 top-2" />
                        <input
                          type="text"
                          readOnly
                          placeholder="Search products, orders..."
                          className="w-full pl-6 pr-2 py-1 text-[10px] rounded border border-forest-200 bg-white text-charcoal"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-semibold text-charcoal dark:text-white">John Doe (Admin)</span>
                        <div className="w-5 h-5 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-[9px]">
                          JD
                        </div>
                      </div>
                    </div>

                    {/* 4 Mini KPI Cards */}
                    <div className="grid grid-cols-4 gap-2 text-left">
                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700">
                        <span className="text-[9px] text-secondary block">Total Products</span>
                        <div className="font-bold text-xs text-charcoal dark:text-white flex items-baseline gap-1">
                          1,248 <span className="text-[8px] text-emerald-700 font-semibold">+12%</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700">
                        <span className="text-[9px] text-secondary block">Stock Value</span>
                        <div className="font-bold text-xs text-forest-800 dark:text-accent-400 flex items-baseline gap-1">
                          ₹24,56,800 <span className="text-[8px] text-emerald-700 font-semibold">+8%</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700">
                        <span className="text-[9px] text-amber-700 block">Low Stock</span>
                        <div className="font-bold text-xs text-amber-700 flex items-baseline gap-1">
                          12 <span className="text-[8px] text-amber-600 font-semibold">-2%</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700">
                        <span className="text-[9px] text-terracotta block">Pending POs</span>
                        <div className="font-bold text-xs text-charcoal dark:text-white flex items-baseline gap-1">
                          8 <span className="text-[8px] text-emerald-700 font-semibold">+2%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Overview Line Graph & Top Products Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {/* Mini Line Chart */}
                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700">
                        <div className="flex items-center justify-between text-[10px] font-bold text-charcoal dark:text-white mb-1">
                          <span>Stock Overview</span>
                          <span className="text-[8px] text-emerald-700 font-mono">Last 30 days</span>
                        </div>
                        <div className="h-24 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                              <YAxis tick={{ fontSize: 8 }} />
                              <Line type="monotone" dataKey="sales" stroke="#15803D" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Top Products Mini Table */}
                      <div className="p-2 bg-white dark:bg-charcoal-800 rounded border border-forest-100 dark:border-charcoal-700 text-[10px]">
                        <span className="font-bold text-charcoal dark:text-white block mb-1">Top Products</span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between border-b border-forest-50 pb-0.5">
                            <span className="font-medium text-charcoal">Laptop Core i7</span>
                            <span className="font-bold text-charcoal">45</span>
                            <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded">In Stock</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-forest-50 pb-0.5">
                            <span className="font-medium text-charcoal">Wireless Mouse</span>
                            <span className="font-bold text-charcoal">129</span>
                            <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded">In Stock</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-forest-50 pb-0.5">
                            <span className="font-medium text-charcoal">Mechanical Keyboard</span>
                            <span className="font-bold text-charcoal">28</span>
                            <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 rounded">Low Stock</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-charcoal">USB-C Monitor 27"</span>
                            <span className="font-bold text-charcoal">12</span>
                            <span className="text-[8px] font-bold text-alert-700 bg-alert-50 px-1 rounded">Critical</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sample Data Horizontal Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-200 dark:border-charcoal-700 shadow-sm">
          {/* Pill Disclaimer */}
          <div className="flex items-center gap-2 mb-3 text-xs text-secondary">
            <span className="inline-flex items-center gap-1 font-bold text-forest-800 dark:text-accent-400 bg-forest-50 dark:bg-charcoal-700 px-2 py-0.5 rounded-md">
              <Info className="w-3.5 h-3.5" /> Sample Data
            </span>
            <span>These numbers are for demonstration purposes only.</span>
          </div>

          {/* 5 KPI Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/50 dark:bg-charcoal-900 border border-forest-100 dark:border-charcoal-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold text-charcoal dark:text-white block leading-tight">1,248</span>
                <span className="text-xs text-secondary font-medium">Total Products</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-charcoal-900 border border-amber-100 dark:border-charcoal-700">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold text-amber-800 dark:text-amber-400 block leading-tight">12</span>
                <span className="text-xs text-secondary font-medium">Low Stock Items</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-terracotta/5 dark:bg-charcoal-900 border border-terracotta/20 dark:border-charcoal-700">
              <div className="w-10 h-10 rounded-xl bg-terracotta/20 text-terracotta flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold text-charcoal dark:text-white block leading-tight">8</span>
                <span className="text-xs text-secondary font-medium">Pending Purchase Orders</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/50 dark:bg-charcoal-900 border border-forest-100 dark:border-charcoal-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold text-charcoal dark:text-white block leading-tight">5</span>
                <span className="text-xs text-secondary font-medium">Pending Dispatches</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/50 dark:bg-charcoal-900 border border-forest-100 dark:border-charcoal-700">
              <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shrink-0">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold text-charcoal dark:text-white block leading-tight">4</span>
                <span className="text-xs text-secondary font-medium">Active Warehouses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "Everything You Need. Nothing You Don't." Section */}
      <section id="features" className="py-16 bg-[#FAFAF7] dark:bg-[#1F2933]/60 border-t border-forest-100 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Heading, Subtitle & Handheld Barcode Pallet Graphic */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <h2 className="text-3xl font-extrabold text-charcoal dark:text-white tracking-tight leading-snug">
                Everything You Need. <br />
                <span className="text-forest-800 dark:text-accent-400">Nothing You Don't.</span>
              </h2>
              <p className="text-sm text-secondary dark:text-ivory/70 leading-relaxed max-w-md">
                A complete warehouse management solution designed for Indian businesses. From inventory to dispatch, we've got you covered.
              </p>

              {/* Handheld Scanner & Pallet Warehouse Box Illustration */}
              <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-200 dark:border-charcoal-700 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-forest-800 dark:text-accent-400 uppercase tracking-wider">
                    Warehouse Receiving Bay
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-semibold">
                    100% Local Scanning
                  </span>
                </div>

                <div className="h-44 rounded-xl bg-gradient-to-b from-forest-50/60 to-sage/30 dark:from-charcoal-900 dark:to-charcoal-850 flex items-center justify-center relative p-4">
                  {/* Visual Pallet with Stacked Boxes */}
                  <div className="space-y-2 text-center">
                    <div className="inline-flex gap-2">
                      <div className="w-14 h-12 bg-amber-100 border-2 border-amber-300 rounded shadow-xs flex items-center justify-center text-[10px] font-bold text-amber-900">
                        BDL-01
                      </div>
                      <div className="w-14 h-12 bg-amber-100 border-2 border-amber-300 rounded shadow-xs flex items-center justify-center text-[10px] font-bold text-amber-900">
                        BDL-02
                      </div>
                    </div>
                    <div className="w-36 h-3 bg-amber-800/40 rounded mx-auto"></div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-forest-800 pt-1">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>Code 128 / QR Code Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 2x3 Grid of 6 Core Capabilities */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {/* 1. Inventory Management */}
              <Link
                to="/inventory"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Inventory Management
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Track stock levels, batches, expiry dates and more.
                </p>
              </Link>

              {/* 2. Purchase & Supplier */}
              <Link
                to="/purchase-orders"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Purchase &amp; Supplier
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Manage suppliers, purchase orders and receipts.
                </p>
              </Link>

              {/* 3. Sales & Dispatch */}
              <Link
                to="/sales-orders"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Sales &amp; Dispatch
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Process orders, packing and deliveries with ease.
                </p>
              </Link>

              {/* 4. Barcode & Labels */}
              <Link
                to="/barcodes"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Barcode &amp; Labels
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Generate and scan barcodes for faster operations.
                </p>
              </Link>

              {/* 5. Stock Audits */}
              <Link
                to="/audits"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Stock Audits
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Reconcile stock and handle variances with confidence.
                </p>
              </Link>

              {/* 6. Demand Forecasting */}
              <Link
                to="/forecasting"
                className="p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-charcoal dark:text-white flex items-center justify-between">
                  Demand Forecasting
                  <ArrowRight className="w-4 h-4 text-secondary group-hover:text-forest-800 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-secondary dark:text-ivory/70 mt-1 leading-relaxed">
                  Predict future demand and get smart reorder suggestions.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "How StockPilot Works" Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white tracking-tight">
            How StockPilot Works
          </h2>
          <p className="text-sm text-secondary dark:text-ivory/70 mt-1">
            Get started in minutes and take control of your warehouse operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 4 Connected Sequential Steps */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                <Building2 className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-xs font-mono font-bold text-forest-800 dark:text-accent-400">1</div>
              <h3 className="font-bold text-sm text-charcoal dark:text-white">Set Up Your Organization</h3>
              <p className="text-xs text-secondary dark:text-ivory/70 leading-relaxed">
                Add your business details, warehouses and users.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                <Package className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-xs font-mono font-bold text-forest-800 dark:text-accent-400">2</div>
              <h3 className="font-bold text-sm text-charcoal dark:text-white">Add Products &amp; Suppliers</h3>
              <p className="text-xs text-secondary dark:text-ivory/70 leading-relaxed">
                Create your product catalog and supplier list.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                <Truck className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-xs font-mono font-bold text-forest-800 dark:text-accent-400">3</div>
              <h3 className="font-bold text-sm text-charcoal dark:text-white">Manage Stock &amp; Orders</h3>
              <p className="text-xs text-secondary dark:text-ivory/70 leading-relaxed">
                Track inventory, create POs and process sales orders.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                <TrendingUp className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-xs font-mono font-bold text-forest-800 dark:text-accent-400">4</div>
              <h3 className="font-bold text-sm text-charcoal dark:text-white">Forecast &amp; Reorder</h3>
              <p className="text-xs text-secondary dark:text-ivory/70 leading-relaxed">
                Get intelligent insights and avoid stockouts.
              </p>
            </div>
          </div>

          {/* Right Floating Laptop Graphic with Reorder Suggestion Card */}
          <div className="lg:col-span-4 relative">
            <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-200 dark:border-charcoal-700 shadow-md space-y-3 relative">
              {/* Laptop Screen Header */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-forest-100">
                <span className="font-bold text-charcoal">Predictive Analytics</span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Algorithm Active
                </span>
              </div>

              {/* Trend line representation */}
              <div className="h-28 w-full bg-forest-50/50 rounded-lg p-2 flex items-end justify-between gap-1">
                {[30, 45, 60, 50, 75, 90, 85, 110, 130].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-full bg-emerald-600 rounded-t-sm"
                  />
                ))}
              </div>

              {/* Floating Reorder Suggestion Badge matching image */}
              <div className="p-3 bg-white dark:bg-charcoal-900 rounded-xl border border-emerald-300 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-secondary uppercase block">
                    Reorder Suggestion
                  </span>
                  <span className="text-base font-extrabold text-charcoal dark:text-white">
                    250 <span className="text-xs font-normal text-secondary">units</span>
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-bold">Recommended</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "Powerful Insights for Better Decisions" Section */}
      <section className="py-16 bg-[#FAFAF7] dark:bg-[#1F2933]/70 border-t border-forest-100 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-charcoal dark:text-white tracking-tight">
              Powerful Insights for Better Decisions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Recharts Demand & Sales Trend Card */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-charcoal-800 border border-forest-200 dark:border-charcoal-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-charcoal dark:text-white">Demand &amp; Sales Trend</h3>
                  <div className="flex items-center gap-3 text-[11px] text-secondary mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Sales
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Forecast
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1 text-xs rounded border border-forest-200 bg-forest-50 text-charcoal font-medium">
                  Last 30 days ▾
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#15803D" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Middle: 3 Core Analytic Points */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal dark:text-white">Demand Forecasting</h4>
                  <p className="text-xs text-secondary dark:text-ivory/70 mt-0.5 leading-relaxed">
                    Predict future demand using historical sales and seasonality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal dark:text-white">Reorder Recommendations</h4>
                  <p className="text-xs text-secondary dark:text-ivory/70 mt-0.5 leading-relaxed">
                    Get data-driven suggestions for optimal stock levels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal dark:text-white">Inventory Analytics</h4>
                  <p className="text-xs text-secondary dark:text-ivory/70 mt-0.5 leading-relaxed">
                    Visualize trends, performance and key metrics.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: High-Bay Warehouse Racks with Floating Accuracy Badge */}
            <div className="lg:col-span-3 relative">
              <div className="h-64 rounded-2xl bg-gradient-to-br from-forest-900 to-charcoal border border-forest-300 dark:border-charcoal-700 p-4 flex flex-col justify-between relative overflow-hidden shadow-md">
                {/* Simulated high-bay warehouse rack perspective */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="grid grid-cols-4 gap-2 h-full p-2">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-white/40 rounded flex items-center justify-center text-[8px] text-white/50">
                        RACK
                      </div>
                    ))}
                  </div>
                </div>

                <div className="z-10 text-white text-[11px] font-mono opacity-80">
                  BAY-A // PEENYA HUB
                </div>

                {/* Floating Stock Accuracy Badge */}
                <div className="z-10 p-3 bg-white text-charcoal rounded-xl shadow-lg border border-forest-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-secondary font-semibold block">Stock Accuracy</span>
                    <span className="text-xl font-extrabold text-charcoal">99.2%</span>
                    <span className="text-[10px] text-emerald-700 font-bold block">↑ 2.4%</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call to Action Dark Forest Green Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
        <div className="relative rounded-3xl bg-[#14532D] text-white p-8 sm:p-12 overflow-hidden shadow-xl text-left">
          {/* Subtle leaves decoration watermark */}
          <div className="absolute left-0 bottom-0 opacity-20 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0 100 C40 80 60 50 70 0 C40 30 20 60 0 100 Z" />
            </svg>
          </div>
          <div className="absolute right-0 top-0 opacity-20 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
              <path d="M100 0 C60 20 40 50 30 100 C60 70 80 40 100 0 Z" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Streamline Your <br />
              Warehouse Operations?
            </h2>
            <p className="text-sm opacity-90 leading-relaxed max-w-lg">
              Join hundreds of businesses already using StockPilot to stay organized, efficient and ahead of demand.
            </p>

            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#22C55E] hover:bg-emerald-500 text-forest-950 font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="block text-[11px] opacity-75 mt-2">No credit card required</span>
            </div>
          </div>

          {/* Script calligraphy watermark on right */}
          <div className="hidden lg:block absolute right-12 bottom-10 font-serif italic text-2xl text-emerald-200/40 select-none">
            “Smarter Inventory, Stronger Business”
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) Section */}
      <section id="faq" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-charcoal dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-secondary dark:text-ivory/70 mt-1">
              Find answers to common questions about StockPilot.
            </p>
          </div>

          <a href="#faq" className="text-xs font-bold text-forest-800 dark:text-accent-400 hover:underline flex items-center gap-1">
            View All FAQs <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2-Column Grid of 6 Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-forest-100 dark:border-charcoal-700 shadow-xs transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 text-left font-bold text-xs sm:text-sm text-charcoal dark:text-white"
                >
                  <span>{f.q}</span>
                  <div className="w-5 h-5 rounded-full bg-forest-50 dark:bg-charcoal-700 flex items-center justify-center shrink-0">
                    {isOpen ? <Minus className="w-3 h-3 text-forest-800" /> : <Plus className="w-3 h-3 text-forest-800" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-secondary dark:text-ivory/70 pt-3 leading-relaxed border-t border-forest-50 dark:border-charcoal-700 mt-3">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-[#1F2933] text-white pt-14 pb-8 border-t border-charcoal-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-charcoal-700 text-xs">
            {/* Logo & Tagline */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-forest-700 flex items-center justify-center text-white">
                  <Boxes className="w-4 h-4 text-accent-400" />
                </div>
                <span className="font-extrabold text-lg text-white">StockPilot</span>
              </div>
              <p className="text-secondary dark:text-charcoal-200 text-xs max-w-sm leading-relaxed">
                Every Item Accounted For. Every Warehouse Connected.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-white/90 block">Product</span>
              <ul className="space-y-2 text-secondary dark:text-charcoal-200">
                <li><Link to="/inventory" className="hover:text-white transition-colors">Features</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-white/90 block">Company</span>
              <ul className="space-y-2 text-secondary dark:text-charcoal-200">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-white/90 block">Resources</span>
              <ul className="space-y-2 text-secondary dark:text-charcoal-200">
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-secondary gap-3">
            <span>© 2025 StockPilot. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
