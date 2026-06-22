# Linear Agent Ops — Statement of Work (productized)

A fixed-scope, "out of the box" consulting offer with two engagements: a one-time **Activation Sprint**
(setup) and an ongoing **Agent Ops** managed service (the recurring business). Prices are 2026-market-
benchmarked defaults — adjust per client, but **publish them** and keep the scope fixed; the point of a
productized offer is that you don't re-scope every deal.

> Delivery engine: the `linear-agents-epd` skill (this repo). The Sprint installs Tiers 0–3; the
> retainer runs the agent fleet against the guardrails. Lead the sale with the **retainer outcome** and
> price the Sprint as the activation cost.

**Floor: $6,000 minimum on every 1:1 engagement** (Activation + Agent Ops). Free lead-gen sits below it
(Readiness scorecard + read-only Audit); the DWY group cohort is the one deliberate exception (a group
program clears $6k in aggregate per run).

---

## Engagement 1 — Activation Sprint (one-time)

Turn a client's Linear workspace into an agent-run EPD ops system in **10 business days**, with a
**first agent output within 48 hours**.

| | **Lite** | **Standard** *(headline)* | **Pro** |
|---|---|---|---|
| **Price** | $6,000 | $8,500 | $12,000 |
| **Playbook tiers** | 0–1 | 0–3 | 0–3 + one bespoke wire-up |
| Foundations (Triage, label taxonomy, workflow states, Customer Requests, integrations, cycles) | ✅ | ✅ | ✅ |
| Native AI (Linear Agent, Agent Guidance workspace+team, Triage Intelligence, Pulse, project-update reminders) | ✅ | ✅ | ✅ |
| Marketplace agents installed + scoped (coding/ops/product) | — | ✅ | ✅ |
| Workflow automation (Triage Rules + Automations, Customer-Request "Create with Agent", SLAs) | — | ✅ | ✅ |
| One bespoke Tier-4 wire-up (custom automation or MCP integration) | — | — | ✅ |
| Guardrail + autonomy design (least-privilege scopes, vendor review, autonomy matrix) | ✅ | ✅ | ✅ |
| Install record + 30-min team handoff/walkthrough | ✅ | ✅ | ✅ |
| 60-day check-in | — | — | ✅ |

**Deliverables (every tier):** a configured workspace; workspace + per-team Agent Guidance authored
from the client's taxonomy; a completed install record (`client-install-record.md`) documenting tiers
enabled, agents + scopes granted, vendor reviews, and the AI-credit cap; and a recorded walkthrough.

**Timeline:** 10 business days from kickoff. Fixed window, fixed scope.

**Explicitly out of scope** (becomes a change order or the Pro/Tier-4 add-on): bespoke multi-step custom
agents beyond the one Pro wire-up; migrating from another tracker; custom reporting/BI; changes to the
client's product codebase; ongoing operation (that's Engagement 2).

**Client prerequisites** (no start until met): Linear **admin** access granted to the named operator;
plan tier confirmed (Business required for Tiers 1+ AI/automation); GitHub + Slack connectable; one
named client owner for decisions; sandbox team available for testing.

**Guarantee (risk-reversal):** first agent output within 48 hours of kickoff or the Sprint is free.

**Payment:** 100% on booking via public checkout (or 50/50 for Pro). The **Readiness Audit** is free
(read-only qualifier) — there is no paid SKU below the $6,000 floor.

---

## Engagement 2 — Agent Ops (recurring managed service)

The agent fleet runs the client's EPD ops continuously; you supervise, tune, and own the outcome. This
is the rung that scales — margin ~90% because the agents do the labor and the client pays their own
Linear seats + token spend.

| | **Starter** | **Standard** | **Pro** |
|---|---|---|---|
| **Price** | $6,000/qtr ($2,000/mo) | $10,500/qtr ($3,500/mo) | $6,000/mo |
| Scope | triage + status rollups, 1 team | full agent fleet, multi-team | fractional-EPD-grade oversight |
| Autonomy | suggest/draft | suggest/draft → earned auto-apply | tuned per team |
| Monthly Agent Ops Review (tuning + report off the install record) | ✅ | ✅ | ✅ + faster SLA |
| Custom guardrails / new automations | — | quarterly | included |

**What's run:** inbound triage (route/label/dedupe), customer-ask → structured issue (drafts to Triage),
project/status-update drafts, spec drafting, stale-issue nudges — all under the autonomy matrix
(customer-facing and terminal actions stay human-gated).

**Cost model:** client pays their own Linear seats and token spend; a token allowance is bundled with
**metered overage** above it. COGS held in the 90s via Haiku-4.5 for high-volume triage/rollups,
Sonnet/Opus reserved for spec/code, prompt caching and batch on routine work.

**Terms:** **billed quarterly (3-month minimum)** so every retainer payment clears the $6,000 floor —
Starter $6,000/qtr, Standard $10,500/qtr, Pro $18,000/qtr. Start at suggest/draft autonomy;
**money-back first month**; **annual prepay = 2 months free** (converts cash forward and cuts churn).
Activation can be bundled into the first quarter to de-risk.

**The metric to instrument from client #1:** Sprint → retainer conversion rate. It's unbenchmarked and
the whole leverage thesis rests on it — measure it, don't assume it.

---

## Add-ons / change orders
- **Readiness Audit** — **free**, read-only assessment + tiered gap report; the qualifier into a Sprint.
- **DWY Cohort** — $2,500/seat, 2-week cohort (5–10 teams per run). The one deliberate exception to the
  $6,000 floor: a group program that serves many teams for one block of your time (the per-hour leverage
  multiplier) and nets well above the floor per run. Lift to $6,000/seat if you want a strict
  no-exceptions floor.
- **Bespoke Tier-4 agent build** — quoted per scope (always above the $6,000 floor); the only hour-heavy
  work; cap at 1–2/month; these fund the eventual multi-tenant product.

> Retired under the floor: the $1,500 audit-as-SKU and the $297 DIY pack — both now free lead-gen.
