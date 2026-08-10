begin;

create table if not exists families (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  id text primary key,
  family_id text not null references families(id),
  account_id text,
  display_name text not null,
  role text not null,
  email text,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'revoked')),
  invited_by_member_id text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (family_id, account_id)
);

create table if not exists family_invitations (
  id text primary key,
  family_id text not null references families(id),
  recipient_binding_ref text not null,
  role text not null,
  invited_by_member_id text not null,
  secret_hash_ref text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked', 'locked')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists connector_installations (
  id text primary key,
  family_id text not null references families(id),
  connector_id text not null,
  status text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (family_id, connector_id)
);

create table if not exists audit_events (
  id text primary key,
  family_id text not null references families(id),
  actor_id text not null,
  actor_type text not null check (actor_type in ('human', 'agent', 'service')),
  action text not null,
  connector_id text,
  resource_type text,
  resource_id text,
  sensitivity text not null,
  result text not null,
  reason text,
  metadata jsonb,
  timestamp timestamptz not null
);

create table if not exists confirmation_requests (
  id text primary key,
  family_id text not null references families(id),
  actor_id text not null,
  action text not null,
  status text not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists intake_tokens (
  id text primary key,
  family_id text not null references families(id),
  issued_by_member_id text not null,
  secret_hash text not null,
  recipient_binding_ref text,
  allowed_action text not null check (allowed_action in ('submit_claim', 'submit_evidence', 'submit_correction', 'submit_memory')),
  minimum_scope text not null check (minimum_scope in ('self', 'household', 'core_circle', 'extended_family', 'descendants_guardianship', 'trusted_advisors')),
  status text not null default 'active' check (status in ('active', 'redeemed', 'expired', 'revoked', 'locked')),
  max_uses integer not null default 1 check (max_uses = 1),
  use_count integer not null default 0 check (use_count between 0 and 1),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists intake_cases (
  id text primary key,
  family_id text not null references families(id),
  intake_token_id text references intake_tokens(id),
  claimant_ref text,
  channel text not null check (channel in ('secure_form', 'email_notice', 'interview', 'steward_entry', 'api')),
  state text not null default 'quarantined' check (state in ('received', 'quarantined', 'awaiting_secure_evidence', 'scan_pending', 'extraction_ready', 'normalized', 'review_ready', 'steward_decided', 'closed', 'rejected', 'withdrawn', 'expired')),
  privacy_scope text not null default 'self' check (privacy_scope in ('self', 'household', 'core_circle', 'extended_family', 'descendants_guardianship', 'trusted_advisors')),
  minor_impact text not null default 'none_known' check (minor_impact in ('none_known', 'possible', 'confirmed')),
  affected_person_refs jsonb not null default '[]'::jsonb,
  attachment_refs jsonb not null default '[]'::jsonb,
  claim_refs jsonb not null default '[]'::jsonb,
  consent_refs jsonb not null default '[]'::jsonb,
  steward_decision_ref text,
  rejection_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists intake_attachments (
  id text primary key,
  family_id text not null references families(id),
  case_id text not null references intake_cases(id),
  storage_ref text not null,
  original_file_name_ref text,
  declared_mime text not null,
  detected_mime text,
  size_bytes integer not null check (size_bytes > 0),
  sha256 text not null,
  scan_status text not null default 'pending' check (scan_status in ('pending', 'clean', 'rejected', 'failed')),
  quarantined boolean not null default true check (quarantined = true or scan_status = 'clean'),
  rejection_code text,
  created_at timestamptz not null default now(),
  scanned_at timestamptz
);

create index if not exists family_members_family_status_idx on family_members (family_id, status);
create index if not exists audit_events_family_timestamp_idx on audit_events (family_id, timestamp desc);
create index if not exists confirmation_requests_family_status_idx on confirmation_requests (family_id, status);
create index if not exists intake_tokens_family_status_idx on intake_tokens (family_id, status, expires_at);
create index if not exists intake_cases_family_state_idx on intake_cases (family_id, state, updated_at desc);
create index if not exists intake_attachments_case_idx on intake_attachments (family_id, case_id, scan_status);

alter table families enable row level security;
alter table family_members enable row level security;
alter table family_invitations enable row level security;
alter table connector_installations enable row level security;
alter table audit_events enable row level security;
alter table confirmation_requests enable row level security;
alter table intake_tokens enable row level security;
alter table intake_cases enable row level security;
alter table intake_attachments enable row level security;

create policy families_tenant_isolation on families
  using (id = current_setting('app.family_id', true))
  with check (id = current_setting('app.family_id', true));
create policy family_members_tenant_isolation on family_members
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy family_invitations_tenant_isolation on family_invitations
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy connector_installations_tenant_isolation on connector_installations
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy audit_events_tenant_isolation on audit_events
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy confirmation_requests_tenant_isolation on confirmation_requests
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy intake_tokens_tenant_isolation on intake_tokens
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy intake_cases_tenant_isolation on intake_cases
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
create policy intake_attachments_tenant_isolation on intake_attachments
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));

drop policy if exists family_circle_tenant_isolation on family_circle_assignments;
create policy family_circle_tenant_isolation on family_circle_assignments
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists lineage_claim_tenant_isolation on lineage_claims;
create policy lineage_claim_tenant_isolation on lineage_claims
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists evidence_tenant_isolation on evidence_artifacts;
create policy evidence_tenant_isolation on evidence_artifacts
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists consent_tenant_isolation on consent_receipts;
create policy consent_tenant_isolation on consent_receipts
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists publication_tenant_isolation on publication_decisions;
create policy publication_tenant_isolation on publication_decisions
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists succession_tenant_isolation on succession_policies;
create policy succession_tenant_isolation on succession_policies
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));
drop policy if exists guardian_approval_tenant_isolation on guardian_approvals;
create policy guardian_approval_tenant_isolation on guardian_approvals
  using (family_id = current_setting('app.family_id', true))
  with check (family_id = current_setting('app.family_id', true));

commit;
