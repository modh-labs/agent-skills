# Incident management runbook

The standalone operating procedure for running an incident calmly, end to end. It expands SOP-4 of the
[SOP library](../sop-library.md) into a drop-in runbook: severity matrix, declare checklist, roles, the
minute-by-minute flow, comms templates, the blameless postmortem, and the action-items pipeline back into
Linear. Run it the same way every time so an incident is mechanical, not improvised.

**Operating model.** A Claude **agent** assembles, drafts, labels, classifies, and keeps the live
timeline. A **human** commands. Owner split below is **[A]** agent / **[H]** human, the same convention as
the rest of the engagement.

> **Autonomy rule (non-negotiable).** The agent NEVER auto-resolves an incident, NEVER sends a customer or
> status-page comm, NEVER performs a mitigation or any terminal action, and NEVER closes, cancels, or
> changes priority on committed work. It drafts and proposes; a human approves and acts. Every
> customer-facing and terminal action is human-approved. See [guardrails](../../references/guardrails.md).

**Where everything lives.** The **Linear incident issue is the single source of truth**. The incident
Slack channel, the status-page incident, and the postmortem all link back to it. A responder joining
mid-incident opens that one issue and is oriented.

---

## 1 · Severity matrix (SEV)

Severity measures **customer impact / business consequence**, not effort and not urgency. Three levels on
purpose: have as few as you can reasonably get away with. Pick the level from the customer's seat.

| | **SEV1, Critical** | **SEV2, Major** | **SEV3, Minor** |
|---|---|---|---|
| **Customer impact** | All or most customers down; data loss or security/privacy breach; SLA broken | A meaningful subset of customers, or one core feature, degraded or unavailable; product still broadly functions | Partial loss or inconvenience not affecting the majority; cosmetic or non-core |
| **Examples** | Login down, checkout failing, DB corruption, credential leak, total API outage | Search broken, one region slow, exports failing, elevated error rate on a key flow | Typo in UI, a non-critical job retrying, minor visual glitch, one edge-case endpoint |
| **Response window** | Now. Drop everything | Within the hour | Next business day |
| **Who's pulled in** | On-call + backup on-call + an eng lead; exec aware | On-call | Whoever owns the area |
| **Public status page** | Yes | Usually (IC's call) | No |
| **Postmortem** | Required, within ~3 calendar days | Required, within ~5 business days | Optional |
| **Internal cadence** | Every 15 to 30 min | Every 30 to 60 min | Ticket / Slack note |

**Severity vs. priority, keep them on two axes.** Severity is the consequence; **priority** is what to fix
first (urgency). They are independent. An outage hitting 0.01% of users can be **high-severity,
low-priority**; a brand-damaging formatting bug can be **low-severity, high-priority**. In Linear, model
**severity as a label** (`SEV1` / `SEV2` / `SEV3`) and **priority as Linear's native priority field**.
Never collapse them into one.

**Tie-break rule, round up.** If you are unsure which of two levels it is, treat it as the **higher** one.
During an incident is not the time to discuss or litigate severities.

**SEV3 is not a hiding place.** A "minor" issue that is **customer-visible and recurring**, or **trending
worse**, bumps to **SEV2**. SEV3 is for the genuinely small and stable.

**Downgrading is allowed, on evidence.** Round-up is the default, but if the blast radius is **confirmed
smaller** than first feared, the **IC may downgrade mid-incident** (for example SEV1 to SEV2 once you
confirm it touches 0.01% of users). Log the change and the reason in the timeline. Never downgrade to dodge
a postmortem; the postmortem requirement follows the **highest severity the incident reached**. The agent
may *propose* a severity; the **human owns every severity decision and change**.

---

## 2 · Declare checklist

Declare **early**. Declaring is cheap; declaring late is expensive. Use the pre-agreed triggers so
declaration is mechanical, not political.

**Declare an incident if ANY of these is true:**

- [ ] You need a **second team** to fix it.
- [ ] The issue is **customer-visible**.
- [ ] It is **still unsolved after ~1 hour** of focused analysis (declaring buys you a commander and a
      timeline; it does **not** by itself set the severity, which you still pick from impact).
- [ ] There is any sign of **data loss, security, privacy, or billing** exposure (declare SEV1, do not wait).

**Auto-trigger.** A Sentry to Linear issue crossing a severity/volume threshold is a valid trigger for the
**[A] agent to PROPOSE a declaration** (assembled brief + suggested SEV). A **[H] human confirms** the
declaration and sets the severity. The agent never declares on its own.

**Who is IC at first.** The **first human to acknowledge owns IC** until an explicit handoff. Command is
never ambiguous, even at 3am when the agent is the only thing awake.

**On declare (first 5 minutes):**

- [ ] **[H]** Confirm the declaration and **set severity** (round up if unsure).
- [ ] **[H]** Name the **Incident Commander (IC)** and the **Ops/Fixer**. Keep them as two different people.
- [ ] **[H] IC** decide: **public status page yes/no** (default yes for SEV1; IC's call for SEV2).
- [ ] **[A]** Draft the **Linear incident issue** from the template (§5) **in Triage**; the IC accepts it
      into the incident workflow.
- [ ] **[A]** Spin up / name the **incident Slack channel**: `#inc-YYYY-MM-DD-short-slug`.
- [ ] **[A]** Fire the **pre-agreed page** per the ladder (§6). A human can only **widen** scope, never the
      agent.
- [ ] **[A]** Start the **live timeline** (§4) and post the first **CAN** internal update (§7).

---

## 3 · Roles (right-sized: IC + Ops, agent as scribe/comms-drafter)

Canonical incident response has four roles (Incident Commander, Ops Lead, Comms Lead, Planning Lead). For a
small team, collapse to **two live human roles** and let the agent carry scribe + comms-drafting. Define a
role only for a vital responsibility that must be attributed to a single person; track everything else as
assigned actions in the Linear issue.

| Role | Who | Owns | Does **not** do |
|---|---|---|---|
| **Incident Commander (IC)** | **[H]** | Holds system state; structures the response; declares, sets, and changes severity; delegates all repair; owns every decision; approves and posts all comms; designates the postmortem owner | **Does NOT touch the keyboard to fix.** The IC is *not a resolver*. |
| **Ops / Fixer** | **[H]** | The **only** party modifying the system: rollback, reroute, feature-flag, hotfix; reports up to the IC in **CAN** form | Does not run comms or chase stakeholders (that's the IC, via the agent). |
| **Agent (scribe + comms drafter)** | **[A]** | Live timeline (recording what humans report); blast-radius/impact assembly from Sentry + Linear; **drafts** internal CAN updates on cadence; **drafts** status-page updates through the lifecycle; classifies/labels; fires the pre-agreed page; drafts the postmortem | **Never** declares, decides or changes severity, mitigates, resolves, sends a customer/status-page comm, or changes priority on committed work. |

**Cardinal rule.** The IC coordinates and delegates; the Ops/Fixer is the only hands on the system. One
person *can* wear two hats in a pinch, but the IC and the hands-on fixer should ideally be **different
people** so coordination, cadence, and the timeline don't drop the moment debugging gets deep.

---

## 4 · The flow: declare to mitigate to resolve to learn

The single most-missed distinction: **mitigation is not resolution.** Mitigation restores service (stop the
bleeding); resolution fixes the root cause (so it doesn't ship again). Never close an incident at
symptom-disappearance; always open a tracked resolution follow-up.

Minute-by-minute, with the agent's exact role at each step:

### Declare
- **[H]** Confirm incident, set severity, name IC + Ops, decide status-page yes/no, per §2.
- **[A]** Draft the Linear incident issue in Triage (IC accepts it), spin up the channel, **fire the
  pre-agreed page**, and **assemble the brief**: pull linked Sentry errors, first-seen timestamp, error
  volume/trend, affected endpoints/customers, recent deploys, and post it as the issue body + first
  timeline entry.
- **[A]** Post the **first internal CAN update** (§7) and, if the IC opted in to the status page, **draft**
  the first **status-page "Investigating"** post for **[H]** approval.

### Mitigate (restore service)
- **[H] Ops** performs the mitigation: roll back the bad deploy, reroute traffic, flip the feature flag.
  **The agent never performs this.**
- **[A]** Capture each action **as Ops reports it**, in the timeline, with a timestamp and a link (deploy,
  dashboard, log query).
- **[A]** Keep drafting CAN updates **on the cadence timer** for the severity; **[H]** posts. When service
  is restored, **[A]** drafts the status-page **"Monitoring"** update for **[H]** approval.
- **[H] IC** decides when "monitoring" holds long enough to call service restored. Status page is **not**
  set to Resolved until the IC says so.

### Resolve (fix the root cause)
- **[A]** Draft a tracked **resolution follow-up** Linear issue ("Root-cause fix: ..."), linked to the
  incident, with the severity label carried over and an owner suggested. **[H]** confirms owner + priority.
- **[A]** Draft the **status-page "Resolved"** update for **[H]** approval and posting. The agent never
  marks an incident resolved itself.
- **[H] IC** confirms resolution criteria and closes the *incident* (the durable fix lives on in the
  resolution issue until shipped).

### Learn
- **[H] IC** designates the **postmortem owner** (for SEV1/SEV2; optional for SEV3).
- **[A]** Drafts the **blameless postmortem** (§8) from the live timeline.
- **[H]** Owns the analysis, runs the 15 to 30 min review, signs off. **[A]** files each action item as an
  owned, due-dated Linear issue (§9).

**Status-page lifecycle maps to the flow:** Investigating, then Identified, then Monitoring, then Resolved.

---

## 5 · Template, Linear incident issue *(agent drafts in Triage, IC accepts and confirms)*

```
Title: [SEV2] Checkout error rate elevated, payments intermittently failing

Labels: SEV2, incident, area:payments      Priority: Urgent
Workflow: drafted in Triage by agent; IC accepts into the incident workflow.

## Summary
One-line, plain-English: what's broken, who feels it.

## Severity & impact
- Severity: SEV2 (round-up applied: yes/no)
- Blast radius: ~__% of checkout attempts, started <time TZ>, region(s): __
- Customer-visible: yes/no   |   SLA at risk: yes/no   |   Data/security/billing exposure: no
- Public status page: yes/no (IC decision)

## Roles
- Incident Commander (IC): @human
- Ops / Fixer:             @human
- Scribe + comms (agent):  this thread

## Signals (assembled by agent)
- Sentry: <issue link>, first seen <ts>, <N> events, trend up
- Recent deploys: <deploy link> at <ts>
- Dashboards / logs: <links>

## Timeline (live, agent maintains, records what humans report)
- HH:MM TZ, Declared SEV2. IC @x, Ops @y.
- HH:MM TZ, Mitigation: rolled back deploy <link>. (Ops @y reported)
- HH:MM TZ, Error rate back to baseline; status page set to Monitoring.

## Links
- Incident channel: #inc-YYYY-MM-DD-checkout
- Status-page incident: <link>
- Resolution follow-up: <Linear issue link>   (root-cause fix, opened before close)
- Postmortem: <doc link>
```

Severity is a **label**; urgency is the **priority field**. The agent drafts the whole issue in Triage; the
IC accepts it and confirms severity, roles, and priority before the response runs off it.

---

## 6 · Template, paging / escalation ladder *(pre-agreed; agent fires, humans can only widen scope)*

The ladder is written ahead of time so the agent can fire the page the instant an incident is declared. The
agent executes this pre-agreed ladder mechanically; it never decides scope. A human can **widen** scope
(pull in more people); the agent never narrows or invents it.

| Severity | Page | Acknowledge within | Channel |
|---|---|---|---|
| **SEV1** | On-call **+** backup on-call **+** an engineering lead | ~5 min | Incident channel spun up immediately |
| **SEV2** | On-call | ~15 min | Incident channel |
| **SEV3** | No page. Slack/ticket notification | Next business hour | Team channel / Linear |

```
[A -> page]  PAGE, {SEV1|SEV2} declared: <one-line impact>.
            IC: @<human>  Ops: @<human>  Channel: #inc-...  Linear: <link>
            Ack required within <5|15> min.

[H -> ack]   Ack. I have IC. Scope confirmed (or widening to +<backup/lead>). Proceeding.
```

If no one acknowledges within the window, the agent **re-fires the pre-agreed next rung** (backup on-call,
then the named lead) and flags that it is doing so. This is executing the agreed ladder, not the agent
deciding who to wake. The **first human to ack owns IC** until an explicit handoff.

---

## 7 · Template, internal Slack status update (CAN) *(agent drafts on cadence, human posts)*

Fix the cadence by severity so nobody improvises: **SEV1 every 15 to 30 min, SEV2 every 30 to 60 min.** The
agent drafts on a timer; a human posts. Use the **CAN** structure (Condition / Actions / Needs), the same
compact report the Ops/Fixer gives the IC.

```
:rotating_light: INCIDENT UPDATE, SEV2, Checkout failures, <HH:MM TZ>

Condition:  Checkout error rate ~12% (down from 30% at peak). Started 14:05 TZ.
            Affecting card payments in EU region only.
Actions:    Rolled back deploy #4821 (14:22). Error rate falling. Watching dashboards.
Needs:      Payments SME to confirm no stuck charges. No customer comms needed yet.

IC: @human   Ops: @human   Next update by: <HH:MM TZ>
```

Always state **when the next update lands.** "All clear" still gets a final CAN with `Condition: Resolved`
and `Next update: none, incident closed`.

---

## 8 · Templates, public status-page updates (lifecycle) *(agent DRAFTS, human approves & publishes)*

The agent **drafts every public update**; a **human approves and publishes**. The agent never sends a
customer-facing comm. Status-page hygiene: no speculating on root cause while live, no internal jargon,
always state when the next update lands.

**Investigating**
```
Investigating, <date HH:MM TZ>
We're investigating reports of <symptom, customer-facing words>. Some users may experience
<impact>. We'll share an update by <HH:MM TZ>.
```

**Identified**
```
Identified, <date HH:MM TZ>
We've identified the cause of <symptom> and are working on a fix. <Impact> may continue for
some users in the meantime. Next update by <HH:MM TZ>.
```

**Monitoring**
```
Monitoring, <date HH:MM TZ>
A fix has been applied and <symptom> should now be resolved. We're monitoring to confirm full
recovery. Next update by <HH:MM TZ>.
```

**Resolved**
```
Resolved, <date HH:MM TZ>
This incident is resolved. <Symptom> is fully restored as of <HH:MM TZ>. Thank you for your
patience.
```

Lifecycle order is fixed: Investigating, then Identified, then Monitoring, then Resolved. Customer-facing
language only; describe symptom and impact, never internal cause, while live.

---

## 9 · Template, blameless postmortem *(agent drafts from timeline, human owns analysis & sign-off)*

A blame-free, detailed description of exactly what went wrong. Required for SEV1 (schedule within ~3
calendar days) and SEV2 (~5 business days); optional for SEV3. The review meeting is **15 to 30 min**. The
postmortem requirement follows the **highest severity the incident reached**, even if it was later
downgraded. The agent drafts from the live timeline; the human owns the analysis and signs off. Blameless:
describe systems and decisions, never name-and-shame.

```
# Postmortem, [SEV1] <title>, <date>

Owner: @human (designated by IC)   Status: Draft -> Reviewed -> Signed off
Incident issue: <Linear link>   Channel: <link>   Duration: <start> to <end> (<hh:mm>)

## 1. Timeline  (the centerpiece, agent-assembled)
- HH:MM TZ, <status/impact change or key action>  [graph/log link]
- HH:MM TZ, Declared SEV1. IC @x, Ops @y.
- HH:MM TZ, Mitigation: <rollback/reroute/flag>.  [deploy link]
- HH:MM TZ, Service restored.  [dashboard link]
- HH:MM TZ, Incident closed.

## 2. Impact
How many customers, for how long, what specifically broke. SLA breached? Revenue/data touched?

## 3. Root cause
What happened and why, the underlying cause, not just the symptom.

## 4. Contributing factors
Conditions that made it worse or slower to detect (missing alert, stale runbook, gap in monitoring).

## 5. Action items  (each becomes a tracked Linear issue, §10)
| Action | Reduces recurrence / improves response | Owner | Due | Linear |
|---|---|---|---|---|
| Add alert on checkout error-rate >5% | response | @ | <date> | <link> |
| Add migration safeguard for <X>      | recurrence | @ | <date> | <link> |

## 6. Lessons learned
- What went well:
- What we got lucky on:
- What we'll change:
```

Aim action items at **both** reducing recurrence and improving the response process. An action item with no
owner and no date never happens.

---

## 10 · Action items to Linear issues

Every postmortem action item converts to an **owned, due-dated Linear issue** before sign-off. That is the
difference between a learning and a wish.

1. **[A]** For each action item, draft a Linear issue: clear title, the recurrence/response rationale, link
   back to the incident + postmortem, suggested owner and due date, area label. It lands in **Triage**.
2. **[H]** Accept it out of Triage and confirm **owner**, **priority** (native field), and **due date**.
   The agent does **not** set priority on committed work or assign humans unilaterally.
3. **[A]** Link every action-item issue back into the postmortem table and the incident issue.
4. **[H] IC** signs off the postmortem only once every action item has an owner and a date.

The agent assembles and links; the human owns the commitment. New issues flow through the standard
[Triage SOP](../sop-library.md) like any other work.

---

## Pitfalls this runbook prevents

- **Litigating severity mid-fire.** Round up and move on; downgrade only on confirmed-smaller blast radius
  (IC's call, logged), and revisit the rest in the postmortem.
- **Conflating severity with priority.** Severity is a label (consequence), priority is the field
  (urgency); never collapse them, or you mislabel low-blast-radius outages and brand-critical cosmetic bugs.
- **The IC trying to fix it.** The moment the IC dives into the keyboard, coordination, cadence, and the
  timeline all drop. IC and Ops/Fixer stay distinct hats.
- **Calling mitigation "resolved."** Restoring service is mitigation; the durable root-cause fix is
  resolution. Always open a tracked resolution follow-up before closing.
- **Declaring late.** Use the pre-agreed triggers so declaration is mechanical, not political.
- **Hiding real issues in SEV3.** Customer-visible and recurring, or trending worse, bumps to SEV2.
- **Comms as an afterthought.** Silence erodes trust faster than bad news; lock cadence to severity and
  let the agent draft on a timer.
- **Letting the agent cross the human boundary.** It assembles/drafts/labels/classifies and keeps the
  timeline; it never auto-resolves, sends a customer/status-page comm, performs a mitigation/terminal
  action, or changes priority on committed work.
- **Too many roles / too many severities.** 3 severities, 2 live human roles. When responders spend more
  time figuring out their role than responding, you have a problem.
- **Blameful or skipped postmortems.** Keep them blameless and time-boxed; don't skip "small" SEV2s; turn
  every action item into an owned, due-dated ticket.
- **No status-page hygiene.** No speculation on root cause while live, no internal jargon, always state the
  next update time; follow Investigating, Identified, Monitoring, Resolved.

---

## The standard it enforces

Incidents run **fast, calm, blameless, and documented**: declared early on pre-agreed criteria, mitigated
before they're "resolved," resolved at the root cause, and learned from in a blameless postmortem whose
action items become owned, due-dated Linear tickets. Customer-impact severity (3 levels) stays separate
from priority; comms run on a fixed, severity-driven cadence so no one improvises during the fire.

**What it signals.** This is **incident-command pedigree**, the discipline you'd see at Shopify or Brex and
in a real on-call practice (Google SRE roles, PagerDuty's "the IC is not a resolver," incident.io's "as few
severities as you can get away with"), right-sized for a Seed to Series A team. It is the thing most small
teams do badly and this engagement does reflexively.

**How it maps to the autonomy guardrails.** The **agent drafts**; the **human owns command, all
customer-facing comms, and all terminal actions**. Concretely: the agent proposes the declaration,
assembles the timeline and blast radius, drafts CAN and status-page updates on cadence, fires the
pre-agreed page, and drafts the postmortem, and it **never** declares, sets or changes severity, mitigates,
resolves, publishes a customer comm, or changes priority on committed work. Every customer-facing and
terminal action is human-approved. This is SOP-4 of the [SOP library](../sop-library.md), executed to the
bar.
