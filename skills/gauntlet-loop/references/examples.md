# Eight worked loops

Each card: objective, the rule that makes it work, shape, hardest boundary, the failure it prevents. What varies most is the **metric**, because that is what people copy wrongly. Any of these written as "make it better, run the tests" would fail differently.

## 1. Harden a public contract

**Objective.** A partner engineer building against the published schema, with no source access and no conversation with us, builds a correct client first try and cannot construct a reasonable query returning wrong data, unrepresentable data, or an N+1.

**Rule.** Would this defect have been visible to a partner before it was visible to us? If yes it is P0 regardless of diff size. A real case: an enum exposed 5 values while the product wrote 11, and one row with an unlisted value blanked an entire list query. CI was green throughout.

**Shape.** Sequential, one owner. Fan out to read and audit, never to edit. Audit-before-edit is a hard gate: the full inventory goes to a human before one resolver changes.

**Hardest boundary.** Additive-only unless a human approves a break. Schema snapshot regenerated in the same commit, every time.

**Prevents.** Five agents editing one contract in parallel, producing five locally-correct, mutually-inconsistent conventions.

## 2. Make a client honest against live data

**Objective.** Every route renders correctly against real production-shaped data. No raw floats, no raw ISO timestamps in UI, no fixture identity beside real KPIs, an empty state for anything legitimately empty, a retry that retries.

**Rule.** Demonstrated effect only, screenshot from the running app. The loop's real value is that it keeps surfacing API defects: 13 rate fields shipping raw floats like `46.153846153846154` was found by pointing a real client at the real API, not by reading the schema.

**Shape.** Fan out, one builder per route. Independence here is real and worth exploiting.

**Hardest boundary.** A client-side workaround for a server-side defect is a failed round. Rounding belongs in a semantic type on the API, not in thirteen clients that will each round differently.

**Prevents.** A polished client that papers over the API problems it was supposed to expose.

## 3. Converge three implementations on one definition

**Objective.** Every metric has exactly one definition in the codebase, guarded by CI.

**Rule.** Mechanism Rule. In the session that produced it, three named root causes were wrong and each took seconds to disprove with a read-only query.

**Shape.** Strictly one owner. This is where fan-out is most tempting (three call sites, three agents) and most destructive: parallel convergence yields three subtly different "converged" definitions, the original bug plus steps.

**Hardest boundary.** No placeholder zeros. `null` where nothing was measured. A confidently wrong number reaches a board deck; a null gets escalated to a human.

**Prevents.** Distributing the wrong number more efficiently.

## 4. Activate work that is finished but dark

**Objective.** Every built surface has an observable effect. Ship the acknowledgement, the mapping table, the reverse direction.

**Rule.** Two rules, both needed. Absence Rule, because in a codebase like this "it doesn't exist" is the statement most likely to be false: two such claims were wrong in one session, each by one file (a wrapper that did render the badge, a cron that was emitting). Plus Demonstrated Effect, because "the handler is registered" is precisely the state every dark surface is already in.

**Shape.** Fan out per surface, except anything spanning two apps. A two-sided event contract split across two builders creates the next dark surface.

**Hardest boundary.** Instrumentation on what gets muted or ignored ships before anything that increases volume. Not alongside. Before.

**Prevents.** A fourth finished feature with no user.

## 5. Make something faster, measurement-gated

**Objective.** Cut wall clock from a stated measured baseline, every change justified by a before-and-after number from real logs.

**Rule.** Measurement is permission, not proof. Nothing applied before its cost is measured; nothing kept unless the number moved. This inverts the normal loop: the agent is not allowed to be helpful first.

**Shape.** Strictly phased, not parallel: measure, no-regret wins, then structural changes chosen by what the data said. Phase two cannot start without phase one's numbers in the progress file.

**Hardest boundary.** No unmeasured optimization, however obvious. Also: a moved cost must never be reported as a saved cost. Decoupling an upload relocates work; that is a memory fix, not a speedup.

**Prevents.** A large diff of confident improvements with no evidence any helped, and no way to attribute a regression.

## 6. Deploy provenance

**Objective.** What ships to production is exactly what a named commit contains.

**Rule.** Prove-it-red. Every guard demonstrated blocking a real violation, in the environment where it runs, before it is trusted. Plus the unused-path rule: a deploy path never exercised is unverified.

**Shape.** Read-only mapping of every path to production first (including the ones nobody uses, since those have no guard), then close each gap.

**Hardest boundary.** The override exists so the escape is a deliberate keystroke, never a default. Preview stays exempt where local changes are the point. Do not flag files the ignore-file already strips: a guard that fires on things that cannot ship trains everyone to reach for the override reflexively, and a guard nobody reads is worse than none.

**Prevents.** An archive upload that ships the working directory while the dashboard confidently names an unrelated commit. Real case: the first run of such a guard blocked 12 files of another session's in-flight work, one with failing tests.

## 7. Metric label truth

**Objective.** Every number on every reporting surface means what its label says, and its provenance is checkable without asking an engineer.

**Rule.** Stakeholder Rule. Write the belief a non-technical reader forms from the label, verify that belief with a query. False belief = failed label, however correct the query. Real case: a column labelled "Bookings" counted landing-page arrivals, and a director was minutes from cutting ad spend on it. Nothing was broken; the label was.

**Shape.** Inventory every label across every surface (dashboards, digests, tool payloads, API, CSVs) read-only, rank disagreements by decision cost rather than by how wrong they are, then fix.

**Hardest boundary.** Fix at the definition, not the label. Renaming is right when the number is correct and the name lies; fixing the query is right when the name described intent. Choosing rename because it is cheaper, when the number was wrong, ships the same defect with better wording. State which and why, every time.

**Prevents.** A technically-correct number under a misleading name, which no test can catch.

## 8. Route-level Storybook

**Objective.** Every route of every app viewable in Storybook, dataful, in every state that occurs in production, unable to rot.

**Rule.** The rendered-screen rule. A story that renders is not a story that shows the screen. Screenshot every story and look at it; a permanent skeleton, an error boundary, or an empty list because the fixture did not satisfy its type is a failed round even though Storybook reports it fine.

**Shape.** Inventory and feasibility read-only, then pilot the presentational boundary on the two most data-entangled routes and STOP for approval, then a single owner for the fixture layer (a shared contract), then fan out per route.

**Hardest boundary.** No production change to make a route storybookable. Converting a server component to a client component, loosening a guard, weakening a type to accept a fixture, or adding a test-only branch are behavior changes wearing test-change costumes, and every check will pass. A route that cannot be covered without one is a finding to report, not a problem to solve. That list is often the loop's most valuable output.

**Prevents.** Moving database calls to the browser in the name of test coverage.

## Reframing note

Several of these are not what they sound like. "Storybook every route" is an architecture task. "Make the API good" is an enum-and-semantic-type task. "Why is this number wrong" was a labelling task. Before writing the objective, state plainly what the work actually is; if the naive framing survives into the plan, the loop will optimize the wrong thing efficiently.
