import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  KeyRound,
  Shield,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { User, Warehouse } from '../types';
import { formatDate } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';

const ROLES = [
  { value: 'ORG_OWNER', label: 'Organization Owner', desc: 'Full root control over all warehouses, financial records, and staff accounts.' },
  { value: 'WAREHOUSE_MGR', label: 'Warehouse Manager', desc: 'Manage warehouse floor, coordinate bins, stock receipts, and movements.' },
  { value: 'INVENTORY_MGR', label: 'Inventory Manager', desc: 'Supervise product catalog, stock adjustments, and low-stock alerts.' },
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer', desc: 'Create and approve purchase orders, track vendor deliveries, receive GRNs.' },
  { value: 'SALES_MGR', label: 'Sales Manager', desc: 'Create customer orders, allocate and reserve warehouse stock, approve sales.' },
  { value: 'DISPATCH_OPERATOR', label: 'Dispatch Operator', desc: 'Fulfill picked/packed orders, assign transporters, generate delivery challans.' },
  { value: 'STOCK_AUDITOR', label: 'Stock Auditor', desc: 'Execute blind cycle counts, record physical tallies, compute ledger variance.' },
  { value: 'FINANCE_VIEWER', label: 'Finance Viewer', desc: 'Read-only access to stock valuation, GST invoices, and purchase records.' },
  { value: 'READ_ONLY', label: 'Read-Only User', desc: 'General inquiry access to view inventory and catalog records without mutation rights.' },
];

export const UserRolesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  // Add User Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'INVENTORY_MGR',
    warehouse: '',
    password: 'StockPilot@2026',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userList, whList] = await Promise.all([
        api.getUsers(),
        api.getWarehouses(),
      ]);
      setUsers(userList);
      setWarehouses(whList);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load staff roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setFeedback(null);
      await api.createUser({
        username: formData.email.split('@')[0],
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        warehouse: formData.warehouse ? Number(formData.warehouse) : null,
        password: formData.password,
      });

      setFeedback({ type: 'success', text: `Staff account for ${formData.first_name} created successfully!` });
      setAddModalOpen(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'INVENTORY_MGR',
        warehouse: '',
        password: 'StockPilot@2026',
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create user account' });
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ORG_OWNER':
      case 'SUPERADMIN':
        return 'danger';
      case 'WAREHOUSE_MGR':
      case 'INVENTORY_MGR':
        return 'success';
      case 'PROCUREMENT_OFFICER':
      case 'SALES_MGR':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-800" />
              Role-Based Access Control (RBAC)
            </h1>
            <Badge variant="success">10 Enterprise Roles</Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            Enforce least-privilege security across procurement approvals, stock adjustments, and warehouse floor access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 border-forest-200 text-charcoal hover:bg-forest-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-forest-800 hover:bg-forest-900 text-white shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </Button>
        </div>
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

      {/* Tabs */}
      <div className="border-b border-forest-100 flex gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-secondary hover:text-charcoal'
          }`}
        >
          <Users className="w-4 h-4" />
          Authorized Staff ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'matrix'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-secondary hover:text-charcoal'
          }`}
        >
          <Shield className="w-4 h-4" />
          Permission Matrix (10 Roles)
        </button>
      </div>

      {activeTab === 'users' ? (
        <Card className="p-4 border-forest-100 bg-white space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-secondary">
              Showing <strong>{filteredUsers.length}</strong> accounts
            </span>
          </div>

          <div className="overflow-x-auto border border-forest-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-forest-50/70 text-secondary uppercase tracking-wider border-b border-forest-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Contact Info</th>
                  <th className="py-2.5 px-3 font-semibold">RBAC Role</th>
                  <th className="py-2.5 px-3 font-semibold">Primary Warehouse</th>
                  <th className="py-2.5 px-2 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Date Onboarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">
                      No staff members match the query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-forest-50/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal">
                          {u.first_name} {u.last_name || ''}
                        </div>
                        <div className="text-[11px] text-secondary font-mono">@{u.username}</div>
                      </td>
                      <td className="py-2.5 px-3 text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-secondary/70" />
                          <span>{u.email}</span>
                        </div>
                        {(u.phone || u.phone_number) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-secondary/70 mt-0.5">
                            <Phone className="w-3 h-3 text-secondary/70" />
                            <span>{u.phone || u.phone_number}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role ? u.role.replace('_', ' ') : 'USER'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-charcoal font-medium">
                        {u.warehouse_name || (
                          <span className="text-secondary italic">All Hubs (Central)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-secondary">
                        {u.date_joined ? formatDate(u.date_joined) : 'Oct 2026'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Permission Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <Card key={r.value} className="p-4 border-forest-100 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-charcoal">{r.label}</span>
                <Badge variant={getRoleBadgeVariant(r.value)}>{r.value}</Badge>
              </div>
              <p className="text-xs text-secondary leading-relaxed">{r.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Onboard Organization Staff Member"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={formData.first_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="e.g. Ramesh"
            />
            <Input
              label="Last Name"
              required
              value={formData.last_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="e.g. Patel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              required
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.in"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal mb-1 block">Role Assignment</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:ring-1 focus:ring-emerald-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal mb-1 block">Assigned Warehouse</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-forest-200 bg-ivory text-charcoal focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Warehouses (Global Access)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Temporary Password"
            type="text"
            required
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
            helperText="Staff member can reset upon first sign in."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-forest-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={creating}>
              {creating ? 'Creating Account...' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
