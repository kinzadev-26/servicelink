import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useRealtime } from '../hooks/useRealtime.js';
import { formatAgo } from '../utils/format.js';

export default function NotificationBell() {
  const { notifications, unreadNotifications, readNotification, readAllNotifications } = useRealtime();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();

  // Close when clicking anywhere else or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  function go(n) {
    readNotification(n);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} aria-expanded={open} className="icon-btn">
        <Bell size={20} />
        {unreadNotifications > 0 && (
          <span data-testid="bell-badge" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="card absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-50 px-4 py-3">
            <p className="font-semibold">Notifications</p>
            {unreadNotifications > 0 && (
              <button onClick={readAllNotifications} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"><CheckCheck size={14} /> Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">Nothing yet. New booking updates will appear here.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n._id}>
                  <button onClick={() => go(n)} className={`flex w-full gap-3 border-b border-brand-50 px-4 py-3 text-left last:border-0 hover:bg-brand-50 ${n.readAt ? '' : 'bg-brand-50/60'}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-brand-700'}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{n.title}</span>
                      {n.body && <span className="block text-xs text-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted">{formatAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
