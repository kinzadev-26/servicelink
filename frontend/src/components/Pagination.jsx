import { ChevronLeft, ChevronRight } from 'lucide-react';

// meta comes straight from the API: { page, limit, total, pages }
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;
  const btn = 'btn-outline px-3 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <button className={btn} disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-muted">Page {meta.page} of {meta.pages}</span>
      <button className={btn} disabled={meta.page >= meta.pages} onClick={() => onPageChange(meta.page + 1)} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
