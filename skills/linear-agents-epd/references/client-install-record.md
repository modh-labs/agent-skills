# Client install record — Linear Agents

Copy to `clients/<client>/docs/linear-agents.md` and commit. This is the auditable record of what's
enabled, which vendors have access, and the cost/guardrail decisions. Update it every time the setup
changes. Keep it free of secrets (reference where keys live, don't paste them).

---

## <CLIENT> — Linear Agents setup

- **Workspace:** `<workspace-slug>` (e.g. `aura-app-ai`)
- **Plan tier:** [ ] Free [ ] Basic [ ] Business [ ] Enterprise
- **Linear MCP key location:** `clients/<client>/.mcp.json` (gitignored)
- **Current ladder tier reached:** `<0–4>`
- **Owner of this setup:** <name> · **Last reviewed:** <YYYY-MM-DD>

### Tier status
| Tier | Status | Notes |
|---|---|---|
| 0 — Foundations | [ ] done / [ ] partial / [ ] n/a | Triage, labels, customer requests, integrations, cycles |
| 1 — Native AI | [ ] | Linear Agent, Agent Guidance, Triage Intelligence (auto-apply teams: …), Code Intelligence |
| 2 — Marketplace agents | [ ] | (list below) |
| 3 — Workflow automation | [ ] | Triage Rules/Automations, Create-with-Agent, SLAs |
| 4 — Custom agent | [ ] | repo: … · deploy: … |

### Agent Guidance
- Workspace guidance set: [ ] yes — last edited <date>
- Team guidance set: <TEAM KEY> [ ], <TEAM KEY> [ ]

### Installed agents (vendor review)
| Agent | Purpose | Scopes / teams granted | Vendor reviewed | Billing | Date |
|---|---|---|---|---|---|
| e.g. Cursor | coding | app:assignable, app:mentionable; team AUR | ✅ | vendor seat | |
| e.g. Sentry·Seer | ops | …; team AUR | ✅ | vendor | |

### Custom agent (if Tier 4)
- OAuth app id / client id location: <where>
- Scopes granted: `app:assignable`, `app:mentionable`, `<data scopes>` — **no `admin`, no delete**
- Webhook endpoint: `<url>` · Worker host: `<vercel project>` · State: `<supabase project>`
- Secrets location: `<.env / vault>` (never in this file)

### Cost governance
- AI-credit balance / auto-reload threshold (cap): `$<n>`
- Last spend review: <date> — `$<n>` spent on Coding Sessions
- Marketplace agent monthly cost: `$<n>`

### Guardrail decisions (deviations from "safe-auto, gated-risk")
- Auto-apply enabled for teams: …
- Any human-gated action made autonomous (and why): …
- Guests present? "Prevent guests interacting with agents" toggle: [ ] on

### Verification log
| Tier | Test | Result | Date |
|---|---|---|---|
| 1 | Customer Request → Create with Agent → structured issue in Triage | | |
| 2 | Delegate test issue → draft PR | | |
| 4 | HMAC ok · 5s ack · 10s thought · Supabase row | | |
