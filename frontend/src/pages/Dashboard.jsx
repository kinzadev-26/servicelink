import { Link, Navigate } from 'react-router-dom';
import { CalendarCheck, Clock, Search, ShieldCheck, SquarePlus } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { getMyBookings } from '../services/bookingService.js';
import { getMyProvider } from '../services/providerService.js';

function Tile({ icon: Icon, label, value, to }) {
  const body = (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon size={22} /></span>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted">{label}</p></div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function ProviderBanner() {
  const { data, loading } = useFetch(getMyProvider);
  if (loading || !data) return null;
  if (data.approvalStatus === 'approved') return null;
  const rejected = data.approvalStatus === 'rejected';
  return (
    <p role="status" className={`flex items-center gap-2 rounded-2xl p-4 text-sm ${rejected ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
      <ShieldCheck size={18} />
      {rejected ? `Your profile was rejected${data.rejectionReason ? `: ${data.rejectionReason}` : '.'}` : 'Your profile is waiting for admin approval. You will appear in search once approved.'}
    </p>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const upcoming = useFetch(() => getMyBookings({ status: 'confirmed', limit: 50 }));
  const pending = useFetch(() => getMyBookings({ status: 'pending', limit: 50 }));
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const isProvider = user.role === 'provider';
  if (upcoming.loading || pending.loading) return <Loader />;
  if (upcoming.error || pending.error) return <ErrorMessage message={upcoming.error || pending.error} onRetry={() => { upcoming.refetch(); pending.refetch(); }} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hello, {user.name.split(' ')[0]}</h2>
        <p className="text-sm capitalize text-muted">{user.role} dashboard</p>
      </div>
      {isProvider && <ProviderBanner />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile icon={Clock} label={isProvider ? 'Requests waiting for you' : 'Bookings awaiting confirmation'} value={pending.meta?.total ?? 0} to="/bookings" />
        <Tile icon={CalendarCheck} label="Confirmed bookings" value={upcoming.meta?.total ?? 0} to="/bookings" />
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Confirmed bookings</h3>
        {upcoming.data.length === 0 ? (
          <p className="card p-5 text-sm text-muted">Nothing confirmed yet.</p>
        ) : (
          <ul className="card divide-y divide-brand-50">
            {upcoming.data.slice(0, 5).map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="font-medium">{b.service?.title}</span>
                <span className="text-muted">{b.date} · {b.startTime}</span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {isProvider ? (
          <Link to="/services/new" className="btn-primary"><SquarePlus size={16} /> Add a service</Link>
        ) : (
          <Link to="/" className="btn-primary"><Search size={16} /> Find a service</Link>
        )}
      </div>
    </div>
  );
}
