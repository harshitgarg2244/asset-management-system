import { useEffect, useState } from 'react';
import { Plus, ArrowLeftRight, Archive, X, Search, Download, ChevronLeft, ChevronRight, Upload, FileWarning, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import TagChip from '../components/TagChip';

const PAGE_SIZE = 10;

const AssetDirectory = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canManage = ['SUPER_ADMIN', 'IT_MANAGER'].includes(user.role);

  const [form, setForm] = useState({ assetTag: '', name: '', category: 'HARDWARE', serialNumber: '', cost: '', warrantyExpiry: '' });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, usersRes] = await Promise.all([
        api.get('/assets', { params: { search, status: statusFilter, category: categoryFilter, page, limit: PAGE_SIZE } }),
        canManage ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setAssets(assetsRes.data.assets);
      setTotalPages(assetsRes.data.totalPages);
      setTotal(assetsRes.data.total);
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
  }, [search, statusFilter, categoryFilter, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', form);
      setShowModal(false);
      setForm({ assetTag: '', name: '', category: 'HARDWARE', serialNumber: '', cost: '', warrantyExpiry: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create asset');
    }
  };

  const openAssignModal = (asset) => {
    setAssigningAsset(asset);
    setSelectedEmployeeId(asset.assignedTo?._id || '');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assets/${assigningAsset._id}/assign`, { employeeId: selectedEmployeeId || null });
      setAssigningAsset(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign asset');
    }
  };

  const handleRetire = async (assetId) => {
    if (!confirm('Retire this asset? It will be marked RETIRED and unassigned.')) return;
    try {
      await api.put(`/assets/${assetId}/retire`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retire asset');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/assets/export', { params: { search, status: statusFilter, category: categoryFilter }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'assets.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/assets/export', { params: { search: '__no_match_intentionally__' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'asset-import-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download template');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const { data } = await api.post('/assets/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(data);
      fetchData();
    } catch (err) {
      setImportResult({ created: 0, skippedDuplicates: 0, errors: [{ row: '-', reason: err.response?.data?.message || 'Import failed' }] });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const inputClasses = 'w-full border border-slate-200 rounded-lg px-3.5 py-2.5 mb-3.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none';
  const hasActiveFilters = search || statusFilter || categoryFilter;

  return (
    <Layout
      eyebrow="Inventory"
      title="Asset Directory"
      subtitle="All hardware & software assets across the company."
      action={
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-150">
            <Download size={16} />Export CSV
          </button>
          {canManage && (
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition-all duration-150">
              <Upload size={16} />Bulk Import
            </button>
          )}
          {canManage && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">
              <Plus size={16} />Add New Asset
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fadeInUp">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by tag, name, or serial number..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3.5 py-2.5 text-sm bg-white transition-shadow duration-150 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500">
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500">
          <option value="">All categories</option>
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading assets...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 animate-fadeInUp">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Tag</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Assigned To</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                {canManage && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => (
                <tr key={asset._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors duration-150 animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                  <td className="px-5 py-3.5"><TagChip>{asset.assetTag}</TagChip></td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{asset.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{asset.category}</td>
                  <td className="px-5 py-3.5 text-slate-600">{asset.assignedTo ? asset.assignedTo.name : '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={asset.status} /></td>
                  <td className="px-5 py-3.5 text-slate-600">₹{asset.cost.toLocaleString()}</td>
                  {canManage && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openAssignModal(asset)} className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium transition-colors"><ArrowLeftRight size={13} /> Assign</button>
                        <button onClick={() => handleRetire(asset._id)} className="flex items-center gap-1 text-slate-400 hover:text-red-600 font-medium transition-colors"><Archive size={13} /> Retire</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    {hasActiveFilters ? 'No assets match your search or filters.' : 'No assets yet.'}
                    {!hasActiveFilters && canManage && ' Click "Add New Asset" to create your first one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {total > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 text-sm text-slate-500">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <ChevronLeft size={15} /> Prev
                </button>
                <span className="px-2 text-slate-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {assigningAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-semibold text-slate-900">Assign Asset</h2>
              <button type="button" onClick={() => setAssigningAsset(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5"><TagChip>{assigningAsset.assetTag}</TagChip> <span className="ml-1">{assigningAsset.name}</span></p>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to</label>
            <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className={`${inputClasses} mb-1`}>
              <option value="">— Unassigned (return to Available) —</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.department})</option>)}
            </select>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setAssigningAsset(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Confirm</button>
            </div>
          </form>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-semibold text-slate-900">Bulk Import Assets</h2>
              <button type="button" onClick={closeImportModal} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Upload a CSV to create many assets at once.</p>
            <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-xs font-medium mb-4"><Download size={13} /> Download a blank template</button>

            {!importResult ? (
              <form onSubmit={handleImportSubmit}>
                <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0] || null)} className="w-full border border-dashed border-slate-300 rounded-lg px-3.5 py-6 mb-2 text-sm text-slate-500 bg-slate-50 cursor-pointer" />
                <p className="text-xs text-slate-400 mb-5">Expected columns: Asset Tag, Name, Category (Hardware/Software), Serial Number, Cost, Warranty Expiry. Assigned To is ignored on import.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeImportModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={!importFile || importing} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50">
                    {importing ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="animate-fadeInUp">
                <div className="flex items-start gap-2.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg px-3.5 py-3 mb-3">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  {importResult.created} asset{importResult.created === 1 ? '' : 's'} created
                  {importResult.skippedDuplicates > 0 && `, ${importResult.skippedDuplicates} skipped (duplicate tag)`}.
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="mb-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-2"><FileWarning size={13} /> {importResult.errors.length} row(s) had problems:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {importResult.errors.map((e, i) => <p key={i} className="text-xs text-slate-500 bg-slate-50 rounded px-2.5 py-1.5">Row {e.row}: {e.reason}</p>)}
                    </div>
                  </div>
                )}
                <button onClick={closeImportModal} className="w-full px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp" style={{ animationDuration: '0.15s' }}>
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-slate-900">Add New Asset</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            <input placeholder="Asset Tag (e.g. LAP-0042)" required value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} className={inputClasses} />
            <input placeholder="Asset Name (e.g. MacBook Pro 14)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClasses}>
              <option value="HARDWARE">Hardware</option>
              <option value="SOFTWARE">Software</option>
            </select>
            <input placeholder="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className={inputClasses} />
            <input type="number" placeholder="Cost (₹)" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={inputClasses} />
            <label className="block text-xs text-slate-500 mb-1">Warranty Expiry (optional)</label>
            <input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} className={`${inputClasses} mb-1`} />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-brand-600 active:scale-[0.98] transition-all duration-150">Create Asset</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default AssetDirectory;
