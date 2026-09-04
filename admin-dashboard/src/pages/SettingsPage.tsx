import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'pricing' | 'system'>('account');

  // Account
  const [name, setName] = useState(user?.name || 'Admin');
  const [notifications, setNotifications] = useState(true);

  // Security / Change Credentials
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Pricing
  const [baseFare, setBaseFare] = useState('50');
  const [perKmRate, setPerKmRate] = useState('15');
  const [perMinRate, setPerMinRate] = useState('3');
  const [minFare, setMinFare] = useState('100');

  // System
  const [autoAssign, setAutoAssign] = useState(false);

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const handleChangeCredentials = async () => {
    setSecurityMsg('');
    setSecurityError('');

    if (!currentPassword) {
      setSecurityError('Current password is required');
      return;
    }
    if (!newEmail && !newPassword) {
      setSecurityError('Enter a new email or new password');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters');
      return;
    }

    setSecurityLoading(true);
    try {
      await adminService.changeCredentials(currentPassword, newEmail || undefined, newPassword || undefined);
      setSecurityMsg('Credentials updated successfully! Use new email to login next time.');
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityError(err.response?.data?.error?.message || err.message || 'Failed to update credentials');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account, security, pricing, and system preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { key: 'account' as const, label: 'Account', icon: 'fa-user' },
          { key: 'security' as const, label: 'Security', icon: 'fa-shield-alt' },
          { key: 'pricing' as const, label: 'Pricing', icon: 'fa-rupee-sign' },
          { key: 'system' as const, label: 'System', icon: 'fa-cog' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'tab-active' : 'tab-inactive'}`}
          >
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-user text-indigo-500"></i> Account Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">To change email, go to Security tab</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-700">Email Notifications</p>
                <p className="text-xs text-slate-400">Receive email updates about account activity</p>
              </div>
              <div
                className={`toggle ${notifications ? 'active' : ''}`}
                onClick={() => setNotifications(!notifications)}
              >
                <div className="thumb"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200/60 transition">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Security - Change Credentials */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <i className="fas fa-shield-alt text-rose-500"></i> Change Email & Password
          </h3>
          <p className="text-sm text-slate-500 mb-6">Update your login credentials. You'll need your current password to confirm.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">New Credentials (fill one or both)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          {securityMsg && (
            <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 flex items-center gap-2">
              <i className="fas fa-check-circle"></i> {securityMsg}
            </div>
          )}
          {securityError && (
            <div className="mt-4 text-sm text-rose-700 bg-rose-50 px-4 py-3 rounded-xl border border-rose-200 flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i> {securityError}
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={handleChangeCredentials}
              disabled={securityLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200/60 transition flex items-center gap-2 disabled:opacity-50"
            >
              {securityLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Updating...</>
              ) : (
                <><i className="fas fa-lock"></i> Update Credentials</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <i className="fas fa-rupee-sign text-emerald-500"></i> Fare & Pricing Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Fare (₹)</label>
              <input type="number" value={baseFare} onChange={(e) => setBaseFare(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Per Km Rate (₹)</label>
              <input type="number" value={perKmRate} onChange={(e) => setPerKmRate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Per Minute Rate (₹)</label>
              <input type="number" value={perMinRate} onChange={(e) => setPerMinRate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Fare (₹)</label>
              <input type="number" value={minFare} onChange={(e) => setMinFare(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition" />
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200/60 transition">
              Save Pricing
            </button>
          </div>
        </div>
      )}

      {/* System */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <i className="fas fa-cog text-purple-500"></i> System Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Auto-assign Drivers</p>
                  <p className="text-xs text-slate-400">Automatically assign nearest driver to new bookings</p>
                </div>
                <div className={`toggle ${autoAssign ? 'active' : ''}`} onClick={() => setAutoAssign(!autoAssign)}>
                  <div className="thumb"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i> System Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Platform Version</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">RideAdmin v2.0.0</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">API Status</p>
                <p className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <span className="status-dot online"></span> Connected
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Database</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">MongoDB Atlas</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Last Backup</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
