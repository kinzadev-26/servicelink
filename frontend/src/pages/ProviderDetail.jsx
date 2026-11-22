import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, LoaderCircle, MapPin, MessageCircle, Star } from 'lucide-react';
import CategoryAvatar from '../components/CategoryAvatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import BookingPanel from '../components/BookingPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage } from '../services/api.js';
import { startConversation } from '../services/chatService.js';
import { getProviderReviews } from '../services/bookingService.js';
import { getProvider } from '../services/providerService.js';
import { formatDate, formatPKR } from '../utils/format.js';

export default function ProviderDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useFetch(() => getProvider(id), [id]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const reviews = useFetch(() => getProviderReviews(id), [id]);

  async function openChat(providerId) {
    setChatBusy(true); setChatError('');
    try {
      const body = await startConversation(providerId);
      navigate(`/messages/${body.data._id}`);
    } catch (err) {
      setChatError(getErrorMessage(err));
      setChatBusy(false);
    }
  }

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const { provider, services } = data;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft size={16} /> Back to search
      </Link>

      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <CategoryAvatar name={provider.categories[0]?.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold">{provider.user?.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1"><MapPin size={15} /> {provider.city}</span>
            <span className="flex items-center gap-1"><Briefcase size={15} /> {provider.experienceYears} years experience</span>
            <span className="flex items-center gap-1">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              {provider.reviewCount > 0 ? `${Number(provider.avgRating).toFixed(1)} (${provider.reviewCount} reviews)` : 'No reviews yet'}
            </span>
          </p>
          {provider.bio && <p className="mt-3 text-sm">{provider.bio}</p>}
          {user?.role === 'customer' && (
            <div className="mt-4">
              <button onClick={() => openChat(provider._id)} disabled={chatBusy} className="btn-outline">
                {chatBusy ? <LoaderCircle size={16} className="animate-spin" /> : <MessageCircle size={16} />} Message provider
              </button>
              {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {provider.categories.map((c) => (
              <span key={c._id} className="pill py-1 text-xs">{c.name}</span>
            ))}
          </div>
        </div>
      </header>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Services</h3>
        {services.length === 0 ? (
          <EmptyState title="No services yet" text="This provider has not added any services." />
        ) : (
          <div className="card relative overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-muted">
                  <th className="px-5 py-4 font-medium">Service</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Duration</th>
                  <th className="px-5 py-4 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className="border-b border-brand-50 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CategoryAvatar name={s.category?.name} size="sm" />
                        <span className="font-semibold">{s.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{s.category?.name}</td>
                    <td className="px-5 py-4">{s.durationMinutes} min</td>
                    <td className="px-5 py-4 font-semibold">{formatPKR(s.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BookingPanel providerId={provider._id} services={services} />

      <section>
        <h3 className="mb-3 text-lg font-semibold">Reviews</h3>
        {reviews.loading && <Loader />}
        {reviews.error && <ErrorMessage message={reviews.error} onRetry={reviews.refetch} />}
        {reviews.data?.length === 0 && <EmptyState title="No reviews yet" text="Reviews appear after a customer completes a booking." />}
        {reviews.data?.length > 0 && (
          <ul className="space-y-3">
            {reviews.data.map((r) => (
              <li key={r._id} className="card p-4">
                <p className="flex items-center gap-2 text-sm">
                  <span className="flex" aria-label={`${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}
                  </span>
                  <b>{r.customer?.name}</b>
                  <span className="text-muted">· {formatDate(r.createdAt.slice(0, 10))}</span>
                </p>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
