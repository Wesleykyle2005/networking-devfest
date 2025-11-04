# Implementation Plan (Work in Progress)

This document breaks down the MVP milestones into actionable development tasks. It will evolve as features are delivered and new learnings emerge.

## M0 — Foundations

1. **Supabase Infrastructure**
   - Apply `0001_devfest_schema.sql` migration and enable RLS
   - Create storage bucket `avatars` with public-read via signed URLs
   - Seed `event_settings` row with event metadata and shared event code
2. **Auth & Session**
   - Configure Supabase magic-link (email OTP) provider for Spanish-language emails
   - Implement `/login` page with email input, confirmation UX, and toast feedback
   - Handle `/auth/callback` to finalize sessions and redirect to `/join`
3. **Event Gate**
   - Build `/join` page prompting for event code (in Spanish)
   - Verify against `NEXT_PUBLIC_EVENT_CODE` first, fall back to Supabase `event_settings`
   - On success, update `profiles.joined_event_at`
4. **Profile Management**
   - `/perfil/editar` form using `react-hook-form` + `zod`
   - Avatar upload workflow (drag/drop → crop → Supabase Storage upload)
   - Persist required fields; handle privacy toggle defaults
   - Ensure `profiles_before_write` trigger updates completion score
5. **Public Profile**
   - Route `/perfil/[slug]` SSR displaying attendee data respecting privacy toggles
   - Add sponsor/footer stripe placeholder

## M1 — QR & Directory

1. `/qr` badge mode page with full-screen QR and brightness hint overlay
2. `POST /api/qr/render` for lock-screen PNG (Satori or @vercel/og)
3. `/directorio` listing with filters (name/company/title) + pagination
4. Record `scans` row when profile or directory card is opened

## M2 — Connections

1. Feature flag default `CONNECTIONS_REQUIRE_APPROVAL=false`
2. Implement request send button on profile view (auto-connect if flag off)
3. `/conexiones` tabs (Todos | Pendientes | Enviadas); integrate toasts
4. Notes & tags UI (modal or side sheet) writing to `connection_notes`
5. Privacy enforcement for phone/email (only show when connection exists or toggle disabled)

## M3 — Admin & Analytics

1. Middleware guard for `/admin` using `ADMIN_EMAILS`
2. `GET /api/admin/metrics` aggregations for cards (performance tuned for ≤2k users)
3. Admin dashboard UI with cards + tables (attendees, connections)
4. CSV export endpoint for connections table
5. Analytics wiring: increment counts for QR downloads, directory views, etc.

## Post-MVP Ideas

- vCard export per connection (`/api/export/vcard`)
- Sponsor lead capture page with downloadable CSV
- Feature flag to toggle approval flow in real time (Supabase `event_settings` or config table)

## Open Questions / To Revisit

- Confirm watermark treatment (copy, placement, color once assets arrive)
- Decide on caching strategy for public profile pages (ISR vs. on-demand revalidation)
- Explore search improvements (accent-insensitive matching with `unaccent` extension)
