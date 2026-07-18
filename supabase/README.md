# Supabase schema & migrations

## Authoritative schema

**`schema_commercial.sql`** is the single authoritative full-setup schema for the
commercial deployment. Run it in a fresh Supabase project's SQL editor to create
all tables, indexes, realtime, and baseline RLS policies.

The older `schema.sql` and `schema_v2.sql` variants have been removed to end the
ambiguity about which policy set is live (see security audit L8). Their history
remains in git if needed.

## Migrations

Apply the files in `migrations/` **in filename order** on top of the base schema:

- `add_cashfree_and_approval_flow.sql`
- `add_image_url_column.sql`
- `add_order_type.sql`
- `add_1rs_biryani_item.sql`
- `20260718_security_hardening.sql` — **review before applying.** Tightens the
  world-readable order policies (M1 order-tracking IDOR) and adds a DB-backed
  `role` column on `profiles` (L4). After applying, unauthenticated order
  tracking must go through a service-role server route rather than client-side
  anon reads.

## Roles / identity

Admin and manager gating is driven by environment variables, not hardcoded
emails (see `lib/config.ts`):

- `NEXT_PUBLIC_ADMIN_EMAILS` — comma-separated admin allowlist
- `NEXT_PUBLIC_MANAGER_EMAILS` — comma-separated manager allowlist (falls back to
  the admin list)

The `profiles.role` column added by the hardening migration is the authoritative
server-side role source.
