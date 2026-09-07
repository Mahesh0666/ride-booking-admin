import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email || !password) { setError('Please enter email and password'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      setMessage('OTP sent to your admin email. Check your inbox.');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      await verifyLoginOtp(email, otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/60 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 sm:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-indigo-200">
            <i className="fas fa-car"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">
            {step === 'login' ? 'Ride Admin' : 'Enter OTP'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 'login' ? 'Sign in to manage your fleet' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {/* Step 1: Email + Password */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-600 text-sm bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200/60 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
              ) : (
                <><i className="fas fa-arrow-right-to-bracket"></i> Sign In</>
              )}
            </button>

            <Link to="/forgot-password" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Forgot Password?
            </Link>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
              <div className="relative">
                <i className="fas fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition text-center text-2xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Check your email inbox (and spam folder)</p>
            </div>

            {message && (
              <div className="text-emerald-600 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                <i className="fas fa-check-circle"></i> {message}
              </div>
            )}
            {error && (
              <div className="text-rose-600 text-sm bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200/60 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
              ) : (
                <><i className="fas fa-check-circle"></i> Verify & Login</>
              )}
            </button>

            <button type="button" onClick={() => { setStep('login'); setError(''); setMessage(''); setOtp(''); }} className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition">
              <i className="fas fa-arrow-left mr-1.5"></i> Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
