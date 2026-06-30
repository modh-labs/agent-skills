// Destination: @/lib/sessions.ts
// Supabase-backed durable state for agent sessions, keyed by Linear's agentSession.id, plus
// delivery idempotency so retried webhooks don't double-process. Service-role only (server side).

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export interface AgentSessionRow {
  linear_session_id: string
  org_id: string
  issue_id: string | null
  access_token: string // encrypt at rest; see schema.sql note
  app_viewer_id: string | null
  claude_session_id: string | null
  status: string
  last_activity_at: string
}

/** Idempotency gate: returns true the FIRST time a Linear-Delivery id is seen, false on retries. */
export async function claimDelivery(deliveryId: string): Promise<boolean> {
  const { error } = await supabase.from('processed_deliveries').insert({ delivery_id: deliveryId })
  // Unique-violation (23505) => already processed => not a fresh claim.
  if (error) return false
  return true
}

export async function upsertSession(row: Omit<AgentSessionRow, 'last_activity_at'>): Promise<void> {
  await supabase
    .from('agent_sessions')
    .upsert({ ...row, last_activity_at: new Date().toISOString() }, { onConflict: 'linear_session_id' })
}

export async function getSession(linearSessionId: string): Promise<AgentSessionRow | null> {
  const { data } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('linear_session_id', linearSessionId)
    .maybeSingle()
  return (data as AgentSessionRow | null) ?? null
}

/** Persist the Claude Agent SDK session id so a follow-up `prompted` event can resume the thread. */
export async function setClaudeSessionId(linearSessionId: string, claudeSessionId: string): Promise<void> {
  await supabase
    .from('agent_sessions')
    .update({ claude_session_id: claudeSessionId, last_activity_at: new Date().toISOString() })
    .eq('linear_session_id', linearSessionId)
}
