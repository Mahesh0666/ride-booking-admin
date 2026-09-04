import { useState, useEffect, useMemo } from 'react';
import adminService, { CabBooking } from '../services/adminService';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'in-transit': 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
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

export default function CabBookingsPage() {
  const [bookings, setBookings] = useState<CabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'in-transit' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getAllCabBookings();
        setBookings(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load bookings');
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
          (typeof b.user === 'object' && b.user?.name?.toLowerCase().includes(term)) ||
          (typeof b.driver === 'object' && b.driver?.name?.toLowerCase().includes(term))
        );
      });
  }, [bookings, activeTab, searchTerm]);

  const handleConfirm = async (bookingId: string) => {
    try {
      await adminService.confirmCabBooking(bookingId);
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'confirmed' } : b));
    } catch (e: any) {
      alert('Failed to confirm booking: ' + (e.message || 'Unknown error'));
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await adminService.cancelCabBooking(bookingId);
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) {
      alert('Failed to cancel booking: ' + (e.message || 'Unknown error'));
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      await adminService.completeCabBooking(bookingId);
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'completed' } : b));
    } catch (e: any) {
      alert('Failed to complete booking: ' + (e.message || 'Unknown error'));
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All Bookings', count: bookings.length, icon: 'fa-car' },
    { key: 'pending' as const, label: 'Pending', count: bookings.filter(b => b.status === 'pending').length, icon: 'fa-clock' },
    { key: 'confirmed' as const, label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length, icon: 'fa-check-circle' },
    { key: 'in-transit' as const, label: 'In Transit', count: bookings.filter(b => b.status === 'in-transit').length, icon: 'fa-road' },
    { key: 'completed' as const, label: 'Completed', count: bookings.filter(b => b.status === 'completed').length, icon: 'fa-flag-checkered' },
    { key: 'cancelled' as const, label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length, icon: 'fa-times-circle' },
  ];

  const statCards = [
    { label: 'Total Bookings', value: bookings.length, icon: 'fa-car', color: 'indigo', borderColor: 'border-l-indigo-500' },
    { label: 'Active', value: bookings.filter(b => ['pending', 'confirmed', 'in-transit'].includes(b.status)).length, icon: 'fa-spinner', color: 'blue', borderColor: 'border-l-blue-500' },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: 'fa-check-circle', color: 'emerald', borderColor: 'border-l-emerald-500' },
    { label: 'Revenue', value: `₹${bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.fare || 0), 0).toLocaleString()}`, icon: 'fa-rupee-sign', color: 'purple', borderColor: 'border-l-purple-500' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading bookings...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load bookings</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cab Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage cab bookings, confirm rides, and track delivery status.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
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
            placeholder="Search bookings by address, user, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 py-16 text-center">
            <i className="fas fa-car text-5xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-medium">No bookings found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredBookings.map(booking => {
            const isExpanded = expandedBooking === booking._id;
            const userName = typeof booking.user === 'object' ? booking.user.name : 'User';
            const driverName = typeof booking.driver === 'object' ? booking.driver.name : 'No driver assigned';
            return (
              <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-slate-200/70 card-hover overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-car"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-800">{userName}</h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <i className="fas fa-circle text-[6px] text-emerald-500"></i> {booking.pickupLocation?.address || 'N/A'}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <i className="fas fa-circle text-[6px] text-rose-500"></i> {booking.dropLocation?.address || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">₹{booking.fare?.toLocaleString() || '—'}</p>
                        <p className="text-xs text-slate-400">{driverName}</p>
                      </div>
                      <button onClick={() => setExpandedBooking(isExpanded ? null : booking._id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">
                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`expandable-content ${isExpanded ? 'open' : ''} px-5 pb-5 border-t border-slate-100`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Vehicle Type</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">{booking.vehicleType || 'Standard'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Created</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{new Date(booking.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Driver</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{driverName}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    {booking.status === 'pending' && (
                      <button onClick={() => handleConfirm(booking._id)} className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition">
                        <i className="fas fa-check mr-1.5"></i>Confirm
                      </button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button onClick={() => handleCancel(booking._id)} className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition">
                        <i className="fas fa-times mr-1.5"></i>Cancel
                      </button>
                    )}
                    {booking.status === 'in-transit' && (
                      <button onClick={() => handleComplete(booking._id)} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition">
                        <i className="fas fa-flag-checkered mr-1.5"></i>Complete
                      </button>
                    )}
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
