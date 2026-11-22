import { useState } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatPKR, formatTime } from '../utils/format.js';

// Which buttons each role sees for each status (the server enforces the same rules).
const ACTIONS = {
  customer: { pending: ['cancelled'], confirmed: ['cancelled'] },
  provider: { pending: ['confirmed', 'rejected'], confirmed: ['completed', 'cancelled'] },
};
const LABEL = { confirmed: 'Confirm', rejected: 'Reject', cancelled: 'Cancel', completed: 'Mark completed' };

const PAY_CHIP = {
  unpaid: 'bg-slate-100 text-slate-700',
  submitted: 'bg-amber-50 text-amber-800',
  paid: 'bg-emerald-50 text-emerald-700',
};
const PAY_TEXT = { unpaid: 'Unpaid', submitted: 'Waiting for confirmation', paid: 'Paid' };

function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ rating: Number(rating), comment }); }} className="mt-2 flex flex-wrap items-center gap-2">
      <select aria-label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} className="field w-auto py-1.5">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
      </select>
      <input aria-label="Comment" placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} className="field min-w-40 flex-1 py-1.5" />
      <button className="btn-primary py-1.5">Submit review</button>
    </form>
  );
}

// The payment part of a booking card. Customers pay (cash or transfer); providers confirm.
function PaymentBox({ booking: b, role, onPayment }) {
  const [reference, setReference] = useState('');
  if (['rejected', 'cancelled'].includes(b.status)) return null;

  const accounts = b.provider?.paymentAccounts || {};
  const accountLines = [['Easypaisa', accounts.easypaisa], ['JazzCash', accounts.jazzcash], ['Bank', accounts.bank]].filter(([, v]) => v);

  return (
    <div className="mt-3 rounded-2xl bg-brand-50/60 p-3 text-sm" data-testid="payment-box">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Payment:</span>
        <span>{b.paymentMethod === 'cash' ? 'Cash after the service' : 'Transfer'}</span>
        <span data-testid="payment-status" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PAY_CHIP[b.paymentStatus]}`}>{PAY_TEXT[b.paymentStatus]}</span>
      </p>
      {b.paymentReference && <p className="mt-1 text-muted">Transaction id: <b className="text-ink">{b.paymentReference}</b></p>}
      {b.paymentNote && b.paymentStatus === 'unpaid' && <p className="mt-1 text-red-600">Last payment was not verified: {b.paymentNote}</p>}

      {/* customer, transfer, not yet paid: show where to send money and take the transaction id */}
      {role === 'customer' && b.paymentMethod === 'transfer' && b.paymentStatus === 'unpaid' && (
        <div className="mt-2 space-y-2">
          {accountLines.length > 0 ? (
            <ul className="space-y-0.5">
              {accountLines.map(([name, value]) => <li key={name}><span className="text-muted">{name}:</span> <b>{value}</b></li>)}
            </ul>
          ) : (
            <p className="text-muted">The provider has not added account details yet. Send them a message to ask.</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); onPayment(b, { action: 'submit', reference }); }} className="flex flex-wrap gap-2">
            <input aria-label="Transaction id" placeholder={`Transaction id after sending ${formatPKR(b.priceAtBooking)}`} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} className="field min-w-48 flex-1 py-1.5" />
            <button className="btn-primary py-1.5" disabled={reference.trim().length < 4}>I have paid</button>
          </form>
        </div>
      )}

      {role === 'customer' && b.paymentMethod === 'cash' && b.paymentStatus === 'unpaid' && (
        <p className="mt-1 text-muted">Pay {formatPKR(b.priceAtBooking)} in cash to the provider when the job is done.</p>
      )}

      {/* provider: confirm or reject */}
      {role === 'provider' && b.paymentStatus !== 'paid' && (
        <div className="mt-2 flex flex-wrap gap-2">
          {b.status !== 'pending' && (
            <button onClick={() => onPayment(b, { action: 'confirm' })} className="btn-primary py-1.5">
              {b.paymentStatus === 'submitted' ? 'Confirm payment received' : 'Mark as paid'}
            </button>
          )}
          {b.paymentStatus === 'submitted' && (
            <button onClick={() => { const reason = window.prompt('Why can you not verify it? (optional)'); if (reason !== null) onPayment(b, { action: 'reject', reason }); }} className="btn-outline border-red-200 py-1.5 text-red-600 hover:bg-red-50">Reject payment</button>
          )}
          {b.status === 'pending' && <p className="text-muted">Confirm the booking first, then you can mark it as paid.</p>}
        </div>
      )}
      {b.paymentStatus === 'paid' && b.paidAt && <p className="mt-1 text-muted">Paid on {formatDate(b.paidAt.slice(0, 10))}</p>}
    </div>
  );
}

// role: 'customer' | 'provider' (which side is looking).
// onStatus(booking, status), onReview(booking, values), onPayment(booking, { action, reference?, reason? }), onMessage(booking)
export default function BookingsTable({ bookings, role, onStatus, onReview, onPayment, onMessage }) {
  const [reviewing, setReviewing] = useState(null);

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const actions = ACTIONS[role]?.[b.status] || [];
        const other = role === 'customer' ? b.provider?.user?.name : b.customer?.name;
        return (
          <article key={b._id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start" data-testid="booking">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{b.service?.title}</h3>
              <p className="text-sm text-muted">{role === 'customer' ? 'With' : 'Customer'}: <span className="font-medium text-ink">{other}</span></p>
              <p className="text-sm text-muted">{formatDate(b.date)} · {formatTime(b.startTime)} to {formatTime(b.endTime)} · {formatPKR(b.priceAtBooking)}</p>
              {b.address && <p className="text-sm text-muted">Address: {b.address}</p>}
              {b.notes && <p className="text-sm text-muted">Notes: {b.notes}</p>}
              {b.statusReason && <p className="text-sm text-muted">Reason: {b.statusReason}</p>}
              <PaymentBox booking={b} role={role} onPayment={onPayment} />
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge status={b.status} />
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {actions.map((to) => (
                  <button key={to} onClick={() => onStatus(b, to)} className={['rejected', 'cancelled'].includes(to) ? 'btn-outline border-red-200 py-1.5 text-red-600 hover:bg-red-50' : 'btn-primary py-1.5'}>
                    {LABEL[to]}
                  </button>
                ))}
                <button onClick={() => onMessage(b)} className="btn-outline py-1.5"><MessageCircle size={15} /> {role === 'customer' ? 'Message provider' : 'Message customer'}</button>
                {role === 'customer' && b.status === 'completed' && !b.reviewed && (
                  <button onClick={() => setReviewing(reviewing === b._id ? null : b._id)} className="btn-outline py-1.5"><Star size={15} /> Leave a review</button>
                )}
                {role === 'customer' && b.reviewed && <span className="text-sm text-muted">Reviewed</span>}
              </div>
              {reviewing === b._id && <ReviewForm onSubmit={(values) => { setReviewing(null); onReview(b, values); }} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}
