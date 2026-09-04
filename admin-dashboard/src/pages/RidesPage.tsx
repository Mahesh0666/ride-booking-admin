import { useState, useEffect, useMemo } from 'react';
import adminService, { Ride } from '../services/adminService';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  requested: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${color}`}>
      {status.replace(/[_-]/g, ' ')}
    </span>
  );
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'requested' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getAllRides();
        setRides(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load rides');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const filteredRides = useMemo(() => {
    return rides
      .filter(r => activeTab === 'all' || r.status === activeTab)
      .filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          r.pickupLocation?.address?.toLowerCase().includes(term) ||
          r.dropoffLocation?.address?.toLowerCase().includes(term) ||
          (typeof r.rider === 'object' && r.rider?.name?.toLowerCase().includes(term)) ||
          (typeof r.driver === 'object' && r.driver?.name?.toLowerCase().includes(term))
        );
      });
  }, [rides, activeTab, searchTerm]);

  const handleCancel = async (rideId: string) => {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    try {
      await adminService.cancelRide(rideId);
      setRides(rides.map(r => r._id === rideId ? { ...r, status: 'cancelled' } : r));
    } catch (e: any) {
      alert('Failed to cancel ride: ' + (e.message || 'Unknown error'));
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All Rides', count: rides.length, icon: 'fa-route' },
    { key: 'requested' as const, label: 'Requested', count: rides.filter(r => r.status === 'requested').length, icon: 'fa-clock' },
    { key: 'in_progress' as const, label: 'In Progress', count: rides.filter(r => r.status === 'in_progress').length, icon: 'fa-spinner' },
    { key: 'completed' as const, label: 'Completed', count: rides.filter(r => r.status === 'completed').length, icon: 'fa-check-circle' },
    { key: 'cancelled' as const, label: 'Cancelled', count: rides.filter(r => r.status === 'cancelled').length, icon: 'fa-times-circle' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading rides...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load rides</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ride Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage all rides across the platform in real-time.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rides', value: rides.length, icon: 'fa-route', color: 'indigo', borderColor: 'border-l-indigo-500' },
          { label: 'Completed', value: rides.filter(r => r.status === 'completed').length, icon: 'fa-check-circle', color: 'emerald', borderColor: 'border-l-emerald-500' },
          { label: 'In Progress', value: rides.filter(r => r.status === 'in_progress').length, icon: 'fa-spinner', color: 'purple', borderColor: 'border-l-purple-500' },
          { label: 'Total Revenue', value: `₹${rides.reduce((s, r) => s + (r.fare || 0), 0).toLocaleString()}`, icon: 'fa-rupee-sign', color: 'amber', borderColor: 'border-l-amber-500' },
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
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'tab-active' : 'tab-inactive'}`}
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
            placeholder="Search rides by address, user, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Ride Cards */}
      <div className="space-y-4">
        {filteredRides.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 py-16 text-center">
            <i className="fas fa-route text-5xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-medium">No rides found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredRides.map(ride => {
            const isExpanded = expandedRide === ride._id;
            const userName = typeof ride.rider === 'object' ? ride.rider.name : 'User';
            const driverName = typeof ride.driver === 'object' ? ride.driver.name : 'No driver';
            return (
              <div key={ride._id} className="bg-white rounded-xl shadow-sm border border-slate-200/70 card-hover overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-route"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-800">{userName}</h3>
                          <StatusBadge status={ride.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1"><i className="fas fa-map-marker-alt text-emerald-500"></i> {ride.pickupLocation?.address || 'N/A'}</span>
                          <span className="text-sm text-slate-500 flex items-center gap-1"><i className="fas fa-map-marker-alt text-rose-500"></i> {ride.dropoffLocation?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">₹{ride.fare?.toLocaleString() || '—'}</p>
                        <p className="text-xs text-slate-400">{driverName}</p>
                      </div>
                      <button onClick={() => setExpandedRide(isExpanded ? null : ride._id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">
                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`expandable-content ${isExpanded ? 'open' : ''} px-5 pb-5 border-t border-slate-100`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Distance & Duration</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{ride.distance ? `${ride.distance} km` : 'N/A'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ride.duration ? `${ride.duration} min` : 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ride Details</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">Fare: ₹{ride.fare?.toLocaleString() || 'N/A'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(ride.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                    <div className="flex justify-end mt-4 pt-3 border-t border-slate-200/60">
                      <button onClick={() => handleCancel(ride._id)} className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition">
                        <i className="fas fa-times mr-1.5"></i>Cancel Ride
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
