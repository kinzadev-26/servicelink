import { useEffect, useState } from 'react';
import { LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage } from '../services/api.js';
import { getMyAvailability, saveMyAvailability } from '../services/providerService.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // week starts on Monday
const SLOT_OPTIONS = [30, 45, 60, 90, 120, 180];
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

function problem(weekly) {
  for (const r of weekly) if (toMin(r.endTime) <= toMin(r.startTime)) return `${DAYS[r.dayOfWeek]}: end time must be after start time`;
  for (let i = 0; i < weekly.length; i += 1)
    for (let j = i + 1; j < weekly.length; j += 1) {
      const a = weekly[i], b = weekly[j];
      if (a.dayOfWeek === b.dayOfWeek && toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime)) return `${DAYS[a.dayOfWeek]}: working periods overlap`;
    }
  return null;
}

export default function MyAvailability() {
  const { data, loading, error, refetch } = useFetch(getMyAvailability);
  const [weekly, setWeekly] = useState([]);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [daysOff, setDaysOff] = useState([]);
  const [newOff, setNewOff] = useState('');
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWeekly(data.weekly.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
    setSlotMinutes(data.slotMinutes);
    setDaysOff(data.daysOff || []);
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const update = (i, field, value) => setWeekly((w) => w.map((r, k) => (k === i ? { ...r, [field]: value } : r)));

  async function handleSave() {
    const found = problem(weekly);
    if (found) return setNotice({ type: 'error', text: found });
    setSaving(true);
    try {
      await saveMyAvailability({ weekly, slotMinutes: Number(slotMinutes), daysOff });
      setNotice({ type: 'success', text: 'Availability saved. Customers can now see these slots.' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-2xl font-bold">My availability</h2>
      <Notice notice={notice} />

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="slotMinutes" className="text-sm font-medium">Slot length</label>
          <select id="slotMinutes" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} className="field w-auto">
            {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </div>

        {ORDER.map((day) => {
          const rows = weekly.map((r, i) => ({ r, i })).filter(({ r }) => r.dayOfWeek === day);
          return (
            <div key={day} className="flex flex-col gap-2 border-t border-brand-50 pt-3 sm:flex-row sm:items-start">
              <p className="w-28 shrink-0 pt-2 text-sm font-medium">{DAYS[day]}</p>
              <div className="flex-1 space-y-2">
                {rows.length === 0 && <p className="pt-2 text-sm text-muted">Day off</p>}
                {rows.map(({ r, i }) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input type="time" aria-label={`${DAYS[day]} start`} value={r.startTime} onChange={(e) => update(i, 'startTime', e.target.value)} className="field w-auto py-1.5" />
                    <span className="text-muted">to</span>
                    <input type="time" aria-label={`${DAYS[day]} end`} value={r.endTime} onChange={(e) => update(i, 'endTime', e.target.value)} className="field w-auto py-1.5" />
                    <button onClick={() => setWeekly((w) => w.filter((_, k) => k !== i))} aria-label={`Remove ${DAYS[day]} period`} className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setWeekly((w) => [...w, { dayOfWeek: day, startTime: '10:00', endTime: '18:00' }])} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"><Plus size={14} /> Add hours</button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-semibold">Days off</h3>
        <div className="flex flex-wrap gap-2">
          {daysOff.length === 0 && <p className="text-sm text-muted">No special days off.</p>}
          {daysOff.map((d) => (
            <button key={d} onClick={() => setDaysOff((x) => x.filter((v) => v !== d))} className="pill" aria-label={`Remove day off ${d}`}>{d} <Trash2 size={13} /></button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" aria-label="New day off" value={newOff} onChange={(e) => setNewOff(e.target.value)} className="field w-auto" />
          <button onClick={() => { if (newOff && !daysOff.includes(newOff)) setDaysOff((x) => [...x, newOff].sort()); setNewOff(''); }} className="btn-outline">Add day off</button>
        </div>
      </section>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save availability'}
      </button>
    </div>
  );
}
