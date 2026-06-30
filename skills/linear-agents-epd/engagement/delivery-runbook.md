# Activation Sprint, delivery runbook (turnkey)

The repeatable, "out of the box" delivery process for the Activation Sprint. Run it the same way every
time so it can be executed by you, a contractor, or an agent without re-thinking scope. Steps map to the
tier checklists in `../references/tiers.md`; guardrails to `../references/guardrails.md`. **[Operator]** =
human; **[Agent]** = Claude/agent does it under review.

Target: 10 business days, first agent output ≤48h. Standard tier shown; Lite stops after Day 4, Pro adds
the Tier-4 wire-up + 60-day check-in.

---

## Day 0, Pre-engagement (before kickoff)
- [ ] **[Operator]** Confirm client prerequisites met (admin access, plan tier = Business+, GitHub/Slack
      connectable, named owner, sandbox team). No start until all green.
- [ ] **[Operator]** Switch to the client's Linear workspace (their own MCP key, not another client's).
- [ ] **[Agent]** Run the read-only audit: `list_teams`, `list_issue_statuses`, `list_issue_labels`,
      `list_projects`, `list_customers`. Record current state + the tier they're already at.
- [ ] **[Operator]** Open the install record from `../references/client-install-record.md` →
      `clients/<client>/docs/linear-agents.md`. Fill plan tier, workspace, owner.

## Day 1, Foundations + first output (hit the 48h promise)
- [ ] **[Agent]** Tier 0: enable Triage per team; reconcile workflow states; ensure Customer Requests on.
- [ ] **[Agent]** Seed the label taxonomy (Types / Areas / Complexity), adapt the reference taxonomy to
      the client's domains; do **not** invent labels beyond the framework.
- [ ] **[Operator]** Connect Slack + GitHub + Sentry; enable Cycles + Estimates.
- [ ] **[Agent]** **First output:** draft the workspace Agent Guidance from
      `../references/agent-guidance-workspace.md`, populated with the client's real Areas + lanes →
      share for sign-off. *(This is the 48h deliverable.)*

## Day 2, Native AI (Tier 1)
- [ ] **[Operator]** Turn on Linear Agent; paste approved workspace guidance; author per-team guidance
      from `../references/agent-guidance-team.md` (lanes, routing, titling, definition of "started").
- [ ] **[Operator]** Enable Triage Intelligence in **suggest-only** mode (auto-apply stays off, earned
      later); enable Pulse + project-update reminders; enable Code Intelligence if GitHub code access ok.
- [ ] **[Agent]** Smoke test: create a test Customer Request → confirm structured-issue suggestion +
      dedupe flag land in Triage.

## Day 3-4, Marketplace agents (Tier 2)
- [ ] **[Operator]** For each agent (coding / ops / product), run the **vendor security review**
      (`../references/guardrails.md`): owner, scopes, teams, data handling. Install **team-scoped**, with
      least-privilege scopes (no `admin`, no delete).
- [ ] **[Operator]** Set the AI-credit cap / auto-reload threshold; toggle "prevent guests interacting
      with agents" if guests present.
- [ ] **[Agent]** Delegate a sandbox issue to one coding agent → confirm pickup, activity, **draft** PR.
- [ ] Record every installed agent + scopes + review outcome in the install record.

*(Lite tier: stop here. Run acceptance Day 5.)*

## Day 5-8, Workflow automation (Tier 3)
- [ ] **[Operator]** Triage Rules: route/label/assignee on match (deterministic), per the team lanes.
- [ ] **[Operator]** Triage Automations: instruct the agent to ask for missing info + attach relevant
      docs on incomplete intake.
- [ ] **[Operator]** Customer Requests → "Create with Linear Agent" wired from the client's support tool
      (Intercom/Zendesk/Slack); set persistent agent guidance for it.
- [ ] **[Operator]** SLAs by priority (e.g. Urgent→24h) with breach nudges.
- [ ] **[Agent]** End-to-end test: drop a deliberately-vague support message → a well-titled, structured
      issue with a customer-request attachment lands in Triage; a Triage Rule routes a matching issue.

## Day 9, Pro only: bespoke Tier-4 wire-up
- [ ] Scope the one custom automation / MCP integration agreed at sale; build from
      `../references/custom-agent/` if it needs the custom agent path. Keep it to the single agreed unit.

## Day 10, Acceptance + handoff
- [ ] **[Operator]** Walk the acceptance checklist (below) with the client owner; capture sign-off.
- [ ] **[Operator]** Record a short walkthrough; finalize the install record (tiers, agents, scopes,
      AI-credit cap, guardrail deviations, verification log).
- [ ] **[Operator]** Position the **Agent Ops retainer** as the default next step; log the Sprint→retainer
      decision and start instrumenting that conversion.

---

## Acceptance checklist (definition of done)
- [ ] Triage enabled; new work lands in Triage, not active cycles.
- [ ] Label taxonomy applied; Agent Guidance live at workspace + each team.
- [ ] Triage Intelligence suggesting (auto-apply only where the team opted in).
- [ ] All installed agents: team-scoped, least-privilege, vendor-reviewed, in the install record.
- [ ] Customer-ask → structured-issue path produces a quality issue in Triage (Standard/Pro).
- [ ] No agent can take customer-facing or terminal actions unattended (autonomy matrix enforced).
- [ ] AI-credit cap set; guest toggle handled.
- [ ] Install record committed to `clients/<client>/docs/linear-agents.md`.

## Handoff → Agent Ops retainer
The retainer runs this configuration continuously. The **Monthly Agent Ops Review** is templated off the
install record (what the fleet did, tuning changes, spend vs cap, autonomy promotions), batchable and
delegable to a contractor or a meta-agent, which is what lets one operator carry 8-10+ retainers.
