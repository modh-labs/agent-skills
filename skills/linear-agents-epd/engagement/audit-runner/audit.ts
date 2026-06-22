// Headless Readiness Audit engine (read-only).
// Takes a Linear API key, queries the workspace, scores it against the playbook tiers (see
// ../readiness-audit.md for the rubric), and returns a structured result + a buyer-facing markdown
// report. This is the reusable core; wrap it in a modh.ca form for the self-serve version.
//
// Run:  LINEAR_API_KEY=lin_api_xxx npx tsx audit.ts
//
// Auth: a Linear *personal API key* goes in the Authorization header verbatim (no "Bearer"); an OAuth
// token uses "Bearer <token>". READ-ONLY: this engine never mutates. Give the key Read scope only.
//
// Field names are validated against Linear's GraphQL schema as of 2026-06. The API evolves — if a query
// errors, re-check api.linear.app/graphql. Each optional probe is isolated so one failure degrades a
// single dimension to "confirm" rather than failing the whole audit.

const LINEAR_GRAPHQL = 'https://api.linear.app/graphql'

const KNOWN_AGENTS = ['cursor', 'codex', 'devin', 'copilot', 'charlie', 'cyrus', 'factory', 'sentry', 'chatprd', 'tembo']

export type Status = 'ok' | 'partial' | 'missing' | 'confirm'
export interface Dimension { name: string; status: Status; finding: string }
export interface AuditResult {
  workspace: string
  tier: 0 | 1 | 2 | 3
  tierName: string
  verdict: string
  dimensions: Dimension[]
  installedAgents: string[]
  gaps: string[]
}

interface TeamNode {
  name: string
  labels: { nodes: { name: string; parent: { name: string } | null }[] }
  states: { nodes: { name: string; type: string }[] }
  cycles: { nodes: { number: number }[] }
}

async function gql<T>(apiKey: string, query: string): Promise<T> {
  const auth = apiKey.startsWith('lin_oauth') ? `Bearer ${apiKey}` : apiKey
  const res = await fetch(LINEAR_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ query }),
  })
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data as T
}

export async function runAudit(apiKey: string): Promise<AuditResult> {
  const main = await gql<{
    organization: { name: string }
    teams: { nodes: TeamNode[] }
    users: { nodes: { name: string; email: string; active: boolean }[] }
  }>(
    apiKey,
    `query {
      organization { name }
      teams(first: 50) { nodes {
        name
        labels(first: 250) { nodes { name parent { name } } }
        states(first: 50) { nodes { name type } }
        cycles(first: 1) { nodes { number } }
      } }
      users(first: 250) { nodes { name email active } }
    }`,
  )

  const teams = main.teams.nodes
  const dimensions: Dimension[] = []
  const gaps: string[] = []

  // --- Foundations: label taxonomy (grouped Types / Areas / Complexity) ---
  const parentGroups = new Set(
    teams.flatMap(t => t.labels.nodes.map(l => l.parent?.name?.toLowerCase()).filter(Boolean) as string[]),
  )
  const hasTypes = parentGroups.has('types')
  const hasAreas = parentGroups.has('areas')
  const hasComplexity = parentGroups.has('complexity')
  const taxScore = [hasTypes, hasAreas, hasComplexity].filter(Boolean).length
  dimensions.push({
    name: 'Label taxonomy',
    status: taxScore === 3 ? 'ok' : taxScore >= 1 ? 'partial' : 'missing',
    finding: taxScore === 3 ? 'Grouped Types / Areas / Complexity in place' : `Missing groups: ${[!hasTypes && 'Types', !hasAreas && 'Areas', !hasComplexity && 'Complexity'].filter(Boolean).join(', ')}`,
  })
  if (taxScore < 3) gaps.push('No structured label taxonomy — agents have nothing reliable to auto-label against')

  // --- Foundations: workflow states ---
  const stateTypes = new Set(teams.flatMap(t => t.states.nodes.map(s => s.type)))
  const statesOk = ['started', 'completed', 'canceled', 'backlog'].every(t => stateTypes.has(t))
  dimensions.push({
    name: 'Workflow states',
    status: statesOk ? 'ok' : 'partial',
    finding: statesOk ? 'Backlog → started → completed/canceled present' : 'Non-standard or incomplete state set',
  })

  // --- Foundations: cycles ---
  const cyclesOk = teams.some(t => t.cycles.nodes.length > 0)
  dimensions.push({ name: 'Cycles', status: cyclesOk ? 'ok' : 'missing', finding: cyclesOk ? 'Cycles active' : 'No cycles configured' })
  if (!cyclesOk) gaps.push('Cycles not in use — no velocity/capacity signal for planning')

  // --- Installed agents (app users) ---
  const installedAgents = main.users.nodes
    .filter(u => /@oauthapp\.linear\.app|@integration\.linear\.app/.test(u.email) || KNOWN_AGENTS.some(a => u.name.toLowerCase().includes(a)))
    .map(u => u.name)
  const agentNames = installedAgents.map(a => a.toLowerCase())
  const hasCoding = ['cursor', 'codex', 'devin', 'copilot', 'charlie', 'cyrus', 'factory'].some(a => agentNames.some(n => n.includes(a)))
  const hasOps = agentNames.some(n => n.includes('sentry'))
  dimensions.push({
    name: 'Installed agents',
    status: hasCoding && hasOps ? 'ok' : installedAgents.length ? 'partial' : 'missing',
    finding: installedAgents.length ? `Found: ${installedAgents.join(', ')}` : 'No agents installed',
  })

  // --- Integrations (detected via app users) ---
  const hasSlack = main.users.nodes.some(u => /slack/i.test(u.name) || u.email.includes('@integration.linear.app'))

  // --- Foundations: Customer Requests (isolated probe) ---
  let customerStatus: Status = 'confirm'
  try {
    const c = await gql<{ customers: { nodes: { needs: { nodes: { id: string }[] } }[] } }>(
      apiKey,
      `query { customers(first: 50) { nodes { name needs(first: 1) { nodes { id } } } } }`,
    )
    const withNeeds = c.customers.nodes.filter(n => n.needs.nodes.length > 0).length
    customerStatus = c.customers.nodes.length === 0 ? 'missing' : withNeeds > 0 ? 'ok' : 'partial'
  } catch {
    customerStatus = 'confirm' // feature off, or key lacks customer:read
  }
  dimensions.push({
    name: 'Customer Requests',
    status: customerStatus,
    finding: customerStatus === 'ok' ? 'Customer requests linked to issues' : customerStatus === 'partial' ? 'Customers exist but no linked requests' : customerStatus === 'missing' ? 'Not in use' : 'Enable customer:read on the key to assess',
  })
  if (customerStatus === 'partial' || customerStatus === 'missing') gaps.push('Customer asks not captured as structured requests — no path to auto-draft them into issues')

  // --- PM maturity: initiatives (isolated probe) ---
  let initiativesOk = false
  try {
    const i = await gql<{ initiatives: { nodes: { name: string }[] } }>(apiKey, `query { initiatives(first: 50) { nodes { name } } }`)
    initiativesOk = i.initiatives.nodes.length > 0
  } catch { /* initiatives unavailable on plan or key */ }

  // --- Native AI + automation are settings-gated; not API-detectable ---
  dimensions.push({ name: 'Native AI (Agent, Guidance, Triage Intelligence)', status: 'confirm', finding: 'Settings-gated — confirm in Settings → AI' + (initiativesOk ? '; PM surface is mature and ready' : '') })
  dimensions.push({ name: 'Workflow automation (Triage Rules, Automations, SLAs)', status: 'confirm', finding: 'Settings-gated — confirm in Team Settings → Triage' })

  // --- Score the current tier (detectable signals only) ---
  const foundationsMissing = dimensions.filter(d => ['Label taxonomy', 'Workflow states', 'Cycles'].includes(d.name) && d.status === 'missing').length
  let tier: AuditResult['tier'] = 0
  if (installedAgents.length > 0) tier = 2
  const tierName = ['Getting started', 'Foundations + native AI ready', 'Agents installed, automation untapped', 'Automated'][tier]

  const verdict = installedAgents.length
    ? `Agents are in the workspace (${installedAgents.join(', ')}) but they're doing coding/ops, not EPD ops. The gap is the AI + automation layer.`
    : foundationsMissing === 0
      ? 'Solid foundations, but no agents yet — the whole agent layer is open.'
      : 'Foundations need shoring up before agents can be effective.'

  return { workspace: main.organization.name, tier, tierName, verdict, dimensions, installedAgents, gaps: gaps.slice(0, 3) }
}

// CLI entry
const ICON: Record<Status, string> = { ok: '✅', partial: '⚠️', missing: '❌', confirm: '🔎' }

export function renderMarkdown(r: AuditResult): string {
  const rows = r.dimensions.map(d => `| ${d.name} | ${ICON[d.status]} | ${d.finding} |`).join('\n')
  const gapList = r.gaps.length ? r.gaps.map((g, i) => `${i + 1}. ${g}`).join('\n') : '_No major gaps detected in read-only signals._'
  return `# Linear Agent Readiness Report — ${r.workspace}
_Read-only assessment · prepared by Modh_

## You're at Tier ${r.tier} of 4: ${r.tierName}
${r.verdict}

| Dimension | Status | Finding |
|---|---|---|
${rows}

## Top gaps costing you time
${gapList}

## What an Activation would change
- **Lite ($6,000)** — Agent Guidance + Triage Intelligence on.
- **Standard ($8,500)** ← recommended — + customer-ask→issue automation + Triage Rules + SLAs.
- **Pro ($12,000)** — + one bespoke automation.
Then **Agent Ops** keeps it running and tuned (from $6,000/quarter).

## Next step
This audit is free. Book a Standard Activation — first agent output within 48 hours or it's free.
`
}

// Run directly: LINEAR_API_KEY=... npx tsx audit.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.LINEAR_API_KEY
  if (!key) {
    console.error('Set LINEAR_API_KEY (read-only) and re-run.')
    process.exit(1)
  }
  runAudit(key)
    .then(r => console.log(renderMarkdown(r)))
    .catch(e => {
      console.error('Audit failed:', e.message)
      process.exit(1)
    })
}
