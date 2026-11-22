import { useNavigate } from 'react-router-dom';
import ServiceForm from '../components/ServiceForm.jsx';
import { createService } from '../services/serviceService.js';

export default function AddService() {
  const navigate = useNavigate();

  async function handleSubmit(values) {
    await createService(values); // the provider comes from the login token
    navigate('/my/services');
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Add a service</h1>
      <ServiceForm submitLabel="Create service" onSubmit={handleSubmit} />
    </div>
  );
}
