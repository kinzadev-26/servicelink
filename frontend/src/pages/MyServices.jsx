import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, SquarePlus, Trash2 } from 'lucide-react';
import CategoryAvatar from '../components/CategoryAvatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage } from '../services/api.js';
import { deleteService, getMyServices, updateService } from '../services/serviceService.js';
import { formatPKR } from '../utils/format.js';

// Provider's own services, including inactive ones.
export default function MyServices() {
  const { data, loading, error, refetch } = useFetch(getMyServices);
  const [notice, setNotice] = useState(null);

  async function run(action, okText) {
    try {
      await action();
      setNotice({ type: 'success', text: okText });
      refetch();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  }
  const handleDelete = (s) => window.confirm(`Delete "${s.title}"?`) && run(() => deleteService(s._id), 'Service deleted');
  const toggle = (s) => run(() => updateService(s._id, { isActive: !s.isActive }), s.isActive ? 'Service paused' : 'Service activated');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">My services</h2>
        <Link to="/services/new" className="btn-primary"><SquarePlus size={16} /> Add a service</Link>
      </div>
      <Notice notice={notice} />
      {loading && <Loader />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No services yet" text="Add your first service so customers can book you." />}
      {!loading && !error && data.length > 0 && (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-muted">
                <th className="px-5 py-4 font-medium">Service</th>
                <th className="px-5 py-4 font-medium">Duration</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id} className="border-b border-brand-50 last:border-0">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><CategoryAvatar name={s.category?.name} size="sm" /><span className="font-semibold">{s.title}</span></div></td>
                  <td className="px-5 py-4">{s.durationMinutes} min</td>
                  <td className="px-5 py-4 font-semibold">{formatPKR(s.price)}</td>
                  <td className="px-5 py-4"><StatusBadge status={s.isActive ? 'active' : 'paused'} label={s.isActive ? 'Active' : 'Paused'} /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggle(s)} className="btn-outline py-1.5">{s.isActive ? 'Pause' : 'Activate'}</button>
                      <Link to={`/services/${s._id}/edit`} aria-label={`Edit ${s.title}`} className="icon-btn h-9 w-9"><Pencil size={16} /></Link>
                      <button onClick={() => handleDelete(s)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" aria-label={`Delete ${s.title}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
