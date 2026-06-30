# Positioning, what the client is actually paying for

The honest tension: wiring Linear + Claude is a commodity. A sharp 20-year-old can install Linear's
native AI, assign Cursor, and paste in a few prompts. If that's the offer, you lose on price. So that
is **not** the offer.

## The reframe

> A generalist ships you a **configured tool**. You ship a **running EPD operation built to a standard
> you've personally operated at scale**, and the guardrails of someone who's shipped through
> billion-dollar scale, so the agents never do the thing that costs a customer or mishandles a SEV1.

The agents are the same for everyone (Linear's AI, Claude). The differentiator is the **rubrics,
guardrails, and SOPs they run on**, what they should do, what they must *never* do, and what "good"
looks like. That layer isn't downloadable. It's earned, and it's where the money is.

## Where the commodity ends and the value begins

| Layer | Who can do it | Defensible? |
|---|---|---|
| Turn on Linear Agent, install Cursor/Sentry, paste guidance | Any competent generalist | ❌ commodity |
| Decide the triage severity rubric that holds at 10x volume | Someone who ran it at scale | ✅ |
| Decide which actions must *never* be autonomous (and why) | Someone who's seen the cost of getting it wrong | ✅ |
| Run an incident to a top-tier standard and write the blameless postmortem | Someone who's done incident command | ✅ |
| Set a spec/PRD bar the agents draft to | Someone who's shipped award-winning product | ✅ |
| Make the board legible enough to survive diligence | Someone who's been through acquisitions | ✅ |

Everything in the right column is the operating judgment that the generalist doesn't have, and it's
exactly what's encoded in the [SOP library](sop-library.md) and the [guardrails](../references/guardrails.md).

## Experience → encoded value (your moat, made specific)

Fill the `[brackets]` with your verifiable specifics (products, awards, deal names) before using this
externally.

| Your experience | The judgment it encodes | Where it shows up in the offer |
|---|---|---|
| **Shopify**, hypergrowth B2C, merchant-grade reliability | What breaks at 10x; triage that doesn't rot at volume; severity discipline | Triage SOP; scaling guardrails |
| **Brex**, fintech B2B, money-movement, compliance | Least-privilege by reflex; the "never automate this" list; audit posture | Guardrail/autonomy SOP; vendor security review |
| **Billion-dollar acquisitions**, lived through diligence | Process hygiene that survives DD; exec-legible reporting | Status-rollup SOP; board-hygiene standard |
| **Best-in-class CS + incident management** | The customer-ask→resolution loop; SLAs; SEV levels; blameless postmortems | Customer-request SOP; Incident SOP |
| **Product dev, award-winning B2B & B2C apps** [name them] | The acceptance-criteria bar; what to build vs cut | Spec-quality SOP; roadmap hygiene |

## Objection handling ("why not the cheap generalist?")

- **"They can set it up too."** Setup is day one. You're buying the operating standard over the next 12
  months, and the judgment for the moment an agent *shouldn't* act. The generalist's agents will
  cheerfully auto-close a SEV1 or draft a wrong reply to your biggest customer. Mine won't, because the
  guardrails were written by someone who's paid for that mistake elsewhere.
- **"It's just prompts and guardrails."** Correct, and the guardrails *are* the product. A bad
  autonomy decision is a customer-facing incident. That decision is where 15 years of not-doing-that
  lives.
- **"Claude can write the SOPs."** Claude can draft them. It can't know that *this* action must never be
  autonomous for *your* business, or which severity threshold actually matters to your customers,
  without someone who has run it. I bring the priors; the agents bring the scale.

## The one line for the sales page

> You're not buying a Linear setup. You're buying the way a Shopify- and Brex-grade EPD org runs,
> encoded into agents that run it for you 24/7, with the guardrails of someone who's shipped through
> billion-dollar scale so your agents never do the thing that costs you a customer or a SEV1.
