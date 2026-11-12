// One pill style for every status in the app (booking statuses from Week 3 included).
const STYLES = {
  pending: 'border border-slate-300 text-slate-500',
  confirmed: 'bg-emerald-500 text-white',
  completed: 'bg-brand-700 text-white',
  active: 'bg-emerald-500 text-white',
  paused: 'border border-orange-400 text-orange-500',
  rejected: 'border border-red-400 text-red-500',
  cancelled: 'border border-slate-300 text-slate-400',
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex min-w-24 justify-center rounded-full px-4 py-1 text-xs font-medium capitalize ${STYLES[status] || STYLES.pending}`}>
      {label || status}
    </span>
  );
}
