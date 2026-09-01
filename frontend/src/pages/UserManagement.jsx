import { useEffect, useState } from 'react';
import { UserPlus, X, ShieldCheck, Check, Ban, UserX, RotateCcw } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ROLE_STYLES = {
  SUPER_ADMIN: 'bg-brand-50 text-brand-700',
  IT_MANAGER: 'bg-emerald-50 text-emerald-700',
  AUDITOR: 'bg-amber-50 text-amber-700',
  EMPLOYEE: 'bg-slate-100 text-slate-600',
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const assignableRoles = isSuperAdmin
    ? ['EMPLOYEE', 'AUDITOR', 'IT_MANAGER', 'SUPER_ADMIN']
    : ['EMPLOYEE', 'AUDITOR', 'IT_MANAGER'];

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', role: 'EMPLOYEE' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes] = await Promise.all([
        api.get('/users?includeOffboarded=true'),
        api.get('/role-requests'),
      ]);
      setUsers(usersRes.data);
      setRequests(requestsRes.data.filter((r) => r.status === 'PENDING'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', department: '', role: 'EMPLOYEE' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleTerminate = async (targetUser) => {
    const confirmed = confirm(`Terminate ${targetUser.name}?\n\nThis immediately revokes their access, and any assets currently assigned to them will be automatically returned to Available. This can be undone later from this page.`);
    if (!confirmed) return;
    try {
      await api.put(`/users/${targetUser._id}/terminate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate user');
    }
  };

  const handleReactivate = async (targetUser) => {
    try {
      await api.put(`/users/${targetUser._id}/reactivate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate user');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await api.put(`/role-requests/${requestId}/approve`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/role-requests/${requestId}/reject`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const inputClasses = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-3.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none';

  return (
    <Layout
      eyebrow="Administration"
      title="User Management"
      subtitle="Review access requests and assign Employee, IT Manager, Auditor, or Super Admin roles."
      action={
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">
          <UserPlus size={16} />Create User
        </button>
      }
    >
      {!isSuperAdmin && (
        <div className="flex items-start gap-2.5 bg-amber-50 text-amber-700 text-xs rounded-lg px-3.5 py-2.5 mb-5">
          <ShieldCheck size={15} className="shrink-0 mt-0.5" />
          As an Auditor, you can assign Employee, IT Manager, and Auditor roles. Only a Super Admin can grant or change Super Admin access, or terminate an account.
        </div>
      )}

      {requests.length > 0 && (
        <div className="mb-6 animate-fadeInUp">
          <h3 className="font-display font-semibold text-slate-900 mb-3 text-sm">Pending Access Requests ({requests.length})</h3>
          <div className="space-y-2.5">
            {requests.map((r) => (
              <div key={r._id} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {r.user?.name} <span className="text-slate-400 font-normal">wants</span> {r.requestedRole.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">{r.user?.email} · {r.user?.department}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleApproveRequest(r._id)} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-100 hover:bg-emerald-50 rounded-lg px-2.5 py-1.5 transition-colors">
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => handleRejectRequest(r._id)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 border border-slate-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors">
                    <Ban size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading users...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 animate-fadeInUp">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {isSuperAdmin && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isOffboarded = u.status === 'OFFBOARDED';
                const isSelf = u._id === currentUser._id;
                const roleLocked = isSelf || (u.role === 'SUPER_ADMIN' && !isSuperAdmin) || isOffboarded;

                return (
                  <tr key={u._id} className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors duration-150 animate-fadeInUp ${isOffboarded ? 'opacity-50' : ''}`} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.department}</td>
                    <td className="px-5 py-3.5">
                      {roleLocked ? (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_STYLES[u.role]}`}>
                          {u.role.replace('_', ' ')} {isSelf && <span className="text-slate-400">(you)</span>}
                        </span>
                      ) : (
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${ROLE_STYLES[u.role]}`}>
                          {assignableRoles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOffboarded ? 'text-slate-400' : 'text-emerald-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOffboarded ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                        {isOffboarded ? 'Offboarded' : 'Active'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-3.5">
                        {isSelf ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : isOffboarded ? (
                          <button onClick={() => handleReactivate(u)} className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-xs transition-colors"><RotateCcw size={13} /> Reactivate</button>
                        ) : (
                          <button onClick={() => handleTerminate(u)} className="flex items-center gap-1 text-slate-400 hover:text-red-600 font-medium text-xs transition-colors"><UserX size={13} /> Terminate</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">Create User</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex items-start gap-2 bg-brand-50 text-brand-700 text-xs rounded-lg px-3 py-2 mb-4">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              This is the only screen in the app where a role can be assigned during account creation.
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-3.5">{error}</div>}
            <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
            <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
            <input type="password" placeholder="Temporary password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClasses} />
            <input placeholder="Department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputClasses} />
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${inputClasses} mb-1`}>
              {assignableRoles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Create User</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default UserManagement;
