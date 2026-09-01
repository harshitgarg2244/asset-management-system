import { useEffect, useState } from 'react';
import { Plus, X, UserPlus, UserMinus, KeyRound } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Licenses = () => {
  const { user } = useAuth();
  const canManage = ['SUPER_ADMIN', 'IT_MANAGER'].includes(user.role);

  const [licenses, setLicenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningLicense, setAssigningLicense] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [form, setForm] = useState({ name: '', vendor: '', totalSeats: '', costPerSeat: '', renewalDate: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licensesRes, usersRes] = await Promise.all([
        api.get('/licenses'),
        canManage ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setLicenses(licensesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/licenses', { ...form, totalSeats: Number(form.totalSeats), costPerSeat: Number(form.costPerSeat) });
      setShowCreateModal(false);
      setForm({ name: '', vendor: '', totalSeats: '', costPerSeat: '', renewalDate: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create license');
    }
  };

  const handleAssignSeat = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/licenses/${assigningLicense._id}/assign-seat`, { employeeId: selectedEmployeeId });
      setAssigningLicense(null);
      setSelectedEmployeeId('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign seat');
    }
  };

  const handleRevokeSeat = async (license, employeeId) => {
    if (!confirm('Revoke this seat? The license spend will drop starting next billing cycle.')) return;
    try {
      await api.put(`/licenses/${license._id}/revoke-seat`, { employeeId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke seat');
    }
  };

  const inputClasses = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-3.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none';

  const availableEmployees = assigningLicense
    ? users.filter((u) => !assigningLicense.seats.some((s) => s.user?._id === u._id))
    : [];

  return (
    <Layout
      eyebrow="Software"
      title="SaaS License Seat Manager"
      subtitle="Track subscription seats, spend, and who's using what."
      action={canManage && (
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">
          <Plus size={16} />Add License
        </button>
      )}
    >
      {loading ? (
        <p className="text-slate-500 text-sm">Loading licenses...</p>
      ) : licenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center animate-fadeInUp">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><KeyRound size={20} /></div>
          <p className="text-slate-500 text-sm">No licenses yet. {canManage && 'Click "Add License" to track your first SaaS subscription.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {licenses.map((license, i) => {
            const used = license.seats.length;
            const pctUsed = Math.min((used / license.totalSeats) * 100, 100);
            const isFull = used >= license.totalSeats;
            const monthlySpend = used * license.costPerSeat;

            return (
              <div key={license._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-display font-semibold text-slate-900">{license.name}</h3>
                  <span className="text-xs text-slate-400">₹{monthlySpend.toLocaleString()}/mo</span>
                </div>
                {license.vendor && <p className="text-xs text-slate-400 mb-3">{license.vendor}</p>}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{used} / {license.totalSeats} seats used</span>
                  {license.renewalDate && <span>Renews {new Date(license.renewalDate).toLocaleDateString()}</span>}
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${pctUsed}%` }} />
                </div>
                <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto">
                  {license.seats.length === 0 ? (
                    <p className="text-xs text-slate-400">No seats assigned yet.</p>
                  ) : (
                    license.seats.map((seat) => (
                      <div key={seat.user?._id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-700 truncate">{seat.user?.name || 'Unknown user'}</span>
                        {canManage && (
                          <button onClick={() => handleRevokeSeat(license, seat.user._id)} className="text-slate-400 hover:text-red-600 transition-colors shrink-0 ml-2" title="Revoke seat">
                            <UserMinus size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {canManage && (
                  <button onClick={() => { setAssigningLicense(license); setSelectedEmployeeId(''); }} disabled={isFull} className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-100 hover:bg-brand-50 rounded-lg py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <UserPlus size={13} /> {isFull ? 'All seats in use' : 'Assign Seat'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assigningLicense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignSeat} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">Assign {assigningLicense.name} Seat</h2>
              <button type="button" onClick={() => setAssigningLicense(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} required className={`${inputClasses} mb-1`}>
              <option value="">Select an employee...</option>
              {availableEmployees.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.department})</option>)}
            </select>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setAssigningLicense(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Assign</button>
            </div>
          </form>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-slate-900">Add License</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <input placeholder="Name (e.g. Figma)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
            <input placeholder="Vendor (optional)" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={inputClasses} />
            <input type="number" placeholder="Total Seats" required value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} className={inputClasses} />
            <input type="number" placeholder="Cost per Seat (₹/month)" required value={form.costPerSeat} onChange={(e) => setForm({ ...form, costPerSeat: e.target.value })} className={inputClasses} />
            <label className="block text-xs text-slate-500 mb-1">Renewal Date (optional)</label>
            <input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} className={`${inputClasses} mb-1`} />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Create</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default Licenses;
