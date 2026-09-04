import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService, { CabBooking } from '../services/adminService';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'in-transit': 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${color}`}>
      {status}
    </span>
  );
}

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<CabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getAllCabBookings();
        setBookings(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => activeTab === 'all' || b.status === activeTab)
      .filter(b => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          b.pickupLocation?.address?.toLowerCase().includes(term) ||
          b.dropLocation?.address?.toLowerCase().includes(term) ||
          (typeof b.user === 'object' && b.user?.name?.toLowerCase().includes(term))
        );
      });
  }, [bookings, activeTab, searchTerm]);

  const totalRevenue = useMemo(() => bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.fare || 0), 0), [bookings]);
  const avgFare = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    return completed.length > 0 ? totalRevenue / completed.length : 0;
  }, [bookings, totalRevenue]);
  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return bookings.filter(b => b.status === 'completed' && new Date(b.createdAt).toDateString() === today).reduce((s, b) => s + (b.fare || 0), 0);
  }, [bookings]);

  const revenueData = useMemo(() => {
    const m: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.status === 'completed') {
        const mStr = new Date(b.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        m[mStr] = (m[mStr] || 0) + (b.fare || 0);
      }
    });
    return Object.entries(m).map(([name, amount]) => ({ name, amount }));
  }, [bookings]);

  const tabs = [
    { key: 'all' as const, label: 'All Payments', count: bookings.length, icon: 'fa-credit-card' },
    { key: 'completed' as const, label: 'Completed', count: bookings.filter(b => b.status === 'completed').length, icon: 'fa-check-circle' },
    { key: 'pending' as const, label: 'Pending', count: bookings.filter(b => b.status === 'pending').length, icon: 'fa-clock' },
    { key: 'cancelled' as const, label: 'Refunded', count: bookings.filter(b => b.status === 'cancelled').length, icon: 'fa-undo' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading payments...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load payments</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track payments, view revenue analytics, and manage financial operations.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: 'fa-rupee-sign', color: 'emerald', borderColor: 'border-l-emerald-500' },
          { label: 'Average Fare', value: `₹${Math.round(avgFare).toLocaleString()}`, icon: 'fa-chart-line', color: 'indigo', borderColor: 'border-l-indigo-500' },
          { label: 'Completed Rides', value: bookings.filter(b => b.status === 'completed').length, icon: 'fa-check-circle', color: 'blue', borderColor: 'border-l-blue-500' },
          { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: 'fa-calendar-day', color: 'purple', borderColor: 'border-l-purple-500' },
        ].map((s, i) => (
          <div key={i} className={`stat-card bg-white rounded-xl shadow-sm border border-slate-200/70 p-5 border-l-4 ${s.borderColor}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{s.value}</h3>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-${s.color}-100 text-${s.color}-600 flex items-center justify-center`}>
                <i className={`fas ${s.icon} text-lg`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${activeTab === t.key ? 'tab-active' : 'tab-inactive'}`}
          >
            <i className={`fas ${t.icon}`}></i> {t.label}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fas fa-chart-bar text-emerald-500"></i> Revenue by Month
        </h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-chart-bar text-5xl opacity-30"></i></div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-4">
        <div className="relative">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search by address or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto table-wrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/80">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">ID</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">User</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Pickup</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Drop</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Status</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <i className="fas fa-credit-card text-5xl text-slate-200 mb-4"></i>
                    <p className="text-slate-400 font-medium">No payments found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b._id} className="border-b border-slate-100/80 hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{b._id.slice(-8)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{typeof b.user === 'object' ? b.user.name : 'User'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]">{b.pickupLocation?.address || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]">{b.dropLocation?.address || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">₹{b.fare?.toLocaleString() || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
