# Tier 4, Custom Linear agent (reference scaffold)

A minimal, runnable skeleton for an `@mentionable` Linear **app-user agent** on **Vercel + Supabase +
Claude Agent SDK**. Build this only for the last mile, see the skill's decision tree. Files here are
flat for readability; the header comment in each names its destination path in a Next.js App Router app
(`@/` = project source root).

## Architecture (driven by Linear's three deadlines)

```
Linear ──AgentSessionEvent──▶ /api/linear-webhook (Node route)
                               1. read RAW body, verify Linear-Signature (HMAC-SHA256, timing-safe)
                               2. reject stale webhookTimestamp (>60s)  +  idempotency on Linear-Delivery
                               3. upsert session row in Supabase
                               4. emit first `thought` activity  ◀── hits the <10s window deterministically
                               5. trigger the worker (fire-and-forget)  ──▶ return 200  ◀── hits the <5s ack
                                                                     │
                          /api/linear-agent-run (fluid compute, maxDuration≈800s)
                               runAgent(): Claude Agent SDK query() loop
                               map stream → action/thought/response/elicitation/error via agentActivityCreate
                               persist Claude session_id (resume on `prompted`)   ◀── 30min stale window
```

**Why split ack from work:** one short function can't both return 200 in 5s and finish multi-minute
reasoning. The webhook route does fast, deterministic things (verify, persist, emit one `thought`, fire
the worker) and returns; the worker runs the long Claude loop and streams activities back.

## Files
- `linear-webhook-route.ts` → `app/api/linear-webhook/route.ts`, verify, ack, emit first thought, trigger worker.
- `agent-worker.ts` → `app/api/linear-agent-run/route.ts`, the Claude Agent SDK loop (set `maxDuration`).
- `linear-client.ts` → `@/lib/linear.ts`, signature verify, OAuth token exchange, GraphQL, activities.
- `sessions.ts` → `@/lib/sessions.ts`, Supabase session store + delivery idempotency.
- `schema.sql` → run in Supabase SQL editor.
- `.env.example` → `.env`.

## Setup
1. `npm i @anthropic-ai/claude-agent-sdk @supabase/supabase-js`
2. Register the OAuth app (`linear.app/settings/api/applications/new`); scopes `app:assignable` +
   `app:mentionable` (+ minimal data scopes). Enable webhooks → **Agent session events**. Install via the
   authorize URL with **`actor=app`** (admin only). **Do not request `admin` or delete.**
3. Run `schema.sql` in Supabase; fill `.env`.
4. Set `maxDuration` on the worker route (Vercel Pro fluid compute, up to ~800s).

## Local test
- Tunnel the webhook with Hookdeck or ngrok; point the OAuth app's webhook URL at it.
- Delegate a sandbox issue to the agent. **Assert:** signature verified, route returns 200 in <5s, a
  `thought` appears in the session <10s, the worker streams `action`/`response` activities, and a row
  exists in `agent_sessions`. Then deploy to Vercel and re-test on a sandbox team.

> Verified against Linear's agent docs June 2026; the Agent API is "Developer Preview." Re-check
> `linear.app/developers/agent-interaction` for the exact activity content shapes and any new event
> subtypes before going to production.
