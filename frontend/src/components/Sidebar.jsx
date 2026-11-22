import { NavLink } from 'react-router-dom';
import { Briefcase, CalendarCheck, CalendarClock, Heart, LayoutDashboard, LogIn, MessageSquare, Search, ShieldCheck, UserPlus, Wallet, X } from 'lucide-react';

import { useAuth } from '../hooks/useAuth.js';

// The menu depends on who is logged in. `soon: true` items are greyed out.
const FIND = { label: 'Find services', icon: Search, to: '/', end: true };
const MENUS = {
  guest: [FIND, { label: 'Log in', icon: LogIn, to: '/login' }, { label: 'Register', icon: UserPlus, to: '/register' }],
  customer: [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }, FIND, { label: 'My bookings', icon: CalendarCheck, to: '/bookings' }, { label: 'Messages', icon: MessageSquare, to: '/messages' }],
  provider: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Booking requests', icon: CalendarCheck, to: '/bookings' },
    { label: 'My services', icon: Briefcase, to: '/my/services' },
    { label: 'Profile & payments', icon: Wallet, to: '/my/profile' },
    { label: 'Availability', icon: CalendarClock, to: '/my/availability' },
    FIND,
    { label: 'Messages', icon: MessageSquare, to: '/messages' },
  ],
  admin: [{ label: 'Admin dashboard', icon: ShieldCheck, to: '/admin' }, FIND],
};

const itemBase = 'relative flex items-center gap-4 rounded-l-full py-3.5 pl-6 pr-4 text-sm font-medium transition-colors';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = MENUS[user?.role || 'guest'];
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
        {items.map(({ label, icon: Icon, to, end, soon }) =>
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
