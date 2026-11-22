import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from './Loader.jsx';
import { useAuth } from '../hooks/useAuth.js';

// Wrap routes with this. Not logged in -> /login (and come back afterwards).
// Logged in with the wrong role -> /forbidden. The server still checks everything again.
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
