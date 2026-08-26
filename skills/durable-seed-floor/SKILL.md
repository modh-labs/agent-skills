---
name: durable-seed-floor
description: >
  When read-only E2E tests assert over shared, sweepable environment data
  ("the board shows > 0 results"), guarantee the data floor with an idempotent
  global-setup upsert into a reserved namespace that cleanup structurally
  cannot match — never rely on residue from other tests. Use when a
  data-dependent spec blocks a deploy on "0 results", when adding a read-only
  spec that asserts non-emptiness, or when auditing cleanup sweeps against the
  data your gates depend on.
---

# Durable Seed Floor

## When This Skill Activates

- A read-only E2E spec asserts non-emptiness ("N results", "at least one row",
  "first card is visible") against a shared staging org/tenant/environment
- A deploy gate failed on missing data rather than a product regression
- You are writing or widening a cleanup sweep for a shared test environment
- A test suite "usually passes" but goes red after quiet weekends, cleanup
  crons, or manual testing sessions
- You are tempted to seed data from a read-only spec's `beforeAll`

## The One Question

> **If every cleanup job ran right now and deleted everything it is allowed
> to delete, would this test still pass?**

If the answer is no, the test is asserting over residue — data other tests
happened to leave behind. Residue is not a fixture. It drains to zero the
moment cleanup gets thorough or traffic gets quiet, and the failure lands on
whoever ships next, disguised as a product bug.

## Decision Tree

```
Does a read-only spec assert the environment contains data?
├── NO → nothing to do; per-spec create/assert/delete is fine
└── YES → Does anything GUARANTEE that data exists?
    ├── "other tests create it" → RESIDUE. Build a seed floor.
    └── Build the floor:
        ├── Where does it run?
        │   └── Global setup, AFTER the cleanup sweep, once per process.
        │       Never in the spec (keeps the read-only contract; avoids
        │       per-worker races).
        ├── How is it written?
        │   └── Upsert keyed on FIXED primary keys. Idempotent, and
        │       parallel CI shards converge on the same rows instead of
        │       inserting duplicates.
        ├── How does cleanup not eat it?
        │   └── Reserved namespace: identifiers structurally disjoint from
        │       every sweep pattern (distinct email domain / name prefix),
        │       documented at BOTH sites (seed module and each sweep).
        └── What if the app mutated it?
            └── The upsert resets mutable fields (status, assignment)
                every run. Self-healing beats protected.
```

## Core Rules

### 1. Partition the namespace; never exempt by age

Cleanup sweeps and seed identifiers must be structurally disjoint. A sweep
that matches `%@testdata.example` must never be allowed to also match the
seed domain `@seed.example` — and that contract is written down in both
places, so the next person widening a sweep pattern sees it.

Staleness thresholds ("only delete rows older than 6h") protect nothing:
seeds age past any threshold within a day. If a sweep would delete a
48-hour-old seed, the floor is broken even while today's run is green.

```typescript
// CORRECT — seed identifiers no sweep pattern can match
const SEED_LEADS = [
  { id: "5eed0001-…", fullName: "Workspace Seed Alpha",
    email: "workspace-seed-alpha@seed.example" },
];
// sweep: .like("email", "%@testdata.example")  ← disjoint by construction

// WRONG — seed relies on being "not stale yet"
// sweep: .like("email", "%@example")           ← matches seeds too
//        .lt("created_at", sixHoursAgo)        ← time bomb, not protection
```

### 2. Fixed primary keys, upserted

Random IDs turn every concurrent shard's "ensure" into an insert, and the
floor accumulates duplicates forever. Hardcoded UUIDs make the write
idempotent AND race-safe: N shards racing produce the same N rows.

```typescript
await db.from("leads").upsert(
  SEED_LEADS.map((s) => ({ ...s, orgId: TEST_ORG_ID, status: "open" })),
  { onConflict: "id" },
);
```

### 3. Reset, don't protect

Manual testing in the shared environment will close, reassign, and rename
your seeds. Don't try to prevent that — let the upsert reset the mutable
fields on every run. The floor is a state you converge to, not an object
you defend.

### 4. Seed the minimal assertion-visible shape

Know the projection your gate reads and seed exactly what makes a row
visible in it — nothing more. A bare parent row that lands in the default
view beats a rich object graph: fewer FKs for cleanup to trip over, fewer
sweeps that can reach it.

Corollary: if any sweep deletes a child table **by age with no name
filter**, seeds cannot own rows in that table at all. Design the seed shape
around the sweeps you cannot pattern-guard.

### 5. Seeding failure is loud but non-fatal

A seed error should print a warning, not abort the suite before one test
runs. If the floor is truly missing, the gate itself reports it — with an
assertion message that points at real data absence instead of a setup crash.

## Implementation Pattern

```typescript
// e2e/setup/seed-floor.ts — one module owns the floor and the namespace doc
export async function ensureSeedFloor(db: Client, orgId: string) {
  const { error } = await db.from("leads").upsert(
    SEED_LEADS.map((s) => ({ ...s, organization_id: orgId, status: "open" })),
    { onConflict: "id" },
  );
  if (error) {
    console.warn(`[E2E Seed] Failed to ensure seed floor: ${error.message}`);
    return;
  }
  console.log(`[E2E Seed] Ensured ${SEED_LEADS.length} seed row(s)`);
}

// e2e/setup/global-setup.ts — sweep first, then converge on the floor
export default async function globalSetup() {
  await sweepZombieTestData(db, orgId);
  await ensureSeedFloor(db, orgId);
}
```

## Anti-Patterns

- **Asserting over residue** — "the org always has data because other tests
  create some" is a claim about traffic, not a fixture.
- **Seeding from a read-only spec's `beforeAll`** — breaks the zero-writes
  contract that lets read-only projects run fully parallel, and races when
  workers spawn.
- **Age-based exemption** — a staleness threshold on the sweep is a delay,
  not a guarantee (Rule 1).
- **Random seed IDs** — every run and every shard inserts fresh rows;
  duplicates accumulate and other specs' `.first()` locators start matching
  them (Rule 2).
- **`test.skip(noData)`** — skipping the gate when data is missing converts
  a deploy gate into decoration. Fix the floor instead.
- **Protecting seeds with app logic** (a "do not touch" flag the UI
  respects) — now production code carries test concerns. Reset in setup
  instead (Rule 3).

## Audit Checklist

- [ ] Every read-only spec that asserts non-emptiness names the mechanism
      that guarantees the data (seed floor, not residue)
- [ ] Seed identifiers are structurally disjoint from every cleanup pattern
      (grep the sweeps for the seed domain/prefix — zero matches)
- [ ] The reserved namespace is documented in the seed module AND in each
      sweep, so widening a pattern surfaces the contract
- [ ] Seeds use fixed primary keys and an upsert (run setup twice: row
      count unchanged)
- [ ] The upsert resets every field the app can mutate
- [ ] Durability is proven the way it will fail: backdate seeds past every
      staleness threshold, run all sweeps, count rows
- [ ] No seed rows live in tables swept by age without a name filter
- [ ] Seeding failure warns and continues; the gate's own assertion reports
      genuine data absence
