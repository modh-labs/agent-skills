// Destination: app/api/linear-agent-run/route.ts
// The slow path. Runs the Claude Agent SDK loop and streams results back as Agent Activities. Give
// this its own function with a high maxDuration (Vercel Pro fluid compute, up to ~800s). The session
// stays alive as long as activities arrive within the 30-minute stale window.

import { NextResponse } from 'next/server'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { createAgentActivity } from '@/lib/linear'
import { getSession, setClaudeSessionId } from '@/lib/sessions'

export const runtime = 'nodejs'
export const maxDuration = 800 // Vercel Pro fluid compute; raise to your plan's ceiling

export async function POST(req: Request): Promise<Response> {
  if (req.headers.get('x-internal-secret') !== process.env.INTERNAL_TRIGGER_SECRET) {
    return new NextResponse('forbidden', { status: 403 })
  }
  const { linearSessionId } = (await req.json()) as { linearSessionId: string }

  // Ack the trigger immediately; do the work after responding so this function isn't held by the caller.
  void runAgent(linearSessionId)
  return NextResponse.json({ ok: true })
}

export async function runAgent(linearSessionId: string): Promise<void> {
  const session = await getSession(linearSessionId)
  if (!session) return
  const { access_token: token } = session

  try {
    // Build the task prompt from the issue/session context you persisted (and previousComments from
    // the webhook). Keep the agent scoped to drafting/organizing, terminal actions stay human-gated.
    const prompt = buildPrompt(session)

    const stream = query({
      prompt,
      options: {
        // Reconstruct conversation from frozen Agent Activities, not editable comments.
        resume: session.claude_session_id ?? undefined,
        // Give the agent only the tools the workflow needs. Wire your own MCP servers
        // (Supabase, GitHub, the Linear MCP) here for proprietary context.
        allowedTools: ['Read', 'Grep', 'WebSearch'],
      },
    })

    for await (const message of stream) {
      // Capture the Claude session id once, so a follow-up `prompted` event can resume this thread.
      if (message.type === 'system' && 'session_id' in message && message.session_id) {
        await setClaudeSessionId(linearSessionId, message.session_id as string)
      }

      // Map SDK stream messages → Linear activities. Adapt to the SDK's exact message schema.
      if (message.type === 'assistant') {
        for (const block of message.message?.content ?? []) {
          if (block.type === 'tool_use') {
            await createAgentActivity(token, linearSessionId, {
              type: 'action',
              action: block.name,
              parameter: JSON.stringify(block.input).slice(0, 500),
            })
          } else if (block.type === 'text' && block.text.trim()) {
            await createAgentActivity(token, linearSessionId, { type: 'thought', body: block.text })
          }
        }
      }

      if (message.type === 'result') {
        const final = 'result' in message ? String(message.result) : 'Done.'
        await createAgentActivity(token, linearSessionId, { type: 'response', body: final })
      }
    }
  } catch (err) {
    await createAgentActivity(token, linearSessionId, {
      type: 'error',
      body: `I hit an error and stopped. ${(err as Error).message}`,
    })
  }
}

function buildPrompt(session: { issue_id: string | null }): string {
  return [
    'You are a delegated Linear agent. Flesh out and organize the work on this issue.',
    'Produce a draft (title, problem, who is affected, proposed change, acceptance criteria) and suggest labels.',
    'Do NOT take terminal actions (close/cancel, change priority, customer replies), leave those for the human owner.',
    session.issue_id ? `Linear issue id: ${session.issue_id}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
