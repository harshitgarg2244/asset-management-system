const TagChip = ({ children, dark = false }) => (
  <span className={`inline-block font-mono text-xs px-2 py-1 rounded ${dark ? 'bg-sidebar text-brand-100 border border-sidebar-border' : 'bg-slate-100 text-slate-600'}`}>
    {children}
  </span>
);

export default TagChip;
