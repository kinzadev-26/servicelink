import { Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Forbidden from '../pages/Forbidden.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Messages from '../pages/Messages.jsx';
import MyBookings from '../pages/MyBookings.jsx';
import MyServices from '../pages/MyServices.jsx';
import MyProfile from '../pages/MyProfile.jsx';
import MyAvailability from '../pages/MyAvailability.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import ProviderDetail from '../pages/ProviderDetail.jsx';
import AddService from '../pages/AddService.jsx';
import EditService from '../pages/EditService.jsx';
import NotFound from '../pages/NotFound.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* public */}
        <Route index element={<Home />} />
        <Route path="providers/:id" element={<ProviderDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forbidden" element={<Forbidden />} />

        {/* any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['customer', 'provider']} />}>
          <Route path="bookings" element={<MyBookings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Messages />} />
        </Route>

        {/* provider only */}
        <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
          <Route path="my/services" element={<MyServices />} />
          <Route path="my/profile" element={<MyProfile />} />
          <Route path="my/availability" element={<MyAvailability />} />
          <Route path="services/new" element={<AddService />} />
          <Route path="services/:id/edit" element={<EditService />} />
        </Route>

        {/* admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
