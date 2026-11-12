import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, CircleCheck, CircleAlert, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import CategoryAvatar from '../components/CategoryAvatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage } from '../services/api.js';
import { getProvider } from '../services/providerService.js';
import { deleteService } from '../services/serviceService.js';
import { formatPKR } from '../utils/format.js';

export default function ProviderDetail() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useFetch(() => getProvider(id), [id]);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  async function handleDelete(service) {
    if (!window.confirm(`Delete "${service.title}"?`)) return;
    try {
      await deleteService(service._id);
      setMessage({ type: 'success', text: 'Service deleted' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
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
          <div className="mt-3 flex flex-wrap gap-2">
            {provider.categories.map((c) => (
              <span key={c._id} className="pill py-1 text-xs">{c.name}</span>
            ))}
          </div>
        </div>
      </header>

      {message && (
        <p role="status" className={`flex items-center gap-2 rounded-2xl p-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
          {message.text}
        </p>
      )}

      <section>
        <h3 className="mb-3 text-lg font-semibold">Services</h3>
        {services.length === 0 ? (
          <EmptyState title="No services yet" text="This provider has not added any services." />
        ) : (
          <div className="card relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-muted">
                  <th className="px-5 py-4 font-medium">Service</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Duration</th>
                  <th className="px-5 py-4 font-medium">Price</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 text-right font-medium">Actions</th>
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
                    <td className="px-5 py-4"><StatusBadge status="active" label="Active" /></td>
                    <td className="px-5 py-4">
                      {/* Week 3: show these only to the owner, and add a Book button for customers */}
                      <div className="flex justify-end gap-2">
                        <Link to={`/services/${s._id}/edit`} aria-label={`Edit ${s.title}`} className="icon-btn h-9 w-9">
                          <Pencil size={16} />
                        </Link>
                        <button onClick={() => handleDelete(s)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 size={16} />
                          <span className="sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
