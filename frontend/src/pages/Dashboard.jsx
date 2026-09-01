import { useEffect, useState } from 'react';
import { Boxes, IndianRupee, UserCheck, PackageCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const StatCard = ({ label, value, icon: Icon, accent, delay }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}><Icon size={15} /></div>
    </div>
    <p className="text-2xl font-display font-semibold text-slate-900">{value}</p>
  </div>
);

const STATUS_COLORS = { AVAILABLE: '#10B981', ASSIGNED: '#6C5CE7', MAINTENANCE: '#F59E0B', RETIRED: '#94A3B8' };

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [expiringWarranties, setExpiringWarranties] = useState([]);
  const [licenseStats, setLicenseStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /assets/stats (not /assets) because the asset list is paginated for
    // the Asset Directory page - the dashboard needs totals across the
    // WHOLE inventory, computed once on the server.
    const fetchDashboardData = async () => {
      try {
        const [statsRes, warrantyRes, licenseRes] = await Promise.all([
          api.get('/assets/stats'),
          api.get('/assets/expiring-warranties'),
          api.get('/licenses/stats'),
        ]);
        setStats(statsRes.data);
        setExpiringWarranties(warrantyRes.data.assets);
        setLicenseStats(licenseRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statusPieData = stats
    ? Object.entries(stats.statusCounts).filter(([, count]) => count > 0).map(([status, count]) => ({ name: status, value: count }))
    : [];

  return (
    <Layout eyebrow="Overview" title={`Welcome back, ${user.name.split(' ')[0]}`} subtitle="Here's what's happening across your organization's assets.">
      {loading || !stats ? (
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      ) : (
        <>
          {expiringWarranties.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl px-4 py-3.5 mb-5 animate-fadeInUp">
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {expiringWarranties.length} asset{expiringWarranties.length === 1 ? '' : 's'} {expiringWarranties.length === 1 ? 'has' : 'have'} a warranty expiring within 30 days
                </p>
                <p className="text-amber-700/80">
                  {expiringWarranties.slice(0, 3).map((a) => `${a.assetTag} (${new Date(a.warrantyExpiry).toLocaleDateString()})`).join(', ')}
                  {expiringWarranties.length > 3 && ` +${expiringWarranties.length - 3} more`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Assets" value={stats.totalAssets} icon={Boxes} accent="bg-brand-50 text-brand-600" delay={0} />
            <StatCard label="Total Hardware Value" value={`₹${stats.totalValue.toLocaleString()}`} icon={IndianRupee} accent="bg-emerald-50 text-emerald-600" delay={60} />
            <StatCard label="Currently Assigned" value={stats.statusCounts.ASSIGNED} icon={UserCheck} accent="bg-amber-50 text-amber-600" delay={120} />
            <StatCard label="Available in Stock" value={stats.statusCounts.AVAILABLE} icon={PackageCheck} accent="bg-slate-100 text-slate-600" delay={180} />
            {licenseStats && <StatCard label="Idle License Cost / mo" value={`₹${licenseStats.idleCost.toLocaleString()}`} icon={KeyRound} accent="bg-red-50 text-red-500" delay={240} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-5 animate-fadeInUp" style={{ animationDelay: '240ms' }}>
              <h3 className="font-display font-semibold text-slate-900 mb-1">Spend by Department</h3>
              <p className="text-xs text-slate-500 mb-4">Total asset cost currently assigned to each team.</p>
              {stats.spendByDepartment.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">No assets are assigned to anyone yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.spendByDepartment} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F4" />
                    <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Spend']} contentStyle={{ borderRadius: 8, border: '1px solid #EEF0F4', fontSize: 13 }} />
                    <Bar dataKey="total" fill="#6C5CE7" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <h3 className="font-display font-semibold text-slate-900 mb-1">Assets by Status</h3>
              <p className="text-xs text-slate-500 mb-4">Current lifecycle breakdown of the whole inventory.</p>
              {statusPieData.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">No assets yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {statusPieData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #EEF0F4', fontSize: 13 }} />
                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
