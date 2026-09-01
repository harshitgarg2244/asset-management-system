import Sidebar from './Sidebar';

const Layout = ({ eyebrow, title, subtitle, action, children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <header className="px-8 pt-8 pb-6 flex items-start justify-between animate-fadeInUp">
          <div>
            {eyebrow && <p className="text-xs font-mono font-medium text-brand-600 tracking-wide uppercase mb-1.5">{eyebrow}</p>}
            <h1 className="text-2xl font-display font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
          </div>
          {action}
        </header>
        <main className="px-8 pb-10">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
