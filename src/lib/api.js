import { supabase } from "./supabase.js";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function requestCount({
  campus,
  area,
  serviceType,
  serviceDate,
  multiAngle,
  images,
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/api/count`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      campus,
      area,
      serviceType,
      serviceDate,
      multiAngle,
      images,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      // ignore
    }
    throw new Error(detail || `Count API error (${res.status})`);
  }
  return res.json();
}
