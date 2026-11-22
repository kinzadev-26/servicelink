import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarPlus, LoaderCircle, LogIn } from 'lucide-react';
import FormInput from './FormInput.jsx';
import Notice from './Notice.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';
import { createBooking, getSlots } from '../services/bookingService.js';
import { formatPKR, formatTime, karachiDate } from '../utils/format.js';

// Book a service: pick service -> pick date -> pick a free slot (loaded from the server) -> send request.
export default function BookingPanel({ providerId, services }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serviceId, setServiceId] = useState(services[0]?._id || '');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null); // null = nothing loaded yet
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function loadSlots(forDate) {
    setSlotsLoading(true);
    setStartTime('');
    return getSlots(providerId, forDate)
      .then((body) => setSlots(body.data.slots))
      .catch((err) => { setSlots([]); setNotice({ type: 'error', text: getErrorMessage(err) }); })
      .finally(() => setSlotsLoading(false));
  }

  useEffect(() => {
    if (date) loadSlots(date);
    else setSlots(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, providerId]);

  if (!user) {
    return (
      <section className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <p className="font-medium">Log in as a customer to book a time slot.</p>
        <Link to="/login" state={{ from: location.pathname }} className="btn-primary"><LogIn size={16} /> Log in to book</Link>
      </section>
    );
  }
  if (user.role !== 'customer') return null; // providers and admins do not book
  if (services.length === 0) return null;

  const service = services.find((s) => s._id === serviceId);

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);
    if (!serviceId || !date || !startTime) {
      setNotice({ type: 'error', text: 'Choose a service, a date and a time slot first.' });
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({ service: serviceId, date, startTime, address, notes, paymentMethod, message });
      navigate('/bookings', { state: { flash: message ? 'Booking request and message sent. The provider will reply soon.' : 'Booking request sent. The provider will confirm it soon.' } });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
      if (err.response?.status === 409) loadSlots(date); // someone else took it: show fresh slots
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CalendarPlus size={20} className="text-brand-700" /> Book a time slot</h3>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Notice notice={notice} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput as="select" label="Service" name="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => <option key={s._id} value={s._id}>{s.title} · {formatPKR(s.price)}</option>)}
          </FormInput>
          <FormInput label="Date" name="date" type="date" min={karachiDate(0)} max={karachiDate(30)} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div aria-live="polite">
          <p className="mb-1.5 text-sm font-medium">Available times</p>
          {!date && <p className="text-sm text-muted">Pick a date to see free slots.</p>}
          {date && slotsLoading && <p className="flex items-center gap-2 text-sm text-muted"><LoaderCircle size={16} className="animate-spin" /> Loading slots...</p>}
          {date && !slotsLoading && slots?.length === 0 && <p className="text-sm text-muted">No free slots on this date. Try another day.</p>}
          {date && !slotsLoading && slots?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button type="button" key={s.startTime} aria-pressed={startTime === s.startTime} onClick={() => setStartTime(s.startTime)} className={`pill ${startTime === s.startTime ? 'pill-active' : ''}`}>
                  {formatTime(s.startTime)}
                </button>
              ))}
            </div>
          )}
        </div>

        <FormInput label="Address (optional)" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <FormInput as="textarea" rows={2} label="Notes (optional)" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <FormInput as="textarea" rows={2} label="Message to the provider (optional)" name="message" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">How will you pay?</legend>
          <div className="flex flex-wrap gap-2">
            {[['cash', 'Cash after the service'], ['transfer', 'Transfer (Easypaisa, JazzCash, bank)']].map(([value, label]) => (
              <button type="button" key={value} aria-pressed={paymentMethod === value} onClick={() => setPaymentMethod(value)} className={`pill ${paymentMethod === value ? 'pill-active' : ''}`}>{label}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {paymentMethod === 'cash' ? 'Pay the provider directly when the job is done. They will mark it as paid.' : 'You will see the provider\'s account details on My bookings. Send the money, then enter the transaction id there.'}
          </p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
            {submitting ? 'Sending...' : 'Send booking request'}
          </button>
          {service && <span className="text-sm text-muted">Price: <b className="text-ink">{formatPKR(service.price)}</b></span>}
        </div>
      </form>
    </section>
  );
}
