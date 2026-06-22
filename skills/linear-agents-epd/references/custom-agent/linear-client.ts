// Destination: @/lib/linear.ts
// Linear API surface for an actor=app agent: webhook signature verification, OAuth token exchange,
// a thin GraphQL caller, and the agent-activity / session mutations. Verified against
// linear.app/developers (agents, agent-interaction, webhooks, oauth) as of June 2026.

import crypto from 'node:crypto'

const LINEAR_GRAPHQL = 'https://api.linear.app/graphql'
const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token'

// Linear's fixed webhook sender IPs — optionally allowlist these at the edge.
export const LINEAR_WEBHOOK_IPS = [
  '35.231.147.226', '35.243.134.228', '34.140.253.14',
  '34.38.87.206', '34.134.222.122', '35.222.25.142',
] as const

/**
 * Verify Linear-Signature: HMAC-SHA256 of the RAW request body using the webhook signing secret.
 * Verify over the raw bytes — re-stringifying parsed JSON will mismatch. Timing-safe compare.
 */
export function verifyLinearSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest()
  let provided: Buffer
  try {
    provided = Buffer.from(signatureHeader, 'hex')
  } catch {
    return false
  }
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided)
}

/** Reject replays: webhookTimestamp (UNIX ms) must be within `toleranceMs` of now. */
export function isFreshTimestamp(webhookTimestamp: number | undefined, toleranceMs = 60_000): boolean {
  if (typeof webhookTimestamp !== 'number') return false
  return Math.abs(Date.now() - webhookTimestamp) <= toleranceMs
}

/** Exchange an OAuth authorization code for an app (actor=app) access token at install time. */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const res = await fetch(LINEAR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINEAR_CLIENT_ID!,
      client_secret: process.env.LINEAR_CLIENT_SECRET!,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Linear token exchange failed: ${res.status}`)
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  })
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (!res.ok || json.errors) throw new Error(`Linear GraphQL error: ${JSON.stringify(json.errors ?? res.status)}`)
  return json.data as T
}

/** The app's per-workspace identity. Store this with the token so you can identify your app user. */
export async function getViewerId(token: string): Promise<string> {
  const data = await graphql<{ viewer: { id: string } }>(token, `query Me { viewer { id } }`, {})
  return data.viewer.id
}

// Agent Activity content shapes (content varies by type — see agent-interaction docs).
export type AgentActivityContent =
  | { type: 'thought'; body: string }
  | { type: 'action'; action: string; parameter?: string; result?: string }
  | { type: 'response'; body: string }
  | { type: 'elicitation'; body: string }
  | { type: 'error'; body: string }

/** Emit an Agent Activity back into a session (thought/action/response/elicitation/error). */
export async function createAgentActivity(
  token: string,
  agentSessionId: string,
  content: AgentActivityContent,
): Promise<void> {
  await graphql(
    token,
    `mutation AgentActivityCreate($input: AgentActivityCreateInput!) {
       agentActivityCreate(input: $input) { success }
     }`,
    { input: { agentSessionId, content } },
  )
}

/**
 * Attach an external URL (e.g. a dashboard or PR) to the session. Setting an external URL also keeps
 * the session from being marked unresponsive within the first-activity window.
 */
export async function setSessionExternalUrl(token: string, agentSessionId: string, url: string, label: string): Promise<void> {
  await graphql(
    token,
    `mutation AgentSessionUpdate($id: String!, $input: AgentSessionUpdateInput!) {
       agentSessionUpdate(id: $id, input: $input) { success }
     }`,
    { id: agentSessionId, input: { externalUrls: [{ label, url }] } },
  )
}
