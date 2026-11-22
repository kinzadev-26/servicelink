import { useNavigate } from 'react-router-dom';
import { BellRing, X } from 'lucide-react';
import { useRealtime } from '../hooks/useRealtime.js';

// A small pop-up for a live event. Disappears after 5 seconds; clicking it opens the related page.
export default function Toast() {
  const { toast, dismissToast } = useRealtime();
  const navigate = useNavigate();
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div key={toast.key} className="card flex items-start gap-3 border border-brand-100 p-4">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><BellRing size={18} /></span>
        <button onClick={() => { dismissToast(); if (toast.link) navigate(toast.link); }} className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold">{toast.title}</span>
          {toast.body && <span className="block truncate text-xs text-muted">{toast.body}</span>}
        </button>
        <button onClick={dismissToast} aria-label="Dismiss" className="rounded-full p-1 text-muted hover:bg-brand-50"><X size={16} /></button>
      </div>
    </div>
  );
}
