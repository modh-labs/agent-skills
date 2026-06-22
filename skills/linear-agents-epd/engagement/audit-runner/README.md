# Audit runner, self-serve engine

The headless core of the free Readiness Audit. It runs **read-only** against a Linear workspace and emits
the buyer-facing gap report. The Claude-run runbook (`../readiness-audit.md`) is the manual version; this
is the same detection logic in code, so it can power a self-serve form on modh.ca.

## Run it (CLI)
```bash
# A Linear personal API key with READ scope only (Settings → API → Personal API keys)
LINEAR_API_KEY=lin_api_xxx npx tsx audit.ts
```
Prints the markdown report to stdout. Read-only, it never writes to the workspace.

## Use it as a library
```ts
import { runAudit, renderMarkdown } from './audit'

const result = await runAudit(apiKey)   // structured AuditResult (tier, dimensions, gaps, agents)
const report = renderMarkdown(result)   // buyer-facing markdown
```

## Wrap it for self-serve (modh.ca)
1. A form collects a prospect's **read-only** Linear API key (state clearly it's read-only and not stored
   beyond the request).
2. A server route calls `runAudit(key)` → `renderMarkdown(result)`; render the report and gate the email
   capture / "Book Activation" CTA on it.
3. Never persist the key. Rate-limit. Log only the structured result (tier + statuses), never raw issue
   content or PII.

## What it detects vs. what it can't
- **Detectable (API):** label taxonomy (grouped Types/Areas/Complexity), workflow states, cycles,
  installed agents (app users), Customer Requests usage, initiatives/PM maturity.
- **Not detectable (settings-gated → reported as 🔎 "confirm"):** Linear Agent / Agent Guidance / Triage
  Intelligence, Triage Rules / Automations / SLAs. These are the upsell surface, the report flags them
  for a quick settings check.

## Caveats
- Field names match Linear's GraphQL schema as of 2026-06; the API evolves, and the Agent surface is a
  Developer Preview. If a query errors, re-check `api.linear.app/graphql`. Optional probes (customers,
  initiatives) are isolated so a missing scope/feature degrades one dimension, not the whole run.
- Tier scoring uses **detectable signals only**; native-AI and automation tiers are confirmed in
  settings during the audit call. Validate the rubric against a few real workspaces before going
  self-serve.
