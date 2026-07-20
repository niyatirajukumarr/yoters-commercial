-- ============================================================
-- DPDP (Digital Personal Data Protection Act, 2023) compliance migration
--
-- Adds the data-protection bookkeeping the Act requires us to keep for each
-- Data Principal (user):
--   * consent_at / consent_version  -> proof of free, informed, specific consent
--                                       (DPDP s.6) and which notice version it was
--   * consent_withdrawn_at          -> consent withdrawal must be as easy as giving it
--   * data_deleted_at               -> right to erasure audit trail (s.12)
--   * dob / is_adult                -> children's data handling (s.9): verifiable
--                                       parental consent / no tracking of minors
--
-- Apply in the Supabase SQL editor after reviewing.
-- ============================================================

alter table profiles
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists consent_withdrawn_at timestamptz,
  add column if not exists data_deleted_at timestamptz,
  add column if not exists dob date,
  add column if not exists is_adult boolean;

comment on column profiles.consent_at is
  'When the user gave consent to the privacy notice (DPDP s.6).';
comment on column profiles.consent_version is
  'Version string of the privacy notice consented to; re-prompt when it changes.';
comment on column profiles.consent_withdrawn_at is
  'Set when the user withdraws consent; processing must stop for withdrawn purposes.';
comment on column profiles.data_deleted_at is
  'Right-to-erasure timestamp: personal data anonymised/removed on this date.';

-- Storage-limitation reference: orders older than the retention window are
-- eligible for erasure/anonymisation. Run this periodically (scheduled job) —
-- kept here as documentation of the retention policy.
--   delete from orders where created_at < now() - interval '365 days'
--     and status in ('collected','cancelled');
