# Owning the backend — replacing Supabase

Status: plan, not yet started. Owner: Niyati.

---

## 1. What we're actually building

Two things get confused under "build our own Supabase". They are not the
same project and we do them in order.

**Phase A — Yoters runs on our own backend.** One Postgres we own, one auth
service we own, one realtime gateway, one storage layer. No `@supabase/*`
package left in `package.json`. This is ~10 weeks and it is the real goal.

**Phase B — that backend becomes a platform.** Multi-project, a dashboard,
a CLI, provisioning. Only worth starting once Phase A has run in production
for a quarter without incident. Everything in Phase A is built so Phase B
is a wrapper, not a rewrite.

This document plans A in detail and B in outline.

### What we are replacing

Measured from the current codebase, not guessed:

| Supabase feature | Our usage today | Replacement difficulty |
|---|---|---|
| Postgres + RLS | 11 tables, 102 migrations, 20 policies, 16 functions, 8 triggers | **Easy** — this is plain Postgres, it is already ours |
| Auth | email/password, reset, session, 1 DB webhook | **Hard** — highest risk, do it carefully |
| Data API (PostgREST) | 41 `.from()` calls, 2 `.rpc()` | **Medium** — bridged, then retired |
| Realtime | 13 channels, all `postgres_changes` | **Medium** — new service |
| Storage | 3 calls, 2 buckets | **Easy** — S3-compatible |
| Edge Functions | none — we use 24 Next.js routes | **Nothing to do** |

The single most important fact: **RLS is a Postgres feature, not a Supabase
feature.** All 20 policies move across untouched. That is why this migration
is achievable instead of a rewrite.

---

## 2. The stack

Decisions, not options. Each line is the choice and the reason.

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript on Node 22 | Same language as the app. One hiring pool, shared types, shared validation (`zod` already in use). |
| HTTP framework | Fastify | Fastest mature Node server, schema-first, first-class plugin isolation. |
| Database | PostgreSQL 16, **managed** (AWS RDS or Neon) | Independence from Supabase ≠ running Postgres on metal. HA, backups and failover are a full-time team; rent them. We own the data and can move it any day. |
| Migrations | Atlas, plain SQL files | Keeps our existing 102 `.sql` files. Adds checksums, CI drift detection and a lint pass. |
| Connection pooling | PgBouncer (transaction mode) | Serverless app + persistent gateway both hit one pool. Non-negotiable at scale. |
| Auth crypto | `argon2id` hashing, `jose` for JWT (ES256) | Never write crypto. Argon2id is the current password standard; ES256 lets us publish a JWKS and verify tokens without sharing a secret. |
| Data API bridge | PostgREST (standalone, Apache-2.0) | The open-source project Supabase wraps. Drop-in, RLS-aware, buys us a working API on day one while we retire queries. |
| Realtime | Own WS gateway: Postgres logical replication → Redis pub/sub → clients | Logical replication sees every change with no trigger overhead and no missed writes. |
| Storage | Cloudflare R2 (S3 API) + our own metadata table | Zero egress fees, S3-compatible so we can move to S3 or MinIO unchanged. |
| Cache / pub-sub | Redis (managed) | Sessions, rate limits, realtime fan-out. |
| Client | `@yoters/client`, our own SDK | Mirrors the Supabase method surface so the 40 app files change an import, not their logic. |
| Deploy | Docker → AWS ECS Fargate (or Fly.io) | Services are stateless; the state is in Postgres, Redis and R2. |
| Observability | OpenTelemetry → Grafana Cloud | Traces across app → gateway → Postgres. Without this we are debugging blind the first time we are paged. |
| Secrets | AWS Secrets Manager | `.env` files do not exist in production. Rotation is a config change, not a deploy. |

### Services

Four processes. Each has its own Postgres role with only the grants it needs.

```
  app (Next.js)
       │
       ├──► auth-service      /auth/*     sessions, tokens, JWKS
       ├──► data-gateway      /rest/*     PostgREST behind our auth
       ├──► realtime-gateway  /realtime   WebSocket, logical replication
       └──► storage-service   /storage/*  signed URLs, R2
                     │
              Postgres (RLS) · Redis · R2
```

---

## 3. How authorization works after the move

This is the part that must not be improvised, so it is specified here.

1. Client sends an access token (JWT, ES256, 15-minute life).
2. Gateway verifies it against our JWKS. No shared secret anywhere.
3. Gateway opens a transaction and sets, per request:
   `SET LOCAL ROLE authenticated;`
   `SET LOCAL request.jwt.claims = '{"sub":"…","role":"…"}';`
4. Every existing RLS policy reads those claims exactly as it does today.
5. Transaction commits or rolls back. The role never leaks between requests.

Refresh tokens are opaque, stored hashed, single-use, and rotate on every
use. Reuse of a spent refresh token revokes the whole session family — that
is how we detect a stolen token.

---

## 4. Phases

Each phase ends with a demo, a rollback path, and a security review. Nothing
merges without the existing hooks (`npm run verify`, secret scan) passing.

### Phase 0 — Inventory and freeze (1 week)
Write down every Supabase call site, every policy, every bucket, every
webhook. Snapshot the schema. Freeze new Supabase-specific features from
here until cutover. **Out:** an inventory doc and a schema snapshot in git.

### Phase 1 — Our Postgres (2 weeks)
Provision managed Postgres. Replay all 102 migrations into it. Move
migrations to Atlas. Set up PgBouncer, automated backups, point-in-time
recovery, and a **restore drill that we actually run**. Copy production
data with `pg_dump`/`pg_restore` into a staging copy.
**Out:** a Postgres we own, byte-identical schema, proven restore.

### Phase 2 — Auth service (3 weeks — the risky one)
Build `auth-service`: signup, login, refresh, logout, password reset, email
verification, TOTP MFA, lockout, audit trail. Import Supabase's
`auth.users` — its password hashes are bcrypt and portable, so users keep
their passwords; we transparently re-hash to argon2id on their next login.
Run both auth systems side by side behind a flag. Cut over one role at a
time: admin → vendor → customer.
**Out:** every user logs in against our service. Supabase auth read-only.

### Phase 3 — Data gateway (2 weeks)
Stand up PostgREST behind our JWT verification at `/rest/*`. Point the SDK
at it. The 41 `.from()` calls keep working. Then begin replacing the
highest-risk ones (orders, payouts, payments) with typed Fastify endpoints
that enforce business rules server-side instead of trusting a client query.
**Out:** all reads/writes through our gateway. Money paths are typed
endpoints, not raw table access.

### Phase 4 — Realtime gateway (2 weeks)
WebSocket server. A logical replication slot streams changes; each change is
matched against subscribers and re-checked against RLS before it is sent —
**a subscription must never leak a row the subscriber could not SELECT.**
Redis pub/sub fans out across instances. Ship the same
`.channel().on('postgres_changes', …)` shape so the 13 call sites are
unchanged.
**Out:** vendor and order screens live on our realtime, Supabase realtime
disabled.

### Phase 5 — Storage (1 week)
R2 buckets mirroring `menu-item-images` and team photos. Uploads go through
signed, size- and type-limited URLs issued by `storage-service`; the browser
never holds a bucket credential. Migrate existing objects, then repoint.
**Out:** no Supabase storage calls left.

### Phase 6 — Cutover and delete (2 weeks)
Remove `@supabase/*` from `package.json`. Remove every `SUPABASE_*` env var.
Keep the Supabase project suspended-but-alive for 30 days as the rollback,
then delete it and rotate everything.
**Out:** zero Supabase dependencies. A dated decommission note.

### Phase 7 — Production hardening (2 weeks)
Multi-AZ, read replica, load test to 10× current peak, chaos test (kill the
primary, kill the realtime gateway, fill the disk), runbooks, alerting,
on-call rotation, quarterly restore drills.
**Out:** an SLO we can state out loud and defend.

### Phase B — Platform (later, outlined)
Project provisioning (schema-per-project), a dashboard (table editor, SQL
console, logs, auth users), a CLI, per-project API keys, usage metering,
org/team/roles, autogenerated typed clients. Only after A is boring.

**Total for Phase A: ~13 weeks.** Two can run in parallel (4 and 5), so
about 11 with focus.

---

## 5. Security — the standing bar

Zero-trust, enforced by machinery. This extends `RULES.md`, it does not
replace it.

- **Every service gets its own Postgres role** with the minimum grants. No
  service uses the superuser. There is no equivalent of a service-role key
  that bypasses RLS available to the app.
- **Internal traffic is mTLS.** Services authenticate each other; network
  position grants nothing.
- **Every request is authorized at the row.** RLS stays on for every table
  including new ones — CI fails a migration that creates a table without
  `ENABLE ROW LEVEL SECURITY`.
- **Secrets are never in the repo or in a file.** The existing pre-commit
  secret scan stays; add a CI check that no image layer contains one.
- **Keys rotate on schedule** — JWT signing keys quarterly (JWKS makes this
  zero-downtime), DB credentials quarterly, storage keys quarterly.
- **Everything money-adjacent is append-only audited.** We already have
  `manager_audit_log`; extend the same pattern to auth events and payouts.
- **Red-team gate per phase.** Before a phase is called done, attack it:
  token replay, refresh reuse, RLS bypass via crafted filters, realtime
  subscription leakage, IDOR on storage paths, rate-limit evasion. Findings
  are fixed before merge, not filed.
- **Dependencies are pinned and scanned** on every CI run. A critical CVE
  in a backend dependency is a same-day fix.

---

## 6. What this costs us

Honest, because the decision depends on it.

- **We now own uptime.** Supabase being down was their problem; this is
  ours. Phase 7 is not optional, and someone carries a pager.
- **Auth is where breaches happen.** Three weeks in Phase 2 is the floor,
  not a stretch goal. It gets an external review.
- **Realtime at scale is genuinely hard.** If fan-out becomes the bottleneck
  after Phase 7's load test, rewrite that one service in Go. Nothing else.
- **Infrastructure cost goes up before it goes down.** Managed Postgres +
  Redis + R2 + compute beats Supabase's pricing only past real scale. We
  are doing this for control and for Phase B, not to save money this year.

What we get: the schema, the data, the auth, and the roadmap are ours, on
our terms, with no vendor able to change pricing, limits, or availability
underneath a business that takes payments.

---

## 7. Where we start

Phase 0, this week. Concretely:

1. Generate the call-site inventory (`grep` is enough — the numbers in §1
   came from it).
2. Snapshot the schema into `supabase/schema_snapshot.sql` and commit it.
3. Provision one staging Postgres and replay all migrations into it.

If step 3 works cleanly, the hardest assumption in this plan — that our
schema is portable — is proven in a day, and everything after it is
execution.
