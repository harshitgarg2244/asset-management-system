import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// SECURITY: No role selector here on purpose - every account created here
// becomes an Employee, and the backend ignores any role sent in the
// request too, so this can't be bypassed by calling the API directly.
// Elevated access happens AFTER logging in, via "Request Access".
const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-3.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm animate-scaleIn">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Layers size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-slate-900">AssetTrack</span>
        </div>

        <h1 className="font-display text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">
          New accounts are created as <span className="font-medium text-slate-700">Employee</span> by default.
        </p>

        <div className="flex items-start gap-2.5 bg-brand-50 text-brand-700 text-xs rounded-lg px-3 py-2.5 mb-5 leading-relaxed">
          <ShieldCheck size={15} className="shrink-0 mt-0.5" />
          <span>Need Auditor, IT Manager, or Admin access? Once you're signed in, go to <span className="font-medium">Request Access</span> to submit a request for review.</span>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}

        <input name="name" value={form.name} onChange={handleChange} required placeholder="Full name" className={inputClasses} />
        <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email" className={inputClasses} />
        <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Password" className={inputClasses} />
        <input name="department" value={form.department} onChange={handleChange} required placeholder="Department (e.g. Engineering)" className={`${inputClasses} mb-6`} />

        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 group">
          {loading ? 'Creating account...' : (<>Create Account<ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" /></>)}
        </button>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-slate-900 font-medium hover:text-brand-600 transition-colors">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
