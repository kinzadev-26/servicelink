import { Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Home from '../pages/Home.jsx';
import ProviderDetail from '../pages/ProviderDetail.jsx';
import AddService from '../pages/AddService.jsx';
import EditService from '../pages/EditService.jsx';
import NotFound from '../pages/NotFound.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="providers/:id" element={<ProviderDetail />} />
        {/* Week 3: put these two behind <ProtectedRoute allowedRoles={['provider']} /> */}
        <Route path="services/new" element={<AddService />} />
        <Route path="services/:id/edit" element={<EditService />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
