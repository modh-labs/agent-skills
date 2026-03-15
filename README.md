# Modh Agent Skills

A portable skill pack for AI coding agents. Consolidates battle-tested architecture, design, and process patterns into reusable skills that work across Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex.

## Quick Start

```bash
# Option A: Git submodule (recommended for teams)
git submodule add https://github.com/modh/agent-skills .agents/modh-skills
./.agents/modh-skills/install.sh

# Option B: Clone (simpler for solo work)
git clone https://github.com/modh/agent-skills /tmp/modh-skills
/tmp/modh-skills/install.sh --target .
```

## What's Included

### Tier 1: Universal (Any Stack)
| Skill | Purpose |
|-------|---------|
| `design-taste` | Frontend design quality, anti-AI patterns, typography, color, motion |
| `internal-tools-design` | Admin dashboards, ops panels — scannability and data density |
| `output-enforcement` | Forces complete code generation, bans placeholder patterns |
| `cross-editor-setup` | AGENTS.md + CLAUDE.md + Cursor + Copilot portability |

### Tier 2: React / Next.js
| Skill | Purpose |
|-------|---------|
| `react-architecture` | Component decomposition, hooks, state machines, hydration safety |
| `nextjs-patterns` | Server Components, Suspense, server actions, prefetching |
| `shadcn-components` | shadcn/ui rules, CSS variables, detail view architecture |

### Tier 3: Backend / Infrastructure
| Skill | Purpose |
|-------|---------|
| `supabase-patterns` | Repository pattern, migrations, RLS, type generation |
| `observability` | Structured logging, Sentry, tracing, webhook observability |
| `webhook-architecture` | SOLID webhook handlers, registry pattern, templates |
| `security-and-compliance` | RLS, Zod validation, GDPR, security headers |
| `testing` | Vitest, Playwright, mocking patterns |

### Tier 4: Workflow / Process
| Skill | Purpose |
|-------|---------|
| `feature-design` | Interactive brainstorming, design specs, ticket creation |
| `linear-tickets` | Rich ticket creation with full context |
| `pull-request` | CI validation, rich PR descriptions |
| `ci-pipeline` | CI conventions, extensible step pattern |
| `route-colocation` | File organization, colocation rules |

## Selective Install

Install only the tiers you need:

```bash
# Just universal + React skills
./install.sh . --tier=universal --tier=react

# Just backend skills
./install.sh . --tier=backend

# Everything (default)
./install.sh .
```

## Cross-Agent Compatibility

| Agent | How It Works |
|-------|-------------|
| **Claude Code** | Auto-discovers from `.claude/skills/` (symlinked by install.sh) |
| **Cursor** | Same path — enable "Import Agent Skills" in Settings > Rules |
| **GitHub Copilot** | `./install.sh . --all-agents` generates `.github/copilot-instructions.md` |
| **Windsurf** | `./install.sh . --all-agents` generates `.windsurfrules` |
| **OpenAI Codex** | Reads `AGENTS.md` natively |

## Updating

```bash
cd .agents/modh-skills && git pull
# Symlinks mean changes are immediate — no reinstall needed
```

## Skill Structure

Each skill follows the AAIF (Agentic AI Foundation) standard:

```
skill-name/
├── SKILL.md          # Core rules (<500 lines, loaded into context)
├── references/       # Deep docs (loaded on-demand when SKILL.md references them)
└── examples/         # Project-specific examples (replace with your own)
```

## Adding Project-Specific Skills

Your project can have local skills alongside the Modh pack:

```
.claude/skills/
├── design-taste/          → .agents/modh-skills/skills/design-taste  (symlink)
├── react-architecture/    → .agents/modh-skills/skills/react-architecture  (symlink)
├── my-custom-skill/       # Local skill (not symlinked)
│   └── SKILL.md
└── billing-patterns/      # Local skill (project-specific)
    └── SKILL.md
```

install.sh never overwrites existing local skill directories.

## License

MIT
