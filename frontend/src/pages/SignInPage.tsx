import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('StockPilot@2026');
    setError(null);
  };

  return (
    <div className="min-h-screen flex bg-ivory dark:bg-charcoal-950 transition-colors">
      {/* Left Brand Panel - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest dark:bg-charcoal-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle decorative background circles - strictly green/sage */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-forest-light/40 dark:bg-emerald/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent/20 dark:bg-accent/5 blur-3xl" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-soft">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight">
              Stock<span className="text-accent">Pilot</span>
            </span>
            <p className="text-xs text-emerald-subtle/80 uppercase tracking-widest font-semibold">
              Warehouse Management System
            </p>
          </div>
        </div>

        {/* Center Illustration & Value proposition */}
        <div className="relative z-10 my-auto py-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-elevated"
          >
            <div className="flex items-center gap-3 text-accent font-bold text-sm mb-3">
              <ShieldCheck className="w-5 h-5" />
              <span>Production-Ready Indian Business Platform</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              “Every Item Accounted For. Every Warehouse Connected.”
              Access your multi-warehouse stock ledger, GST-compliant purchase orders, Rule 55 delivery challans, and local demand forecasting.
            </p>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Multi-Warehouse coordinate tracking (Zone/Aisle/Rack/Bin)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Atomic database locks preventing unauthorized overselling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>100% Local Python forecasting engine without external APIs</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-emerald-subtle/70">
          StockPilot Enterprise Edition • Bharat DistroLogix Architecture
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center text-white">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <span className="font-extrabold text-xl text-charcoal-900 dark:text-white">
              Stock<span className="text-forest dark:text-accent">Pilot</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 dark:text-white tracking-tight">
              Sign In to Your Hub
            </h2>
            <p className="text-sm text-textMuted dark:text-charcoal-200 mt-1">
              Enter your authorized organization credentials.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3.5 bg-alert-subtle border border-alert/30 rounded-xl flex items-start gap-2.5 text-xs text-alert font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="e.g. rajesh@bharatdistro.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              prefixIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-charcoal-900 dark:hover:text-white focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal-700 dark:text-charcoal-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-charcoal-300 text-forest focus:ring-forest"
                />
                <span>Remember me for 30 days</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset links are routed to your organization administrator.')}
                className="text-forest dark:text-accent font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-base font-bold shadow-soft"
            >
              Sign In to StockPilot
            </Button>
          </form>

          {/* Demo Logins Section */}
          <div className="pt-4 border-t border-charcoal-200 dark:border-charcoal-800">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted dark:text-charcoal-200 mb-2">
              One-Click Demo Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@stockpilot.in')}
                className="p-2 text-left bg-sage-50 hover:bg-sage-100 dark:bg-charcoal-800 dark:hover:bg-charcoal-750 border border-sage-200/80 dark:border-charcoal-700 rounded-lg transition-colors"
              >
                <p className="font-bold text-forest dark:text-accent">Org Owner</p>
                <p className="text-[10px] text-textMuted">admin@stockpilot.in</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('warehouse.mgr@stockpilot.in')}
                className="p-2 text-left bg-charcoal-50 hover:bg-charcoal-100 dark:bg-charcoal-800 dark:hover:bg-charcoal-750 border border-charcoal-200 dark:border-charcoal-700 rounded-lg transition-colors"
              >
                <p className="font-bold text-charcoal-900 dark:text-white">Warehouse Mgr</p>
                <p className="text-[10px] text-textMuted">warehouse.mgr@stockpilot.in</p>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-textMuted">
            Need a new warehouse organization?{' '}
            <Link to="/register" className="font-bold text-forest dark:text-accent hover:underline">
              Create an Organization →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
