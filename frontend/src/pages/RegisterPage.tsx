import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Mail, Lock, Building, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [orgName, setOrgName] = useState('');
  const [businessType, setBusinessType] = useState('distributor');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Mumbai');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the system operational terms.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        phone_number: phone,
        organization_name: orgName,
        business_type: businessType,
        state,
        city,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ivory dark:bg-charcoal-950 transition-colors py-8 sm:py-12">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-2xl shadow-elevated p-6 sm:p-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-charcoal-100 dark:border-charcoal-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-white shadow-soft">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-charcoal-900 dark:text-white">
                  Stock<span className="text-forest dark:text-accent">Pilot</span>
                </span>
                <p className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">
                  New Organization Onboarding
                </p>
              </div>
            </div>
            <Link to="/signin" className="text-xs font-semibold text-forest dark:text-accent hover:underline">
              Sign In Instead
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-charcoal-900 dark:text-white">
              Create Your Warehouse Organization
            </h2>
            <p className="text-xs text-textMuted dark:text-charcoal-200 mt-1">
              Configure your primary company profile and owner credentials.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-alert-subtle border border-alert/30 rounded-xl flex items-start gap-2.5 text-xs text-alert font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner / Contact Full Name"
                placeholder="e.g. Rajesh Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                prefixIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Work Email"
                type="email"
                placeholder="rajesh@bharatdistro.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Indian Phone Number"
                placeholder="+91 98201 12345"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                prefixIcon={<Phone className="w-4 h-4" />}
                required
              />
              <Input
                label="Organization / Company Name"
                placeholder="e.g. Bharat DistroLogix Pvt Ltd"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                prefixIcon={<Building className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Business Type"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                options={[
                  { value: 'distributor', label: 'Distributor / Wholesaler' },
                  { value: 'manufacturer', label: 'Manufacturer' },
                  { value: 'retailer', label: 'Retailer / Chain' },
                  { value: 'ecommerce', label: 'E-Commerce Seller' },
                  { value: 'sme', label: 'SME Enterprise' },
                ]}
              />
              <Select
                label="Registered State"
                value={state}
                onChange={e => setState(e.target.value)}
                options={[
                  { value: 'Maharashtra', label: 'Maharashtra (27)' },
                  { value: 'Delhi', label: 'Delhi (07)' },
                  { value: 'Karnataka', label: 'Karnataka (29)' },
                  { value: 'Gujarat', label: 'Gujarat (24)' },
                  { value: 'Haryana', label: 'Haryana (06)' },
                  { value: 'Tamil Nadu', label: 'Tamil Nadu (33)' },
                  { value: 'Uttar Pradesh', label: 'Uttar Pradesh (09)' },
                ]}
              />
              <Input
                label="Operating City"
                placeholder="Mumbai"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password (min 6 chars)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-textMuted dark:text-charcoal-200">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="rounded border-charcoal-300 text-forest focus:ring-forest mt-0.5"
                />
                <span>
                  I accept the StockPilot enterprise terms and confirm that all inventory and tax records are managed for internal operational compliance.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-base font-bold shadow-soft mt-2"
            >
              Complete Registration &amp; Open Dashboard
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
