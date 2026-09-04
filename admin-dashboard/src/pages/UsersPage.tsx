import { useState, useEffect, useMemo } from 'react';
import adminService, { User } from '../services/adminService';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getAllUsers();
        setUsers(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        if (activeTab === 'verified') return u.isVerified;
        if (activeTab === 'unverified') return !u.isVerified;
        return true;
      })
      .filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm, activeTab]);

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await adminService.updateUser(editingUser._id, {
        name: editingUser.name,
        email: editingUser.email,
        isVerified: editingUser.isVerified,
      });
      setUsers(users.map(u => u._id === editingUser._id ? editingUser : u));
      setShowModal(false);
      setEditingUser(null);
    } catch (e: any) {
      alert('Failed to update user: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (e: any) {
      alert('Failed to delete user: ' + (e.message || 'Unknown error'));
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All Users', count: users.length, icon: 'fa-users' },
    { key: 'verified' as const, label: 'Verified', count: users.filter(u => u.isVerified).length, icon: 'fa-check-circle' },
    { key: 'unverified' as const, label: 'Unverified', count: users.filter(u => !u.isVerified).length, icon: 'fa-exclamation-circle' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-slate-500 font-medium">Loading users...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-rose-600">
      <i className="fas fa-exclamation-triangle text-5xl mb-4"></i>
      <p className="text-xl font-semibold mb-2">Failed to load users</p>
      <p className="text-sm text-slate-500">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage registered users, verify accounts, and handle account issues.</p>
        </div>
        <button className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200/60 transition">
          <i className="fas fa-plus mr-1.5"></i> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: 'fa-users', color: 'indigo' },
          { label: 'Verified Users', value: users.filter(u => u.isVerified).length, icon: 'fa-check-circle', color: 'emerald' },
          { label: 'Unverified Users', value: users.filter(u => !u.isVerified).length, icon: 'fa-exclamation-circle', color: 'amber' },
        ].map((s, i) => (
          <div key={i} className="stat-card bg-white rounded-xl shadow-sm border border-slate-200/70 p-5 border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{s.value.toLocaleString()}</h3>
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
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto table-wrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/80">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">User</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Role</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Joined</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <i className="fas fa-users text-5xl text-slate-200 mb-4"></i>
                    <p className="text-slate-400 font-medium">No users found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="border-b border-slate-100/80 hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                        <span className={`status-dot ${user.isVerified ? 'online' : 'offline'}`}></span>
                        <span className={user.isVerified ? 'text-emerald-700' : 'text-slate-500'}>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${user.isAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditUser(user)} className="w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center" title="Edit">
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button onClick={() => handleDeleteUser(user._id)} className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 transition flex items-center justify-center" title="Delete">
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editingUser && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <i className="fas fa-user-edit text-indigo-500"></i> Edit User
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Verified</p>
                  <p className="text-xs text-slate-400">Account verification status</p>
                </div>
                <div
                  className={`toggle ${editingUser.isVerified ? 'active' : ''}`}
                  onClick={() => setEditingUser({ ...editingUser, isVerified: !editingUser.isVerified })}
                >
                  <div className="thumb"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Admin</p>
                  <p className="text-xs text-slate-400">Admin privileges</p>
                </div>
                <div
                  className={`toggle ${editingUser.isAdmin ? 'active' : ''}`}
                  onClick={() => setEditingUser({ ...editingUser, isAdmin: !editingUser.isAdmin })}
                >
                  <div className="thumb"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSaveUser} className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200/60 transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
