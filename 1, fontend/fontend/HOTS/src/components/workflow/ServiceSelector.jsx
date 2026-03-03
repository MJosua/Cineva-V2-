export default function ServiceSelector({ services, serviceId, onChange }) {
  return (
    <select
      className="w-full border rounded p-2 bg-white dark:bg-neutral-900"
      value={serviceId}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select Service</option>
      {services?.map((s) => (
        <option key={s.service_id} value={s.service_id}>
          {s.module_name}
        </option>
      ))}
    </select>
  );
}
