// A labelled field that shows its own error (NFR-15, NFR-16).
export default function FormInput({ label, name, error, as = 'input', children, ...props }) {
  const Tag = as;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">{label}</label>
      <Tag id={name} name={name} aria-invalid={Boolean(error)} className={`field ${error ? 'border-red-400' : ''}`} {...props}>
        {children}
      </Tag>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
