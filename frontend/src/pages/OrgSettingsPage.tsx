import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Palette,
  ShieldAlert,
  Globe2,
  MapPin,
  Calendar,
  IndianRupee,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { Organization, User } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

export const OrgSettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, organization, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [orgData, setOrgData] = useState<Partial<Organization>>({
    name: '',
    code: '',
    gstin: '',
    pan: '',
    registered_address: '',
    state: 'Maharashtra',
    pin_code: '',
    contact_email: '',
    contact_phone: '',
    financial_year_start_month: 4,
  });

  useEffect(() => {
    loadOrgData();
  }, []);

  const loadOrgData = async () => {
    try {
      setLoading(true);
      const org = await api.getOrganization();
      setOrgData(org);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load organization settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      await api.updateOrganization(orgData);
      setFeedback({ type: 'success', text: 'Organization settings updated successfully!' });
      await refreshProfile();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'sage') => {
    setTheme(newTheme);
    try {
      await api.updateTheme(newTheme);
    } catch {
      // Local storage already updated by context
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-800" />
            Organization & System Settings
          </h1>
          <p className="text-sm text-secondary mt-1">
            Configure Indian business taxation (GSTIN, PAN), default financial year, and workspace appearance.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-forest-800 hover:bg-forest-900 text-white shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-alert-50 border-alert-200 text-alert-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-alert-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity */}
        <Card className="p-5 border-forest-100 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-forest-100">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-charcoal">Enterprise Profile & Registration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              value={orgData.name || ''}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              placeholder="e.g. Bharat DistroLogix Pvt Ltd"
            />
            <Input
              label="Organization Code"
              required
              value={orgData.code || ''}
              onChange={(e) => setOrgData({ ...orgData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. BDL"
              helperText="Prefixed to all system SKU codes and ledger references."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GSTIN (Goods & Services Tax ID)"
              value={orgData.gstin || ''}
              onChange={(e) => setOrgData({ ...orgData, gstin: e.target.value.toUpperCase() })}
              placeholder="e.g. 27AABCB1234F1Z8"
              helperText="15-character statutory GST identification for B2B e-way bills."
            />
            <Input
              label="PAN (Permanent Account Number)"
              value={orgData.pan || ''}
              onChange={(e) => setOrgData({ ...orgData, pan: e.target.value.toUpperCase() })}
              placeholder="e.g. AABCB1234F"
            />
          </div>
        </Card>

        {/* Registered Address & Regional Parameters */}
        <Card className="p-5 border-forest-100 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-forest-100">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-charcoal">Registered Head Office & Contact</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Registered Office Address"
              value={orgData.registered_address || ''}
              onChange={(e) => setOrgData({ ...orgData, registered_address: e.target.value })}
              placeholder="Suite / Plot / Industrial Area"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal mb-1 block">State / Union Territory</label>
              <select
                value={orgData.state || 'Maharashtra'}
                onChange={(e) => setOrgData({ ...orgData, state: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:ring-1 focus:ring-emerald-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="PIN Code"
              value={orgData.pin_code || ''}
              onChange={(e) => setOrgData({ ...orgData, pin_code: e.target.value })}
              placeholder="e.g. 400001"
            />

            <Input
              label="Primary Work Email"
              type="email"
              value={orgData.contact_email || ''}
              onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })}
              placeholder="admin@stockpilot.in"
            />

            <Input
              label="Contact Phone"
              value={orgData.contact_phone || ''}
              onChange={(e) => setOrgData({ ...orgData, contact_phone: e.target.value })}
              placeholder="+91 22 2847 1000"
            />
          </div>
        </Card>

        {/* Financial & Timezone Standards */}
        <Card className="p-5 border-forest-100 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-forest-100">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-charcoal">Fiscal Year & Regional Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal mb-1 block">Financial Year Start</label>
              <select
                value={orgData.financial_year_start_month || 4}
                onChange={(e) => setOrgData({ ...orgData, financial_year_start_month: Number(e.target.value) })}
                className="w-full p-2 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:ring-1 focus:ring-emerald-500"
              >
                <option value={4}>April (Standard Indian Fiscal Year: 1 Apr - 31 Mar)</option>
                <option value={1}>January (Calendar Year)</option>
              </select>
            </div>

            <Input
              label="Currency Standard"
              value="INR (₹) — Indian Rupee"
              disabled
              helperText="Formatted with Indian numbering: ₹24,56,800.00"
            />

            <Input
              label="System Timezone"
              value="Asia/Kolkata (IST — UTC+05:30)"
              disabled
              helperText="Uniform ledger timestamping across all Indian hubs."
            />
          </div>
        </Card>

        {/* Appearance & Themes */}
        <Card className="p-5 border-forest-100 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-forest-100">
            <Palette className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-charcoal">Workspace Appearance & Theme</h2>
          </div>

          <p className="text-xs text-secondary">
            Select your preferred visual atmosphere. Adheres strictly to the warm, sophisticated forest green and ivory palette—zero blue elements.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Light Theme */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'light'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-forest-100 bg-white hover:border-forest-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-charcoal">1. Light Theme</span>
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              </div>
              <p className="text-[11px] text-secondary">
                Warm ivory background, crisp white cards, and deep forest green accents.
              </p>
              <div className="flex gap-1.5 mt-3">
                <span className="w-4 h-4 rounded-full bg-[#14532D] border border-white/50"></span>
                <span className="w-4 h-4 rounded-full bg-[#FAFAF7] border border-forest-200"></span>
                <span className="w-4 h-4 rounded-full bg-[#1F2933]"></span>
              </div>
            </button>

            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'dark'
                  ? 'border-emerald-600 bg-charcoal text-ivory shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-forest-100 bg-[#1F2933] text-ivory hover:border-forest-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-ivory">2. Dark Theme</span>
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-ivory/70">
                Deep charcoal surfaces, subdued green highlights, and comfortable night contrast.
              </p>
              <div className="flex gap-1.5 mt-3">
                <span className="w-4 h-4 rounded-full bg-[#1F2933] border border-forest-400"></span>
                <span className="w-4 h-4 rounded-full bg-[#15803D]"></span>
                <span className="w-4 h-4 rounded-full bg-[#FAFAF7]"></span>
              </div>
            </button>

            {/* Soft Sage Theme */}
            <button
              type="button"
              onClick={() => handleThemeChange('sage')}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                theme === 'sage'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-forest-100 bg-[#E7F2E8]/40 hover:border-forest-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-charcoal">3. Soft Sage Theme</span>
                {theme === 'sage' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
              </div>
              <p className="text-[11px] text-secondary">
                Warm botanic tones, muted sage surfaces, and calming natural contrast.
              </p>
              <div className="flex gap-1.5 mt-3">
                <span className="w-4 h-4 rounded-full bg-[#E7F2E8] border border-forest-300"></span>
                <span className="w-4 h-4 rounded-full bg-[#14532D]"></span>
                <span className="w-4 h-4 rounded-full bg-[#C65D3A]"></span>
              </div>
            </button>
          </div>
        </Card>

        {/* Statutory Regulatory Disclaimer */}
        <div className="p-4 rounded-xl bg-sage/30 border border-sage/60 flex items-start gap-3 text-xs text-charcoal">
          <ShieldAlert className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-emerald-950">Statutory Tax & Compliance Notice:</span>
            <p className="text-secondary leading-relaxed">
              StockPilot operates as an internal warehouse inventory and logistics accounting ledger. Generated delivery challans adhere to Rule 55 of the CGST Rules, and tax invoices are formatted for Indian commercial records. StockPilot does not replace direct GST filing on the official GSTN / CBIC portal.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
