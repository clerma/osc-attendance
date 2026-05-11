export interface Env {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CORS_ORIGIN?: string;
}

const AREA_GUIDANCE: Record<string, string> = {
  Sanctuary:
    "This is the main worship sanctuary. Count adults and older children/teens seated or standing in the audience. Count people on stage (worship team, speakers, musicians) separately.",
  "Kids Church":
    "This is a kids ministry environment. Most people in the audience will be children. Count children in the audience separately from adult leaders/volunteers — return the child count as total_count and the leader count as stage_count. Note in your reasoning if the leader/child split is unclear.",
  Students:
    "This is a student/youth ministry environment, primarily middle school and high school age. Count students in the audience as total_count, and adult leaders/volunteers/speakers as stage_count.",
  Nursery:
    "This is a nursery environment with infants and young children. Count children as total_count and adult caregivers as stage_count. Be especially careful — small children may be in laps, cribs, or play areas and easy to miss.",
  "Lobby / Overflow":
    "This is a lobby, foyer, or overflow viewing area — not the main sanctuary. Count all people visible. There is typically no stage; stage_count will usually be 0.",
  Other:
    "Count all people visible in the audience as total_count, and any people on stage or leading as stage_count.",
};

function corsHeaders(env: Env): Record<string, string> {
  const origin = env.CORS_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, env: Env, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env),
    },
  });
}

async function verifyUser(token: string, env: Env): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string };
  return data?.id ?? null;
}

interface CountRequest {
  campus: string;
  area: string;
  serviceType: string;
  serviceDate: string;
  multiAngle: boolean;
  images: { base64: string; mediaType: string }[];
}

function buildPrompt(req: CountRequest): string {
  const areaGuidance = AREA_GUIDANCE[req.area] || AREA_GUIDANCE.Other;
  const photoCount = req.images.length;

  const multiAngleBlock = req.multiAngle
    ? `

MULTI-ANGLE MODE — CRITICAL: The ${photoCount} photos are DIFFERENT ANGLES of the SAME ROOM taken moments apart. They show overlapping coverage of ONE congregation, not separate spaces. Your job is to produce ONE accurate count of unique people. Do NOT sum per-photo counts naively — that double-counts everyone in overlap zones.

Required process:
1. Identify which areas of the room are visible in multiple photos (overlap zones) versus only one photo (unique zones).
2. For each overlap zone: count it ONCE, choosing the angle with the cleanest sightlines for that zone.
3. For each unique zone: count it from the sole photo that shows it.
4. total_count = sum of the unique non-overlapping contributions across all photos.
5. The per_image counts you return MUST reflect each photo's non-overlapping contribution (the zones you assigned to it) — they should sum to total_count.
6. In notes, briefly state which photo you used for which section of the room (e.g., "left mezzanine from photo 1, main floor center and right mezzanine from photo 2").

`
    : `

If multiple photos are provided, treat them as independent shots and do your best not to double-count if they happen to overlap.

`;

  return `You are counting people in photos from Our Savior's Church.

Service context:
- Campus: ${req.campus}
- Area: ${req.area}
- Service type: ${req.serviceType}
- Date: ${req.serviceDate}
- Photos provided: ${photoCount}
- Mode: ${req.multiAngle ? "Multi-angle stitch (overlap-aware)" : "Single photo / independent shots"}

Area-specific guidance: ${areaGuidance}
${multiAngleBlock}
Exclude camera operators in booths or technicians clearly behind the scenes.

If this is a "Candlelight Service" or extremely dim scene, you may use visible candles as a proxy signal (most adults hold one, families may share) — note this approach in your explanation if used.

Return ONLY a JSON object with no surrounding text or markdown:
{
  "total_count": <integer audience count, your best single estimate>,
  "stage_count": <integer count of people on stage / leaders / volunteers, 0 if none visible>,
  "confidence": "high" | "medium" | "low",
  "notes": "<2-3 sentences: what you observed, what helped or hurt counting accuracy, and any caveats>",
  "per_image": [
    {"image_index": <1-based>, "count": <integer>, "note": "<one short observation>"}
  ]
}

Confidence calibration:
- high = elevated vantage, clear separation, lit audience, ~5-8% margin
- medium = some occlusion, mixed lighting, but most people resolvable, ~10-15% margin
- low = heavy occlusion, mid-crowd angle, very dim, or candlelight (rough estimate)`;
}

function validateRequest(body: unknown): CountRequest | string {
  if (!body || typeof body !== "object") return "Invalid JSON body";
  const b = body as Record<string, unknown>;
  const required = ["campus", "area", "serviceType", "serviceDate"];
  for (const k of required) {
    if (typeof b[k] !== "string" || !(b[k] as string).length) {
      return `Missing field: ${k}`;
    }
  }
  if (!Array.isArray(b.images) || b.images.length === 0) {
    return "At least one image is required";
  }
  if (b.images.length > 6) {
    return "Too many images (max 6)";
  }
  for (const img of b.images as unknown[]) {
    if (
      !img ||
      typeof img !== "object" ||
      typeof (img as { base64?: unknown }).base64 !== "string" ||
      typeof (img as { mediaType?: unknown }).mediaType !== "string"
    ) {
      return "Each image must have base64 and mediaType";
    }
  }
  return {
    campus: b.campus as string,
    area: b.area as string,
    serviceType: b.serviceType as string,
    serviceDate: b.serviceDate as string,
    multiAngle: Boolean(b.multiAngle),
    images: b.images as CountRequest["images"],
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/count" || request.method !== "POST") {
      return jsonResponse({ error: "Not found" }, env, 404);
    }

    const auth = request.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return jsonResponse({ error: "Missing bearer token" }, env, 401);

    const userId = await verifyUser(token, env);
    if (!userId) return jsonResponse({ error: "Invalid session" }, env, 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, env, 400);
    }
    const validated = validateRequest(body);
    if (typeof validated === "string") {
      return jsonResponse({ error: validated }, env, 400);
    }

    const prompt = buildPrompt(validated);
    const content: unknown[] = [{ type: "text", text: prompt }];
    for (const img of validated.images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType,
          data: img.base64,
        },
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      return jsonResponse(
        { error: `Anthropic error (${anthropicRes.status})`, detail: text },
        env,
        502
      );
    }

    const data = (await anthropicRes.json()) as {
      content?: { type: string; text?: string }[];
    };
    const textBlock = data.content?.find((b) => b.type === "text");
    const raw = textBlock?.text ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return jsonResponse(
        { error: "Could not parse AI response", raw },
        env,
        502
      );
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return jsonResponse(
        { error: "AI returned invalid JSON", raw },
        env,
        502
      );
    }

    return jsonResponse(
      {
        total_count: parsed.total_count,
        stage_count: parsed.stage_count ?? 0,
        confidence: parsed.confidence ?? "medium",
        notes: parsed.notes ?? "",
        per_image: parsed.per_image ?? [],
        raw_response: data,
      },
      env
    );
  },
};
