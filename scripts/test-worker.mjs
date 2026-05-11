#!/usr/bin/env node
/**
 * Smoke test for the local Worker — bypasses the React UI.
 *
 * Usage:
 *   node scripts/test-worker.mjs <image-file> [<image-file>...]
 *
 * Reads VITE_API_BASE from .env (defaults to http://localhost:8787).
 * Reads SB_ACCESS_TOKEN from your shell — grab it from the browser:
 *   DevTools → Application → Local Storage → http://localhost:5173
 *   → key "sb-<projectref>-auth-token" → value is a JSON blob → copy the
 *     "access_token" string and export SB_ACCESS_TOKEN=<that>.
 *
 * Prints status, elapsed time, and the Worker's JSON response.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/test-worker.mjs <image-file> [<image-file>...]");
  process.exit(1);
}

const token = process.env.SB_ACCESS_TOKEN;
if (!token) {
  console.error("Set SB_ACCESS_TOKEN (see comments at top of this file).");
  process.exit(1);
}

const envFile = ".env";
let apiBase = "http://localhost:8787";
if (fs.existsSync(envFile)) {
  const text = fs.readFileSync(envFile, "utf8");
  const m = text.match(/^VITE_API_BASE\s*=\s*(.+)$/m);
  if (m) apiBase = m[1].trim();
}

const images = args.map((p) => {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  const mediaType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return {
    base64: buf.toString("base64"),
    mediaType,
    sizeKB: (buf.length / 1024).toFixed(1),
  };
});

const payload = {
  campus: "Opelousas",
  area: "Sanctuary",
  serviceType: "Sunday 9:30 AM",
  serviceDate: new Date().toISOString().slice(0, 10),
  multiAngle: images.length > 1,
  images: images.map(({ base64, mediaType }) => ({ base64, mediaType })),
};

console.log(`POST ${apiBase}/api/count`);
console.log(
  `Images: ${images.length} (${images.map((i) => i.sizeKB + " KB").join(", ")})`
);
console.log(`multiAngle: ${payload.multiAngle}`);
console.log("Sending…");

const t0 = Date.now();
try {
  const res = await fetch(`${apiBase}/api/count`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const text = await res.text();
  console.log(`\nStatus ${res.status} in ${elapsed}s\n`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
} catch (e) {
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`\nFailed after ${elapsed}s:`, e.message);
}
