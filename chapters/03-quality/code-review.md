---
title: "Code Review"
subtitle: "AI-assisted reviews that teach, not just gatekeep -- seven dimensions, three severities, zero ambiguity"
chapter: 10
section: "Quality"
seo_title: "AI-Assisted Code Review Methodology — Seven Dimensions, Educational Feedback — 2026"
seo_description: "A structured code review methodology with 7 review dimensions, severity classification, and educational feedback format. Implement AI-assisted reviews that teach engineers while catching real bugs."
keywords: ["code review", "AI code review", "review automation", "code quality", "pull request review", "review methodology", "engineering standards"]
reading_time: "14 min"
difficulty: "intermediate"
tech_stack: ["TypeScript", "Next.js", "Any"]
business_case: "Inconsistent code reviews are the hidden tax on engineering velocity. Structured AI-assisted reviews enforce standards automatically, onboard new engineers through educational feedback, and free senior developers from repetitive gatekeeping -- all while catching more bugs than manual reviews alone."
---

# Code Review

Most code reviews are theater.

A senior engineer skims the diff, writes "looks good" or "needs changes," and moves on. When they do leave feedback, it sounds like this: "This violates best practices." No explanation of which practice. No context on why it matters. No guidance on how to fix it. The junior engineer guesses, pushes a new commit, and waits another day for another round of vague feedback.

Meanwhile, the real bugs -- the missing error boundary, the PII leaking into logs, the race condition hiding behind a happy-path test -- sail through unnoticed because the reviewer was focused on variable naming.

This chapter lays out a code review methodology that fixes both problems: it catches the bugs that matter, and it teaches engineers why they matter.

## The Seven Dimensions

A useful code review examines more than "does this code look clean." It evaluates the change across seven dimensions that map to real production risks.

### 1. Observability

Can you tell what this code is doing in production? Not in a debugger. Not by reading the source. In production, at 3 AM, when something is wrong.

**What to check:**
- Structured logging (module-level loggers, not `console.log`)
- Error tracking with domain-specific context
- Request tracing through async boundaries
- Meaningful error messages that include enough context to diagnose without reproducing

```typescript
// Bad: invisible in production
try {
  await processPayment(order);
} catch (error) {
  console.error(error);
  throw error;
}

// Good: diagnosable in production
try {
  await processPayment(order);
} catch (error) {
  logger.error("Payment processing failed", {
    orderId: order.id,
    amount: order.totalCents,
    paymentMethod: order.paymentMethod,
    error: error instanceof Error ? error.message : String(error),
  });
  capturePaymentError(error, { orderId: order.id });
  throw error;
}
```

### 2. Testing

Does the test suite actually prove this code works? Or does it just prove the mocks were set up correctly?

**What to check:**
- Tests exist for the critical path (not just the happy path)
- Edge cases covered: empty inputs, null values, boundary conditions
- Error paths tested: what happens when the database is down? When auth fails?
- Tests mock at boundaries (external APIs, database), not internals
- No tests that just verify mock call counts without asserting behavior

### 3. SOLID Architecture

Is the code organized so that future changes are cheap? This is not about purity. It is about whether the next person who touches this file has to understand the entire system or just their piece.

**What to check:**
- Single Responsibility: one reason to change per file
- Open/Closed: can you add behavior without modifying existing code?
- Dependency Inversion: actions call services, services call repositories, repositories call the database -- never skip layers
- No god files (>500 lines doing unrelated things)

### 4. Type Safety

Types are the cheapest bug prevention tool you have. Every `as any` is a decision to skip the safety net.

**What to check:**
- No `as any` or `@ts-expect-error` without a comment explaining why
- No `@ts-nocheck` files
- Return types on public functions (not just inferred)
- Generics used where the same function handles multiple types
- Zod schemas at input boundaries (API routes, form submissions, webhook payloads)

```typescript
// Bad: types are lying
const user = data as any;
const name = user.name; // runtime bomb

// Good: types are enforced
const parsed = UserSchema.safeParse(data);
if (!parsed.success) {
  return { error: "Invalid user data", details: parsed.error.flatten() };
}
const { name } = parsed.data; // guaranteed to exist
```

### 5. Security and PII

Security reviews are not just for the security team. Every engineer who writes code that touches user data is on the security team.

**What to check:**
- No PII (emails, phone numbers, names) in log messages, error tags, or analytics events
- Input validation before any database operations
- Authorization checked (not just authentication -- does this user have access to this resource?)
- No secrets in client-side code
- Webhook handlers verify signatures before processing

### 6. Business Logic

This is the dimension most reviews skip entirely. Clean, well-typed, well-tested code that implements the wrong behavior is worse than messy code that works.

**What to check:**
- Does the code actually do what the ticket describes?
- Are edge cases handled? (empty lists, zero amounts, concurrent modifications)
- State transitions are valid (can't go from "cancelled" to "active")
- Financial calculations use integer cents, not floating point
- Side effects (emails, webhooks, cache invalidation) fire at the right time

### 7. Clean Code

This is where most reviews start. It should be where they end -- after the other six dimensions are covered.

**What to check:**
- Meaningful variable and function names
- No magic numbers or strings (use constants)
- Functions do one thing
- No deeply nested conditionals (early returns instead)
- Dead code removed (commented-out blocks, unused imports)

## The Educational Review Format

Here is the single most important idea in this chapter: **review feedback that does not teach is wasted feedback.**

"This violates the single responsibility principle" is useless. The engineer either already knows SRP (in which case, they disagree with your application of it) or they do not (in which case, they cannot fix it without Googling). Either way, the feedback created friction without creating understanding.

Every review finding should follow three parts:

### What

State the specific issue. Not a principle. Not a category. The actual thing that is wrong, with a line reference.

### Why It Matters

Explain the real-world consequence. Not "best practices say so." What breaks? What gets harder? What risk are we accepting?

### How to Fix

Show the concrete change. A code snippet, a pattern reference, a link to a similar fix in the codebase. Remove all ambiguity about what "good" looks like.

### Example

Here is the difference between useless and useful review feedback:

**Useless:**
> "This function is too long and violates SRP."

**Useful:**
> **What:** `processOrder()` handles validation, payment processing, inventory updates, and email notifications in a single 200-line function.
>
> **Why it matters:** When the payment provider changes their API, you will have to modify a function that also handles inventory -- risking unrelated breakage. The function is also impossible to unit test without mocking four external systems simultaneously.
>
> **How to fix:** Extract into focused functions: `validateOrder()`, `chargePayment()`, `updateInventory()`, `sendConfirmation()`. The parent function becomes an orchestrator that calls each step in sequence. Each extracted function can be tested independently.

The educational format takes more effort to write. But it has a compounding return: the engineer who receives this feedback does not make the same mistake in the next PR. Over time, the number of review findings decreases because the team's baseline quality increases. That is the point -- reviews should be making themselves unnecessary.

## Severity Classification

Not all findings are equal. A missing error boundary on a payment handler is not the same as an inconsistent variable name. Treating them the same creates two failure modes: either everything is a blocker (and reviews take forever) or nothing is a blocker (and real issues get ignored).

Three severity levels:

### Critical (Auto-Fail)

These block the PR. No exceptions, no "we will fix it later." These are the findings where shipping the code as-is creates immediate risk.

- Security vulnerabilities (SQL injection, XSS, missing auth checks)
- PII leaked into logs, error tracking, or client-side code
- Data loss risk (missing transactions, no rollback on failure)
- Missing input validation on public-facing endpoints
- Broken error handling that silently swallows failures
- Financial calculation errors

### Important (Should Fix)

These should be fixed before merge in most cases. A tech lead might approve with these outstanding if there is a tracked follow-up, but the default answer is "fix it now."

- Missing tests for critical paths
- Observability gaps (no logging, no error tracking)
- SOLID violations that will make the next change expensive
- Type safety holes (`as any` without justification)
- Missing cache invalidation after mutations
- Inconsistent patterns (doing the same thing differently than the rest of the codebase)

### Advisory (Suggestions)

These are optional improvements. Good ideas, not blockers. The author can accept or reject them without further discussion.

- Code style preferences beyond what the linter enforces
- Alternative approaches that are roughly equivalent
- Performance optimizations for non-critical paths
- Documentation suggestions
- Naming improvements

## The Verdict System

Every review should end with a clear verdict. Not "mostly looks good but..." -- an unambiguous signal that tells the author exactly what to do next.

### APPROVED

The code is ready to merge. There may be advisory suggestions, but nothing that needs to change before shipping. The reviewer has verified all seven dimensions and is confident the change is production-ready.

### CHANGES REQUESTED

The review found Critical or Important issues that must be addressed. The findings are listed with the educational format (What / Why / How), so the author can fix them without a follow-up conversation. Once addressed, the author requests re-review.

### NEEDS DISCUSSION

The review surfaced architectural questions or trade-offs that cannot be resolved in a comment thread. This is not a soft rejection -- it is a signal that the team needs to align on approach before more code is written. Common triggers:

- The implementation approach conflicts with an existing pattern
- The change has implications for other teams or systems
- There are multiple valid approaches and the trade-offs are not obvious
- The scope of the change suggests the ticket needs re-scoping

## Making It Automatic

The methodology above works for manual reviews. But the real power comes from encoding it into automated tooling -- specifically, AI agent skills that run the review on every PR.

### The Skill Structure

An AI code review skill needs four components:

1. **Dimension checklist** -- The seven dimensions as a structured prompt. Each dimension includes what to check, common mistakes to look for, and examples of good vs. bad patterns.

2. **Severity classifier** -- Rules that map findings to Critical, Important, or Advisory. This prevents the AI from treating everything as equally severe.

3. **Educational output template** -- Forces every finding into the What/Why/How format. No finding is valid without all three parts.

4. **Verdict logic** -- Determines the final verdict based on the highest-severity finding: any Critical = CHANGES REQUESTED, only Advisory = APPROVED, Important findings = reviewer judgment.

### Example Skill Definition

```yaml
name: code-review
description: >
  Review code changes across seven quality dimensions
  with educational feedback and severity classification.

dimensions:
  - observability
  - testing
  - solid-architecture
  - type-safety
  - security-pii
  - business-logic
  - clean-code

severity_levels:
  critical:
    verdict: CHANGES_REQUESTED
    examples:
      - "Missing auth check on mutation endpoint"
      - "PII in error tracking tags"
      - "No input validation on webhook handler"
  important:
    verdict: REVIEWER_JUDGMENT
    examples:
      - "No tests for error path"
      - "as any without justification"
      - "Missing structured logging"
  advisory:
    verdict: APPROVED
    examples:
      - "Consider extracting to a utility function"
      - "This constant could have a more descriptive name"

output_format:
  per_finding:
    - what: "Specific issue with file and line reference"
    - why: "Real-world consequence"
    - how: "Concrete fix with code example"
  summary:
    - metrics: "Files reviewed, findings by severity"
    - verdict: "APPROVED | CHANGES_REQUESTED | NEEDS_DISCUSSION"
```

### Calibrating the Skill

The first version of any automated review will be too noisy. That is normal. Calibration follows a predictable pattern:

1. **Start strict.** It is easier to relax rules than to add them later. Let the skill flag everything it sees.

2. **Track false positives.** When the team overrides a finding, record why. After 10-20 reviews, patterns emerge: "it always flags X, and X is never a real issue."

3. **Add exceptions.** Encode the team's judgment into the skill. If test files do not need structured logging, exclude them. If generated types use `any`, whitelist the file.

4. **Review the reviewer.** Every month, sample 5 reviews and check: did the skill catch what a senior engineer would catch? Did it miss anything? Did it flag things that do not matter?

The goal is not perfection on day one. The goal is a system that gets smarter every sprint.

### Integrating with CI

The review skill is most powerful when it runs automatically on every pull request. The implementation depends on your CI system, but the pattern is the same:

1. PR is opened or updated
2. CI triggers the review skill with the diff as input
3. The skill analyzes changes across all seven dimensions
4. A summary review with the verdict is posted as the review body
5. Each Critical and Important finding is posted as an **inline comment on the exact line** that needs to change -- not as threaded replies, but as line-pinned comments visible directly in the diff view
6. Advisory findings are summarized in the review body only (to avoid cluttering the diff with non-blocking suggestions)

The key design decision: **the AI review is advisory, not blocking.** It posts findings and a verdict, but a human reviewer makes the final merge decision. This keeps the team in control while ensuring every PR gets a thorough, consistent review -- even when the senior engineers are busy.

## The Business Case

### Quality Gates Scale with the Team

Manual code review does not scale. When you have 3 engineers, the senior reviews everything. When you have 10, reviews become a bottleneck. When you have 30, reviews become superficial because the bottleneck is unbearable.

Automated reviews with the seven-dimension framework ensure every PR gets the same thorough analysis, whether the team is 3 people or 300. The senior engineers shift from gatekeeping to mentoring -- they review the AI's findings and add context, instead of scanning every line themselves.

### Consistency Beats Brilliance

The best code review you have ever received is not the standard. The average review is the standard. And in most teams, the average review is a skim, a "looks good," and a merge.

A structured review -- even an imperfect one -- beats a brilliant review that only happens when the right person is available. When every PR is evaluated against the same seven dimensions with the same severity classifications, the codebase converges toward consistency. That consistency is what makes the codebase maintainable at scale.

### Onboarding Accelerator

New engineers learn more from review feedback than from documentation. But only if the feedback teaches. The educational format -- What/Why/How -- turns every review into a micro-lesson. After 10 PRs, the new engineer has absorbed the team's patterns, conventions, and reasoning. They start producing code that passes review on the first try.

Compare this to the alternative: vague feedback, guesswork fixes, multiple review rounds, and an engineer who still does not understand why things are done a certain way three months in.

### The Math

A senior engineer spending 30 minutes per PR review, across 5 PRs per day, is 2.5 hours of review time daily. That is 31% of their productive day spent gatekeeping.

An AI-assisted review handles the first pass in under 2 minutes. The senior engineer spends 5 minutes reviewing the AI's findings, adding context where needed, and making the merge decision. Total: 25 minutes instead of 2.5 hours. That is 2 hours per day returned to building.

Multiply by a team of 5 senior engineers and you have recovered 50 engineering hours per week -- more than a full-time engineer's worth of capacity, redirected from gatekeeping to building.

## Try It

```bash
npx modh-playbook init code-review
```
