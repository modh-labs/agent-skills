# Tiers, checklists, plan-gating, verification

Each tier is independently shippable. Adopt in order. Plan-gating is the #1 feasibility constraint, so
it's called out per item. Legend: **[Any]** all plans · **[Seat]** included in seat price ·
**[Biz]** Business+ · **[Ent]** Enterprise · **[Metered]** burns AI credits.

---

## Tier 0, Foundations (any plan, no AI)

These make every later tier effective. An agent with no Triage queue, no label taxonomy, and no
codebase access is flying blind.

- [ ] **Enable Triage** for each team (Team Settings → Triage). This is the human-in-the-loop landing
      zone for agent/integration-created issues. **[Any]**
- [ ] **Label taxonomy**, three grouped families (copy Aura's as the template): **[Any]**
  - **Types**: Bug · Improvement · Feature
  - **Areas**: product domains (e.g. Billing, Auth, Scheduler, Calls, Analytics, Integrations…)
  - **Complexity**: Quick Win (0-2d) · Standard (3-5d) · Needs Breakdown (6d+)
  - Plus workspace labels: Incident, Epic, Released.
- [ ] **Workflow states** sane and minimal: Backlog · Todo · In Progress · In Review · Done ·
      Canceled · Duplicate. (Agents move issues to the first `started` state on pickup.) **[Any]**
- [ ] **Customer Requests** on (Workspace Settings → Customer requests). Manual + from Slack on all
      plans; from Intercom/Zendesk/Front on Business+; from Salesforce on Enterprise. **[Any]** (sources gated)
- [ ] **Integrations**: Slack (issue creation + project channels), GitHub (PR linking; prerequisite for
      Code Intelligence/Coding Sessions), Sentry. **[Any]**
- [ ] **Cycles + Estimates** enabled (Team Settings → General / Cycles). Capacity dial uses the last 3
      cycles' velocity. **[Any]**

**Verify:** `list_issue_statuses`, `list_issue_labels`, `list_projects`, `list_customers` return the
expected taxonomy; a Slack-created issue lands in Triage.

---

## Tier 1, Native Linear AI

The seat-included + Business AI layer. Highest value-to-effort ratio.

- [ ] **Linear Agent** on (Settings → AI → Linear Agent). Surfaces: chat (⌘/Ctrl+J), `@Linear` in
      comments/issues/docs/updates, `@Linear` in Slack (after `/invite`), `@Linear` in Microsoft Teams.
      Public beta since 2026-03-24; base chat included in seat price. **[Seat]**
- [ ] **Agent Guidance** authored at workspace + team level (paste from
      `agent-guidance-workspace.md` / `agent-guidance-team.md`). Team guidance overrides workspace when
      both exist; guidance is also injected into the agent webhook payload. **[Seat]**
- [ ] **Triage Intelligence** on (Settings → AI / Product Intelligence). Auto-suggests
      team/project/assignee/labels and flags **semantic duplicates** on each new Triage issue
      (~1-4 min to analyze). **Keep auto-apply opt-in per team** at first; promote per team once trusted.
      Manual trigger on any issue via "Find Suggestions". **[Biz]**
- [ ] **Pulse** feed on (sidebar + daily/weekly Inbox digests; not for Guests). **[Any]**
- [ ] **Project-update reminders** + **agent-assisted updates**: the agent drafts an update from recent
      changes + the linked Slack channel "for you to refine" (changelog 2026-06-18). Reminders nudge the
      human owner; they don't auto-post. **[Seat/Biz]**
- [ ] **Code Intelligence** (public beta, 2026-05-14): give Linear Agent read access to connected GitHub
      repos so it answers grounded technical questions and feeds Coding Sessions. Scope to existing
      GitHub permissions or workspace-wide. **[Biz]**

**Verify:** ask `@Linear` to summarize a project; create a Customer Request and confirm Triage
Intelligence surfaces suggestions + any duplicate; confirm a project overdue for an update is flagged.

---

## Tier 2, Marketplace agents (install & delegate)

Agents appear as `app users` (non-billable). Install from `linear.app/integrations/agents` (admin),
choosing which teams each can access, then `@mention` or delegate via assignment. ~26 agents available.

- [ ] **Coding / PR** (pick per stack): **Cursor** *(already in Aura)*, **Cyrus** (open-source runner
      that registers **Claude Code** as an assignable agent, fastest path to "Claude in Linear"),
      **Codex**, **Devin**, **Charlie** (TypeScript PR plan/implement/review). **[Any]** (vendor-billed)
- [ ] **First-party Coding Sessions** (GA 2026-06-11): assign an issue to **Linear** (or ask in
      chat/comment/Slack) → it writes code + opens a PR using **Claude Code + Codex** in the cloud.
      Requires GitHub code access. **[Metered]**, set a spend cap; `$20/seat` promo credits if GitHub
      code access enabled by 2026-07-11.
- [ ] **Ops / observability**: **Sentry · Seer** *(already in Aura)*, resolve Linear issues from Sentry
      errors; Dash0, Panaptico, TierZero as needed. **[Any]** (vendor-billed)
- [ ] **Product**: **ChatPRD**, writes requirements / manages product feedback. **[Any]** (vendor-billed)

**Cost note:** installed agents don't consume a Linear seat. Their compute is billed by each vendor;
first-party Coding Sessions are billed from Linear's prepaid **AI credits** (~$0.50 styling, ~$3-5 small
bug, $5+ complex; failed runs/retries are billable; admins currently cannot cap per-member spend, gate
with the guest toggle + a reload threshold).

**Verify:** delegate a sandbox issue to one coding agent → it sets the issue to `started`, emits
activity, opens a **draft** PR; confirm the AI-credit balance/cap.

---

## Tier 3, Workflow automation (Business/Enterprise)

The layer that makes ops *scale*. All Business/Enterprise.

- [ ] **Triage Rules**, deterministic: when conditions match, set team/status/assignee/label/project/
      priority (top-down). Can **delegate to an agent** as part of the rule. **[Biz]**
- [ ] **Triage Automations**, open-ended, run Linear Agent on Triage entry: translate, attach relevant
      docs, **post a clarifying comment when info is missing** (public teams only; Team Settings →
      Triage → Agent behavior). **[Biz]**
- [ ] **Customer Requests → "Create with Linear Agent"** from Intercom/Zendesk/Front: analyzes the full
      conversation (messages, support replies, metadata, attachments), drafts title+description, **splits
      into multiple issues** when warranted, attaches the customer request, routes to a team, lands in
      **Triage**. Persistent agent guidance (routing hints, templates, internal docs) + per-creation
      instructions. *This is the "flesh out vague customer asks" use case, native here.* **[Biz/Ent]**
- [ ] **SLAs**, auto-apply deadlines by rule (e.g. Urgent→24h, High→1w); Inbox + Slack breach nudges.
      **[Biz]**

**Verify:** drop a deliberately-vague support message in the connected tool → "Create with Linear
Agent" produces a structured, well-titled issue in Triage with a customer-request attachment; a Triage
Rule routes a matching issue to the right team/label without a human.

---

## Tier 4, Custom EPD agent (build only for the last mile)

Build a bespoke `@mentionable` app-user agent **only** when Tiers 1-3 can't express the workflow:
branded in-Linear agent, proprietary context via your own MCP servers, fine-grained guardrails, or
custom domain logic. Full scaffold in `custom-agent/`. The five steps (verified June 2026):

1. **Register OAuth app** (`linear.app/settings/api/applications/new`). Scopes:
   `app:assignable` + `app:mentionable` (+ minimal data scopes: `issues:create`, `comments:create`,
   `customer:read`/`initiative:read` as needed). Install via authorize URL with **`actor=app`**
   (admin-only). `actor=app` **cannot also request `admin`**, a hard least-privilege ceiling.
2. **Subscribe** the app webhook to **Agent session events** (`AgentSessionEvent`: `created`,
   `prompted`). This is a distinct toggle on the OAuth app, not in the generic data-webhook model list.
3. **Webhook route (Vercel):** verify **`Linear-Signature` = HMAC-SHA256 over the raw body**; reject
   stale `webhookTimestamp` (>60s); **ack 200 in <5s**; enqueue; emit the first **`thought`** activity
   **<10s** of `created` or the session shows "unresponsive."
4. **Worker (fluid compute, `maxDuration` up to ~800s):** run the **Claude Agent SDK**
   (`@anthropic-ai/claude-agent-sdk`, `ANTHROPIC_API_KEY`); map stream → activities (tool-use→`action`,
   reasoning→`thought`, result→`response`, ask→`elicitation`, failure→`error`) via `agentActivityCreate`.
   Session goes **stale after 30min** of inactivity (recoverable by another activity).
5. **State in Supabase**, keyed by Linear `agentSession.id`: encrypted token, app `viewer.id` (from
   `query Me`), Claude `session_id` (to resume on `prompted`), idempotency on `Linear-Delivery`.
   Reconstruct conversation from **Agent Activities** (frozen), not editable comments.

**Verify:** see SKILL.md "Verification → Tier 4" and `custom-agent/README.md`.

---

## Plan-gating cheat-sheet

| Capability | Min plan |
|---|---|
| Customer Requests (manual + Slack), Pulse, Linear Agent chat, Cycles, install/mention/delegate agents | Any / Seat |
| Triage Intelligence, Triage Rules, Triage Automations, SLAs, Insights, Code Intelligence, Intercom/Zendesk/Front, guests | Business |
| Salesforce customer requests, third-party app *approvals*, audit log, owner role, SCIM/SAML | Enterprise |
| Coding Sessions (Claude Code/Codex) | Basic+ (metered AI credits) |

> Dollar figures for Linear plans vary across secondary sources; confirm on `linear.app/pricing`. The
> load-bearing facts: **agents are non-billable**, the powerful automation clusters at **Business**, and
> governance (approvals, audit log) clusters at **Enterprise**.
