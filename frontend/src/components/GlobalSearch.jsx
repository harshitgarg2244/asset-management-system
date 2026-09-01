import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Boxes, User, ScrollText } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// A single search box reachable from every page - jumps across Assets,
// Users, and (if allowed) Audit Logs. Clicking a result takes you to the
// right PAGE, not a deep link into that record - keeps this simple while
// still being genuinely useful, the same "quick jump" idea as Cmd+K search
// in most internal tools.
const GlobalSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: query } });
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const hasAnyResults = results && (results.assets.length || results.users.length || results.auditLogs.length);
  const canSeeAuditLogs = ['SUPER_ADMIN', 'AUDITOR'].includes(user.role);

  return (
    <div ref={containerRef} className="relative px-3 mb-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search everything..."
          className="w-full bg-sidebar-hover text-white placeholder:text-slate-500 text-sm rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-brand-400/50"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-3 right-3 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 py-2 max-h-96 overflow-y-auto z-50 animate-fadeInUp" style={{ animationDuration: '0.15s' }}>
          {loading && <p className="px-4 py-3 text-xs text-slate-400">Searching...</p>}
          {!loading && !hasAnyResults && <p className="px-4 py-3 text-xs text-slate-400">No matches for "{query}"</p>}

          {!loading && results?.assets.length > 0 && (
            <div className="mb-1">
              <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Assets</p>
              {results.assets.map((a) => (
                <button key={a._id} onClick={() => goTo('/assets')} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                  <Boxes size={14} className="text-brand-500 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{a.name}</span>
                  <span className="text-xs text-slate-400 font-mono ml-auto shrink-0">{a.assetTag}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && results?.users.length > 0 && (
            <div className="mb-1">
              <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">People</p>
              {results.users.map((u) => (
                <button key={u._id} onClick={() => goTo(canSeeAuditLogs ? '/users' : '/assets')} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                  <User size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{u.name}</span>
                  <span className="text-xs text-slate-400 ml-auto shrink-0">{u.department}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && canSeeAuditLogs && results?.auditLogs.length > 0 && (
            <div>
              <p className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Audit Logs</p>
              {results.auditLogs.map((log) => (
                <button key={log._id} onClick={() => goTo('/audit-logs')} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                  <ScrollText size={14} className="text-amber-500 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{log.action}</span>
                  <span className="text-xs text-slate-400 ml-auto shrink-0">{log.actor?.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
