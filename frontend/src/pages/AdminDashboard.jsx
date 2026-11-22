import { useState } from 'react';
import { Check, X } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getAdminBookings, getAdminProviders, getAdminUsers, getStats, setProviderApproval, setUserStatus } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate, formatTime } from '../utils/format.js';

const TABS = ['Overview', 'Providers', 'Users', 'Bookings'];

function Panel({ state, empty, children }) {
  if (state.loading) return <Loader />;
  if (state.error) return <ErrorMessage message={state.error} onRetry={state.refetch} />;
  if (state.data.length === 0) return <EmptyState title={empty} />;
  return <div className="card relative overflow-x-auto">{children}</div>;
}
const th = 'px-5 py-4 font-medium';
const td = 'px-5 py-3';

function Overview() {
  const s = useFetch(getStats);
  if (s.loading) return <Loader />;
  if (s.error) return <ErrorMessage message={s.error} onRetry={s.refetch} />;
  const d = s.data;
  const tiles = [['Users', d.users], ['Approved providers', d.providers], ['Waiting approval', d.pendingProviders], ['Active services', d.services], ['Bookings', d.bookings], ['Reviews', d.reviews], ['Paid so far', `PKR ${Number(d.paidTotal).toLocaleString('en-PK')}`]];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(([label, value]) => <div key={label} className="card p-5"><p className="text-3xl font-bold text-brand-700">{value}</p><p className="text-sm text-muted">{label}</p></div>)}
      </div>
      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Bookings by status</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(d.bookingsByStatus).map(([k, v]) => <span key={k} className="flex items-center gap-2"><StatusBadge status={k} /> <b>{v}</b></span>)}
        </div>
      </div>
    </div>
  );
}

function Providers({ notify }) {
  const state = useFetch(() => getAdminProviders({ limit: 50 }));
  async function decide(p, approvalStatus) {
    let reason;
    if (approvalStatus === 'rejected') { reason = window.prompt('Reason for rejecting (optional):'); if (reason === null) return; }
    try { await setProviderApproval(p._id, approvalStatus, reason); notify({ type: 'success', text: `Provider ${approvalStatus}.` }); state.refetch(); }
    catch (err) { notify({ type: 'error', text: getErrorMessage(err) }); }
  }
  return (
    <Panel state={state} empty="No providers">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-brand-100 text-muted"><th className={th}>Provider</th><th className={th}>City</th><th className={th}>Status</th><th className={`${th} text-right`}>Decision</th></tr></thead>
        <tbody>
          {state.data?.map((p) => (
            <tr key={p._id} className="border-b border-brand-50 last:border-0">
              <td className={td}><p className="font-semibold">{p.user?.name}</p><p className="text-xs text-muted">{p.user?.email}</p></td>
              <td className={td}>{p.city}</td>
              <td className={td}><StatusBadge status={p.approvalStatus === 'approved' ? 'confirmed' : p.approvalStatus} label={p.approvalStatus} /></td>
              <td className={td}>
                <div className="flex justify-end gap-2">
                  {p.approvalStatus !== 'approved' && <button onClick={() => decide(p, 'approved')} className="btn-primary py-1.5"><Check size={15} /> Approve</button>}
                  {p.approvalStatus !== 'rejected' && <button onClick={() => decide(p, 'rejected')} className="btn-outline border-red-200 py-1.5 text-red-600 hover:bg-red-50"><X size={15} /> Reject</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Users({ notify }) {
  const state = useFetch(() => getAdminUsers({ limit: 50 }));
  async function toggle(u) {
    try { await setUserStatus(u._id, !u.isActive); notify({ type: 'success', text: u.isActive ? 'User suspended.' : 'User restored.' }); state.refetch(); }
    catch (err) { notify({ type: 'error', text: getErrorMessage(err) }); }
  }
  return (
    <Panel state={state} empty="No users">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-brand-100 text-muted"><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Account</th><th className={`${th} text-right`}>Action</th></tr></thead>
        <tbody>
          {state.data?.map((u) => (
            <tr key={u._id} className="border-b border-brand-50 last:border-0">
              <td className={`${td} font-semibold`}>{u.name}</td><td className={td}>{u.email}</td><td className={`${td} capitalize`}>{u.role}</td>
              <td className={td}><StatusBadge status={u.isActive ? 'active' : 'cancelled'} label={u.isActive ? 'Active' : 'Suspended'} /></td>
              <td className={td}><div className="flex justify-end">{u.role !== 'admin' && <button onClick={() => toggle(u)} className="btn-outline py-1.5">{u.isActive ? 'Suspend' : 'Restore'}</button>}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function Bookings() {
  const state = useFetch(() => getAdminBookings({ limit: 50 }));
  return (
    <Panel state={state} empty="No bookings">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead><tr className="border-b border-brand-100 text-muted"><th className={th}>Service</th><th className={th}>Customer</th><th className={th}>Provider</th><th className={th}>When</th><th className={th}>Status</th></tr></thead>
        <tbody>
          {state.data?.map((b) => (
            <tr key={b._id} className="border-b border-brand-50 last:border-0">
              <td className={`${td} font-semibold`}>{b.service?.title}</td><td className={td}>{b.customer?.name}</td><td className={td}>{b.provider?.user?.name}</td>
              <td className={td}>{formatDate(b.date)} · {formatTime(b.startTime)}</td><td className={td}><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [notice, setNotice] = useState(null);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Admin dashboard</h2>
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setNotice(null); }} className={`pill ${tab === t ? 'pill-active' : ''}`}>{t}</button>)}
      </div>
      <Notice notice={notice} />
      {tab === 'Overview' && <Overview />}
      {tab === 'Providers' && <Providers notify={setNotice} />}
      {tab === 'Users' && <Users notify={setNotice} />}
      {tab === 'Bookings' && <Bookings />}
    </div>
  );
}
