# Readiness Audit runner (free qualifier)

A read-only assessment Claude runs against a prospect's Linear workspace. It detects which playbook tier
they're at and what's missing, then emits a buyer-facing **gap report** that recommends an Activation
tier. It is the top of the funnel: free, no-sales-call, and it directly upsells the $6k+ Activation.

**Two ways to run it:**
- **Connected MCP** — the prospect connects their Linear MCP (or you're given access); Claude calls the
  read-only tools below.
- **Read-only token** — the prospect creates a Linear personal API key restricted to **Read** (and
  specific teams) and shares it; run the same queries via the Linear GraphQL API.

**Hard rule: read-only.** Never call a write/`save_*` tool. Never quote a customer's private message,
PII, or internal issue content in the report — report *structure and counts*, not contents.

---

## Step 1 — Pull the data (read-only)

| Tool | What it reveals |
|---|---|
| `list_teams` | teams (run per-team queries below for each) |
| `list_users` (limit 250) | team size, admins, and **installed agents** (app users) |
| `list_issue_labels` (per team) | label taxonomy — grouped parents Types / Areas / Complexity |
| `list_issue_statuses` (per team) | workflow states (types: backlog/unstarted/started/completed/canceled) |
| `list_projects` (limit 50) | projects, leads, initiatives, and `slackChannelId` (= Slack wired) |
| `list_customers` (`includeNeeds: true`) | Customer Requests usage (needs linked to issues) |
| `list_initiatives` | PM maturity (initiatives in use) |
| `list_cycles` (per team, `current`) | cycles enabled + velocity history |

## Step 2 — Detection rules (signal → status)

Status legend: ✅ in place · ⚠️ partial · ❌ missing · 🔎 confirm in Settings (not API-detectable).

**Foundations (Tier 0)**
- **Label taxonomy** — in `list_issue_labels`, look at each label's `parent`. ✅ if all three groups
  exist (a **Types** group with Bug/Improvement/Feature, an **Areas** group, a **Complexity** group); ⚠️
  if one or two; ❌ if labels are flat/ad-hoc.
- **Workflow states** — `list_issue_statuses` should include `backlog`, `unstarted`, at least one
  `started`, `completed`, `canceled` (bonus: an "In Review" started state). ⚠️ if only defaults/missing
  review.
- **Customer Requests** — `list_customers(includeNeeds)`: ✅ if customers have `needs` linked to issues;
  ⚠️ customers but no needs; ❌ none.
- **Integrations** — Slack ✅ if any project has `slackChannelId` **or** a `slack` app user exists;
  GitHub/Sentry ✅ if `sentry`/github app users or PR attachments appear; otherwise ❌.
- **Cycles** — `list_cycles`: ✅ if a current cycle with `completedScopeHistory` exists; ❌ none.
- **Triage** — 🔎 not directly queryable; infer "likely on" if Customer Requests/integration-created
  issues exist; otherwise flag to confirm in Team Settings → Triage.

**Native AI (Tier 1)** — mostly 🔎 (settings-gated, not in the API)
- **Linear Agent / Agent Guidance / Triage Intelligence / Pulse** — 🔎 confirm in Settings → AI. Infer
  *readiness* (not activation) from plan tier + foundation completeness.
- **Initiatives & PM cadence** — `list_initiatives`: ✅ active initiatives with owners/targets = mature
  PM surface ready for agent-assisted updates; ❌ none = greenfield.

**Marketplace agents (Tier 2)** — fully detectable
- In `list_users`, an **installed agent** is an app user whose email contains `@oauthapp.linear.app` or
  `@integration.linear.app`, or whose name matches a known agent (Cursor, Codex, Devin, GitHub Copilot,
  Charlie, Cyrus, Factory, Sentry, ChatPRD…). List each found. ✅ if a coding agent **and** an ops agent
  are present; ⚠️ if one; ❌ if none.

**Workflow automation (Tier 3)** — 🔎 mostly
- **Triage Rules / Automations / SLAs** — not directly queryable; flag to confirm. Weak signals: an
  `Incident`/`SLA`/`Released` label or heavy Customer-Request volume suggests appetite.

## Step 3 — Score the current tier
Assign the **highest contiguous tier** that is mostly satisfied:
- **Tier 0** if Foundations are ✅/⚠️ across the board.
- **Tier 1** if Foundations done **and** plan = Business **and** initiatives/PM cadence present (AI
  layer ready or partially on).
- **Tier 2** if ≥1 marketplace agent is installed.
- **Tier 3** if automation is confirmed on.
State the gating reason for not being one tier higher — that gap is the sales hook.

## Step 4 — Emit the report
Fill the template below. Keep it to one screen, lead with the score, make every gap map to an Activation
tier. No raw issue content or PII.

---

## Gap report template (buyer-facing)

```
# Linear Agent Readiness Report — {Workspace}
_Read-only assessment · {date} · prepared by Modh_

## You're at Tier {N} of 4: {tier name}
{one-sentence verdict — what's strong, what's holding you back}

| Dimension | Status | Finding |
|---|---|---|
| Foundations (Triage, labels, states, customer requests, cycles) | {✅/⚠️/❌} | {one line} |
| Native AI (Linear Agent, guidance, Triage Intelligence) | {✅/⚠️/🔎} | {one line} |
| Installed agents | {✅/⚠️/❌} | {which agents found, or none} |
| Workflow automation (rules, SLAs, customer-request agent) | {✅/⚠️/🔎} | {one line} |

## Top 3 gaps costing you time
1. {gap} → {the cost, e.g. "inbound issues sit untriaged; no auto-labeling/dedupe"}
2. {gap}
3. {gap}

## What an Activation would change
- **Lite ($6,000)** closes: {foundation/native-AI gaps}
- **Standard ($8,500)** closes: {+ agents + workflow automation} ← recommended for you
- **Pro ($12,000)** closes: {+ one bespoke automation}
Then **Agent Ops** keeps it running and tuned (from $6,000/quarter).

## Next step
This audit is free. Book a Standard Activation — first agent output within 48 hours or it's free —
or reply with questions. {checkout link}
```

---

## Notes
- This runner doubles as Day-0 of the [delivery runbook](delivery-runbook.md): the same read-only pull
  seeds the client install record.
- The headless engine version lives in `audit-runner/` (`runAudit(apiKey)` → `renderMarkdown()`): the
  same detection logic in code, ready to wrap in a modh.ca self-serve form. Validate the rubric against a
  few real workspaces with the manual runner before turning on self-serve.
