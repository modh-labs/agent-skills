# SOP library, what the service actually is, granularly

The offer, concretely, is a set of **standard operating procedures** the agents execute and you
supervise. Each SOP has a trigger, an owner split (**[A]** agent / **[H]** human), steps, an output, and
**the standard it enforces**, the bit a generalist can't author. This is what the client buys; the
Activation installs them, the Agent Ops retainer runs them.

> Autonomy rule across every SOP: agents draft, route, and suggest; humans approve anything
> customer-facing or terminal. See [guardrails](../references/guardrails.md).

---

## SOP-1 · Onboarding / Activation
**Trigger:** new client. **Owner:** [H] led, [A] executes config.
The 10-day [delivery runbook](delivery-runbook.md), installs SOPs 2-9 and produces the
[install record](../references/client-install-record.md).
**Output:** a configured, guardrailed workspace + recorded handoff.
**Standard:** set up the way a top-tier org *should* run, not just "turned on."

## SOP-2 · Triage
> Full standalone runbook: [sops/triage.md](sops/triage.md) (severity x priority matrix, SLA table, intake gate, dedup, escalation).

**Trigger:** any new issue enters Triage. **Owner:** [A] runs, [H] handles escalations.
1. [A] classify Type (Bug/Improvement/Feature), Area, Complexity; assign a **severity** score.
2. [A] semantic dedup check → link to canonical if matched.
3. [A] if missing repro / expected-vs-actual / affected account → post a clarifying comment, **hold in
   Triage** (do not accept).
4. [A] route by team lane; suggest assignee.
5. [A] **escalate immediately to a human**: anything SEV1, security, billing, or legal.
**Output:** a clean, labeled, routed issue, or a held-for-info issue that never silently rots.
**Standard (Shopify-scale):** triage that holds at volume; nothing critical sits unseen, nothing rots in
an inbox.

## SOP-3 · Customer request → spec
**Trigger:** a customer ask lands (Intercom/Zendesk/Slack → Customer Request). **Owner:** [A] drafts, [H] CS owner approves.
1. [A] read the full thread (messages, metadata, attachments).
2. [A] draft a structured issue: problem · who's affected & why it matters · proposed change ·
   **acceptance criteria**; split into multiple issues if warranted.
3. [A] attach the customer request; route to a team; land in Triage.
4. [H] **any customer-facing reply is human-approved** before it sends.
**Output:** a spec-ready issue + a (gated) customer reply.
**Standard (best-in-class CS):** the customer gets a real answer; engineering gets a real ticket, not a
one-line "user wants a thing."

## SOP-4 · Incident management
> Full standalone runbook: [sops/incident-management.md](sops/incident-management.md) (SEV matrix, declare checklist, roles, comms templates, blameless postmortem).

**Trigger:** Sentry alert or a declared SEV. **Owner:** [A] assembles + drafts, [H] commands + comms.
1. Classify severity: **SEV1** (customer-down / data / money) · **SEV2** (degraded) · **SEV3** (minor).
2. [A] assemble the timeline, blast radius, and linked errors; draft the incident-channel summary and a
   status-page update; page the on-call human.
3. [H] own the response and **all customer comms**, [A] never auto-resolves or messages customers.
4. After resolution: [A] draft a **blameless postmortem** (timeline, root cause, contributing factors,
   action items) and file the action items as issues.
**Output:** a calmly-run incident + a postmortem + tracked follow-ups.
**Standard (incident-command pedigree):** fast, calm, blameless, documented, the thing most teams do
badly and you do reflexively.

## SOP-5 · Project & status rollup
**Trigger:** weekly + on demand. **Owner:** [A] drafts, [H] edits + publishes.
1. [A] review what shipped + the project's Slack channel since the last update.
2. [A] draft each project update: health (on track / at risk / off track), progress, risks, next.
3. [A] flag stale/overdue projects and cycle roll-over risk.
4. [H] edit and publish.
**Output:** exec-legible updates + a board that tells the truth at a glance.
**Standard (acquisition/diligence):** reporting an acquirer's diligence team would nod at, not a wall of
half-done tickets.

## SOP-6 · Autonomy promotion
**Trigger:** monthly review. **Owner:** [H] decides, [A] proposes.
1. Per dimension (labeling, dedup, draft-spec), measure suggestion acceptance over the last N issues.
2. If acceptance ≥ threshold for a team, **promote that dimension to auto-apply** for that team; log it.
3. Customer-facing and terminal actions stay human-gated **permanently**.
4. Any regression → roll the dimension back to suggest-only.
**Output:** teams that get more autonomous *safely*, on evidence.
**Standard (Brex risk posture):** earned trust per-dimension, never blanket automation.

## SOP-7 · Monthly Agent Ops review  *(the retainer's core deliverable)*
**Trigger:** monthly. **Owner:** [A] compiles, [H] presents.
1. [A] pull from the install record: volume handled, triage accuracy, dedup catches, specs drafted,
   incidents, AI-credit spend vs cap, autonomy changes.
2. [A] draft the review doc + recommendations for next month.
3. [H] 30-minute review call with the client.
**Output:** a value-proving report + a tuned system.
**Standard:** the client *sees* the ROI, the system compounds, and because it's templated off the
record, a contractor or a meta-agent can run it. This is what lets one operator carry 8-10+ retainers.

## SOP-8 · Guardrail & vendor security review
**Trigger:** before installing any agent + quarterly. **Owner:** [H].
1. Least-privilege scope decision (`issues:create`/`comments:create`; never `admin`/delete).
2. Vendor data-handling review (sub-processors, retention, training-on-your-data, DPA).
3. Team-scope the install; record in the install record; set the AI-credit cap.
4. Maintain the **never-automate list** for the client.
**Output:** a documented, least-privilege agent footprint.
**Standard (fintech security mindset):** a tracker treated with the care you'd give a money-movement
system.

## SOP-9 · Spec / PRD quality standard
**Trigger:** any issue or spec the agents draft. **Owner:** [A] drafts to the bar, [H] spot-checks.
The quality bar every drafted ticket meets, user story, journey, architecture context, edge cases,
acceptance criteria (see the `linear-tickets` skill).
**Output:** tickets a contract engineer (or an agent) can implement without follow-up questions.
**Standard (award-winning product):** the agents draft, but the bar they draft *to* is yours.

---

## How the SOPs map to the offer
- **Activation Sprint** installs SOP-1 and stands up SOP-2 … SOP-9 with the client's taxonomy + guardrails.
- **Agent Ops retainer** *runs* SOP-2 … SOP-8 continuously and delivers SOP-7 every month.
- **The moat:** SOP-2/3/4/5/6/8 each encode operating judgment from real scale (Shopify, Brex,
  acquisitions, incident command, award-winning product). A generalist can install the agents; they
  can't author these rubrics. See [positioning](positioning.md).

Each SOP here is a catalog entry. The two that signal the pedigree hardest are written as full
standalone runbooks: [sops/incident-management.md](sops/incident-management.md) (SOP-4) and
[sops/triage.md](sops/triage.md) (SOP-2). The rest can be expanded the same way on request.
