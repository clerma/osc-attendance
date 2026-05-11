export default function FormField({ label, children }) {
  return (
    <div>
      <label
        className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5"
        style={{ color: "#6B7A92" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
