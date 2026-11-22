import { AuthProvider } from './context/AuthContext.jsx';
import { RealtimeProvider } from './context/RealtimeContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppRoutes />
      </RealtimeProvider>
    </AuthProvider>
  );
}
