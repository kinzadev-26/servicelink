import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LoaderCircle, UserPlus } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormInput from '../components/FormInput.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { homeFor } from './Login.jsx';

function check(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email address';
  if (v.password.length < 8 || !/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = 'At least 8 characters with a letter and a number';
  if (v.confirm !== v.password) e.confirm = 'Passwords do not match';
  if (v.role === 'provider' && !v.city.trim()) e.city = 'City is required for providers';
  return e;
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', role: 'customer', city: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = check(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const { confirm, ...payload } = values;
      const body = await register(payload);
      navigate(homeFor(body.data.user.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
      <p className="mb-4 text-sm text-muted">Customers book services. Providers offer them (an admin approves new providers).</p>
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        {serverError && <ErrorMessage message={serverError} />}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">I want to</legend>
          <div className="flex gap-2">
            {[['customer', 'Book services'], ['provider', 'Offer services']].map(([role, label]) => (
              <button key={role} type="button" aria-pressed={values.role === role} onClick={() => setValues((v) => ({ ...v, role }))} className={`pill flex-1 justify-center ${values.role === role ? 'pill-active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <FormInput label="Full name" name="name" autoComplete="name" value={values.name} onChange={change} error={errors.name} />
        <FormInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} error={errors.email} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={change} error={errors.password} />
          <FormInput label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={change} error={errors.confirm} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label={values.role === 'provider' ? 'City' : 'City (optional)'} name="city" value={values.city} onChange={change} error={errors.city} />
          <FormInput label="Phone (optional)" name="phone" value={values.phone} onChange={change} error={errors.phone} />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-muted">
          Already registered? <Link to="/login" className="font-medium text-brand-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
