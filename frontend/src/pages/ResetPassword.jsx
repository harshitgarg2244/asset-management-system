import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm animate-scaleIn">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Layers size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-slate-900">AssetTrack</span>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          {success ? (
            <div className="text-center animate-fadeInUp">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} />
              </div>
              <h1 className="font-display text-xl font-semibold text-slate-900 mb-1">Password reset</h1>
              <p className="text-slate-500 text-sm mb-6">You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-slate-900 mb-1">Set a new password</h1>
              <p className="text-slate-500 text-sm mb-6">Choose something you haven't used before.</p>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}

              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none" />
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Re-enter your new password"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-6 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 group">
                  {loading ? 'Resetting...' : (<>Reset Password<ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" /></>)}
                </button>
              </form>

              <p className="text-sm text-slate-500 mt-6 text-center">
                <Link to="/login" className="text-slate-900 font-medium hover:text-brand-600 transition-colors">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
