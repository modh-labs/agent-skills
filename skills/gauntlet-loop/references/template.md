# Gauntlet Loop prompt template

Fill every bracket. An unfilled bracket is a loop with no stop condition.

```
OBJECTIVE

<The outcome as a state that becomes true, gradable by someone who did not build it.
Include the "a stranger using this could not get a wrong answer" framing where it
applies.>

<One paragraph naming what this work actually is, if the obvious reading is wrong.
Example: "storybook every route" is really "extract a presentational boundary per
route"; the stories are the byproduct. If a plan reads like <the naive framing>, it
has missed the job.>

Work in this order. Ordered by cost x irreversibility, not importance.

  0. <Cheapest thing that de-risks everything after it. Usually: verify the facts the
     plan depends on, plus tooling preflight. Read-only. Stop for approval.>
  1..N <Each item: what, and the specific known trap so it is not rediscovered.>

  <What is explicitly OUT OF SCOPE, and where it belongs instead.>

METRIC

  <THE RULE FOR THIS AREA, in caps, with the incident that produced it. Pick from the
  table in SKILL.md: Mechanism / Absence / Live-Read / Demonstrated-Effect /
  Partner-Visibility / Measurement-is-Permission / Stakeholder.>

  Executable:
    - <Full gate> green, re-run from clean each round. A green subset is not evidence.
    - <Language-specific test trap, e.g. run vitest, never `bun test`: it no-ops
      vi.mock and yields phantom passes.>
    - Never pipe a gate into tail or head; you get the pipe's exit code.
    - Tests must pass in the PARALLEL run, not just standalone.
    - Real output pasted, not described.
    - <Any guard added must be shown FAILING against a deliberate violation before it
      is shown passing.>

  Critic-judged, fresh context per part:
    - Critic gets objective + rules + the REAL artifact. Never the builder's summary.
    - Dedicated adversarial lens each round: "<the one question this loop exists to
      ask>". If the honest answer fails, the round failed regardless of code quality.
    - <Optional second lens, e.g. "did this diff change production behavior?" or
      "how much volume does this add?">
    - Every finding adversarially verified by a second fresh agent that tries to
      REFUTE it and defaults to refuted when uncertain.

  Failure-triage ladder, before editing anything:
    1. Stale tree, stale base, or cache replay?
    2. Ambient on main, predating this work? MEASURE IT.
    3. Stale assertion from an earlier migration?
    4. Real product defect?
    5. Only then: infra.
    Record which rung each failure landed on. Two consecutive rung-4s is a report.

DECOMPOSITION

  - Item 0: <read-only, sequential, gates everything>.
  - <Which items fan out, one agent per unit, because the units are independent.>
  - <Which items have ONE owner, because the artifact is coupled, and why parallel
    edits there reproduce the original bug.>
  - Progress file at <path>: current target, parts passed, FAILED APPROACHES AND WHY,
    evidence, next action, remaining budget. Plus a section recording <the claim class
    this loop keeps getting wrong> and what settled each claim.

BOUNDARIES

  Allowed: <read, edit, test, query, build, screenshot, small verified commits>.

  Requires explicit approval, every time, no generalizing one yes to the next:
    - <irreversible or outward-facing actions>
    - <beginning the edit phase of any audit>

  Stop and report:
    - <decisions that belong to a human>
    - The same failure twice without a changed strategy.
    - <ambient reds unrelated to the diff: say so, do not fix silently>

  Never: <the defect classes just eliminated>, lower a threshold not first measured,
  raise a timeout to fix a slow first test, or ship a comment describing a state that
  is no longer true.

  <If the clone is shared: explicit git add paths only, stat before and after, never
  touch another session's uncommitted files, re-read HEAD before assuming, check
  authorship and count after any rebase.>

INTEGRATION PASS

One fresh agent that built nothing: <inspect the whole result for consistency and
seams, not redesign; the specific walk-through for this domain>. Then hand over the
diff and the receipts.
```

## Sizing

Scale to the ask. "Find any bugs" is a few finders and single-vote verify. "Thoroughly audit this" is a larger finder pool, three to five vote adversarial verification, and a synthesis stage. Lean thorough for review/audit/research, brief for quick checks.

If a phase bounds coverage (top-N, sampling, no-retry), the loop must say what was dropped. Silent truncation reads as "covered everything".
