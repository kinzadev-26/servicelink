import { useNavigate, useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import ServiceForm from '../components/ServiceForm.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getService, updateService } from '../services/serviceService.js';

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: service, loading, error, refetch } = useFetch(() => getService(id), [id]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  async function handleSubmit(values) {
    // Only the fields the API allows to change
    const { category, title, description, price, durationMinutes } = values;
    await updateService(id, { category, title, description, price, durationMinutes });
    navigate(`/providers/${service.provider._id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Edit service</h1>
      <ServiceForm
        initial={{
          category: service.category._id,
          title: service.title,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
