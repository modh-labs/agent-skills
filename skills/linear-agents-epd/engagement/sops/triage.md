# Triage runbook

**Owner:** EPD Operations (Modh consulting engagement)
**Scope:** All inbound issues, Sentry errors, customer reports, internal bug reports, and manual filings, across every team Triage inbox in Linear.
**Operating model:** An AI agent assembles, drafts, classifies, and routes. A human owns command and every customer-facing or terminal action.
**Status:** Active SOP. Drop-in for `engagement/sops/`.

---

## 1. What this runbook is for

Triage is the gate between "something arrived" and "the team works on it." A good triage function admits only issues that are actionable, reproducible, and relevant; scores them consistently; deduplicates them against what already exists; and routes them to the right owner, fast, without burning engineering attention on noise.

This runbook makes that gate **deterministic and auditable** while keeping the human in command of every decision that has consequences. The agent does the assembly. The human does the deciding.

**Auditability is mechanical, not aspirational.** The agent operates under a distinct, named agent actor in Linear (for example `triage-agent`). Every classification, dedup suggestion, and routing proposal is posted as a comment attributed to that actor, each carrying a one-line rationale. Every disposition (Accept / Decline / Hold), every priority change, and every merge is a human action recorded in the issue history. The result: from the issue alone, anyone can reconstruct what the agent proposed and what the human decided. If you cannot tell agent from human in the history, the boundary has been violated.

### The one distinction everything hangs on: severity vs priority

These are two different axes. Do not collapse them into one field.

| | **Severity** | **Priority** |
|---|---|---|
| What it is | An objective **attribute** of the issue | A **decision** by the responder |
| Measures | Impact / blast radius right now | Urgency of response: how fast we act, what we drop |
| Set from | Facts at intake (users affected, data at risk, core flow down) | Severity + urgency, weighed by a human |
| Who sets it | **Agent drafts** it from intake facts | **Human owns** it (agent may propose) |
| Linear field | `Severity` (custom field) | `Priority` (native) |

> Google SRE states it plainly: *"severity is an attribute of the incident; priority is a decision made by the responder."*

**Why this matters:** a low-severity bug can be high-priority (a typo on the **pricing page**: tiny blast radius, urgent because it costs trust and money). A high-severity bug can be lower-priority (a backend degradation with a known workaround during a quiet window). Collapse the two and you either over-escalate cosmetic bugs or bury an urgent low-severity one. **Keep two separate Linear fields. Always.**

**How the two axes connect (without collapsing):** severity feeds the **Impact** axis of the priority matrix in §4; it does not set priority by itself. The one hard coupling is escalation, not priority: a **SEV-1 always triggers the human escalation path in §11**, immediately, regardless of what priority is later set. Severity drives *who must be woken up*; priority drives *what we drop to respond*.

---

## 2. The triage pipeline

Every issue flows through six stages. Each stage is a clean hand-off between the agent (assembly) and the human (command).

```
  INTAKE  →  QUALITY GATE  →  CLASSIFY  →  DEDUP  →  ROUTE  →  DISPOSE
 (any src)   (required        (severity,   (canonical (lane +   (Accept /
             fields)          priority,    issue)     assignee)  Decline /
                              labels)                            Hold)

  └────────────── AGENT drafts steps 2-5 ──────────────┘   └─ HUMAN commands ─┘

  SEV-1 FAST-PATH: the moment the agent scores SEV-1 it pages on-call and posts
  assembled facts. It does NOT wait for normal disposition. (See §3 and §11.)
```

1. **Intake**, issue lands in one per-team Triage inbox (Sentry, Slack/support, customer request, manual).
2. **Quality gate**, block or relabel anything missing required fields before it consumes engineering attention.
3. **Classify**, agent drafts severity, impact, urgency→priority, and Type/Area/Complexity labels.
4. **Dedup**, agent surfaces likely duplicates and proposes a merge to the canonical issue.
5. **Route**, agent proposes owning team/assignee by lane.
6. **Dispose**, **human** Accepts / Declines / Holds (Snoozes). This is the terminal action.

This maps 1:1 onto Linear Triage: a per-team inbox where integration and non-member issues land, reviewed before they enter the workflow, with **Accept / Mark as Duplicate / Decline / Snooze**. The agent does steps 2 through 5 as drafts; a human performs step 6 and any priority change on committed work.

**The one exception to "draft and wait": SEV-1.** When the agent scores an issue SEV-1 (§3), it does not park a disposition draft and move on. It immediately pages the on-call human and posts the assembled facts (see the SEV-1 fast-path in §3 and the escalation table in §11). Disposition still happens, but the page goes first. A live critical incident must never sit in a review queue.

---

## 3. Severity ladder (SEV-1 → SEV-5)

Lower number = more severe. The agent scores severity from intake facts. A human confirms SEV-1 and any security/billing/legal flag. **Confirmation does not gate the SEV-1 page:** the agent pages first, the human confirms or downgrades on arrival.

| Level | Name | Definition | Examples |
|---|---|---|---|
| **SEV-1** | Critical | A core flow is down for a large share of users, customer data is exposed or at risk, or money movement is broken. Warrants immediate on-call page; may warrant public notification + exec liaison. | Login down for all users; data breach; payments failing platform-wide. |
| **SEV-2** | Major | A critical issue actively impairing **many** customers' ability to use the product. Broken core feature or widespread unavailability with no clean workaround. | Checkout broken in a major browser; dashboard won't load for a whole plan tier. |
| **SEV-3** | Stability | Minor customer-impacting or stability issue needing prompt attention. Partial functionality loss, or a single point of failure that has not yet failed. | One report export fails; intermittent 500s on a secondary endpoint. |
| **SEV-4** | Minor | Action needed, but customers can still use the product. Performance delays, single-host failure with redundancy intact. | Slow page under load; one worker node flapping while replicas absorb traffic. |
| **SEV-5** | Cosmetic | Bug not affecting usage. Tracked as a ticket; no immediate response. | Misaligned icon; typo in a tooltip (note: location can still raise *priority*). |

> **Golden rule: if you are unsure which level it is, treat it as the higher one.**

### SEV-1 fast-path (the agent's only SEV-1 action)

The instant the agent scores SEV-1, it does exactly this, in order, and nothing else:

1. **Page the on-call human** through the configured channel (PagerDuty / Opsgenie / on-call Slack).
2. **Post the assembled facts** as a comment: what is down, since when, who/how many affected, the Sentry link or customer reports, and the proposed Area label.
3. **Apply the `incident` + `SEV-1` labels** so the issue is findable, and link any duplicate customer reports already in hand.

The agent does **not** set priority, declare the incident, open a status page, message customers, or wait for disposition. A human takes command from step 1. Everything else in this runbook (classification draft, dedup, routing) still happens, but after the page, not before it.

### Right-sizing for a small team

If five levels feel heavy, compress to **SEV-1 / SEV-2 / SEV-3** by folding SEV-4 and SEV-5 into SEV-3 ("minor / cosmetic, no immediate response"). Keep the **SEV-1 criteria finite and explicit** so the page decision is never ambiguous, and keep the fast-path above intact. The priority/SLA structure in §4 and §5 is unchanged by this compression: severity still feeds the Impact axis, and only the number of named rungs changes. Do not invent per-customer custom tiers.

---

## 4. Severity × priority matrix (copy-paste)

Priority is derived from **Impact** (how many users / how much business, the severity input) against **Urgency** (how fast it degrades / time-sensitivity). The agent drafts the priority deterministically from these two scored inputs. **A human owns the final priority and any override.**

Score **Impact** and **Urgency** each as High / Medium / Low, then read the cell:

| Impact ↓ \ Urgency → | **High urgency** (degrading now / time-boxed) | **Medium urgency** | **Low urgency** (stable, can wait) |
|---|---|---|---|
| **High impact** (many users / core flow / data or money) | **P1, Critical** | **P1, Critical** | **P1, Critical** |
| **Medium impact** (a segment / a secondary flow) | **P2, High** | **P2, High** | **P3, Medium** |
| **Low impact** (few users / cosmetic / workaround exists) | **P2, High** | **P3, Medium** | **P4, Low** |

**Hard floor (read this):** any issue whose impact is **core flow down, data loss/exposure, or money movement broken** is **P1 regardless of urgency**. A total outage that has stopped actively getting worse is still a total outage. Urgency modulates priority only *within* the medium- and low-impact rows; it never demotes a true high-impact event below P1. This is also why the High-impact row is P1 across all three urgency columns.

**Worked examples**

- All-users login outage → High impact (core flow down) → **P1**, even if it is "stable" and not spreading. (Severity SEV-1.)
- Typo on the **pricing page** → Low impact + High urgency (trust/conversion) → **P2**. (Severity SEV-5.) *This is the canonical proof that severity ≠ priority.*
- Slow report export, workaround exists → Low impact + Low urgency → **P4**. (Severity SEV-3/4.)
- Billing webhook dropping events for one enterprise account → Medium impact + High urgency (money + a key customer) → **P2**, and routed to the billing escalation trigger in §11.

**Tier discipline:** four priority tiers (Critical / High / Medium / Low) is the sweet spot. More creates inconsistent scoring; fewer fails to differentiate business impact. Do not add tiers.

---

## 5. SLA table per priority (response + mitigation)

Each tier carries **two clocks**: time-to-first-response (acknowledge) and time-to-mitigate (restore service or apply a workaround). **Note the second clock is mitigation, not full root-cause resolution.** For a critical incident you commit to *stopping the bleeding* on a clock; the durable fix is owned by the post-incident process, not the SLA. Promising a hard resolution time on a critical bug is a promise you will break.

**Tune these to your actual staffing before publishing. An SLA you cannot hit is worse than a looser one you always hit.**

| Priority | First response (ack) | Mitigation target | Operating hours | On miss |
|---|---|---|---|---|
| **P1, Critical** | 15 min | Mitigate in 1-4 h; root-cause fix tracked post-incident | 24/7 on-call (for the narrowed P1 set) | On-call is already paged via the SEV-1 fast-path; agent drafts the status update and escalation note; human runs incident command. |
| **P2, High** | 1 h | 4-8 h | Business hours | Agent drafts a nudge to assignee + lead at 80% of the clock; human decides re-prioritization. |
| **P3, Medium** | 4 h | 24-48 h | Business hours | Agent flags overdue in the daily triage digest; human re-plans. |
| **P4, Low** | Next business day | 3-5 business days | Business hours | Agent surfaces in weekly review; human decides keep/decline. |

**Operating-hours stance for P1 (decide this at adoption, do not ship it blank):** the default in this runbook is **24/7 on-call for a deliberately narrow P1 set**: only core-flow-down, data exposure, or broken money movement qualify. If 24/7 coverage is not realistic for this team, you have exactly two honest options, and you must pick one before publishing:

- **(a)** keep the narrow P1 set and accept that out-of-hours P1s page someone, or
- **(b)** publish an explicit **business-hours P1 clock** and a documented best-effort posture outside those hours.

Do not leave a 15-minute clock running against a target nobody is on call for. State the choice in the engagement's on-call doc and link it here.

**Document for each tier:** what's included, how priority is set, response + mitigation targets, operating hours, and what happens when a target is missed. The agent **watches the clock and drafts** the nudge or escalation; **a human owns** the breach response and any customer-facing SLA communication.

---

## 6. Intake quality gate (the checklist)

An issue is admitted only if it is **actionable, reproducible, and relevant.** The agent checks these on intake and drafts a `needs-info` request back to the reporter. A human owns any customer-facing reply.

> **SEV-1 bypasses the gate.** A suspected critical incident (site down, data exposed, payments broken) is paged immediately via the §3 fast-path even if the report is incomplete. You do not hold a live outage for missing repro steps. The gate below is for the normal queue.

### Required fields for a bug report

- [ ] **Title**, specific, says *what* + *where*. Good: *"Submit button fails on checkout in Chrome 120."* Bad: *"Checkout broken."*
- [ ] **Environment**, OS / browser / device **and the exact build/version number**. `"latest"` is **not** acceptable: bugs are version-specific.
- [ ] **Steps to reproduce**, numbered, one action per step.
- [ ] **Expected result.**
- [ ] **Actual result**, must **not** be a restatement of the expected result.
- [ ] **Evidence**, screenshot, video, or console/log output.

> **The single most effective gate: block an issue from entering active development if Steps to Reproduce is missing or incomplete.** Without this, triage drowns in vague reports and real SEV-1s get lost in the noise. (Sentry-originated issues carry a stacktrace, which satisfies this in place of manual repro steps.)

### Copy-paste bug intake template

```markdown
**Title:** <what fails> on <where/flow> in <browser/app + version>

**Environment**
- OS / device:
- Browser / app version (EXACT build number, not "latest"):
- Account / plan tier / user role:
- Date & time observed (with timezone):

**Steps to reproduce**
1.
2.
3.

**Expected result**

**Actual result**  (do not restate "Expected"; describe what actually happened)

**Evidence**  (screenshot / screen recording / console or server logs)

**Impact (reporter's view)**  (who/how many affected, is there a workaround?)
```

### Agent's `needs-info` draft (held for a human before any customer-facing send)

This is the internal draft. For a customer-reported issue, a human reviews and sends the customer-safe version in §10, never this one verbatim.

```markdown
Thanks for the report. To get this in front of an engineer we need a few details
the current report is missing:

- Exact build/version number (for example "Chrome 120.0.6099.130", not "latest")
- Numbered steps to reproduce, one action per step
- What you expected vs. what actually happened
- A screenshot or console log if you have one

Reply here with those and we'll pick it up.
```

The agent applies the `needs-info` label and sets the issue to Hold/Snooze with a return trigger (see §11). That status is internal and must not appear in any message sent to a customer.

---

## 7. Classification, the agent's exact steps

For every issue that passes the gate, the agent drafts the following. Each is a suggestion the human can override at disposition.

1. **Label, Type:** `bug` / `feature` / `chore` / `incident` / `security` (per the engagement label taxonomy).
2. **Label, Area:** the product surface (for example `auth`, `billing`, `checkout`, `api`, `notifications`).
3. **Label, Complexity:** `XS` / `S` / `M` / `L` / `XL` as a first-pass effort hint (advisory only; not an estimate commitment).
4. **Severity score (SEV-1…SEV-5):** drafted from intake facts, users affected, data at risk, core flow down, and the rolled-up customer-request count on the issue. Writes to the `Severity` field with a one-line rationale in a comment. **If the score is SEV-1, the §3 fast-path fires before anything below.**
5. **Impact + Urgency → Priority:** scores Impact and Urgency (High/Med/Low each), reads the §4 matrix, proposes a `Priority`. **Marked as a proposal; the human confirms or overrides.**
6. **Dedup check:** runs the §9 procedure and, if a likely duplicate exists, proposes Mark-as-Duplicate against the canonical issue.
7. **Hold-for-info:** if any §6 required field is missing, the agent applies a `needs-info` label, drafts the request (above), and sets the issue to Hold/Snooze with a return trigger. It does **not** advance the issue to routing.
8. **Route by lane:** proposes owning team/assignee per §8.
9. **Suggest assignee:** via Linear Triage Intelligence (matches against workspace history), as a suggestion in the disposition draft. If Triage Intelligence returns no confident match, the agent falls back to the Area label's default owner and says so.

The agent posts all of the above as a single **disposition draft** comment on the issue, attributed to the agent actor. It does not Accept, Decline, change priority on committed work, declare an incident, or send any customer message.

---

## 8. Routing, lanes

The agent proposes a lane; the human confirms at disposition.

| Lane | Trigger | Proposed route |
|---|---|---|
| **Error/stability** | Sentry-originated, has a fingerprint | Owning team by Area label; assignee = recent code owner of the failing path. |
| **Customer-reported** | Slack/support integration or Linear customer request | Owning team by Area; link customer request to canonical issue (§10). |
| **Internal bug** | Manual filing by a team member | Owning team by Area; assignee suggested by Triage Intelligence. |
| **Security** | `security` label or data-exposure signal | Route to security owner **and** raise a human escalation trigger (§11). |
| **Billing/legal** | `billing` Area or legal-sensitive content | Route to the relevant owner **and** raise a human escalation trigger (§11). |

**Sentry-specific events:**
- **Regression** (a previously resolved Sentry issue re-opens): the linked Linear issue re-enters Triage at no lower than its prior severity. A regression is evidence the fix did not hold; do not let it quietly re-rank lower.
- **Spike** (event volume crosses the configured alert threshold): the agent proposes a severity re-score with the new volume as the rationale, because affected-user count is a direct severity input. The human confirms.

**Deterministic auto-apply (safe):** Linear **Triage Rules** may set team / status / assignee / label / project by filter condition, top-to-bottom. These are predictable and auditable, so they may auto-apply. **LLM assistance (Triage Intelligence) only DRAFTS and SUGGESTS:** assignee, label, duplicate candidate, proposed priority. Never let the model auto-resolve, auto-close, declare an incident, or send customer comms.

---

## 9. Deduplication procedure

Two stages, mirroring Sentry. Maintain **one canonical issue per underlying problem.**

**Stage 1, Deterministic fingerprint (auto, safe).** Same-fingerprint events group into one issue automatically (Sentry behavior). Exact-match grouping needs no human confirmation.

**Stage 2, Semantic fallback (agent proposes, human confirms).** When fingerprinting finds no match, an ML/semantic model compares the new error's stacktrace (or the issue text) against existing issues and flags candidates above a similarity threshold. The agent **proposes** Mark-as-Duplicate; **a human confirms** the merge. It is reversible, but it is still a human-owned disposition.

**When merging (Linear Mark-as-Duplicate does this):**
- Merge the duplicate **into the canonical issue.**
- **Transfer attachments AND customer requests** onto the canonical issue, so total impact stays visible.
- The duplicate is cancelled and points at the canonical.

**Dedup guardrails:**
- Auto-merge **only** on fingerprint-exact matches. Borderline semantic merges **require human confirmation.**
- **Never auto-merge (auto-cancel) a customer-linked issue.** This is distinct from *rolling up* customer requests: linking and rolling a customer request onto a canonical issue is the desired behavior and is done at human-confirmed merge time. What is forbidden is the agent *automatically cancelling* an issue that has a customer attached, without a human in the loop.
- Keep merges **reversible** (unmerge); the system learns to keep genuinely distinct bugs apart.
- **Always roll the customer requests/attachments onto the canonical issue.** Forgetting this loses the affected-customer count, a primary input to the severity score, and makes the canonical issue look smaller than it is.

### Copy-paste dedup / canonical-issue rule

```markdown
Canonical-issue rule
- One canonical issue per underlying problem.
- Stage 1: same fingerprint → auto-group (no confirmation).
- Stage 2: semantic match above threshold → AGENT proposes Mark-as-Duplicate;
  HUMAN confirms.
- On merge: move attachments + customer requests to the canonical; cancel duplicate.
- Rolling up customer requests onto a canonical = good (at human-confirmed merge).
- Auto-cancelling a customer-linked issue = forbidden (always needs a human).
- Merges are reversible (unmerge). When unsure, do NOT merge: file a linked issue instead.
```

---

## 10. Customer-reported issue handling

Customer-reported issues enter the **same** Triage queue as everything else, never a parallel track, via a support/Slack integration or a Linear customer request. They get the same quality gate, dedup, classification, and routing. A parallel pipeline would mean inconsistent severity scoring and missed deduplication between an internal Sentry issue and the customer report describing the same failure.

**The agent does:**
1. Assemble and label the inbound; run the §6 quality gate.
2. **Link the customer request to the canonical issue** so multiple requests roll up onto one issue and the affected-customer count is visible (a direct input to the severity score).
3. Run dedup (§9) and classification (§7).
4. **Draft** the acknowledgement / response, held for a human to review and send.
5. If the report is a fully-specified feature or change rather than a bug, link it forward to the **customer-request → spec flow** (see `../sop-library.md`) so a human can shape the spec.

**The agent never:**
- Sends a customer-facing message (a human sends **every** one).
- Auto-resolves an incident.
- Closes / cancels customer-linked work.
- Changes priority on committed work.

### Copy-paste customer acknowledgement draft (human reviews, then sends)

Everything in angle brackets is a fill-in. Nothing internal (issue IDs, Linear status words, priority codes, SLA promises) goes to the customer unless a human deliberately includes it.

```markdown
Thanks for flagging this. We've logged it and our team is looking into it now.

What we understand is happening: <one-line plain-language restatement of the issue>

<If we need more from them, include this line, otherwise delete it:>
To dig in, could you share <the one missing detail, e.g. the browser version, or a screenshot>?

We'll follow up here as soon as we have an update for you.
```

Guidance for the human sending it: do not quote an SLA or a resolution time unless that commitment has been explicitly approved for this customer. Keep internal tracking identifiers out of the message. If you want to give a timeframe, give one you will hit.

---

## 11. Disposition, human command (terminal action)

Disposition is the human step. The agent has staged everything; the human now Accepts, Declines, or Holds.

> **"Committed work" defined** (because three guardrails protect it): an issue is *committed* if it is in an active or upcoming cycle, is in an In Progress or otherwise committed workflow state, or carries a customer-facing commitment. Re-prioritizing, closing, or cancelling committed work is human-only. The agent may propose, never execute, a change to committed work.

### Disposition checklist (human reviews the agent's draft, then commands)

- [ ] **If SEV-1 / security / billing / legal** → the human escalation path (below) takes precedence. For SEV-1 the on-call human is already paged via the §3 fast-path; confirm command is established before doing anything else.
- [ ] **Read the agent's disposition draft** (severity rationale, proposed priority, labels, dedup candidate, suggested route/assignee).
- [ ] **Confirm or override severity**, does the SEV match the facts? When unsure, round **up**.
- [ ] **Set/confirm priority**, does the §4 matrix cell match the business reality? Human owns this.
- [ ] **Confirm dedup**, is the proposed canonical issue genuinely the same problem? If unsure, do **not** merge.
- [ ] **Confirm route/assignee.**
- [ ] **Command one:**
  - **Accept** → issue enters the workflow.
  - **Decline** → with a one-line reason (not actionable / not relevant / wontfix).
  - **Hold (Snooze)** → **must** carry a return trigger: a date **or** "on new activity." No open-ended holds.

### Human escalation triggers, always a human, immediately

| Trigger | Why it's human-owned | Action |
|---|---|---|
| **SEV-1** | Live critical incident; may warrant public notification + exec liaison | On-call paged via the §3 fast-path; human runs incident command; agent drafts status updates and the escalation note only. |
| **Security** (data exposure, auth bypass, vuln) | Legal/compliance exposure | Human owns disclosure decisions and timeline. Agent assembles facts. |
| **Billing** (payments, charges, refunds) | Money + customer trust | Human owns any customer-facing or financial action. |
| **Legal** (contractual, privacy, regulatory) | Liability | Human (and counsel if needed) owns the response. Agent never replies. |

The agent **drafts** the incident note, the customer status update, and the internal escalation message. The **human owns** the escalation decision, the incident resolution, every customer-facing message, and any priority change on committed work.

### Hold/Snooze hygiene

A **Hold** is a deferral with a return, never a graveyard. Every hold returns on a **date** or on **new activity** (Linear Snooze supports both). **Review the held/snoozed set weekly** so deferred-but-real issues resurface. An unbounded hold is where real issues go to die silently.

---

## 12. Agent autonomy guardrails (the bright line)

| Surface | Agent (assembly / draft) | Human (command / terminal) |
|---|---|---|
| Quality-gate check | checks fields, drafts `needs-info` | sends any customer-facing reply |
| Severity score | drafts from facts | confirms SEV-1 |
| **SEV-1 page** | **pages on-call + posts facts (fast-path)** | takes incident command |
| Priority | proposes from matrix | **sets / overrides** |
| Labels (Type/Area/Complexity) | drafts | corrects as needed |
| Dedup | proposes merge | **confirms merge** |
| Routing/assignee | proposes (rules may auto-apply) | confirms |
| Accept / Decline / Hold | drafts the recommendation | **commands** |
| Priority change on **committed** work | proposes only | **human only** |
| Incident resolution / close / cancel | | **human only** |
| Customer-facing comms | drafts | **human sends every one** |
| Incident escalation (SEV-1/security/billing/legal) | drafts the note | **human owns the decision** |

**Hard guardrails, the agent NEVER:** auto-resolves or declares an incident; sends a customer message; closes, cancels, or changes priority on committed work; auto-cancels a customer-linked issue; or auto-merges on anything weaker than a fingerprint-exact match. The agent's *only* unilateral action on a critical event is to page a human (the SEV-1 fast-path), which raises a human into the loop rather than taking a terminal action. Classification, dedup-suggestion, and routing are the safe-to-automate surface. Disposition is always the human decision.

---

## 13. Triage health (how you know it's working)

The "auditable" claim in §1 is only real if someone watches the numbers. Pull these weekly from Linear and the Sentry integration; a human reviews them in the same weekly pass as the held-issue sweep.

| Metric | What it tells you | Watch for |
|---|---|---|
| **Time-in-triage** (intake → disposition) | How fast the gate clears | A rising median means the queue is backing up. |
| **Gate bounce rate** (% sent back as `needs-info`) | Inbound report quality | Very high = the reporting template isn't reaching reporters; very low = the gate isn't being enforced. |
| **Dedup rate** (% merged into a canonical) | Noise vs. distinct problems | A sudden spike often means one underlying incident is fanning out. |
| **SLA attainment** (per priority) | Whether the §5 clocks are real | Chronic P2/P3 misses mean the SLA is unstaffed; fix the staffing or loosen the clock. |
| **Reopen / regression rate** | Whether "resolved" sticks | High reopens point at premature closes or fixes that don't hold. |

If any of these drift, the fix is a process change (gate, staffing, SLA, or template), not a heroics sprint.

---

## 14. Pitfalls to avoid

- **Collapsing severity and priority into one field.** They're different axes. Keep two Linear fields, or you'll over-escalate cosmetic bugs and bury urgent low-severity ones.
- **Letting the agent take terminal actions.** Accept/decline, incident declaration/resolution, closing/cancelling customer-linked or committed work, priority changes on committed work, and all customer comms are human-owned. The one exception is paging a human, which is the opposite of a terminal action.
- **Parking a SEV-1 in the review queue.** A detected critical incident pages a human immediately; it does not wait for normal disposition.
- **Promising a resolution SLA on a critical incident.** Commit to time-to-mitigate; root-cause resolution is owned by the post-incident process.
- **Publishing an SLA you can't staff.** A tight SLA you routinely miss is worse than a looser one you always hit. Narrow P1 or publish an explicit business-hours clock.
- **Too many tiers.** Four priority tiers, three-to-five severity levels. Resist per-customer custom-tier sprawl.
- **No hard intake gate.** Block entry when Steps to Reproduce is missing/incomplete (Sentry stacktraces excepted), or triage drowns in vague reports.
- **Accepting "latest version" as environment.** Bugs are version-specific; require an exact build number the agent checks.
- **Over-aggressive auto-dedup (false merges).** Fingerprint-exact auto-grouping only; human confirmation for semantic merges; keep them reversible; never auto-cancel a customer-linked issue.
- **Forgetting to roll customer requests onto the canonical issue.** You lose the affected-customer count, a primary severity input, and the canonical issue looks smaller than it is.
- **Treating customer-reported issues as a separate track.** Same queue, gate, dedup, and classification as everything else.
- **Leaking internal text into customer messages.** Issue IDs, Linear status words, priority codes, and unapproved SLA promises stay internal. Send the §10 customer-safe template, never the internal `needs-info` draft.
- **Unbounded snooze/hold.** Every hold returns on a date or on new activity. Review the held set weekly.

---

## 15. The standard this enforces

This runbook enforces **incident-command-grade triage discipline, right-sized for a Seed-Series A team**: the severity-vs-priority separation that Google SRE codifies, the SEV ladder with the "round up when unsure" rule and an explicit page fast-path, the impact×urgency→priority→SLA chain (with mitigation, not resolution, on the critical clock), and Sentry-style fingerprint-then-semantic deduplication onto a single canonical issue that accumulates customer impact.

**What it signals:** the operating maturity you'd expect from a Shopify or Brex engineering org and a real customer-support function, explicit SLAs you actually staff, a hard reproducibility gate, an immediate page for live incidents, consistent cross-source scoring, a mechanical audit trail, and a clean intake→gate→classify→dedup→route→dispose pipeline, delivered without enterprise bloat.

**How it maps to the autonomy guardrails:** the **agent drafts**, quality-gate checks, severity scores, priority proposals, labels, dedup suggestions, routing, and the text of every customer and escalation message, and it **pages a human** the instant it sees a SEV-1. The **human owns command**, disposition (accept/decline/hold), priority on committed work, dedup confirmation, incident declaration/escalation/resolution, and **every customer-facing message**. The bright line never moves: assembly and classification are automated; command and all terminal or customer-facing actions stay human.
