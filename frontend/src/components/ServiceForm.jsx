import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import FormInput from './FormInput.jsx';
import Loader from './Loader.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getCategories } from '../services/categoryService.js';
import { getProviders } from '../services/providerService.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';

// Browser-side checks. The server repeats them (SYS-2); never trust only the browser.
function validate(values, needsProvider) {
  const errors = {};
  if (needsProvider && !values.provider) errors.provider = 'Pick a provider';
  if (!values.category) errors.category = 'Pick a category';
  if (values.title.trim().length < 3 || values.title.trim().length > 80) errors.title = 'Title must be 3 to 80 characters';
  if (!/^\d+$/.test(String(values.price)) || Number(values.price) < 1) errors.price = 'Price must be a whole number of 1 or more';
  const d = Number(values.durationMinutes);
  if (!Number.isInteger(d) || d < 15 || d > 480) errors.durationMinutes = 'Duration must be 15 to 480 minutes';
  if (values.description.length > 500) errors.description = 'Description is at most 500 characters';
  return errors;
}

// Used by both "Add a service" and "Edit service".
// Week 3: remove the provider picker; the server reads the provider from the JWT.
export default function ServiceForm({ initial, showProviderPicker, submitLabel, onSubmit }) {
  const [values, setValues] = useState({
    provider: '',
    category: '',
    title: '',
    description: '',
    price: '',
    durationMinutes: 60,
    ...initial,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = useFetch(getCategories);
  const providers = useFetch(() => (showProviderPicker ? getProviders({ limit: 50 }) : Promise.resolve({ data: [] })), [showProviderPicker]);

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validate(values, showProviderPicker);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...values, price: Number(values.price), durationMinutes: Number(values.durationMinutes) });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (categories.loading || providers.loading) return <Loader />;
  if (categories.error) return <ErrorMessage message={categories.error} onRetry={categories.refetch} />;
  if (providers.error) return <ErrorMessage message={providers.error} onRetry={providers.refetch} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
      {serverError && <ErrorMessage message={serverError} />}

      {showProviderPicker && (
        <FormInput as="select" label="Provider (temporary until login exists)" name="provider" value={values.provider} onChange={change} error={errors.provider}>
          <option value="">Choose a provider</option>
          {providers.data.map((p) => (
            <option key={p._id} value={p._id}>{p.user?.name} ({p.city})</option>
          ))}
        </FormInput>
      )}

      <FormInput as="select" label="Category" name="category" value={values.category} onChange={change} error={errors.category}>
        <option value="">Choose a category</option>
        {categories.data.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </FormInput>

      <FormInput label="Title" name="title" value={values.title} onChange={change} error={errors.title} />
      <FormInput as="textarea" rows={3} label="Description (optional)" name="description" value={values.description} onChange={change} error={errors.description} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput label="Price (PKR)" name="price" inputMode="numeric" value={values.price} onChange={change} error={errors.price} />
        <FormInput label="Duration (minutes)" name="durationMinutes" inputMode="numeric" value={values.durationMinutes} onChange={change} error={errors.durationMinutes} />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
