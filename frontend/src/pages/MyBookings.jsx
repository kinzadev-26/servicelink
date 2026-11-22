import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingsTable from '../components/BookingsTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage } from '../services/api.js';
import { createReview, getMyBookings, updateBookingStatus, updatePayment } from '../services/bookingService.js';
import { startConversation } from '../services/chatService.js';

const FILTERS = ['', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled'];

// One page for both roles: customers see "My bookings", providers see "Booking requests".
export default function MyBookings() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState(location.state?.flash ? { type: 'success', text: location.state.flash } : null);
  const { data, meta, loading, error, refetch } = useFetch(() => getMyBookings({ status: status || undefined, page, limit: 10 }), [status, page]);
  const isProvider = user.role === 'provider';

  async function handleStatus(booking, to) {
    let reason;
    if (to === 'rejected' || to === 'cancelled') {
      reason = window.prompt(`Reason for ${to === 'rejected' ? 'rejecting' : 'cancelling'} (optional):`) ?? null;
      if (reason === null) return; // pressed Cancel in the prompt
    }
    try {
      await updateBookingStatus(booking._id, to, reason);
      setNotice({ type: 'success', text: `Booking ${to}.` });
      refetch();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
      refetch();
    }
  }

  async function handlePayment(booking, values) {
    try {
      await updatePayment(booking._id, values);
      const done = { submit: 'Payment details sent. The provider will confirm it.', confirm: 'Payment marked as received.', reject: 'Payment rejected. The customer was told.' }[values.action];
      setNotice({ type: 'success', text: done });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
    refetch();
  }

  async function handleMessage(booking) {
    try {
      const target = isProvider ? { customer: booking.customer._id } : booking.provider._id;
      const body = await startConversation(target);
      navigate(`/messages/${body.data._id}`);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  }

  async function handleReview(booking, values) {
    try {
      await createReview(booking._id, values);
      setNotice({ type: 'success', text: 'Thanks for your review!' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
    refetch();
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">{isProvider ? 'Booking requests' : 'My bookings'}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f || 'all'} aria-pressed={status === f} onClick={() => { setStatus(f); setPage(1); }} className={`pill capitalize ${status === f ? 'pill-active' : ''}`}>{f || 'All'}</button>
        ))}
      </div>
      <Notice notice={notice} />
      {loading && <Loader />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No bookings here" text={isProvider ? 'New requests will show up here.' : 'Find a service and book your first slot.'} />}
      {!loading && !error && data.length > 0 && <BookingsTable bookings={data} role={user.role} onStatus={handleStatus} onReview={handleReview} onPayment={handlePayment} onMessage={handleMessage} />}
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
