import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600"><ShieldAlert size={26} /></span>
      <h1 className="mt-4 text-xl font-bold">403 · Not allowed</h1>
      <p className="mt-1 text-muted">Your account does not have permission to open this page.</p>
      <Link to="/" className="btn-primary mt-5">Back to home</Link>
    </div>
  );
}
