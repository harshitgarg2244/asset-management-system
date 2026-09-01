import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, Boxes, ScrollText } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">AssetTrack</span>
        </div>

        <div className="relative animate-fadeInUp">
          <h2 className="font-display text-3xl font-semibold leading-tight max-w-md">
            One record for every laptop, license, and login.
          </h2>
          <p className="text-slate-400 mt-3 max-w-sm text-sm leading-relaxed">
            Track hardware and software across your organization, and keep an audit trail nobody can quietly edit.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Boxes, text: 'Full lifecycle tracking, from purchase to retirement' },
              { icon: ShieldCheck, text: 'Role-based access for admins, auditors, and staff' },
              { icon: ScrollText, text: 'Immutable audit logs for every change made' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon size={15} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Built for internal IT & operations teams.</p>
      </div>

      <div className="flex items-center justify-center p-8 bg-canvas">
        <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fadeInUp">
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your AssetTrack account</p>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-5">{error}</div>}

          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
            placeholder="you@company.com"
          />

          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-brand-600 transition-colors">Forgot password?</Link>
          </div>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-6 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
            placeholder="••••••••"
          />

          <button
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? 'Signing in...' : (<>Sign In<ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" /></>)}
          </button>

          <p className="text-sm text-slate-500 mt-6 text-center">
            No account? <Link to="/register" className="text-slate-900 font-medium hover:text-brand-600 transition-colors">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
