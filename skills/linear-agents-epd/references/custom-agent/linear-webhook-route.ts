// Destination: app/api/linear-webhook/route.ts
// The fast path. Verify the signature, reject replays + duplicates, persist the session, emit the
// first `thought` (deterministically inside the 10s window), trigger the worker, return 200 (<5s).

import { NextResponse } from 'next/server'
import { verifyLinearSignature, isFreshTimestamp, createAgentActivity } from '@/lib/linear'
import { claimDelivery, upsertSession } from '@/lib/sessions'

export const runtime = 'nodejs' // need raw body + node:crypto

interface AgentSessionEvent {
  type: string // 'AgentSessionEvent'
  action: 'created' | 'prompted'
  webhookTimestamp: number
  organizationId: string
  appUserId: string
  agentSession: {
    id: string
    issue?: { id: string }
  }
  // `created` carries promptContext; `prompted` carries the new message on agentActivity.body
  [key: string]: unknown
}

export async function POST(req: Request): Promise<Response> {
  // 1. Verify over the RAW body — never re-stringify parsed JSON.
  const raw = await req.text()
  const signature = req.headers.get('linear-signature')
  if (!verifyLinearSignature(raw, signature, process.env.LINEAR_WEBHOOK_SECRET!)) {
    return new NextResponse('invalid signature', { status: 401 })
  }

  const event = JSON.parse(raw) as AgentSessionEvent

  // 2. Replay protection + idempotency.
  if (!isFreshTimestamp(event.webhookTimestamp)) {
    return new NextResponse('stale timestamp', { status: 401 })
  }
  const deliveryId = req.headers.get('linear-delivery') ?? `${event.agentSession?.id}:${event.webhookTimestamp}`
  if (!(await claimDelivery(deliveryId))) {
    return NextResponse.json({ ok: true, duplicate: true }) // already processed
  }

  // Only handle agent-session events; ack anything else so Linear doesn't retry.
  if (event.type !== 'AgentSessionEvent') return NextResponse.json({ ok: true })

  // The app's OAuth token (saved at install). In production, look it up by organizationId.
  const token = process.env.LINEAR_APP_TOKEN! // placeholder: resolve per-workspace from your token store
  const sessionId = event.agentSession.id

  if (event.action === 'created') {
    await upsertSession({
      linear_session_id: sessionId,
      org_id: event.organizationId,
      issue_id: event.agentSession.issue?.id ?? null,
      access_token: token,
      app_viewer_id: event.appUserId,
      claude_session_id: null,
      status: 'active',
    })
    // Immediate, unobtrusive feedback — satisfies the 10s first-activity SLA before the slow worker runs.
    await createAgentActivity(token, sessionId, { type: 'thought', body: 'On it — reviewing the issue and context…' })
  }

  // 3. Fire the worker without blocking the ack. On Vercel, call the fluid-compute worker route.
  triggerWorker(sessionId).catch(() => {
    // best-effort; the worker also has its own error reporting
  })

  // 4. Ack fast (well under 5s).
  return NextResponse.json({ ok: true })
}

/** Fire-and-forget call to the long-running worker route (its own function with a high maxDuration). */
async function triggerWorker(linearSessionId: string): Promise<void> {
  await fetch(`${process.env.APP_BASE_URL}/api/linear-agent-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_TRIGGER_SECRET! },
    body: JSON.stringify({ linearSessionId }),
  })
}
