---
name: project-charter
description: >
  Make every tracker project (Linear/Jira/Asana) a complete charter with a measurable
  success metric, gated by a Definition of Ready and Definition of Done. Use when
  creating, documenting, auditing, or closing a project, or when a project overview is
  thin/empty. Forces the question "how will we know it worked?" to be answered with a
  number, a baseline, and a target, and catches board-vs-code drift.
tier: process
icon: clipboard-check
title: "Project Charter & Definition of Done"
seo_title: "Project Charter & Definition of Done — Make Every Project Measurable"
seo_description: "Every project should answer 'how will we know it worked?' with a number. A 12-section charter, a Definition of Ready, and a Definition of Done that blocks fake 'done'."
keywords: ["project charter", "definition of done", "definition of ready", "north star metric", "project hygiene", "linear", "jira"]
difficulty: intermediate
related_chapters:
  - "06-process/linear-tickets"
related_tools: []
---

# Project Charter & Definition of Done

## When This Skill Activates

- Creating a new project in a tracker (Linear, Jira, Asana, Shortcut)
- Asked to "flesh out / write up / document a project" or an epic's home
- A project overview is empty, thin, or a metric-less wish ("improve X")
- Moving a project between states (planned -> in progress -> done)
- Auditing a portfolio of projects for completeness or board-vs-reality drift
- Closing a project (does it actually meet the Definition of Done?)

This is the **project-level** companion to `linear-tickets` (which governs individual
issues). Tickets are contracts; the project is the why that contains them.

## The One Question

> **"How will we know it worked?"** answered with a **number, a baseline, and a target.**

If a project cannot answer that, it is not ready to start. "Improve onboarding" fails.
"Paid admin to a live booking link in under 10 minutes (from ~33 min today)" passes.
This single rule is what separates a charter from a wish.

## Decision Tree

```
New or existing project?
  NEW / EMPTY  -> write all 12 charter sections from evidence
  EXISTING-GOOD -> append a dated status section; never clobber the owner's framing

Moving to In Progress?
  -> run Definition of Ready. Any gap = not ready.

Moving to Completed?
  -> run Definition of Done. A project behind a partial flag is NOT done.

Does the North Star have a baseline number AND a target number?
  NO  -> stop. Instrument or estimate the baseline first.
  YES -> proceed.

Auditing a portfolio?
  -> for each project: sections present? metric has baseline+target?
     tracker fields populated? does the board match what shipped?
```

## Core Rules

### 1. The 12-section charter

Lead with narrative (any reader, exec to engineer, gets their answer alone). Keep
technical detail after it.

1. **Problem** (evidence, not opinion)
2. **Who's affected & why it matters** (segments + business stake)
3. **North Star / success metric** (exactly one primary, with baseline AND target)
4. **Scope** (in, plus an explicit out-of-scope list)
5. **Approach / how it works** (mechanism + the one mental model)
6. **Milestones / phases** (each with a status)
7. **Rollout & risk** (flags, allowlist, failure modes, mitigations)
8. **Acceptance criteria** (a testable checklist)
9. **Observability** (the dashboard + alert that prove it works in prod, and the owner)
10. **Status (dated)** (shipped vs outstanding, board reconciled against reality)
11. **Owner & dates** (lead, start, target — populated in the tracker fields, not just prose)
12. **Links** (epic, sub-issues, source-of-truth docs, channel)

### 2. Definition of Ready (gate into In Progress)

- [ ] All 12 sections present and non-empty
- [ ] North Star has a baseline number and a target number
- [ ] Tracker fields populated: lead, priority, start date, target date, initiative
- [ ] Scope has an explicit out-of-scope list
- [ ] At least one observability signal named that will prove the metric moved
- [ ] Acceptance criteria are testable

### 3. Definition of Done (gate into Completed)

- [ ] North Star moved to target, proven by the named dashboard (or de-scoped in writing)
- [ ] Acceptance criteria checked, or deferred to a NAMED follow-up (no silent drops)
- [ ] Shipped to 100% of intended audience (a project behind a partial flag is not done)
- [ ] Observability live: dashboard + a regression alert, with an owner
- [ ] Docs updated and the board reconciled (no issue reading "In Progress" whose code shipped)
- [ ] No open P1/P2 bugs attributable to the project
- [ ] Outcome note posted: did it move the metric, by how much

### 4. Per-type success-metric defaults

| Project type | Primary metric (baseline -> target) | Reliability gate |
|---|---|---|
| Feature / activation | Activation or conversion rate, or time-to-value | Funnel instrumented; flag-on vs flag-off |
| Integration | Orgs connected / actively syncing | Sync success rate; reconnect path |
| Performance | Latency p75/p90 before vs after; cost delta | Monitor proving the win in prod |
| Platform / standards | Adoption or compliance % | Lint/CI gate or audit enforcing it |
| Reliability / observability | MTTR, alert coverage %, incident count | Every "should never happen" is an alert/invariant |

### 5. Board-vs-code reconciliation

A charter is only honest if the tracker matches what actually shipped. When writing
the Status section, spot-check the code/PR history against the board. The two failure
modes to flag explicitly:

- **"Done in code, stale on board"**: a feature is merged but the issue still reads In
  Progress / In Review. Close it.
- **"Done but dark"**: code is merged and even in prod, but gated off behind a partial
  flag, so it is marked Completed while no user has it. That is NOT done.

## Anti-Patterns

- **Metric-less project.** "Make the dashboard better." No number, no baseline, no
  target -> not ready. Reframe around a measurable outcome.
- **Vanity completion.** Marking a project Done because the code merged, while the flag
  is at 5% and nobody widened it. Rollout to the intended audience is part of done.
- **Clobbering the owner.** Rewriting someone's project overview from scratch. Append a
  dated status section; preserve their framing; mark drafts as "pending lead review."
- **Inventing dates.** Setting a target date nobody committed to, on a shared board, so
  it reads as a real deadline. If no date was agreed, leave it and flag it for the lead.
- **Out-of-scope omitted.** A scope with no "out of scope" list invites creep and makes
  "done" un-decidable.

## Audit Checklist

For each project in the portfolio:

- [ ] All 12 charter sections present and non-empty
- [ ] North Star has both a baseline and a target number
- [ ] Tracker fields set: lead, priority, start date, target date, initiative
- [ ] Explicit out-of-scope list present
- [ ] Observability signal (dashboard/alert) named with an owner
- [ ] Status section is dated and reconciled against code reality
- [ ] If Completed: rolled out to 100%, outcome note posted, no open P1/P2
- [ ] Run this audit on a recurring cadence (weekly) so projects do not drift back
