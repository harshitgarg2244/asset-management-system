import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import api from '../api/axios';

// SIMPLIFICATION: a real production app would email the reset link and
// never show it on screen. This project has no email service configured,
// so - purely so you can test the complete flow - the backend hands the
// link back directly, and we display it here with a clear label.
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
          <h1 className="font-display text-xl font-semibold text-slate-900 mb-1">Forgot your password?</h1>
          <p className="text-slate-500 text-sm mb-6">Enter your email and we'll generate a reset link.</p>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}

          {!result ? (
            <form onSubmit={handleSubmit}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
              />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 group">
                {loading ? 'Sending...' : (<>Send Reset Link<ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" /></>)}
              </button>
            </form>
          ) : (
            <div className="animate-fadeInUp">
              <div className="flex items-start gap-2.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg px-3.5 py-3 mb-4">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                {result.message}
              </div>
              {result.resetUrl && (
                <>
                  <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2.5 mb-3 leading-relaxed">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    This project doesn't have email sending configured, so your reset link is shown directly below instead of being emailed.
                  </div>
                  <Link to={result.resetUrl} className="block w-full text-center bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">
                    Continue to Reset Password
                  </Link>
                </>
              )}
            </div>
          )}

          <p className="text-sm text-slate-500 mt-6 text-center">
            <Link to="/login" className="text-slate-900 font-medium hover:text-brand-600 transition-colors">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
