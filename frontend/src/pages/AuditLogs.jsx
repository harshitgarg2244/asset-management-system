import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout';
import TagChip from '../components/TagChip';

const actionColor = (action) => {
  if (action.includes('CREATED')) return 'text-emerald-600';
  if (action.includes('ASSIGNED') || action.includes('APPROVED')) return 'text-brand-600';
  if (action.includes('RETIRED') || action.includes('TERMINATED') || action.includes('REJECTED')) return 'text-slate-500';
  return 'text-slate-700';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/audit-logs');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleExport = async () => {
    try {
      const res = await api.get('/audit-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <Layout
      eyebrow="Compliance"
      title="Audit Trail"
      subtitle="Immutable record of every important action taken in the system."
      action={
        <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-150">
          <Download size={16} />Export CSV
        </button>
      }
    >
      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 animate-fadeInUp">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors duration-150 animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-slate-700">{log.actor ? log.actor.name : 'Unknown'}</td>
                  <td className={`px-5 py-3.5 font-medium ${actionColor(log.action)}`}>{log.action}</td>
                  <td className="px-5 py-3.5"><TagChip>{log.targetEntity} · {log.entityId?.toString().slice(-6)}</TagChip></td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No activity logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default AuditLogs;
