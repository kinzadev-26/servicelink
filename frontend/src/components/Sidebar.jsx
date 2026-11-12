import { NavLink } from 'react-router-dom';
import { CalendarCheck, ChartPie, Heart, LayoutDashboard, MessageSquare, Search, SquarePlus, X } from 'lucide-react';

// `soon: true` items are greyed out until the matching feature exists (Week 3 and later).
const ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, soon: true },
  { label: 'Find services', icon: Search, to: '/', end: true },
  { label: 'Add a service', icon: SquarePlus, to: '/services/new' },
  { label: 'Bookings', icon: CalendarCheck, soon: true },
  { label: 'Messages', icon: MessageSquare, soon: true },
  { label: 'Statistics', icon: ChartPie, soon: true },
];

const itemBase = 'relative flex items-center gap-4 rounded-l-full py-3.5 pl-6 pr-4 text-sm font-medium transition-colors';

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col overflow-hidden bg-brand-700 py-6 text-white transition-transform lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between pl-8 pr-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold text-brand-700">S</span>
          <span className="text-xl font-bold tracking-tight">ServiceLink</span>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="rounded-full p-2 hover:bg-white/10 lg:hidden">
          <X size={20} />
        </button>
      </div>

      <nav className="mt-12 flex-1 space-y-1 pl-4" aria-label="Main">
        {ITEMS.map(({ label, icon: Icon, to, end, soon }) =>
          soon ? (
            <span key={label} aria-disabled="true" title="Coming in a later week" className={`${itemBase} cursor-not-allowed text-white/40`}>
              <Icon size={20} />
              {label}
            </span>
          ) : (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) => `${itemBase} ${isActive ? 'nav-notch' : 'text-white/80 hover:text-white'}`}
            >
              <Icon size={20} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="px-8 text-xs leading-relaxed text-white/60">
        <p className="font-medium text-white/80">ServiceLink Dashboard</p>
        <p>© 2026 All rights reserved</p>
        <p className="mt-1">
          Made with <Heart size={12} className="mx-0.5 inline fill-red-400 text-red-400" /> by an AUREX intern
        </p>
      </div>
    </aside>
  );
}
