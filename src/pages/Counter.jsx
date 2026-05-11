import { useState, useRef, useEffect, useMemo } from "react";
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  Loader2,
  ImagePlus,
  Trash2,
  Sparkles,
} from "lucide-react";

import FormField from "../components/FormField.jsx";
import SelectField from "../components/SelectField.jsx";
import ResultCard from "../components/ResultCard.jsx";
import LogRow from "../components/LogRow.jsx";
import Toast from "../components/Toast.jsx";

import { CAMPUSES, SERVICE_TYPES, AREAS } from "../lib/constants.js";
import { downscaleToJpeg } from "../lib/image.js";
import { requestCount } from "../lib/api.js";
import { listCounts, saveCount } from "../lib/counts.js";
import { useAuth } from "../lib/auth.jsx";

export default function Counter() {
  const { profile, session } = useAuth();
  const defaultCampus = profile?.default_campus || "Opelousas";
  const isAdmin = profile?.role === "admin";

  const [files, setFiles] = useState([]);
  const [campus, setCampus] = useState(defaultCampus);
  const [area, setArea] = useState("Sanctuary");
  const [multiAngle, setMultiAngle] = useState(false);
  const [serviceType, setServiceType] = useState("Sunday 9:30 AM");
  const [serviceDate, setServiceDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);
  const [historyCampus, setHistoryCampus] = useState(defaultCampus);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (profile?.default_campus) {
      setCampus(profile.default_campus);
      setHistoryCampus(profile.default_campus);
    }
  }, [profile?.default_campus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listCounts({ campus: historyCampus });
        if (!cancelled) setSessionLog(rows);
      } catch (e) {
        if (!cancelled) setToast({ type: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyCampus]);

  useEffect(() => {
    if (currentResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentResult]);

  const handleFiles = async (newFiles) => {
    const arr = Array.from(newFiles);
    for (const file of arr) {
      try {
        const processed = await downscaleToJpeg(file);
        setFiles((prev) => [...prev, processed]);
      } catch {
        // skip files that fail to decode
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2");
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("ring-2");
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const runCount = async () => {
    if (files.length === 0) {
      setError("Add at least one photo first.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setCurrentResult(null);

    try {
      const images = files.map((f) => ({
        base64: f.base64,
        mediaType: f.mediaType,
      }));

      const parsed = await requestCount({
        campus,
        area,
        serviceType,
        serviceDate,
        multiAngle,
        images,
      });

      const enriched = {
        campus,
        area,
        serviceType,
        serviceDate,
        multiAngle,
        photoCount: files.length,
        ...parsed,
      };

      setCurrentResult(enriched);

      try {
        const row = await saveCount({
          result: enriched,
          files,
          user: session.user,
        });
        setSessionLog((prev) => [row, ...prev]);
        setToast({ type: "success", message: "Count saved." });
      } catch (saveErr) {
        setToast({
          type: "error",
          message: `Count succeeded but save failed: ${saveErr.message}`,
        });
      }

      setFiles([]);
    } catch (e) {
      setError(
        `Counting failed: ${e.message}. Try fewer photos or smaller images.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const historyOptions = useMemo(
    () => (isAdmin ? ["All", ...CAMPUSES] : null),
    [isAdmin]
  );

  return (
    <div className="grain min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-8 sm:py-12">
        <div className="mb-10 fade-up">
          <h1
            className="serif text-4xl sm:text-5xl leading-[1.05] mb-3"
            style={{ color: "#1F568C", fontWeight: 500 }}
          >
            Count today's
            <br />
            <em style={{ fontWeight: 400 }}>congregation.</em>
          </h1>
          <p
            className="text-base leading-relaxed max-w-xl"
            style={{ color: "#4A5A75" }}
          >
            Take a photo from your usual spot, add the service details, and we'll
            handle the count. Best results come from an elevated angle during a
            lit moment — opening welcome or announcements work well.
          </p>
        </div>

        <section
          className="rounded-2xl p-5 sm:p-6 mb-5 fade-up fade-up-delay-1"
          style={{
            backgroundColor: "white",
            boxShadow:
              "0 1px 0 rgba(31,86,140,0.04), 0 8px 32px -12px rgba(31,86,140,0.10)",
            border: "1px solid #ECE7E6",
          }}
        >
          <h2
            className="serif text-xl mb-4 flex items-center gap-2"
            style={{ color: "#1F568C" }}
          >
            <span
              className="inline-block w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-semibold"
              style={{
                backgroundColor: "#A7CEF2",
                color: "#1F568C",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              1
            </span>
            Photos
          </h2>

          <div
            className="flex gap-1 p-1 rounded-lg mb-3"
            style={{ backgroundColor: "#F0EBE8" }}
          >
            <button
              onClick={() => setMultiAngle(false)}
              className="flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: !multiAngle ? "white" : "transparent",
                color: !multiAngle ? "#1F568C" : "#6B7A92",
                boxShadow: !multiAngle
                  ? "0 1px 2px rgba(31,86,140,0.08)"
                  : "none",
              }}
            >
              Single photo
            </button>
            <button
              onClick={() => setMultiAngle(true)}
              className="flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: multiAngle ? "white" : "transparent",
                color: multiAngle ? "#1F568C" : "#6B7A92",
                boxShadow: multiAngle
                  ? "0 1px 2px rgba(31,86,140,0.08)"
                  : "none",
              }}
            >
              Multi-angle stitch
            </button>
          </div>

          {multiAngle && (
            <div
              className="mb-4 p-3 rounded-md text-xs leading-relaxed fade-up"
              style={{
                backgroundColor: "#F0F6FC",
                color: "#1F568C",
                border: "1px solid #DDE9F5",
              }}
            >
              Upload 2+ photos taken moments apart from different angles of the
              same room. The AI will identify overlap zones and count them only
              once, so people aren't double-counted.
            </div>
          )}

          {files.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="rounded-xl border-2 border-dashed p-6 sm:p-10 text-center transition-all"
              style={{ borderColor: "#A7CEF2", backgroundColor: "#FBFAF8" }}
            >
              <div
                className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: "#A7CEF2" }}
              >
                <ImagePlus size={24} color="#1F568C" strokeWidth={1.8} />
              </div>
              <p className="text-sm mb-4" style={{ color: "#4A5A75" }}>
                Drag photos here, or use the buttons below
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: "#1F568C", color: "white" }}
                >
                  <Camera size={16} />
                  Take photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "white",
                    color: "#1F568C",
                    border: "1px solid #A7CEF2",
                  }}
                >
                  <Upload size={16} />
                  Choose from device
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="relative rounded-lg overflow-hidden aspect-[4/3]"
                    style={{ backgroundColor: "#1F568C" }}
                  >
                    <img
                      src={f.preview}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(f.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: "rgba(31,42,66,0.65)" }}
                    >
                      <X size={14} color="white" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg aspect-[4/3] flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{
                    border: "2px dashed #A7CEF2",
                    backgroundColor: "#FBFAF8",
                    color: "#1F568C",
                  }}
                >
                  <ImagePlus size={20} />
                  <span className="text-xs font-medium">Add more</span>
                </button>
              </div>
              <div className="text-xs" style={{ color: "#6B7A92" }}>
                {files.length} photo{files.length === 1 ? "" : "s"} ready
              </div>
            </div>
          )}
        </section>

        <section
          className="rounded-2xl p-5 sm:p-6 mb-5 fade-up fade-up-delay-2"
          style={{
            backgroundColor: "white",
            boxShadow:
              "0 1px 0 rgba(31,86,140,0.04), 0 8px 32px -12px rgba(31,86,140,0.10)",
            border: "1px solid #ECE7E6",
          }}
        >
          <h2
            className="serif text-xl mb-4 flex items-center gap-2"
            style={{ color: "#1F568C" }}
          >
            <span
              className="inline-block w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-semibold"
              style={{
                backgroundColor: "#A7CEF2",
                color: "#1F568C",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              2
            </span>
            Service details
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Campus">
              <SelectField
                value={campus}
                onChange={setCampus}
                options={CAMPUSES}
              />
            </FormField>
            <FormField label="Area">
              <SelectField value={area} onChange={setArea} options={AREAS} />
            </FormField>
            <FormField label="Service">
              <SelectField
                value={serviceType}
                onChange={setServiceType}
                options={SERVICE_TYPES}
              />
            </FormField>
            <FormField label="Date">
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1px solid #DDDDDD",
                  backgroundColor: "#FBFAF8",
                  color: "#1A2942",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </FormField>
          </div>
        </section>

        <div className="mb-8 fade-up fade-up-delay-3">
          <button
            onClick={runCount}
            disabled={isProcessing || files.length === 0}
            className="w-full rounded-xl px-5 py-4 text-base font-semibold transition-all flex items-center justify-center gap-2.5"
            style={{
              backgroundColor:
                isProcessing || files.length === 0 ? "#C5D5E5" : "#1F568C",
              color: "white",
              cursor:
                isProcessing || files.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                files.length === 0
                  ? "none"
                  : "0 4px 16px -4px rgba(31,86,140,0.4)",
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {multiAngle ? "Stitching…" : "Counting…"}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {multiAngle ? "Stitch & count" : "Count people"}
              </>
            )}
          </button>
          {error && (
            <div
              className="mt-3 p-3 rounded-lg text-sm flex items-start gap-2"
              style={{ backgroundColor: "#FEF2EC", color: "#9C4221" }}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {currentResult && (
          <section ref={resultRef} className="mb-10 fade-up">
            <ResultCard result={currentResult} prominent />
          </section>
        )}

        {sessionLog.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2
                className="serif text-2xl"
                style={{ color: "#1F568C", fontWeight: 500 }}
              >
                History
              </h2>
              <div className="flex items-center gap-2">
                {historyOptions && (
                  <SelectField
                    value={historyCampus}
                    onChange={setHistoryCampus}
                    options={historyOptions}
                  />
                )}
                <button
                  onClick={() => setExpandedLogId(null)}
                  className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors"
                  style={{ color: "#6B7A92" }}
                  title="Collapse all"
                >
                  <Trash2 size={12} />
                  Collapse
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {sessionLog.map((entry) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  expanded={expandedLogId === entry.id}
                  onToggle={() =>
                    setExpandedLogId(
                      expandedLogId === entry.id ? null : entry.id
                    )
                  }
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          </section>
        )}

        <footer
          className="mt-16 pt-6 text-center text-xs leading-relaxed"
          style={{ color: "#8B9AAE", borderTop: "1px solid #ECE7E6" }}
        >
          Counts are estimates from AI vision. Treat as a directional metric for
          trends, not an exact attendance number. Photos are sent to Anthropic
          for analysis and stored privately in the church's database.
        </footer>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
