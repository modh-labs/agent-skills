-- Destination: run in the Supabase SQL editor.
-- Durable agent-session state keyed by Linear's agentSession.id, plus a delivery-idempotency table.
-- Both are written only by the server (service role). Keep RLS on with no policies so the anon/auth
-- keys cannot read them; the service role bypasses RLS.

create table if not exists agent_sessions (
  linear_session_id text primary key,           -- Linear agentSession.id
  org_id            text not null,              -- organizationId from the webhook
  issue_id          text,                       -- agentSession.issue.id
  access_token      text not null,              -- app OAuth token; encrypt at rest (see note)
  app_viewer_id     text,                       -- the app user's viewer.id in this workspace
  claude_session_id text,                       -- Claude Agent SDK session id, for resume on `prompted`
  status            text not null default 'active',
  last_activity_at  timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create table if not exists processed_deliveries (
  delivery_id text primary key,                 -- Linear-Delivery header (idempotency)
  received_at timestamptz not null default now()
);

-- Lock down: RLS on, no policies => only the service role (server) can touch these.
alter table agent_sessions enable row level security;
alter table processed_deliveries enable row level security;

-- Optional housekeeping: prune old idempotency rows on a schedule (Supabase cron / pg_cron).
-- delete from processed_deliveries where received_at < now() - interval '7 days';

-- NOTE on access_token: prefer encrypting tokens with pgsodium/Vault rather than storing plaintext.
-- At minimum, treat this column as a secret and never expose it through any client-facing API.
