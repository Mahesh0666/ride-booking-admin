import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: 'fa-tachometer-alt' },
  { name: 'Users', href: '/users', icon: 'fa-users' },
  { name: 'Drivers', href: '/drivers', icon: 'fa-id-card' },
  { name: 'Rides', href: '/rides', icon: 'fa-route' },
  { name: 'Cab Bookings', href: '/cab-bookings', icon: 'fa-car' },
  { name: 'Payments', href: '/payments', icon: 'fa-credit-card' },
  { name: 'Settings', href: '/settings', icon: 'fa-cog' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };
  const current = NAV_ITEMS.find((n) => location.pathname === n.href);
  const displayName = user?.name || 'Admin User';
  const displayEmail = user?.email || 'maheshbabuv57@gmail.com';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/80">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/80 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm shadow-md shadow-indigo-200">
            <i className="fas fa-car"></i>
          </div>
          <span className="font-bold text-slate-800 text-lg">RideAdmin</span>
          <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">v2.0</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <i className={`fas ${item.icon} w-5 text-center ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                {item.name}
                {isActive && <span className="ml-auto w-1.5 h-6 rounded-full bg-indigo-600"></span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-200/80 p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition" title="Sign out">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-600 hover:text-slate-800 p-1.5 -ml-1.5">
            <i className="fas fa-bars text-lg"></i>
          </button>
          <div className="flex-1 flex items-center gap-4">
            <div className="relative hidden sm:block">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input type="text" placeholder="Search anything…" className="w-64 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-slate-100">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center badge-pulse">3</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-slate-100">
              <i className="fas fa-comment-dots text-lg"></i>
            </button>
            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200/60">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{initials}</div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">{displayName.split(' ')[0]}</span>
              <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition rounded-lg" title="Sign out">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
