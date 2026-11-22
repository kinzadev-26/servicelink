import { useEffect, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormInput from '../components/FormInput.jsx';
import Loader from '../components/Loader.jsx';
import Notice from '../components/Notice.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { getMyProvider, updateMyProvider } from '../services/providerService.js';

// Provider's own profile, including where customers should send money for "transfer" bookings.
export default function MyProfile() {
  const { data, loading, error, refetch } = useFetch(getMyProvider);
  const [values, setValues] = useState({ bio: '', city: '', experienceYears: 0, easypaisa: '', jazzcash: '', bank: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const a = data.paymentAccounts || {};
    setValues({ bio: data.bio || '', city: data.city || '', experienceYears: data.experienceYears ?? 0, easypaisa: a.easypaisa || '', jazzcash: a.jazzcash || '', bank: a.bank || '' });
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({}); setNotice(null);
    if (!values.city.trim()) return setErrors({ city: 'City is required' });
    setSaving(true);
    try {
      await updateMyProvider({
        bio: values.bio, city: values.city, experienceYears: Number(values.experienceYears) || 0,
        paymentAccounts: { easypaisa: values.easypaisa, jazzcash: values.jazzcash, bank: values.bank },
      });
      setNotice({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h2 className="text-2xl font-bold">Profile and payments</h2>
      <Notice notice={notice} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className="card space-y-4 p-6">
          <h3 className="font-semibold">About you</h3>
          <FormInput label="City" name="city" value={values.city} onChange={change} error={errors.city} />
          <FormInput label="Years of experience" name="experienceYears" type="number" min="0" max="60" value={values.experienceYears} onChange={change} error={errors.experienceYears} />
          <FormInput as="textarea" rows={3} label="Bio" name="bio" maxLength={500} value={values.bio} onChange={change} error={errors.bio} />
        </section>

        <section className="card space-y-4 p-6">
          <div>
            <h3 className="font-semibold">How customers can pay you</h3>
            <p className="text-sm text-muted">Shown only to customers who book you and choose "Transfer". Leave empty what you do not use. Cash always works.</p>
          </div>
          <FormInput label="Easypaisa number" name="easypaisa" placeholder="0300-1234567" value={values.easypaisa} onChange={change} error={errors['paymentAccounts.easypaisa']} />
          <FormInput label="JazzCash number" name="jazzcash" placeholder="0301-1234567" value={values.jazzcash} onChange={change} error={errors['paymentAccounts.jazzcash']} />
          <FormInput label="Bank account" name="bank" placeholder="Bank name, account title, IBAN" value={values.bank} onChange={change} error={errors['paymentAccounts.bank']} />
        </section>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
