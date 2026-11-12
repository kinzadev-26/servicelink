import { LoaderCircle } from 'lucide-react';

export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted" role="status">
      <LoaderCircle size={22} className="animate-spin text-brand-700" />
      {label}
    </div>
  );
}
