# Project Development Guide

## Quick Reference

```bash
npm run dev              # Development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint check
```

## Tech Stack

- **Frontend:** React + TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest + Playwright

## Critical Rules

### DO

- Use TypeScript strict mode
- Use shadcn/ui components — never raw HTML elements
- Colocate components with features, share only when used by 3+ locations
- Create Zod validation schemas for all form inputs
- Use CSS variables for theming, never hardcoded colors

### DON'T

- Use `any` types
- Import components across feature boundaries
- Skip loading, error, and empty states
- Use `console.log` in production code

## Available Skills

Skills are installed from the Modh Agent Skills pack. Use `/skill-name` to invoke.

See `.claude/skills/` for the full list.
