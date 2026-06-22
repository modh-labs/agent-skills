# Guardrails — autonomy, scopes, vendor review, cost

Default posture: **safe-auto, gated-risk.** Agents act autonomously on low-blast-radius, reversible,
internal work and draft/route everything else for a human to approve. Much of this is enforced by
Linear's design (delegation keeps a human owner; AI suggestions are opt-in; Triage holds new work), not
left to convention — but you still choose scopes, auto-apply, and which vendors to trust.

## Autonomy matrix

| Posture | Actions | Why it's safe / risky |
|---|---|---|
| **Autonomous OK** | apply/suggest labels · dedupe linking · draft issue descriptions & specs · internal comments and `thought`s · summarize threads into **Triage** items · draft (not publish) project/status updates · propose **draft** PRs · move an issue to first `started` state on pickup | Low blast radius, reversible, internal-only. Worst case is a wrong label or a draft someone edits. |
| **Human-gated** | customer-facing replies (Customer Requests / synced Zendesk·Intercom·Slack threads reach real people) · closing/cancelling issues · changing priority or due dates on committed work · deleting issues/comments/attachments · merging / PR-merge via Diffs · broad re-triage or re-assignment | Customer-visible, terminal, or irreversible. A human must own the final action. |

**Operating rules**
- **Triage is the airlock.** Agent/integration-created issues land in Triage, outside the team's
  workflow, until a human accepts. Never let an agent inject straight into an active cycle.
- **Auto-apply is opt-in, per team, earned.** Start with Triage Intelligence *suggesting*; promote a
  team to auto-apply only after it has watched the suggestions and trusts them.
- **Assignment = delegation.** The human assignee stays accountable. Design automations so terminal
  actions (close, customer reply) require the human, not the agent.
- **Updates are drafts.** Agent-assisted project/status updates are written "for you to refine" — keep
  the publish step human.

## Least-privilege OAuth scopes (for installed + custom agents)

Request the **narrowest** scopes that work. `actor=app` installs **structurally cannot request
`admin`** — agents can't sign in, manage users, billing, or security settings regardless of build.

| Scope | Grants | Use it? |
|---|---|---|
| `read` | read user-accessible data (always present, mandatory) | always |
| `issues:create` | create issues + attachments only | **prefer** over `write` for triage/intake agents |
| `comments:create` | create comments only | **prefer** for comment-only agents |
| `app:assignable` | be delegated issues + added to projects | required for a delegatable agent |
| `app:mentionable` | be `@mentioned` in issues/docs/editors | required for a mentionable agent |
| `customer:read` / `initiative:read` (+`:write`) | customer requests / initiatives | only if the workflow needs them |
| `write` | full write to user-accessible data | avoid unless genuinely needed |
| *(delete)* | delete issues/comments/attachments | **never grant** — prefer no delete capability at all |
| `admin` | admin endpoints | **never** (and `actor=app` can't request it anyway) |

Also: **scope each agent to specific teams** at install. A personal API key (for scripts) can be
restricted to teams and to a Read/Create-issues/Create-comments subset — use that for anything that
isn't a true interactive agent.

## Per-client vendor security review (before installing any third-party agent)

A third-party agent is a third-party OAuth app whose token can create/edit issues and comments across
the teams you grant it. Linear's SOC 2 Type II / GDPR / HIPAA posture and "no training on your data"
guarantee cover **Linear**, not the agent vendor. For each agent:

- [ ] Who owns it? (the directory generally lists apps "built by formal companies" — confirm.)
- [ ] What scopes + which teams does it request? Decline `write`/`admin`/delete it doesn't need.
- [ ] Vendor data handling: where does your issue data go, sub-processors, retention, DPA, does it
      train on your data?
- [ ] Install **team-scoped**, not workspace-wide, unless it must see everything.
- [ ] Record the decision in the client install record (`client-install-record.md`).
- [ ] On **Enterprise**: gate installs behind **Third-Party App Approvals** (request → admin approve/deny
      with reason → logged).

## Visibility & revocation

- **Install/suspend**: admins install agents (Settings → Applications) and can suspend/revoke at any
  time (Settings → Members). Revocation fires a `PermissionChange` webhook (e.g. `teamAccessChanged`) —
  the agent can detect it and you can audit it.
- **Attribution**: agent actions show under the agent's avatar/name; an `actor=app` agent can render
  actions as "User (via App)" via `createAsUser` + `displayIconUrl` to tie automation to a human name.
- **Audit log**: full immutable audit log (actor + IP + country, 90-day retention, GraphQL queryable,
  SIEM-streamable) is **Enterprise-only**. Below Enterprise, rely on in-app activity history +
  `PermissionChange` / `AppUserNotification` webhooks.
- **Guests**: toggle **"Prevent guests from interacting with agents"** (Security → Integrations &
  applications) when guests are present; note enabled integrations are otherwise reachable by guests.

## Cost governance

- **Agents are non-billable** — they don't consume a Linear seat. Add as many as you want.
- **Coding Sessions burn metered AI credits** (prepaid, workspace-pooled, USD; min $10 top-up; expire
  12 months after purchase; non-refundable). ~$0.50 styling / ~$3–5 small bug / $5+ complex; **failed
  runs and retries are billable**.
- **Gap:** admins currently **cannot restrict which members spend** AI credits. Mitigate with an
  automatic-reload threshold (a cap, not a floor), the guest toggle, and a periodic spend review logged
  in the install record.
- **Marketplace agents** are billed by each vendor (e.g. coding agents per-seat/per-run) — track in the
  install record.
