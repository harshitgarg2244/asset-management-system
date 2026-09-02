import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Boxes, UserCircle, ScrollText, LogOut, Layers, Users, ShieldQuestion, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canSeeAuditLogs = ['SUPER_ADMIN', 'AUDITOR'].includes(user.role);
  const canManageUsers = ['SUPER_ADMIN', 'AUDITOR'].includes(user.role);
  // PRIVACY RULE: the full Asset Directory and Licenses pages show WHO has
  // WHAT across the whole company - only Super Admin / IT Manager should
  // even see the link. Everyone else uses "My Assets" for their own view
  // (which now also shows their own licenses).
  const canSeeFullDirectories = ['SUPER_ADMIN', 'IT_MANAGER'].includes(user.role);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    ...(canSeeFullDirectories ? [{ to: '/assets', label: 'Asset Directory', icon: Boxes }] : []),
    ...(canSeeFullDirectories ? [{ to: '/licenses', label: 'Licenses', icon: KeyRound }] : []),
    { to: '/my-assets', label: 'My Assets', icon: UserCircle },
    { to: '/request-access', label: 'Request Access', icon: ShieldQuestion },
    ...(canSeeAuditLogs ? [{ to: '/audit-logs', label: 'Audit Logs', icon: ScrollText }] : []),
    ...(canManageUsers ? [{ to: '/users', label: 'User Management', icon: Users }] : []),
  ];

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive ? 'bg-brand-500/15 text-white' : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
    }`;

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <Layers size={17} strokeWidth={2.5} />
        </div>
        <span className="font-display font-semibold text-[17px] tracking-tight">AssetTrack</span>
      </div>

      <GlobalSearch />

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClasses}>
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-sidebar-border pt-4 mx-3">
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-semibold font-display">
            {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors duration-150">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
