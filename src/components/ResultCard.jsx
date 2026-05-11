import ConfidenceBadge from "./ConfidenceBadge.jsx";

export default function ResultCard({ result, prominent }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: prominent ? "#1F568C" : "white",
        color: prominent ? "white" : "inherit",
        border: prominent ? "none" : "1px solid #ECE7E6",
      }}
    >
      <div className={prominent ? "p-6 sm:p-8" : "p-5"}>
        <div className="flex items-baseline justify-between mb-2">
          <div
            className="text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: prominent ? "#A7CEF2" : "#468FD8" }}
          >
            Estimated count
          </div>
          <div
            className="text-xs flex items-center gap-2 flex-wrap"
            style={{ color: prominent ? "#A7CEF2" : "#6B7A92", opacity: 0.85 }}
          >
            <span>
              {result.campus} · {result.area || "Sanctuary"} ·{" "}
              {result.serviceType}
            </span>
            {result.multiAngle && (
              <span
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold"
                style={{
                  backgroundColor: prominent
                    ? "rgba(167,206,242,0.18)"
                    : "#A7CEF2",
                  color: prominent ? "#A7CEF2" : "#1F568C",
                  opacity: 1,
                }}
              >
                Stitched
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <div
            className="serif num-display"
            style={{
              fontSize: prominent ? "5.5rem" : "3rem",
              lineHeight: 1,
              fontWeight: 500,
              color: prominent ? "white" : "#1F568C",
            }}
          >
            {result.total_count}
          </div>
          {result.stage_count > 0 && (
            <div
              className="text-sm pb-2"
              style={{ color: prominent ? "#A7CEF2" : "#6B7A92" }}
            >
              + {result.stage_count} on stage
            </div>
          )}
        </div>

        <div className="mb-4">
          <ConfidenceBadge confidence={result.confidence} />
        </div>

        {result.notes && (
          <div
            className="text-sm leading-relaxed pt-4"
            style={{
              color: prominent ? "rgba(255,255,255,0.88)" : "#4A5A75",
              borderTop: prominent
                ? "1px solid rgba(167,206,242,0.25)"
                : "1px solid #ECE7E6",
            }}
          >
            {result.notes}
          </div>
        )}

        {result.per_image && result.per_image.length > 1 && (
          <div
            className="mt-4 pt-4"
            style={{
              borderTop: prominent
                ? "1px solid rgba(167,206,242,0.25)"
                : "1px solid #ECE7E6",
            }}
          >
            <div
              className="text-[11px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: prominent ? "#A7CEF2" : "#6B7A92" }}
            >
              By photo
            </div>
            <div className="space-y-1.5">
              {result.per_image.map((p) => (
                <div
                  key={p.image_index}
                  className="flex items-baseline gap-2 text-sm"
                  style={{
                    color: prominent ? "rgba(255,255,255,0.85)" : "#4A5A75",
                  }}
                >
                  <span
                    className="font-semibold tabular-nums"
                    style={{ minWidth: "2.5rem" }}
                  >
                    {p.count}
                  </span>
                  <span className="text-xs" style={{ opacity: 0.75 }}>
                    Photo {p.image_index} — {p.note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
