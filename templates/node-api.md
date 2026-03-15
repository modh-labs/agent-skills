# Project Development Guide

## Quick Reference

```bash
npm run dev              # Development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint check
```

## Tech Stack

- **Runtime:** Node.js + TypeScript strict
- **Testing:** Vitest

## Critical Rules

### DO

- Use repositories for ALL database access
- Use structured logging (never `console.log`)
- Validate all input at API boundaries with Zod
- Use environment variables for secrets (never commit `.env`)
- Verify webhook signatures before processing
- Handle errors with domain-specific capture functions

### DON'T

- Use `any` types
- Use raw SQL string concatenation (parameterize queries)
- Trust client input without validation
- Use `console.log` for production logging
- Commit secrets or `.env` files

## Available Skills

Skills are installed from the Modh Agent Skills pack. Use `/skill-name` to invoke.

See `.claude/skills/` for the full list.
