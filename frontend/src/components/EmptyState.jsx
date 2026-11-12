import { Inbox } from 'lucide-react';

export default function EmptyState({ title, text, action }) {
  return (
    <div className="card flex flex-col items-center p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
        <Inbox size={26} />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
