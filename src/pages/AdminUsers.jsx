import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import FormField from "../components/FormField.jsx";
import SelectField from "../components/SelectField.jsx";
import Toast from "../components/Toast.jsx";

import { supabase } from "../lib/supabase.js";
import { CAMPUSES } from "../lib/constants.js";

const ROLES = ["volunteer", "admin"];

export default function AdminUsers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setToast({ type: "error", message: error.message });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, patch) => {
    setSavingId(id);
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", id);
    setSavingId(null);
    if (error) {
      setToast({ type: "error", message: error.message });
      return;
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    setToast({ type: "success", message: "Saved." });
  };

  return (
    <div className="grain min-h-screen">
      <main className="max-w-4xl mx-auto px-5 py-8 sm:py-12">
        <h1
          className="serif text-4xl sm:text-5xl leading-[1.05] mb-6"
          style={{ color: "#1F568C", fontWeight: 500 }}
        >
          Users
        </h1>

        {loading ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#6B7A92" }}
          >
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #ECE7E6" }}
          >
            <div className="divide-y" style={{ borderColor: "#ECE7E6" }}>
              {profiles.length === 0 ? (
                <div
                  className="px-5 py-8 text-sm text-center"
                  style={{ color: "#6B7A92" }}
                >
                  No users yet. Volunteers will show up here after they sign in
                  for the first time.
                </div>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-4 grid sm:grid-cols-[1fr_180px_180px] items-center gap-4"
                  >
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: "#1A2942" }}
                      >
                        {p.full_name || p.email}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "#6B7A92" }}
                      >
                        {p.email}
                      </div>
                    </div>
                    <FormField label="Role">
                      <SelectField
                        value={p.role || "volunteer"}
                        onChange={(v) => update(p.id, { role: v })}
                        options={ROLES}
                      />
                    </FormField>
                    <FormField label="Default campus">
                      <SelectField
                        value={p.default_campus || "Opelousas"}
                        onChange={(v) => update(p.id, { default_campus: v })}
                        options={CAMPUSES}
                      />
                    </FormField>
                    {savingId === p.id && (
                      <div
                        className="text-xs flex items-center gap-1.5 sm:col-span-3"
                        style={{ color: "#6B7A92" }}
                      >
                        <Loader2 size={12} className="animate-spin" /> Saving…
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
