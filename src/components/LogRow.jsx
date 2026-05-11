import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CONFIDENCE_META } from "../lib/constants.js";
import { listCountPhotos, signedUrlsFor } from "../lib/counts.js";

export default function LogRow({ entry, expanded, onToggle, formatTimestamp }) {
  const meta = CONFIDENCE_META[entry.confidence] || CONFIDENCE_META.medium;
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    (async () => {
      try {
        const photos = await listCountPhotos(entry.id);
        if (photos.length === 0) {
          setPreviews([]);
          return;
        }
        const urls = await signedUrlsFor(photos.map((p) => p.storage_path));
        if (cancelled) return;
        setPreviews(urls.map((u) => u.signedUrl).filter(Boolean));
      } catch {
        if (!cancelled) setPreviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, entry.id]);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: "white", border: "1px solid #ECE7E6" }}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-colors"
        style={{ backgroundColor: expanded ? "#FBFAF8" : "white" }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="serif num-display flex-shrink-0"
            style={{
              fontSize: "1.75rem",
              lineHeight: 1,
              fontWeight: 500,
              color: "#1F568C",
              minWidth: "3.5rem",
            }}
          >
            {entry.total_count}
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-medium truncate"
              style={{ color: "#1A2942" }}
            >
              {entry.campus} · {entry.area || "Sanctuary"} ·{" "}
              {entry.service_type}
            </div>
            <div
              className="text-xs flex items-center gap-2 mt-0.5 flex-wrap"
              style={{ color: "#6B7A92" }}
            >
              <span>{entry.service_date}</span>
              <span>·</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ color: meta.color }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {entry.confidence}
              </span>
              {entry.multi_angle && (
                <>
                  <span>·</span>
                  <span style={{ color: "#1F568C", fontWeight: 500 }}>
                    stitched
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          color="#6B7A92"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>
      {expanded && (
        <div
          className="px-4 pb-4 pt-1 text-sm fade-up"
          style={{ color: "#4A5A75", backgroundColor: "#FBFAF8" }}
        >
          {entry.ai_notes && (
            <p className="leading-relaxed mb-3">{entry.ai_notes}</p>
          )}
          {previews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-16 rounded-md flex-shrink-0"
                />
              ))}
            </div>
          )}
          <div className="text-xs mt-3" style={{ color: "#8B9AAE" }}>
            Logged {formatTimestamp(entry.created_at)}
            {entry.stage_count > 0 ? ` · ${entry.stage_count} on stage` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
