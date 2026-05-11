# OSC Attendance

An internal, mobile-first PWA for Our Savior's Church. A volunteer at each campus
takes 1–3 photos of the congregation; Claude vision returns a counted estimate;
the count, photos, and AI reasoning are logged to a shared database. Church
leadership views attendance trends in a small dashboard.

- Vite + React 18 + Tailwind CSS PWA
- Cloudflare Worker that proxies the Anthropic Claude API (keys never reach the
  browser)
- Supabase for auth (magic link), Postgres, and private photo storage
- Recharts for the dashboard

## Repo layout

```
osc-attendance/
├── src/                  React app (pages, components, lib)
├── worker/               Cloudflare Worker that calls Anthropic
├── db/                   schema.sql + policies.sql for Supabase
├── public/               static assets, PWA icons
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Setup

### 1. Install

```sh
npm install
(cd worker && npm install)
```

### 2. Supabase project

Create a fresh Supabase project, then:

1. Open **SQL editor** and run `db/schema.sql` followed by `db/policies.sql`.
2. **Storage** → New bucket → name `attendance-photos`, **not** public.
3. **Authentication** → settings → email provider on, magic link enabled, redirect
   URL set to your deployed frontend (and `http://localhost:5173` for local dev).
4. Copy the project URL and the anon key into `.env`:

```sh
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE
```

### 3. First admin

Profiles default to `role = 'volunteer'`. After your designated admin signs in
once (so their profile row exists), promote them via the SQL editor:

```sql
update profiles set role = 'admin' where email = 'admin@oursaviorschurch.org';
```

### 4. Worker secrets

```sh
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SUPABASE_URL          # https://<project>.supabase.co
npx wrangler secret put SUPABASE_ANON_KEY     # anon key, used for token verification
# optional:
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

`wrangler.toml` already sets the non-secret vars (`ANTHROPIC_MODEL`,
`CORS_ORIGIN`). Restrict `CORS_ORIGIN` to your Pages URL before going live.

## Development

```sh
npm run dev          # Vite dev server (http://localhost:5173)
npm run worker:dev   # Worker local at http://localhost:8787
```

Point the frontend at the local Worker by setting:

```
VITE_API_BASE=http://localhost:8787
```

## Build

```sh
npm run build         # produces dist/
npm run preview       # local preview of the production build
```

## Deploy

- **Frontend** → Cloudflare Pages.
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
    `VITE_API_BASE` (your Worker URL, e.g.
    `https://osc-attendance-api.<account>.workers.dev`).
  - Suggested URL: `https://osc-attendance.pages.dev`.
- **Worker** → Cloudflare Workers via `npm run worker:deploy`.
  - Secrets are set with `wrangler secret put` (see above).
  - Suggested URL: `https://osc-attendance-api.<account>.workers.dev`.

After deploying, update `CORS_ORIGIN` in `worker/wrangler.toml` to your real
frontend origin and run `worker:deploy` again.

## How it works

```
[ Volunteer PWA ] ──auth──► [ Supabase ]
       │
       ├── POST /api/count + JWT ──► [ Worker ] ──► [ Anthropic Claude API ]
       │                                                   │
       │ ◄── { total_count, confidence, notes, … } ◄───────┘
       │
       └── insert into counts + upload photos ──► [ Supabase Postgres + Storage ]

[ Admin Dashboard ] ── read aggregated counts ──► [ Supabase ]
```

The Worker:
- Verifies the user's Supabase JWT against `${SUPABASE_URL}/auth/v1/user`.
- Builds the prompt with area-specific guidance and a multi-angle stitch block
  when requested.
- Calls Claude with base64 images; parses the JSON-only response.
- Returns the parsed object to the client, which then writes to Supabase.

The Anthropic API key never reaches the browser and is not in the Vite bundle.

## Pages

- `/login` — magic-link email sign-in.
- `/` — Counter (default landing). Photos → AI count → saved to DB. Volunteers
  see their own campus history; admins can filter by campus.
- `/dashboard` — admin-only. Trend chart, week-over-week, recent counts.
- `/admin/users` — admin-only. Edit role and default campus per user.

## PWA

`vite-plugin-pwa` generates the service worker and manifest at build time.
Drop your real icons in `public/`:

- `public/icon-192.png` — 192×192 PNG, app icon.
- `public/icon-512.png` — 512×512 PNG, used for both `any` and `maskable`.

A simple OSC mark works (deep-blue circle, white "OSC"). Until you swap them
in, the manifest will reference the paths but the icons will 404.

## RLS at a glance

- `profiles`: a user can read and update their own row; admins can read and
  update everyone's. A trigger reverts role changes by non-admins.
- `counts`: volunteers insert their own rows; everyone can read counts at
  their `default_campus`; admins read all. Counts are immutable (no update or
  delete policy).
- `count_photos`: insert allowed when the parent count is yours; read allowed
  for admins and for the same-campus volunteers who can read the count.
- Storage objects in `attendance-photos`: a user can upload to `<their-uid>/…`
  and read their own uploads; admins can read all.

## Promoting / managing users

After someone signs in for the first time, their `profiles` row is created with
`role = 'volunteer'`. Use the SQL editor:

```sql
-- promote
update profiles set role = 'admin' where email = '…';

-- assign a default campus
update profiles set default_campus = 'Opelousas' where email = '…';
```

Admins can also do this from the `/admin/users` page.

## Out of scope (v1)

Multi-language, native apps, CCB integrations, manual override workflow, custom
camera-system integration, multi-tenancy. Don't add these without a fresh
decision.
