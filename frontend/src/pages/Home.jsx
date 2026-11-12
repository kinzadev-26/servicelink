import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, LayoutGrid, List, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getCategories } from '../services/categoryService.js';
import { getServices } from '../services/serviceService.js';

const FIELDS = ['search', 'city', 'minPrice', 'maxPrice'];
const fromParams = (params) => Object.fromEntries(FIELDS.map((f) => [f, params.get(f) || '']));

export default function Home() {
  // Every filter lives in the URL, so a search can be shared and survives a refresh.
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(fromParams(params));
  const [showMore, setShowMore] = useState(Boolean(params.get('minPrice') || params.get('maxPrice')));
  const [view, setView] = useState('grid');

  useEffect(() => setDraft(fromParams(params)), [params]);

  const categories = useFetch(getCategories);
  const services = useFetch(() => getServices(Object.fromEntries(params)), [params.toString()]);

  // Merge changes into the current URL; empty values and the default sort are removed; page resets to 1.
  function apply(changes) {
    const next = { ...Object.fromEntries(params), ...changes };
    delete next.page;
    for (const [key, value] of Object.entries(next)) {
      if (value === '' || value == null || (key === 'sort' && value === 'newest')) delete next[key];
    }
    setParams(next);
  }

  const change = (e) => setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    apply(draft);
  };
  const goToPage = (page) => setParams({ ...Object.fromEntries(params), page });
  const clearFilters = () => setParams({});
  const hasFilters = [...params.keys()].some((k) => k !== 'page');
  const activeCategory = params.get('category') || '';

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-56">
            <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" />
            <input name="city" value={draft.city} onChange={change} placeholder="City" aria-label="City" className="field pl-10" />
          </div>
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="search" value={draft.search} onChange={change} placeholder="Search by service or provider" aria-label="Search services" className="field pl-10" />
          </div>
          <button type="button" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} className="btn-outline">
            <SlidersHorizontal size={16} /> Filter
          </button>
          <button type="submit" className="btn-primary">
            <Search size={16} /> Find
          </button>
        </div>

        {showMore && (
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
            <input name="minPrice" value={draft.minPrice} onChange={change} placeholder="Min price (PKR)" inputMode="numeric" aria-label="Minimum price" className="field" />
            <input name="maxPrice" value={draft.maxPrice} onChange={change} placeholder="Max price (PKR)" inputMode="numeric" aria-label="Maximum price" className="field" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Categories">
          <span className="mr-1 text-sm text-muted">Categories</span>
          <button type="button" onClick={() => apply({ category: '' })} className={`pill ${activeCategory === '' ? 'pill-active' : ''}`}>
            All
          </button>
          {(categories.data || []).map((c) => (
            <button type="button" key={c._id} onClick={() => apply({ category: c._id })} className={`pill ${activeCategory === c._id ? 'pill-active' : ''}`}>
              {c.name}
            </button>
          ))}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {services.meta ? `Showing ${services.meta.total} services` : 'Services'}
          </h2>
          <p className="text-sm text-muted">Based on your preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline">Clear filters</button>
          )}
          <label className="relative">
            <ArrowUpDown size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" />
            <select
              name="sort"
              value={params.get('sort') || 'newest'}
              onChange={(e) => apply({ sort: e.target.value })}
              aria-label="Sort by"
              className="appearance-none rounded-full border border-brand-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-brand-700 outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}
              className={`grid h-9 w-9 place-items-center rounded-full ${view === 'list' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
              <List size={18} />
            </button>
            <button type="button" onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}
              className={`grid h-9 w-9 place-items-center rounded-full ${view === 'grid' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      <section>
        {services.loading && <Loader />}
        {services.error && <ErrorMessage message={services.error} onRetry={services.refetch} />}
        {!services.loading && !services.error && services.data.length === 0 && (
          <EmptyState
            title="No services match your search"
            text="Try a different word or remove some filters."
            action={hasFilters && <button onClick={clearFilters} className="btn-primary">Clear filters</button>}
          />
        )}
        {!services.loading && !services.error && services.data.length > 0 && (
          <>
            <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
              {services.data.map((s) => (
                <ServiceCard key={s._id} service={s} layout={view} />
              ))}
            </div>
            <Pagination meta={services.meta} onPageChange={goToPage} />
          </>
        )}
      </section>
    </div>
  );
}
