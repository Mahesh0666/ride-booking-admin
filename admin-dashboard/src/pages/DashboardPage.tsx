import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import adminService, { DashboardStats, User, Ride, CabBooking } from '../services/adminService';

const OVERVIEW_TABS = [
  { key: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
  { key: 'users', label: 'Users', icon: 'fa-users' },
  { key: 'drivers', label: 'Drivers', icon: 'fa-car' },
  { key: 'revenue', label: 'Revenue', icon: 'fa-money-bill-wave' },
];

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  requested: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'in-transit': 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${color}`}>
      {status.replace(/[_-]/g, ' ')}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const miniData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width={80} height={30}>
      <LineChart data={miniData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const [overviewTab, setOverviewTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<CabBooking[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const [s, u, d, b, r] = await Promise.allSettled([
          adminService.getDashboardStats(),
          adminService.getAllUsers(),
          adminService.getAllDrivers(),
          adminService.getAllCabBookings(),
          adminService.getAllRides(),
        ]);
        if (s.status === 'fulfilled') setStats(s.value);
        if (u.status === 'fulfilled') setUsers(u.value);
        if (d.status === 'fulfilled') setDrivers(d.value);
        if (b.status === 'fulfilled') setBookings(b.value);
        if (r.status === 'fulfilled') setRides(r.value);
      } catch (e: any) { setError(e.message || 'Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const totalUsers = useMemo(() => stats?.totalUsers ?? users.length, [stats, users]);
  const totalDrivers = useMemo(() => stats?.totalDrivers ?? drivers.length, [stats, drivers]);
  const totalRides = useMemo(() => stats?.totalRides ?? rides.length, [stats, rides]);
  const totalRevenue = useMemo(() => stats?.totalRevenue ?? bookings.reduce((s, b) => s + (b.fare || 0), 0), [stats, bookings]);

  const recentRides = useMemo(() => [...rides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6), [rides]);
  const recentBookings = useMemo(() => [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [bookings]);

  const userTrend = useMemo(() => {
    const now = new Date();
    const counts = [0, 0, 0, 0];
    const labels = ['4w+', '3-4w', '2-3w', '1-2w'];
    const thresholds = [28, 21, 14, 7];
    users.forEach(u => {
      const d = new Date(u.createdAt);
      const days = (now.getTime() - d.getTime()) / 86400000;
      for (let i = 0; i < 4; i++) { if (days >= thresholds[i] && (i === 0 || days < thresholds[i - 1])) { counts[i]++; break; } }
    });
    return labels.map((name, i) => ({ name, count: counts[i] }));
  }, [users]);

  const rideStatusData = useMemo(() => {
    const m: Record<string, number> = {};
    rides.forEach(r => { m[r.status] = (m[r.status] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name: name.replace(/[_-]/g, ' '), value }));
  }, [rides]);

  const driverStatusData = useMemo(() => {
    const m: Record<string, number> = {};
    drivers.forEach((d: any) => { m[d.isApproved ? 'Approved' : 'Pending'] = (m[d.isApproved ? 'Approved' : 'Pending'] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [drivers]);

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

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load dashboard</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  const statCards = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: 'fa-users', color: 'indigo', borderColor: 'border-indigo-500', trend: '+12%', trendUp: true, trendValue: `${Math.round(totalUsers * 0.12)} new`, data: userTrend.map(d => d.count) },
    { label: 'Total Drivers', value: totalDrivers.toLocaleString(), icon: 'fa-car', color: 'emerald', borderColor: 'border-emerald-500', trend: '+8%', trendUp: true, trendValue: `${Math.round(totalDrivers * 0.08)} new`, data: driverStatusData.map(d => d.value) },
    { label: 'Total Rides', value: totalRides.toLocaleString(), icon: 'fa-route', color: 'amber', borderColor: 'border-amber-500', trend: '+23%', trendUp: true, trendValue: `${Math.round(totalRides * 0.23)} new`, data: rideStatusData.map(d => d.value) },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: 'fa-rupee-sign', color: 'purple', borderColor: 'border-purple-500', trend: '+18%', trendUp: true, trendValue: `₹${Math.round(totalRevenue * 0.18).toLocaleString()}`, data: revenueData.map(d => d.amount) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening with your platform today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <i className="fas fa-download mr-1.5"></i> Export
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200/60 transition">
            <i className="fas fa-plus mr-1.5"></i> Add New
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((c, i) => (
          <div key={i} className={`stat-card bg-white rounded-xl shadow-sm border border-slate-200/70 p-5 border-l-4 ${c.borderColor}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{c.value}</h3>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-${c.color}-100 text-${c.color}-600 flex items-center justify-center`}>
                <i className={`fas ${c.icon} text-lg`}></i>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <span className="inline-flex items-center text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <i className="fas fa-arrow-up text-[10px] mr-1"></i> {c.trend}
              </span>
              <span className="text-xs text-slate-400">{c.trendValue}</span>
              <Sparkline data={c.data as number[]} color={c.color === 'indigo' ? '#6366f1' : c.color === 'emerald' ? '#10b981' : c.color === 'amber' ? '#f59e0b' : '#a855f7'} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {OVERVIEW_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setOverviewTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${overviewTab === t.key ? 'tab-active' : 'tab-inactive'}`}
          >
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {overviewTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ride Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <i className="fas fa-chart-pie text-indigo-500"></i> Ride Distribution
            </h3>
            {rideStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={rideStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={3}>
                    {rideStatusData.map((_, i) => <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#a855f7'][i % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} rides`, 'Count']} contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-chart-pie text-5xl opacity-30"></i></div>
            )}
          </div>

          {/* Driver Approval */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <i className="fas fa-chart-bar text-indigo-500"></i> Driver Approval Status
            </h3>
            {driverStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={driverStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {driverStatusData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#f59e0b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-chart-bar text-5xl opacity-30"></i></div>
            )}
          </div>
        </div>
      )}

      {overviewTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-chart-line text-indigo-500"></i> User Registration Trend
          </h3>
          {userTrend.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={userTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-users text-5xl opacity-30"></i></div>
          )}
        </div>
      )}

      {overviewTab === 'drivers' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-car text-indigo-500"></i> Driver Status Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {driverStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={driverStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                      {driverStatusData.map((d, i) => <Cell key={i} fill={d.name === 'Approved' ? '#10b981' : '#f59e0b'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-car text-5xl opacity-30"></i></div>
              )}
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-emerald-700 font-medium">Approved Drivers</p><p className="text-3xl font-bold text-emerald-800 mt-1">{drivers.filter((d: any) => d.isApproved).length}</p></div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><i className="fas fa-check-circle text-xl"></i></div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm text-amber-700 font-medium">Pending Approval</p><p className="text-3xl font-bold text-amber-800 mt-1">{drivers.filter((d: any) => !d.isApproved).length}</p></div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><i className="fas fa-clock text-xl"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {overviewTab === 'revenue' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-chart-line text-emerald-500"></i> Monthly Revenue
          </h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400"><i className="fas fa-chart-line text-5xl opacity-30"></i></div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-clock text-indigo-500"></i> Recent Rides
          </h3>
          <div className="overflow-x-auto table-wrap">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">ID</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Fare</th>
                </tr>
              </thead>
              <tbody>
                {recentRides.map(r => (
                  <tr key={r._id} className="border-b border-slate-100/80 hover:bg-slate-50/80 transition">
                    <td className="py-3 text-sm text-slate-600 font-mono text-xs">{r._id.slice(-8)}</td>
                    <td className="py-3 text-sm font-medium text-slate-800">{typeof r.rider === 'object' ? r.rider.name : 'User'}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3 text-sm font-semibold text-slate-800">₹{r.fare?.toLocaleString() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-bolt text-amber-500"></i> Activity Feed
          </h3>
          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {[
              { color: 'emerald', icon: 'fa-check', text: 'Ride #8823 completed successfully', time: '2 min ago' },
              { color: 'indigo', icon: 'fa-user-plus', text: 'New user Sarah Johnson registered', time: '8 min ago' },
              { color: 'purple', icon: 'fa-car', text: 'Driver David Williams approved', time: '15 min ago' },
              { color: 'blue', icon: 'fa-credit-card', text: 'Payment of ₹1,250 received', time: '22 min ago' },
              { color: 'rose', icon: 'fa-times-circle', text: 'Ride #8819 cancelled by user', time: '35 min ago' },
              { color: 'amber', icon: 'fa-exclamation-triangle', text: 'Driver license verification pending', time: '45 min ago' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200/60">
                <div className={`w-9 h-9 rounded-full bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${item.icon} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium">{item.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5"><i className="far fa-clock mr-1"></i>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-car text-indigo-500"></i> Recent Cab Bookings
          </h3>
          <div className="overflow-x-auto table-wrap">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">ID</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">User</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Pickup</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Drop</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 font-medium">Fare</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b._id} className="border-b border-slate-100/80 hover:bg-slate-50/80 transition">
                    <td className="py-3 text-sm text-slate-600 font-mono text-xs">{b._id.slice(-8)}</td>
                    <td className="py-3 text-sm font-medium text-slate-800">{typeof b.user === 'object' ? b.user.name : 'User'}</td>
                    <td className="py-3 text-sm text-slate-600 truncate max-w-[150px]">{b.pickupLocation?.address || '—'}</td>
                    <td className="py-3 text-sm text-slate-600 truncate max-w-[150px]">{b.dropLocation?.address || '—'}</td>
                    <td className="py-3"><StatusBadge status={b.status} /></td>
                    <td className="py-3 text-sm font-semibold text-slate-800">₹{b.fare?.toLocaleString() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
