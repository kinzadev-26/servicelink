import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle, LogIn } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormInput from '../components/FormInput.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';

export const homeFor = (role) => (role === 'admin' ? '/admin' : '/dashboard');

export default function Login() {
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || homeFor(user.role)} replace />;

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) found.email = 'Enter a valid email address';
    if (!values.password) found.password = 'Password is required';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const body = await login(values);
      navigate(location.state?.from || homeFor(body.data.user.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
      <p className="mb-4 text-sm text-muted">Log in to book services or manage your bookings.</p>
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        {sessionExpired && <ErrorMessage message="Your session has expired. Please log in again." />}
        {serverError && <ErrorMessage message={serverError} />}
        <FormInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} error={errors.email} />
        <FormInput label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={change} error={errors.password} />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-center text-sm text-muted">
          New here? <Link to="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
