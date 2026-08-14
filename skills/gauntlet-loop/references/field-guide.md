# Field guide: why each rule exists

Rationale behind the rules in SKILL.md. Every entry comes from a real session that failed without it. Incidents are described by shape rather than by client so they generalize.

## The central hazard: a green that means nothing

A loop trusts its verifier. So the verifier is where to look first. Known ways to get a pass that proves nothing:

- **A test runner that no-ops mocks.** `bun test` silently ignores `vi.mock`, so mocked suites produce phantom passes. Run the framework the tests were written for.
- **A pipe swallowing the exit code.** `<gate> | tail` reports `tail`'s success. A red CI was read as green twice this way.
- **A branch diff that is empty.** Pushing straight to main empties `origin/main...HEAD`, so any guard scoped to the diff passes over nothing.
- **A workflow that is not a required check.** A merge can be green in the UI and red in the workflow.
- **A cache hit replaying logs.** A cacheable task replayed its output and skipped a codegen step entirely. Indistinguishable from a pass.
- **A workflow that has never run.** One waited on an event its projects never emit. Another referenced a variable that did not exist, so its assertion would have failed even with secrets present.
- **Passing standalone but not in parallel.** Two tests passed alone and died at exactly 5000ms under load, both the first test in their file paying an import cost. The assertions never ran. Warm expensive setup in `beforeAll` with its own budget; do not raise the global timeout.

## A green subset is not evidence

One session went from failing at step 1 to passing 42 of 43, and each fix made the next failure visible: stale schema snapshot, then a doc-reference checker bug, then typecheck, then formatting, then a copy-rule violation, then a second snapshot, then test timeouts, then a dependency resolution bug. Stopping at "the thing I was sent to fix is green" would have reported done eight separate times.

Re-run the whole gate from clean, every round. It is expensive and it is the only thing that catches this shape.

## Measure before accepting blame

A coverage gate failed and looked like a regression. It had been failing before any work started. The correct response was to write the missing tests; the easier response, lowering the bar, was available and wrong. Pre-push and CI gates also produce ambient reds unrelated to a given diff. Confirm whether a failure predates the work before fixing it, and never lower a threshold not first measured.

## Config that looks load-bearing and isn't

Six tests failed with `Cannot read properties of null (reading 'useState')`, thrown from inside `node_modules` with nothing in the trace naming a cause. It read exactly like ambient flake. The real cause: two copies of the framework in one render, because a package declaring it as a peer was externalized and therefore resolved outside the bundler, where the dedupe setting never applied. The dedupe entry looked like protection while covering nothing.

The first fix was an alias pin. It passed. Removing the alias also passed: it had been a no-op riding along with the real fix. Delete config you cannot prove is doing work. A line that appears necessary and isn't is how the next person concludes the wrong thing.

## Files that are read as data

Several files are parsed, not read: schema snapshots used as gates, migration journals that decide whether production runs a migration at all, a doc-reference checker running a ratchet that tightens when a reference is fixed, and in one case a markdown table whose left column doubled as an architecture-boundary allowlist. Editing that table broke four checks. Grep for whatever parses a file before editing it, and put corrections where the parser is not looking.

## Requests versus grants

A manifest scope is a request. An env var in a config file is an interpolation that may resolve to nothing. A workflow trigger may be unable to fire. Before building on any of them, confirm the installed, deployed, running thing actually holds it. Two examples worth internalizing: an app held `reactions:read` and ran a full reaction pipeline that only wrote a log line, and subscribed to a link-shared event without holding the write scope needed to act on it, so it received a stream it discarded.

## Done means observable

Three finished surfaces in one app had no user: one gated off by env, one that resolved an event all the way back to its subject and then logged, one live while its own comment claimed no scheduler emitted it. All three would pass any code review. The passing condition has to be a user-visible effect in a real environment, or a loop rewarded for "implemented" will add a fourth.

## Absence claims are the ones that are wrong

In one session two claims that something did not exist were both false, each by exactly one level of indirection: a component that "did not render a badge" was a thin wrapper around one that did, and a comment saying "no cron emits these yet" was contradicted by two live schedulers. In a codebase with much built-but-dark surface area, "it doesn't exist" is the statement most likely to be false, so it is the one the critic should attack hardest.

## Mechanisms are cheap to invent

An approved plan named the wrong root cause three times. One read-only query settled each in seconds. Two plan items dissolved entirely, and a third claim had already been reported upward as fact before anyone checked. In another investigation, two theories about an attribution discrepancy were both refuted by a single query each.

The rule that follows is specific: the query must precede the belief. Requiring it afterwards produces retroactive justification, which is the failure itself.

When a fix works and the mechanism is unknown, say "mechanism unconfirmed" in those words. Do not upgrade an unexplained fix to an explained one.

## Concurrency, when the clone is shared

Sessions collide in both directions. Observed in one arc: the pre-push gate red on another session's test file, a deploy that would have shipped 12 of their uncommitted files (because an archive upload sends the working directory while the platform records a commit SHA with no enforced relationship to it), and a rebase that carried one of their commits up alongside two of ours. That last one passed every gate and did no harm, and nothing distinguished it because the git identity was the same.

Standing rules: explicit `git add` paths only, `git diff --cached --stat` before and `git show --stat HEAD` after, never format or lint-fix another session's uncommitted files even to get a gate green, re-read HEAD before assuming the branch has not moved, and after any rebase check authorship and count before pushing. Bypassing a pre-push gate is acceptable only for a red on foreign uncommitted work, only while naming the files, and never past a schema-integrity check.

## Preflight: tools before work

An unverified tool is a claim generator. A loop that starts without database credentials will spend three rounds diagnosing a drift check as a code problem.

Before a long session: resolve environment variables, run the full gate once, confirm CLI auth for anything the loop will read truth from, and make one real call per MCP server you intend to rely on. Two recurring traps: env interpolation in an MCP config happens in the launching shell, so a non-interactive or scheduled session may load a server that fails on every call; and OAuth-backed servers need one interactive authorization that a headless session cannot perform. A server that appears in the list but has never returned a result is not available, it is unverified.

## Anti-patterns

**Coverage pressure on a bounded surface.** A loop rewarded for answering more questions will widen a measure-by-dimension matrix until some pair returns a plausible wrong number. Cap it and make additions an approval. A refusal gets escalated to a human; a wrong answer gets put in a board deck.

**Resolving what should be reported.** When an item needs a human decision, scope it read-only with an explicit stop. Any completion drive resolves rather than reports.

**Volume before instrumentation.** For anything adding notifications or alerts, instrument what gets muted or ignored first. Otherwise the first evidence of over-notifying is a churned customer.

**Wrapping discrete actions in a loop.** Two verifiable one-shot actions do not need a critic. Doing them is faster than governing them.

**Letting the builder grade itself.** Cheapest rule in the whole method, catches the most.

## Further reading

- Matt Shumer, "How to Run a Gauntlet Loop", and the Claude of Duty repository. The honest assessment is the most useful part: every blind comparison still preferred the reference artifact. The valuable output was the process, not the artifact.
- Addy Osmani, "Loop Engineering".
- ReAct (Yao et al.), the research formalization of reason-then-act cycles.
