import { useNavigate } from 'react-router-dom';
import ServiceForm from '../components/ServiceForm.jsx';
import { createService } from '../services/serviceService.js';

export default function AddService() {
  const navigate = useNavigate();

  async function handleSubmit(values) {
    const body = await createService(values);
    // Go to the provider page, where the new service now appears
    navigate(`/providers/${body.data.provider._id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Add a service</h1>
      <ServiceForm showProviderPicker submitLabel="Create service" onSubmit={handleSubmit} />
    </div>
  );
}
