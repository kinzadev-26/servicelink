import { Clock, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPKR } from '../utils/format.js';
import CategoryAvatar from './CategoryAvatar.jsx';

// layout="grid" is a centred card; layout="list" is one wide row.
export default function ServiceCard({ service, layout = 'grid' }) {
  const { provider, category } = service;
  const list = layout === 'list';

  return (
    <article
      className={`card flex gap-4 p-5 transition hover:shadow-[0_8px_30px_rgba(64,24,157,0.14)] ${
        list ? 'flex-col sm:flex-row sm:items-center' : 'flex-col items-center text-center'
      }`}
    >
      <CategoryAvatar name={category?.name} />

      <div className={`min-w-0 ${list ? 'flex-1' : ''}`}>
        <h3 className="font-semibold">{service.title}</h3>
        <p className="text-sm text-muted">
          <Link to={`/providers/${provider._id}`} className="font-medium text-brand-600 hover:underline">
            {provider.user?.name}
          </Link>
          <span className="mx-1">·</span>
          <MapPin size={13} className="mb-0.5 inline" /> {provider.city}
        </p>
        {service.description && !list && <p className="mt-2 line-clamp-2 text-sm text-muted">{service.description}</p>}
      </div>

      <div className={`flex items-center gap-3 text-sm ${list ? 'sm:ml-auto' : 'flex-wrap justify-center'}`}>
        <span className="pill py-1 text-xs">{category?.name}</span>
        <span className="flex items-center gap-1 text-muted">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {provider.reviewCount > 0 ? `${Number(provider.avgRating).toFixed(1)} (${provider.reviewCount})` : 'New'}
        </span>
        <span className="flex items-center gap-1 text-muted">
          <Clock size={14} /> {service.durationMinutes} min
        </span>
      </div>

      <p className={`text-lg font-bold text-brand-700 ${list ? 'sm:w-32 sm:text-right' : ''}`}>{formatPKR(service.price)}</p>
    </article>
  );
}
