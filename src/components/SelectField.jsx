import { ChevronDown } from "lucide-react";

export default function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg px-3 py-2.5 pr-9 text-sm focus:outline-none cursor-pointer"
        style={{
          border: "1px solid #DDDDDD",
          backgroundColor: "#FBFAF8",
          color: "#1A2942",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        color="#6B7A92"
      />
    </div>
  );
}
