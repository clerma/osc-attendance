import { CONFIDENCE_META } from "../lib/constants.js";

export default function ConfidenceBadge({ confidence }) {
  const meta = CONFIDENCE_META[confidence] || CONFIDENCE_META.medium;
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: i <= meta.dots ? meta.color : "transparent",
              border: `1px solid ${meta.color}`,
              opacity: i <= meta.dots ? 1 : 0.3,
            }}
          />
        ))}
      </div>
      <span>{meta.label}</span>
      <span style={{ opacity: 0.65 }}>· {meta.accuracy}</span>
    </div>
  );
}
