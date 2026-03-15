# Project Development Guide

## Quick Reference

```bash
bun dev                  # Development server
bun build                # Build for production
bun test                 # Run tests
bun lint                 # Lint check
bun typecheck            # Type check
```

## Tech Stack

- **Frontend:** Next.js (App Router) + React + TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui (`@/components/ui/`)
- **Database:** Supabase (PostgreSQL + RLS)
- **Testing:** Vitest + Playwright

## Critical Rules

### DO

- Use repositories for ALL database queries
- Use Server Actions for ALL mutations (colocate in route's `actions.ts`)
- Use types generated from database schema
- Always `select *` in Supabase queries
- Call `revalidatePath()` after every mutation
- Use shadcn/ui components — never raw HTML elements
- Colocate components with routes, share only when used by 3+ routes
- Trust RLS for org isolation
- Create `error.tsx` for every route
- Create Zod validation schemas before server actions

### DON'T

- Use `supabase.from()` directly in Server Actions/Components
- Create custom interfaces for database types
- Use `any` types
- Import components from other routes
- Skip cache invalidation after mutations

## Available Skills

Skills are installed from the Modh Agent Skills pack. Use `/skill-name` to invoke.

See `.claude/skills/` for the full list.
