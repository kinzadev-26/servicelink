import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { LogOut, Menu, MessageCircle, Search } from 'lucide-react';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useRealtime } from '../hooks/useRealtime.js';

function titleFor(pathname) {
  if (pathname === '/') return 'Find services';
  if (pathname === '/services/new') return 'Add a service';
  if (pathname === '/login') return 'Log in';
  if (pathname === '/register') return 'Register';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/bookings') return 'Bookings';
  if (pathname === '/my/services') return 'My services';
  if (pathname === '/my/availability') return 'Availability';
  if (pathname === '/my/profile') return 'Profile & payments';
  if (pathname.startsWith('/messages')) return 'Messages';
  if (pathname === '/admin') return 'Admin';
  if (pathname === '/forbidden') return 'No access';
  if (pathname.startsWith('/providers/')) return 'Provider';
  if (/^\/services\/.+\/edit$/.test(pathname)) return 'Edit service';
  return 'ServiceLink';
}

// The two bells are decorative; real notifications are a future feature.
export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadMessages } = useRealtime();
  const [q, setQ] = useState('');

  function submit(e) {
    e.preventDefault();
    navigate(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : '/');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-white px-4 py-3 shadow-sm sm:gap-5 sm:px-8">
      <button onClick={onMenu} aria-label="Open menu" className="rounded-full p-2 text-ink hover:bg-brand-50">
        <Menu size={22} className="lg:hidden" />
        <Menu size={22} className="hidden lg:block" />
      </button>
      <h1 className="hidden text-xl font-semibold sm:block">{titleFor(pathname)}</h1>

      <form onSubmit={submit} role="search" className="relative ml-auto min-w-0 flex-1 sm:max-w-sm">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Quick search"
          placeholder="Search something here..."
          className="w-full rounded-full bg-brand-50 py-2.5 pl-5 pr-11 text-sm outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </form>

      {user && user.role !== 'admin' && (
        <Link to="/messages" aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ''}`} className="icon-btn">
          <MessageCircle size={20} />
          {unreadMessages > 0 && (
            <span data-testid="message-badge" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
          )}
        </Link>
      )}
      {user && <NotificationBell />}

      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{(user?.name || 'G')[0].toUpperCase()}</span>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold">{user?.name || 'Guest'}</p>
          <p className="text-xs capitalize text-muted">{user?.role || 'Visitor'}</p>
        </div>
        {user && (
          <button onClick={() => { logout(); navigate('/login'); }} aria-label="Log out" title="Log out" className="icon-btn">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
