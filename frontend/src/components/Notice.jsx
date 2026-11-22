import { CircleAlert, CircleCheck } from 'lucide-react';

// A small success or error banner: notice = { type: 'success' | 'error', text }
export default function Notice({ notice }) {
  if (!notice) return null;
  const ok = notice.type === 'success';
  return (
    <p role="status" className={`flex items-center gap-2 rounded-2xl p-3 text-sm ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
      {notice.text}
    </p>
  );
}
