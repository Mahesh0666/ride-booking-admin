import { useState, useEffect, useMemo } from 'react';
import adminService, { Driver } from '../services/adminService';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  requested: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${color}`}>
      {status}
    </span>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getAllDrivers();
        setDrivers(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load drivers');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers
      .filter(d => {
        if (activeTab === 'pending') return !d.isApproved && !d.isRejected;
        if (activeTab === 'approved') return d.isApproved;
        if (activeTab === 'rejected') return d.isRejected;
        return true;
      })
      .filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.includes(searchTerm)
      );
  }, [drivers, activeTab, searchTerm]);

  const handleApprove = async (driverId: string) => {
    try {
      await adminService.approveDriver(driverId);
      setDrivers(drivers.map(d => d._id === driverId ? { ...d, isApproved: true, isRejected: false } : d));
    } catch (e: any) {
      alert('Failed to approve driver: ' + (e.message || 'Unknown error'));
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await adminService.rejectDriver(driverId);
      setDrivers(drivers.map(d => d._id === driverId ? { ...d, isApproved: false, isRejected: true } : d));
    } catch (e: any) {
      alert('Failed to reject driver: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await adminService.deleteDriver(driverId);
      setDrivers(drivers.filter(d => d._id !== driverId));
    } catch (e: any) {
      alert('Failed to delete driver: ' + (e.message || 'Unknown error'));
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All Drivers', count: drivers.length, icon: 'fa-id-card' },
    { key: 'pending' as const, label: 'Pending', count: drivers.filter(d => !d.isApproved && !d.isRejected).length, icon: 'fa-clock' },
    { key: 'approved' as const, label: 'Approved', count: drivers.filter(d => d.isApproved).length, icon: 'fa-check-circle' },
    { key: 'rejected' as const, label: 'Rejected', count: drivers.filter(d => d.isRejected).length, icon: 'fa-times-circle' },
  ];

  const getDriverStatus = (d: Driver) => {
    if (d.isApproved) return 'approved';
    if (d.isRejected) return 'rejected';
    return 'pending';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading drivers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load drivers</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage drivers, review approvals, and monitor performance.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Drivers', value: drivers.length, icon: 'fa-id-card', color: 'indigo', borderColor: 'border-l-indigo-500' },
          { label: 'Approved', value: drivers.filter(d => d.isApproved).length, icon: 'fa-check-circle', color: 'emerald', borderColor: 'border-l-emerald-500' },
          { label: 'Pending', value: drivers.filter(d => !d.isApproved && !d.isRejected).length, icon: 'fa-clock', color: 'amber', borderColor: 'border-l-amber-500' },
          { label: 'Rejected', value: drivers.filter(d => d.isRejected).length, icon: 'fa-times-circle', color: 'rose', borderColor: 'border-l-rose-500' },
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

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-4">
        <div className="relative">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search drivers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Driver Cards */}
      <div className="space-y-4">
        {filteredDrivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 py-16 text-center">
            <i className="fas fa-id-card text-5xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-medium">No drivers found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredDrivers.map(driver => {
            const isExpanded = expandedDriver === driver._id;
            const status = getDriverStatus(driver);
            return (
              <div key={driver._id} className="bg-white rounded-xl shadow-sm border border-slate-200/70 card-hover overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                        {driver.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-800">{driver.name}</h3>
                          <StatusBadge status={status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1"><i className="fas fa-envelope text-slate-400"></i> {driver.email}</span>
                          <span className="text-sm text-slate-500 flex items-center gap-1"><i className="fas fa-phone text-slate-400"></i> {driver.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedDriver(isExpanded ? null : driver._id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">
                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                      {!driver.isApproved && (
                        <button onClick={() => handleApprove(driver._id)} className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition">
                          <i className="fas fa-check mr-1"></i>Approve
                        </button>
                      )}
                      {!driver.isRejected && (
                        <button onClick={() => handleReject(driver._id)} className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition">
                          <i className="fas fa-times mr-1"></i>Reject
                        </button>
                      )}
                      <button onClick={() => handleDelete(driver._id)} className="w-8 h-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center">
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`expandable-content ${isExpanded ? 'open' : ''} px-5 pb-5 border-t border-slate-100`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Vehicle</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{driver.vehicle?.type || 'Not specified'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{driver.vehicle?.make || ''} {driver.vehicle?.model || ''}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">License</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{driver.licenseNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Documents</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{driver.documents?.length || 0} uploaded</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
