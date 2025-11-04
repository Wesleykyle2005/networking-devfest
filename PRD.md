# PRD — DevFest Managua 2025 Networking App

_Last updated: Nov 3, 2025 • Owner: Rodolfo Andino • App language: **Spanish** • Deploy target: **Vercel**_

---

## 0) Summary

A lightweight networking web app for the single event **DevFest Managua 2025** that lets attendees:

- Sign in via **magic link** and join using a **single shared event code**.
- Create a **public profile** (avatar 1:1, name, headline, company, bio, location, socials).
- **Generate & show a QR** that links to the public profile (lock-screen friendly export).
- **Discover people** (directory search by name, company, title).
- **Request connections** by scanning or from profiles; **B approves** (if feasible); both see each other in “Mis Conexiones”.
- **Admin** (email-whitelisted) can view simple metrics and moderate basic items.
- **Post-event**: database will be **deleted** (data retention not required).

Scope is intentionally simple and “AI pair-coding friendly”.

---

## 1) Goals & Non-Goals

### 1.1 Goals

- Make exchanging contact details frictionless during the event.
- Provide a simple directory for discovery and connection requests.
- Generate **lock-screen QR** images to speed up scanning at the venue.
- Offer minimal but useful **Admin metrics** (profiles completion %, total connections).

### 1.2 Non-Goals

- Multi-event support.
- Offline mode / PWA.
- Complex moderation workflows or content governance.
- Email notifications (only in-app toasts).
- Complex matchmaking (“people you may want to meet”).

---

## 2) Users & Access

- **Audience:** Only event attendees.
- **Entrance:** Magic-link sign-in + **single shared event code** (e.g., `DEVFEST2025`).
- **Roles:**
  - **Attendee** (default)
  - **Admin** (no separate role table; protect `/admin` by **email whitelist** env var).
- **Profile visibility:** **Public** via UUID URLs; contact fields can be **hidden until connected**.

---

## 3) Core Use Cases & Flows

### 3.1 Sign-in & Event Code

1. User enters email → receives **magic link** (Supabase Auth).
2. First visit post-auth: show **Event Code** gate.
3. If code matches the configured code in app env (or Supabase `event_settings`), the user proceeds to **Create Profile**.
4. Store `joined_event_at`.

**Acceptance Criteria**

- Magic link works; no password screen.
- Invalid event code blocks access beyond the code gate.
- Refresh preserves session; sign-out clears it.

### 3.2 Create/Edit Profile (Spanish UI)

Fields:

- **Required:** `name`, `headline`, `company`, `avatar` (1:1), `bio` (short), `location`
- **Socials (optional):** LinkedIn, X/Twitter, Instagram, Facebook, WhatsApp, phone, email, website
- **Privacy toggles:** “Ocultar teléfono/email hasta que haya conexión”
- **Lock-screen QR export** (see 3.4)

**Acceptance Criteria**

- Avatar cropped/stored at 1:1; reasonable max size (e.g., 3 MB).
- Can save without optional socials.
- Public profile page accessible via UUID URL.
- Contact fields are hidden if viewer is not connected and privacy toggle is on.

### 3.3 Directory & Profile View

- **Directory**: search by **name**, **company**, **job title**.
- Profile card → View profile → **Solicitar conexión** button.

**Acceptance Criteria**

- Search is case-insensitive, debounced, returns ≤50 results/page.
- Public profile page shows event brand header, avatar, name, headline, company, bio, visible socials (respect privacy toggles).

### 3.4 QR Code (Profile Share)

- Each profile has a **QR** to their public URL.
- **Export image**: **lock-screen card** (PNG) that includes: event logo, attendee avatar, name, headline, and QR (high contrast).
- **Badge mode**: button to show full-screen QR quickly.

**Acceptance Criteria**

- QR image renders sharply on modern phones.
- PNG download works (server-side render or client canvas).
- “Badge mode” full-screen with brightness advice (optional simple overlay).

### 3.5 Connections (Scan → Request → Approve)

- Flow A: **Scan QR** → lands on profile → taps **Solicitar conexión**.
- **Pending requests** list for recipients (if “approval” is on).
- On **Approve**, both users appear in **Mis Conexiones** (mutual connection).
- If “approval flow” is deemed too heavy during dev, **fallback** to auto-connect (feature flag).

**Acceptance Criteria**

- Request cannot be duplicated (dedupe by requester_id + recipient_id + event_id).
- Recipient sees **in-app toast** and a **Pending** tab.
- Approve → both see each other under **Mis Conexiones**.
- Add **personal notes** and **tags** (private to the author) to a connection.
- Multiple scans of the same QR do not create duplicate connections.

### 3.6 Download “Profile Card” as Image

- From any profile (self or others), **Exportar tarjeta** (PNG) with avatar, name, headline, socials icons, and event logo (social-card design).

**Acceptance Criteria**

- Exports quickly (<2s typical on Vercel function).
- Image has safe padding and looks good on mobile share.

### 3.7 Admin Dashboard (Simple)

- Route: `/admin` (protected by email whitelist).
- Cards:
  - **% Perfiles completos**
  - **Conexiones totales**
  - **Solicitudes pendientes**
  - **Descargas de QR / Escaneos** (basic counts)
- Tables:
  - Attendees list (name, email, profile completion status)
  - Connections list (with timestamps)
- **Export CSV**: connections.

**Acceptance Criteria**

- Whitelisted emails only (env var `ADMIN_EMAILS` comma-separated).
- Metrics load under 1s for ≤2k attendees.
- CSV downloads open/save correctly.

---

## 4) Information Architecture

### 4.1 Navigation (Attendee)

- `/login` → magic link
- `/join` → event code gate
- `/perfil/editar`
- `/perfil/:uuid` (public)
- `/qr` (badge mode)
- `/directorio`
- `/conexiones` (Tabs: Todos | Pendientes | Enviadas)
- `/ajustes` (optional minimal)

### 4.2 Navigation (Admin)

- `/admin`
  - Dashboard (cards + charts)
  - Personas (table)
  - Conexiones (table)
  - Config (read-only theme preview; values are in code)

---

## 5) Data Model (Supabase)

> Uses Supabase Auth (`auth.users`) for accounts. App schema lives in `public`.

### 5.1 Tables

#### `profiles`

- `id` (uuid, pk, references `auth.users.id`)
- `event_id` (uuid) — constant for single event
- `slug_uuid` (uuid, unique) — used in public URL
- `name` (text, required)
- `headline` (text)
- `company` (text)
- `job_title` (text) — used for directory filter
- `bio` (text)
- `location` (text)
- `avatar_url` (text)
- `social_linkedin` (text)
- `social_twitter` (text)
- `social_instagram` (text)
- `social_facebook` (text)
- `phone` (text)
- `email_public` (text) — optional public contact email
- `website` (text)
- `hide_phone_until_connected` (bool, default true)
- `hide_email_until_connected` (bool, default true)
- `profile_completion_score` (int) — computed server-side trigger
- `joined_event_at` (timestamptz)
- `created_at` / `updated_at`

Indexes: `idx_profiles_event`, GIN trigram on (`name`, `company`, `job_title`) for search.

#### `connection_requests`

- `id` (uuid, pk)
- `event_id` (uuid)
- `requester_id` (uuid, references `profiles.id`)
- `recipient_id` (uuid, references `profiles.id`)
- `status` (enum: `pending`, `approved`, `declined`, default `pending`)
- `created_at` / `updated_at`

Unique index: (`event_id`, `requester_id`, `recipient_id`).

#### `connections`

- `id` (uuid, pk)
- `event_id` (uuid)
- `user_a_id` (uuid)
- `user_b_id` (uuid)
- `created_at`

Unique index: (`event_id`, `user_a_id`, `user_b_id`) with sorted rule (ensure A < B at insert).

#### `connection_notes`

- `id` (uuid, pk)
- `event_id` (uuid)
- `author_id` (uuid) — who writes the note
- `peer_id` (uuid) — about whom
- `note` (text)
- `tags` (text[]) — simple array of tags
- `created_at` / `updated_at`

Index: (`author_id`, `peer_id`).

#### `scans`

- `id` (uuid, pk)
- `event_id` (uuid)
- `profile_id` (uuid) — whose profile was scanned/viewed
- `by_user_id` (uuid, nullable if anonymous)
- `source` (enum: `qr`, `directory`, `link`)
- `created_at`

#### `qr_assets` (optional cache)

- `id` (uuid, pk)
- `event_id` (uuid)
- `profile_id` (uuid)
- `png_url` (text)
- `rendered_at` (timestamptz)

#### `event_settings`

- `event_id` (uuid, pk)
- `event_code` (text) — single shared code
- `event_name` (text)
- `starts_at` / `ends_at` (timestamptz)

Branding remains defined in code.

### 5.2 ERD (ASCII)

```
auth.users (Supabase)
└── profiles (1:1)
    ├── connection_requests (1:N)
    ├── connections (M:N via user_a_id/user_b_id)
    ├── connection_notes (1:N)
    ├── scans (1:N)
    └── qr_assets (0:1)

event_settings (1:many logical but single active event)
```

---

## 6) Permissions (RLS)

- `profiles`:
  - **SELECT**: public-readable (only non-sensitive fields).
  - **SELECT sensitive fields** (`phone`, `email_public`) only if:
    - viewer is connected to profile owner **OR**
    - owner’s privacy toggles are off.
  - **INSERT/UPDATE**: owner can write only their row.
- `connection_requests`:
  - **INSERT**: requester.
  - **SELECT**: requester sees their sent; recipient sees requests to them.
  - **UPDATE**: only recipient can change status.
- `connections`:
  - **INSERT**: done by RPC on approval (server function).
  - **SELECT**: either participant can read rows involving them.
- `connection_notes`:
  - **SELECT/INSERT/UPDATE/DELETE**: only `author_id`.

Implement with Supabase RLS policies + helper RPC to atomically approve request → create mutual connection.

---

## 7) API & Server Functions

### 7.1 Next.js API routes

- `POST /api/qr/render` → returns PNG (lock-screen card).
  - Inputs: `profile_id`/`slug_uuid`.
  - Auth: must be the profile owner **or** public render allowed.
- `POST /api/export/profile-card` → returns PNG social card for a given profile.
- `GET /api/admin/metrics` → aggregates (requires admin email).

### 7.2 Supabase SQL / RPC

- `rpc_approve_request(request_id uuid)`
  - Validates recipient ownership; sets status `approved`; inserts row into `connections` with normalized pair (A < B).
- `rpc_profile_completion_score(profile_id uuid)`
  - Returns 0–100; optional trigger to set `profiles.profile_completion_score`.

---

## 8) UX & UI Components (shadcn/ui)

- **Auth**: Magic link screen; Event Code modal sheet.
- **Profile Form**: Avatar upload (Supabase Storage), text inputs, toggles; Spanish labels & helper text.
- **Directory**: Search input + filters (Company, Title) + result list; skeleton loaders.
- **Profile Public**: Header with event logo, avatar/name block, socials icons (respect privacy).
- **QR Page**: Full-screen QR with tap-to-maximize; “Descargar PNG”.
- **Connections**: Tabs (Todos | Pendientes | Enviadas); approve/decline buttons; notes/tags drawer.
- **Admin**: KPI cards; tables; CSV export buttons.

---

## 9) Branding & Theming

- Tailwind tokens: `-brand-primary`, `-brand-accent`, `-brand-surface`, `-brand-text`.
- Event logo imported as asset; used in public header and QR/social cards.
- Sponsor placement: footer stripe (logo row) on **public profile** and **QR lock-screen image**.

---

## 10) Analytics (Minimal)

Tracked in DB:

- `profiles.profile_completion_score`
- `scans` (count per source)
- `connection_requests` (pending, approved)
- `connections` count

Admin dashboard shows:

- **% Perfiles completos** (>=60 or >=80 threshold)
- **Conexiones totales**
- **Solicitudes pendientes**
- **Escaneos totales** (by source)

---

## 11) Non-Functional Requirements

- **Performance**: TTFB < 500ms for SSR pages on Vercel (typical). Directory queries paginated (≤50).
- **Availability**: Best-effort during event day (no SLOs).
- **Security**: UUID URLs; RLS enforced; event code required to create profile.
- **Privacy**: Phone/email hidden until connection (if toggled). Public profiles otherwise readable.
- **i18n**: Spanish only (labels, toasts, errors).
- **Accessibility**: Reasonable ARIA for forms & buttons; color contrast ≥ 4.5:1.

---

## 12) MVP Scope (Build Order)

- **M0 – Foundations**
  - Supabase project + schema + RLS.
  - Next.js app, auth (magic link), event code gate.
  - Profile create/edit; public profile page.
- **M1 – QR & Directory**
  - QR generation (lock-screen PNG export + badge mode).
  - Directory search (name/company/title).
- **M2 – Connections**
  - Request → Pending → Approve → Mutual connection.
  - Notes & tags on a connection.
  - Privacy checks for phone/email.
- **M3 – Admin & Analytics**
  - `/admin` (email whitelist): metrics, tables, CSV export.
  - Scans + counters; profile completion metric.
- **Post-MVP (if time)**
  - vCard export per connection.
  - Basic sponsor “lead capture” page.
  - Feature flag to disable approval (auto-connect fallback).

---

## 13) Acceptance Criteria (MVP Checklist)

- [ ] Magic link login works; event code gate enforced.
- [ ] Users can create/edit profile; avatar 1:1 stored; Spanish UI.
- [ ] Public profile accessible by UUID; contact fields respect privacy toggles.
- [ ] QR page shows full-screen QR; PNG **lock-screen** export includes event logo, avatar, name, headline, QR.
- [ ] Directory search by name/company/title with pagination.
- [ ] Connection request flow works: send, view pending, approve, mutual appears in “Mis Conexiones”.
- [ ] Notes/tags attach to a connection (private to author).
- [ ] No duplicate requests or connections for same pair/event.
- [ ] Admin dashboard shows metrics & supports CSV export.
- [ ] Basic scan analytics recorded.

---

## 14) Risks & Mitigations

- **Approval flow complexity:** Implement via single RPC (`rpc_approve_request`) to atomically set status and create connection. Feature flag a fallback to auto-connect if needed.
- **Public data leakage:** RLS + field-level guards in queries; only expose non-sensitive fields to anonymous readers. Contact details gated.
- **Load spikes during event:** Cache public profiles (SSR with revalidate); use pagination and light queries.

---

## 15) Environment & Config

- `NEXT_PUBLIC_EVENT_NAME="DevFest Managua 2025"`
- `NEXT_PUBLIC_EVENT_ID=<uuid>`
- `NEXT_PUBLIC_EVENT_CODE="DEVFEST2025"`
- `ADMIN_EMAILS="rodolfo@...,another@..."`
- Supabase keys/URL (standard)
- Branding tokens hardcoded in theme file (Tailwind CSS).

---

## 16) Example SQL (Supabase) — Sketch

```sql
-- connection status enum
create type connection_status as enum ('pending', 'approved', 'declined');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  event_id uuid not null,
  slug_uuid uuid not null default gen_random_uuid() unique,
  name text not null,
  headline text,
  company text,
  job_title text,
  bio text,
  location text,
  avatar_url text,
  social_linkedin text,
  social_twitter text,
  social_instagram text,
  social_facebook text,
  phone text,
  email_public text,
  website text,
  hide_phone_until_connected boolean not null default true,
  hide_email_until_connected boolean not null default true,
  profile_completion_score int not null default 0,
  joined_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connection_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  requester_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  status connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, requester_id, recipient_id)
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  user_a_id uuid not null references profiles(id) on delete cascade,
  user_b_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_a_id, user_b_id)
);

create table if not exists connection_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  author_id uuid not null references profiles(id) on delete cascade,
  peer_id uuid not null references profiles(id) on delete cascade,
  note text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  by_user_id uuid,
  source text check (source in ('qr','directory','link')),
  created_at timestamptz not null default now()
);

create table if not exists event_settings (
  event_id uuid primary key,
  event_code text not null,
  event_name text not null,
  starts_at timestamptz,
  ends_at timestamptz
);
```

RLS policies and RPC definitions to be added during implementation.

---

## 17) QA Scenarios (Spot Checks)

- **Privacy:** Visit another user’s profile while not connected — phone/email hidden; after connection approved — visible.
- **Duplicate prevention:** Send two requests to the same recipient — second blocked.
- **Directory:** “José” vs “Jose” fuzzy matching (minimum: case-insensitive exact/ILIKE).
- **Admin whitelist:** Non-admin attempting `/admin` sees 403/redirect.

---

## 18) Dev Notes & Implementation Tips

- Use **shadcn/ui** for forms, tabs, dialogs, toasts; **react-hook-form + zod** for validation.
- Avatar upload: Supabase Storage bucket `avatars/` + signed URLs.
- QR rendering: `qrcode` lib + `@vercel/og`/`satori` or `node-canvas` to compose **lock-screen PNG** (avatar, logo, QR).
- Directory search: SQL `ILIKE` with indexes; paginate with `limit/offset` or keyset.
- Feature flag for approval fallback: env `CONNECTIONS_REQUIRE_APPROVAL=true`.
- Clean-up plan: `DROP SCHEMA public CASCADE` post-event or project delete.

---

## 19) Open Questions

- Do we want **vCard** export per connection as a quick win? (_Default: out of MVP_)
- Should exported images include a small “Compartido por DevFest” watermark? (_Default: yes, tasteful_)

---

## 20) Handover / Next Steps

1. Confirm env values (event id, code, admin emails, brand tokens).
2. Scaffold Next.js app (App Router), Supabase client, auth middleware.
3. Create DB schema + RLS; seed `event_settings`.
4. Implement M0 → M3 per MVP scope.
5. Dry-run with 10 test attendees; load test directory/QR briefly.

---
