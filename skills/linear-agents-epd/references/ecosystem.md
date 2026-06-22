# Ecosystem — what's available (verified June 2026)

Facts below were verified against Linear's primary docs/changelog and the agents directory in June
2026. Re-check before relying on anything dated — the developer Agent API is still **Developer
Preview**. Source URLs are listed per section.

## How agents work in Linear (mechanics)

- An agent is an **"app user"** — installed via OAuth with **`actor=app`**, it appears as a real
  workspace member: `@mentionable`, delegatable via assignment, can comment/collaborate. Installed and
  managed by **admins**; **non-billable**.
- **Assignment = delegation.** The human stays the primary assignee/owner; the agent is an additional
  contributor. Delegated issues still show in the human's My Issues; filter by "Delegate" in views/Insights.
- **Agent Sessions** track one agent task (states: `pending`, `active`, `awaitingInput`, `error`,
  `complete`, `stale`), auto-created on mention/delegation.
- **`AgentSessionEvent` webhook** drives it: `created` (mention/delegation) and `prompted` (a follow-up
  user message). Payload includes `agentSession`, `agentActivity`, `previousComments`, `guidance`,
  `organizationId`, `oauthClientId`, `appUserId`.
- The agent reports back via **Agent Activities** (`thought`, `action`, `response`, `elicitation`,
  `error`) using the `agentActivityCreate` mutation. `prompt` activities are user-only.
- **Hard timing:** webhook HTTP 200 in **5s**; first activity within **10s** of `created` (else
  "unresponsive"); **30min** to stale (recoverable).
- **Scopes:** `app:assignable`, `app:mentionable` (+ data scopes). `actor=app` can't request `admin`.
- Sources: `linear.app/docs/agents-in-linear`, `linear.app/developers/agents`,
  `linear.app/developers/agent-interaction`, `linear.app/developers/agent-best-practices`,
  `linear.app/developers/oauth-actor-authorization`.

## First-party Linear AI

| Feature | What it does | Status / plan | Sources |
|---|---|---|---|
| **Linear Agent** | Conversational agent: chat (⌘/Ctrl+J), `@Linear` in comments/docs/Slack/Teams. Creates/updates issues·projects·milestones·initiatives, summarizes work + customer requests, drafts docs/specs + stakeholder updates. Runs **Skills** (saved workflows), **Automations**, connects **MCP servers**. | Public beta since **2026-03-24**; base chat seat-included | `docs/linear-agent`, `changelog/2026-03-24-introducing-linear-agent` |
| **Triage Intelligence** | Auto-suggest team/project/assignee/labels; semantic **duplicate detection**; opt-in auto-apply per team. | GA (was preview Aug 2025); **Business+** | `docs/triage-intelligence` |
| **Code Intelligence** | Read access to connected GitHub repos so the agent reasons about the codebase. | Public beta **2026-05-14**; **Business+** | `changelog/2026-05-14-code-intelligence` |
| **Coding Sessions** | Linear Agent writes code + opens PRs from an assigned issue, using **Claude Code + Codex** in the cloud. Resolves ~30% of inbound bugs first-pass internally (per Linear). | **GA 2026-06-11**; Basic+; **metered AI credits** | `changelog/2026-06-11-coding-sessions`, `docs/ai-credits` |
| **Agent-assisted project updates** | Drafts a project update from recent changes + linked Slack channel "for you to refine". | **2026-06-18** | `changelog/2026-06-18-agent-assisted-project-updates` |
| **Pulse** | Feed of project/initiative updates; daily/weekly Inbox digests. | All plans (not Guests) | `docs/pulse` |
| **MCP (Linear)** | Hosted remote MCP `https://mcp.linear.app/mcp` (Streamable HTTP, OAuth 2.1). Find/create/update issues·projects·comments. Expanded for PM (initiatives/milestones/updates) **2026-02-05**. | All plans | `docs/mcp`, `changelog/2026-02-05-linear-mcp-for-product-management` |

## Marketplace agents (`linear.app/integrations/agents`, ~26)

Install (admin), pick teams, then `@mention`/delegate. All third-party, built on Linear's Agent SDK,
**non-billable in Linear** (vendor-billed for compute).

- **Coding / PR:** Codex ("delegate issues to Codex"), **Cursor** ("issues → PRs with cloud agents"),
  GitHub Copilot, **Devin** ("issue → tested PR"), **Charlie** ("plans/implements/reviews TypeScript
  PRs"), **Cyrus** ("Claude Code-powered Linear agent, deployable anywhere"), Factory (Droids), Tembo,
  Warp's "Oz", plus Replicas/Blocks/Solo/Stilla/Pixelesq.
- **Ops / observability:** **Sentry · Seer** ("resolve Linear issues with Seer"), TierZero, Dash0,
  Panaptico, Larridin, Jellyfish.
- **Product / other:** **ChatPRD** ("writes requirements, manages product feedback"), Ranger (bug
  formatting + test plans), Reflag (feature flags), cto.new, CellCog, Testifly.
- The directory shows no beta/waitlist flags on agent cards.

## Where Claude fits (three paths — no native Anthropic agent)

There is **no** Anthropic-published "Claude" agent assignable inside Linear. Claude reaches Linear via:

1. **As the engine behind first-party Coding Sessions** (Linear runs Claude Code + Codex under the hood).
2. **As a third-party agent via Cyrus** — open-source runner (`github.com/cyrusagents/cyrus`) that
   registers **Claude Code** as an assignable/mentionable agent; watches delegated issues, runs Claude
   Code in per-issue worktrees, streams activities back. Fastest way to get "Claude in Linear" with no
   custom backend.
3. **As an MCP client from your terminal** — add Linear's MCP to Claude Code:
   `claude mcp add --transport http linear-server https://mcp.linear.app/mcp` then `/mcp` to auth. This
   drives Linear *from* Claude Code; it does **not** make Claude appear as an in-Linear teammate.
- Sources: `linear.app/integrations/claude`, `linear.app/integrations/cyrus`, `linear.app/docs/mcp`.

> **CodeRabbit** is not in the assignable-agents directory; it touches Linear via its **Issue Planner**
> (generates a coding plan from a Linear issue) and does PR review on GitHub via `@coderabbitai`.

## Date-confidence flags (re-verify before building)

- **Confirmed current (June 2026):** Coding Sessions (GA 2026-06-11), the live agents directory, the
  Agent Interaction docs + scopes + 5s/10s/30min timing + HMAC verification, Claude Agent SDK package
  names/API, Vercel duration limits.
- **Confirmed at launch, treat as beta thereafter:** Linear Agent (2026-03-24), Code Intelligence
  (2026-05-14).
- **Re-verify:** exact OAuth authorize/token endpoint paths, the precise `AgentSessionEvent` subtype
  list, current Linear TS SDK version for typed agent APIs, Anthropic Managed Agents hosting shape, and
  Linear plan dollar amounts (secondary sources conflict).
