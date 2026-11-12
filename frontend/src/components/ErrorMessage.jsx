import { TriangleAlert } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
      <TriangleAlert size={20} className="mt-0.5 shrink-0" />
      <div>
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-sm font-medium underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
