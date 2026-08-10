begin;

create table if not exists family_circle_assignments (
  id text primary key,
  family_id text not null,
  person_id text not null,
  circle text not null check (circle in ('self', 'household', 'core_circle', 'extended_family', 'descendants_guardianship', 'trusted_advisors', 'public_archive')),
  assigned_by_person_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists lineage_claims (
  id text primary key,
  family_id text not null,
  claimant_id text not null,
  subject jsonb not null,
  predicate text not null,
  object jsonb not null,
  status text not null,
  source_grade text not null,
  confidence_basis text,
  privacy_scope text not null,
  living_person_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_artifacts (
  id text primary key,
  family_id text not null,
  kind text not null,
  title text not null,
  storage_ref text,
  source_uri text,
  sha256 text,
  source_grade text not null,
  rights_status text not null,
  allowed_uses jsonb not null default '[]'::jsonb,
  sensitivity text not null,
  quarantined boolean not null default true,
  created_at timestamptz not null default now(),
  constraint evidence_has_source check (storage_ref is not null or source_uri is not null)
);

create table if not exists consent_receipts (
  id text primary key,
  family_id text not null,
  subject_person_id text not null,
  authorized_by_person_id text not null,
  authority_basis text not null,
  purposes jsonb not null,
  data_categories jsonb not null,
  scope text not null,
  actions jsonb not null,
  notice_version text not null,
  notice_language text not null,
  status text not null,
  granted_at timestamptz not null,
  expires_at timestamptz,
  withdrawn_at timestamptz
);

create table if not exists publication_decisions (
  id text primary key,
  family_id text not null,
  resource_type text not null,
  resource_id text not null,
  decision text not null,
  living_person_ids jsonb not null default '[]'::jsonb,
  consent_receipt_ids jsonb not null default '[]'::jsonb,
  redactions jsonb not null default '[]'::jsonb,
  reviewed_by_person_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists succession_policies (
  id text primary key,
  family_id text not null,
  owner_person_id text not null,
  trigger_type text not null check (trigger_type in ('emergency', 'incapacity', 'death')),
  guardian_person_ids jsonb not null,
  quorum integer not null check (quorum >= 2),
  verification_requirements jsonb not null,
  cooling_period_hours integer not null check (cooling_period_hours >= 0),
  release_scopes jsonb not null,
  secret_export_allowed boolean not null default false check (secret_export_allowed = false),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists guardian_approvals (
  id text primary key,
  family_id text not null,
  policy_id text not null,
  guardian_person_id text not null,
  decision text not null,
  evidence_ref text,
  created_at timestamptz not null default now(),
  unique (policy_id, guardian_person_id)
);

create index if not exists lineage_claims_family_status_idx on lineage_claims (family_id, status);
create index if not exists evidence_artifacts_family_idx on evidence_artifacts (family_id);
create index if not exists consent_receipts_family_subject_idx on consent_receipts (family_id, subject_person_id);
create index if not exists publication_decisions_resource_idx on publication_decisions (family_id, resource_type, resource_id);

alter table family_circle_assignments enable row level security;
alter table lineage_claims enable row level security;
alter table evidence_artifacts enable row level security;
alter table consent_receipts enable row level security;
alter table publication_decisions enable row level security;
alter table succession_policies enable row level security;
alter table guardian_approvals enable row level security;

create policy family_circle_tenant_isolation on family_circle_assignments
  using (family_id = current_setting('app.family_id', true));
create policy lineage_claim_tenant_isolation on lineage_claims
  using (family_id = current_setting('app.family_id', true));
create policy evidence_tenant_isolation on evidence_artifacts
  using (family_id = current_setting('app.family_id', true));
create policy consent_tenant_isolation on consent_receipts
  using (family_id = current_setting('app.family_id', true));
create policy publication_tenant_isolation on publication_decisions
  using (family_id = current_setting('app.family_id', true));
create policy succession_tenant_isolation on succession_policies
  using (family_id = current_setting('app.family_id', true));
create policy guardian_approval_tenant_isolation on guardian_approvals
  using (family_id = current_setting('app.family_id', true));

commit;
