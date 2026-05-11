import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

import FormField from "../components/FormField.jsx";
import SelectField from "../components/SelectField.jsx";
import ConfidenceBadge from "../components/ConfidenceBadge.jsx";
import Toast from "../components/Toast.jsx";

import { CAMPUSES, AREAS } from "../lib/constants.js";
import { listCounts, listCountPhotos, signedUrlsFor } from "../lib/counts.js";

const ALL = "All";

function formatDay(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [campus, setCampus] = useState(ALL);
  const [area, setArea] = useState(ALL);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [openPreviews, setOpenPreviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await listCounts({
          campus: campus === ALL ? null : campus,
          limit: 500,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setToast({ type: "error", message: e.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campus]);

  const filtered = useMemo(
    () => rows.filter((r) => area === ALL || r.area === area),
    [rows, area]
  );

  const trend = useMemo(() => {
    const byDay = new Map();
    for (const r of filtered) {
      const k = r.service_date;
      byDay.set(k, (byDay.get(k) ?? 0) + r.total_count);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, total]) => ({ date, total }));
  }, [filtered]);

  const weekComparison = useMemo(() => {
    const now = new Date();
    const startOfWeek = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      x.setDate(x.getDate() - x.getDay());
      return x;
    };
    const sumWeek = (weeksAgo, yearOffset = 0) => {
      const ref = new Date(now);
      ref.setFullYear(ref.getFullYear() - yearOffset);
      const start = startOfWeek(ref);
      start.setDate(start.getDate() - 7 * weeksAgo);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return filtered
        .filter((r) => {
          const d = new Date(r.service_date);
          return d >= start && d < end;
        })
        .reduce((s, r) => s + r.total_count, 0);
    };
    return [
      { label: "Last year", total: sumWeek(0, 1) },
      { label: "Last week", total: sumWeek(1) },
      { label: "This week", total: sumWeek(0) },
    ];
  }, [filtered]);

  const openRow = async (row) => {
    if (openId === row.id) {
      setOpenId(null);
      setOpenPreviews([]);
      return;
    }
    setOpenId(row.id);
    setOpenPreviews([]);
    try {
      const photos = await listCountPhotos(row.id);
      if (!photos.length) return;
      const urls = await signedUrlsFor(photos.map((p) => p.storage_path));
      setOpenPreviews(urls.map((u) => u.signedUrl).filter(Boolean));
    } catch (e) {
      setToast({ type: "error", message: e.message });
    }
  };

  return (
    <div className="grain min-h-screen">
      <main className="max-w-5xl mx-auto px-5 py-8 sm:py-12">
        <div className="mb-8 fade-up">
          <h1
            className="serif text-4xl sm:text-5xl leading-[1.05] mb-3"
            style={{ color: "#1F568C", fontWeight: 500 }}
          >
            Attendance <em style={{ fontWeight: 400 }}>trends.</em>
          </h1>
          <p
            className="text-base leading-relaxed max-w-xl"
            style={{ color: "#4A5A75" }}
          >
            Read-only view across campuses and services. Filter, scan, drill in.
          </p>
        </div>

        <section
          className="rounded-2xl p-5 sm:p-6 mb-6 fade-up fade-up-delay-1 grid sm:grid-cols-2 gap-4"
          style={{
            backgroundColor: "white",
            border: "1px solid #ECE7E6",
            boxShadow:
              "0 1px 0 rgba(31,86,140,0.04), 0 8px 32px -12px rgba(31,86,140,0.10)",
          }}
        >
          <FormField label="Campus">
            <SelectField
              value={campus}
              onChange={setCampus}
              options={[ALL, ...CAMPUSES]}
            />
          </FormField>
          <FormField label="Area">
            <SelectField
              value={area}
              onChange={setArea}
              options={[ALL, ...AREAS]}
            />
          </FormField>
        </section>

        {loading ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#6B7A92" }}
          >
            <Loader2 size={14} className="animate-spin" /> Loading counts…
          </div>
        ) : (
          <>
            <section
              className="rounded-2xl p-5 sm:p-6 mb-6 fade-up"
              style={{ backgroundColor: "white", border: "1px solid #ECE7E6" }}
            >
              <div
                className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3"
                style={{ color: "#468FD8" }}
              >
                Total per service day
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={trend}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#ECE7E6" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDay}
                      stroke="#6B7A92"
                      fontSize={12}
                    />
                    <YAxis stroke="#6B7A92" fontSize={12} />
                    <Tooltip
                      labelFormatter={formatDay}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ECE7E6",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#1F568C"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#1F568C" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section
              className="rounded-2xl p-5 sm:p-6 mb-6 fade-up"
              style={{ backgroundColor: "white", border: "1px solid #ECE7E6" }}
            >
              <div
                className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3"
                style={{ color: "#468FD8" }}
              >
                Week-over-week
              </div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={weekComparison}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#ECE7E6" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#6B7A92" fontSize={12} />
                    <YAxis stroke="#6B7A92" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ECE7E6",
                        borderRadius: 8,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="total" fill="#468FD8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section
              className="rounded-2xl overflow-hidden fade-up"
              style={{ backgroundColor: "white", border: "1px solid #ECE7E6" }}
            >
              <div
                className="px-5 py-4 text-[11px] uppercase tracking-[0.18em] font-semibold"
                style={{ color: "#468FD8", borderBottom: "1px solid #ECE7E6" }}
              >
                Recent counts ({filtered.length})
              </div>
              <div className="divide-y" style={{ borderColor: "#ECE7E6" }}>
                {filtered.length === 0 ? (
                  <div
                    className="px-5 py-8 text-sm text-center"
                    style={{ color: "#6B7A92" }}
                  >
                    No counts match these filters yet.
                  </div>
                ) : (
                  filtered.map((row) => (
                    <div key={row.id}>
                      <button
                        onClick={() => openRow(row)}
                        className="w-full px-5 py-3.5 grid sm:grid-cols-[80px_1fr_auto] items-center gap-3 text-left"
                        style={{
                          backgroundColor:
                            openId === row.id ? "#FBFAF8" : "white",
                        }}
                      >
                        <div
                          className="serif num-display"
                          style={{
                            fontSize: "1.5rem",
                            color: "#1F568C",
                            fontWeight: 500,
                          }}
                        >
                          {row.total_count}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: "#1A2942" }}
                          >
                            {row.campus} · {row.area} · {row.service_type}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "#6B7A92" }}
                          >
                            {row.service_date}
                            {row.multi_angle ? " · stitched" : ""}
                          </div>
                        </div>
                        <div className="justify-self-end">
                          <ConfidenceBadge confidence={row.confidence} />
                        </div>
                      </button>
                      {openId === row.id && (
                        <div
                          className="px-5 py-4 text-sm fade-up"
                          style={{
                            backgroundColor: "#FBFAF8",
                            color: "#4A5A75",
                          }}
                        >
                          {row.ai_notes && (
                            <p className="leading-relaxed mb-3">
                              {row.ai_notes}
                            </p>
                          )}
                          {openPreviews.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                              {openPreviews.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt=""
                                  className="h-24 rounded-md flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}
                          <div
                            className="text-xs"
                            style={{ color: "#8B9AAE" }}
                          >
                            {row.stage_count > 0
                              ? `${row.stage_count} on stage · `
                              : ""}
                            {row.photo_count} photo
                            {row.photo_count === 1 ? "" : "s"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
