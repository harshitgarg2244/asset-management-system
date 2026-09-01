const STATUS_STYLES = {
  AVAILABLE: { dot: 'bg-status-available', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  ASSIGNED: { dot: 'bg-status-assigned', text: 'text-brand-700', bg: 'bg-brand-50' },
  MAINTENANCE: { dot: 'bg-status-maintenance', text: 'text-amber-700', bg: 'bg-amber-50' },
  RETIRED: { dot: 'bg-status-retired', text: 'text-slate-600', bg: 'bg-slate-100' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.RETIRED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${status === 'ASSIGNED' ? 'animate-pulseSoft' : ''}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
