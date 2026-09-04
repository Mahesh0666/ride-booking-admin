import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'otp' | 'password' | 'done'>('otp');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setLoading(true);
    try {
      await adminService.forgotPassword();
      setMessage('OTP sent to your admin email. Check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      await adminService.verifyResetOtp(otp);
      setMessage('OTP verified! Now set your new password.');
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword) { setError('Enter new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await adminService.resetPassword(otp, newPassword);
      setMessage('Password reset successful! Confirmation email sent.');
      setStep('done');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/60 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 sm:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-rose-200">
            <i className="fas fa-lock"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">
            {step === 'otp' && 'Verify OTP'}
            {step === 'password' && 'Set New Password'}
            {step === 'done' && 'All Done!'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 'otp' && 'Enter the 6-digit code sent to your admin email'}
            {step === 'password' && 'Create your new password'}
            {step === 'done' && 'Redirecting to login page...'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 'otp' && i === 0 ? 'bg-indigo-600 text-white scale-110' :
                (step === 'password' && i <= 1) || step === 'done' ? 'bg-emerald-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {(step === 'password' && i <= 1) || step === 'done' ? (
                  <i className="fas fa-check"></i>
                ) : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${(step === 'password' && i === 0) || step === 'done' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Send OTP + Enter OTP */}
        {step === 'otp' && (
          <>
            <form onSubmit={handleSendOtp} className="mb-4">
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200/60 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send OTP to Admin Email</>}
              </button>
            </form>

            {message && <SuccessMessage text={message} />}

            <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter OTP</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition text-center text-2xl tracking-[0.3em] font-mono"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Check your email inbox (and spam folder)</p>
              </div>

              {error && <ErrorMessage text={error} />}

              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200/60 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check-circle"></i> Verify OTP</>}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Set New Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition"
                />
              </div>
            </div>

            {error && <ErrorMessage text={error} />}
            {message && <SuccessMessage text={message} />}

            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200/60 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : <><i className="fas fa-check"></i> Reset Password</>}
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl text-emerald-600"></i>
            </div>
            <p className="text-slate-600 font-medium mb-2">Password Reset Complete!</p>
            <p className="text-sm text-slate-400">A confirmation email has been sent.</p>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            <i className="fas fa-arrow-left mr-1"></i> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="text-rose-600 text-sm bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
      <i className="fas fa-exclamation-circle"></i> {text}
    </div>
  );
}

function SuccessMessage({ text }: { text: string }) {
  return (
    <div className="text-emerald-600 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
      <i className="fas fa-check-circle"></i> {text}
    </div>
  );
}
