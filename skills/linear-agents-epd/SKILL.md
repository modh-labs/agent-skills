---
name: linear-agents-epd
description: >
  Set up Linear Agents to absorb EPD ops/admin work for a client — triage,
  customer-request structuring, board/project hygiene, status rollups, spec
  drafting, and coding-from-issue. A portable, per-client runbook (a 5-tier
  ladder) with a buy-first decision tree, baked-in guardrails, and a Tier-4
  custom-agent build scaffold. Use when standing up or expanding agentic
  automation in a client's Linear workspace.
tier: process
icon: bot
title: "Linear Agents for EPD Teams"
seo_title: "Linear Agents for EPD Teams — Modh Engineering Skill"
seo_description: "Portable per-client playbook for adopting Linear Agents across triage, customer requests, project management, and coding-from-issue — with a buy-first decision tree and guardrails."
keywords: ["linear", "agents", "triage", "customer requests", "EPD", "automation", "AI agents"]
difficulty: intermediate
related_chapters: []
related_tools: []
---

# Linear Agents for EPD Teams

A portable playbook for putting AI agents to work across an Engineering / Product / Design team's
Linear workspace. Run it **once per client** (each is a separate workspace with its own API key). The
reference implementation is the **Aura** workspace (`aura-app-ai`), which is already at ~Tier 2.

> Facts in this skill were verified against Linear's primary docs/changelog as of **June 2026**. Linear
> ships fast and the developer Agent API is still labeled "Developer Preview" — re-check
> `linear.app/developers/agents` and `linear.app/changelog` before a Tier-4 build. See
> `references/ecosystem.md` for dated facts + source URLs.

## When This Skill Activates

- Setting up Linear for a new client, or deciding "how much can agents do for us?"
- Standing up or expanding triage automation, customer-request handling, or PM/product hygiene
- Evaluating build-vs-buy for an in-Linear agent
- Auditing what agents are installed in a workspace and whether the guardrails are right

## Core Principle

**Delegate, don't abdicate.** In Linear, assigning an issue to an agent is *delegation* — the human
stays the responsible assignee and the agent is a contributor. Lean in hard on low-risk, reversible,
internal work (labeling, dedupe, drafting, summarizing, coding-from-issue); keep a human gate on
anything **customer-facing or terminal** (replies, closing/cancelling, priority changes, deletes).
Agents draft and route; humans approve. This is also how Linear's own design works — AI suggestions are
opt-in per team, and integration/AI-created issues land in **Triage** until a human accepts them.

## The strategic answer ("should we go all in?")

**Yes — aggressively, but tiered, and buy-before-build.**

- **High-leverage, low-risk (do it):** triage routing/labeling/dedupe, customer-ask → well-formed
  issue, status rollups + project updates, spec/PRD drafting, coding-from-issue. Mostly native or one
  marketplace install away.
- **Human-gated (don't automate the last step):** customer replies, closing/cancelling, priority &
  date changes on committed work, deletes, merges, broad re-triage.
- **The thing you most want is already mostly native.** "Flesh out vague customer asks" =
  **Customer Requests + "Create with Linear Agent"** (analyzes the whole conversation, drafts
  title+description, splits into multiple issues, routes to a team, lands in Triage). A custom build is
  the *last-mile* only.
- **Two constraints to confirm per client:** (1) most powerful automation (Triage
  Rules/Intelligence/Automations, SLAs, Insights, Intercom/Zendesk) is **Business/Enterprise**-gated;
  (2) agents are **non-billable** (they don't consume a seat), but **Coding Sessions** burn metered
  **AI credits** — set a spend cap.

## The 5-tier ladder

Adopt in order; each tier is independently shippable. Full checklists, plan-gating, and per-tier
verification live in **`references/tiers.md`**.

| Tier | What | Plan | Effort |
|---|---|---|---|
| **0 — Foundations** | Triage on; Types/Areas/Complexity labels; Customer Requests; Slack+GitHub+Sentry; Cycles+Estimates | Any | Config |
| **1 — Native AI** | Linear Agent + **Agent Guidance**; Triage Intelligence (suggest+dedupe, auto-apply opt-in); Pulse + project-update reminders + agent-assisted updates; Code Intelligence | Seat + Business | Config |
| **2 — Marketplace agents** | Install & delegate: Cursor / **Cyrus (Claude Code)** / Codex / Devin (coding), Sentry·Seer (ops), ChatPRD (product); first-party Coding Sessions | Any (agents non-billable; sessions metered) | Install |
| **3 — Workflow automation** | Triage **Rules** + **Automations** (ask for missing info, attach docs); Customer Requests "Create with Linear Agent"; SLAs | Business/Enterprise | Config |
| **4 — Custom EPD agent** | Bespoke `@mentionable` app-user on Vercel + Supabase + Claude Agent SDK | Any (build) | Build |

## Decision tree

```
Need agentic help in Linear?
├─ Is it triage/labeling/dedupe/customer-request structuring/status updates?
│   └─ Use Tier 1 + Tier 3 NATIVE features. Do not build. ──────────────► configure
├─ Is it coding-from-issue or PR review?
│   └─ Install a Tier 2 marketplace agent (Cursor/Cyrus/Codex/Devin) or
│      turn on first-party Coding Sessions. Do not build. ─────────────► install
└─ Is it a bespoke workflow the above can't express
   (branded in-Linear agent, proprietary context via your own MCP,
    fine-grained guardrails / custom domain logic)?
    └─ Build Tier 4 on Vercel+Supabase+Claude Agent SDK. ──────────────► references/custom-agent/
```

**Rule of thumb:** the "vague ask → spec" loop is ~80% covered by Tier 1+3. Reach for Tier 4 only for
the autonomous/branded last mile.

## Guardrails (default posture: "safe-auto, gated-risk")

Full matrix, scope table, and vendor-review checklist in **`references/guardrails.md`**. Summary:

- **Autonomous OK:** apply/suggest labels, dedupe linking, draft descriptions/specs, internal
  comments/`thought`s, summarize threads into **Triage** items, *draft* (not publish) updates, propose
  *draft* PRs.
- **Human-gated:** customer replies, closing/cancelling, priority/date changes, deletes, merges, broad
  re-triage.
- **Enforced by:** least-privilege OAuth scopes (`issues:create`+`comments:create`, **no `admin`, no
  delete** — `actor=app` structurally can't request `admin`), team-scoped install, Triage-before-
  workflow, opt-in auto-apply, per-team Agent Guidance, the "prevent guests interacting with agents"
  toggle, Enterprise third-party-app approvals where available, and a **per-client vendor security
  review** (a third-party agent's token can write across its teams; Linear's SOC2/GDPR covers Linear,
  not the vendor). Audit log is Enterprise-only — below that, rely on activity history +
  `PermissionChange` webhooks.

## Per-client run procedure

1. **Switch to the client's workspace.** Use that client's Linear key (`clients/<client>/.mcp.json`).
   The connected MCP in modh sessions is **Aura's** — confirm before acting.
2. **Confirm plan tier** (Free/Basic/Business/Enterprise). It decides which tiers are reachable
   (`references/tiers.md`).
3. **Audit current state** read-only: `list_teams`, `list_issue_statuses`, `list_issue_labels`,
   `list_projects`, `list_customers`. Record the tier the client is already at.
4. **Open a client install record** from `references/client-install-record.md` and commit it to
   `clients/<client>/docs/linear-agents.md`.
5. **Walk the ladder** Tier 0 → up, stopping where plan/appetite stops. Paste Agent Guidance from
   `references/agent-guidance-workspace.md` + `references/agent-guidance-team.md` (seed from the
   client's own taxonomy).
6. **Set guardrails** per `references/guardrails.md` (scopes, auto-apply opt-in, AI-credit cap, vendor
   review for each installed agent).
7. **Verify** each tier per its checklist; log results + spend cap in the install record.

## Verification

- **Tier 1:** create a test Customer Request → run "Create with Linear Agent" → a structured issue
  lands in **Triage** with suggested labels + a dedupe flag.
- **Tier 2:** delegate a throwaway issue to an installed agent → it picks up, emits activity, opens a
  *draft* PR; AI-credit cap is set.
- **Tier 4 (if built):** run `references/custom-agent` behind Hookdeck/ngrok → delegate a test issue →
  assert HMAC verified, 200 ack <5s, first `thought` <10s, activities render, a Supabase row is
  written; then deploy to Vercel and re-test on a sandbox team.
- **Portability:** repeat Tier 0–1 on a second workspace (Hyran/Modh) to prove transfer.

## References

- `references/tiers.md` — Tier 0–4 checklists, plan-gating, verification.
- `references/guardrails.md` — autonomy matrix, OAuth scope table, vendor review, cost governance.
- `references/ecosystem.md` — native AI features + marketplace agents, dated facts + sources.
- `references/agent-guidance-workspace.md` / `agent-guidance-team.md` — paste-in Linear Agent Guidance.
- `references/client-install-record.md` — per-client audit record template.
- `references/custom-agent/` — Tier-4 reference implementation (webhook + worker + Supabase schema).

### Productized offer ("out of the box consulting")
The playbook above is the delivery engine for a packaged consulting offer. The sellable assets:
- `engagement/readiness-audit.md` — the free, read-only qualifier: Claude audits a prospect's Linear and
  emits a tiered gap report that upsells the Activation. Top of the funnel.
- `engagement/activation-sprint-sow.md` — fixed-scope SOW: one-time **Activation Sprint** (installs
  Tiers 0–3) + the recurring **Agent Ops** managed-service retainer, with tiers, prices, and guarantee.
- `engagement/delivery-runbook.md` — the turnkey, day-by-day delivery process (operator vs agent steps,
  acceptance checklist) so every engagement runs identically.
- `engagement/one-pager.md` — buyer-facing pitch + public good/better/best pricing.

Run the delivery-runbook to fulfill a Sprint; the Sprint converts into the Agent Ops retainer, which is
the rung that scales (agents do the labor → ~90% margin, decoupled from operator hours).

## Related

- `linear-tickets` — ticket-quality standard the agents should produce against.
- `webhook-architecture` / `webhook-patterns` — SOLID handler design for the Tier-4 webhook route.
- `oauth-callback-pattern` — server-side OAuth handling for the agent install flow.
- `supabase-patterns` — schema/RLS for the session store.
