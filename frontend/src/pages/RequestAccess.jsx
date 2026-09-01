import { useEffect, useState } from 'react';
import { ShieldQuestion, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

// The "ask for elevated access" half of the request/approve flow. Anyone
// can submit one; a Super Admin or Auditor reviews it later from
// User Management. Requires a reason (min 10 chars, enforced by the
// backend validator too) so reviewers have something real to judge.
const STATUS_STYLES = {
  PENDING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  APPROVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const RequestAccess = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ requestedRole: 'IT_MANAGER', reason: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = ['IT_MANAGER', 'AUDITOR', 'SUPER_ADMIN'].filter((r) => r !== user.role);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/role-requests/mine');
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const hasPending = myRequests.some((r) => r.status === 'PENDING');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/role-requests', form);
      setForm({ requestedRole: roleOptions[0] || 'IT_MANAGER', reason: '' });
      fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-3.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none';

  return (
    <Layout eyebrow="Access" title="Request Access" subtitle="Ask a Super Admin or Auditor to grant you a different role.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fadeInUp">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><ShieldQuestion size={17} /></div>
            <h3 className="font-display font-semibold text-slate-900">New Request</h3>
          </div>

          {hasPending ? (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3.5 py-3">
              You already have a pending request. Please wait for it to be reviewed before submitting another.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-3.5">{error}</div>}

              <label className="block text-sm font-medium text-slate-700 mb-1.5">Requested Role</label>
              <select value={form.requestedRole} onChange={(e) => setForm({ ...form, requestedRole: e.target.value })} className={inputClasses}>
                {roleOptions.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
                minLength={10}
                rows={4}
                placeholder="Explain why you need this access (at least 10 characters)..."
                className={`${inputClasses} resize-none`}
              />

              <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
          <h3 className="font-display font-semibold text-slate-900 mb-4">Your Request History</h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : myRequests.length === 0 ? (
            <p className="text-sm text-slate-400">You haven't submitted any requests yet.</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((r) => {
                const style = STATUS_STYLES[r.status];
                const Icon = style.icon;
                return (
                  <div key={r._id} className="flex items-start gap-3 border border-slate-100 rounded-lg px-3.5 py-3">
                    <div className={`w-7 h-7 rounded-lg ${style.bg} ${style.color} flex items-center justify-center shrink-0`}><Icon size={14} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{r.requestedRole.replace('_', ' ')}</p>
                        <span className={`text-xs font-medium ${style.color}`}>{r.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.reason}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RequestAccess;
