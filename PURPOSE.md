# ProForma — What This Is and Why It's Built This Way

## The One-Line Purpose

A tool that turns an engineering investment decision into a **scannable bet sheet** — one page, async-ready, that a VP or CFO can understand in 30 seconds and defend in 30 minutes.

---

## The Problem It Solves

Most engineering investment proposals fail in one of two ways:

1. **Too vague** — "This will improve performance and increase revenue." No numbers, no mechanism, no way to hold anyone accountable.
2. **Too confident** — A single projected number presented as fact, hiding the assumptions behind it. When reality diverges, trust collapses.

ProForma forces a third path: **explicit assumptions, scenario-modeled outcomes, and a cost that is locked regardless of what happens.**

---

## The Core Mental Model: The Bet

Every engineering investment is a bet. ProForma makes the terms of the bet legible:

- **What you're paying** — the cost floor. This is locked. It's not a forecast. It happens whether the bet pays off or not.
- **What has to be true** — the funnel levers. Where exactly does this tool touch the revenue chain, and by how much?
- **What you could win** — three scenario outcomes (Conservative / Mid / Optimistic), each with a payback month and a 24-month net.
- **When you'd know** — the payback month tells you when cumulative return crosses zero. That's the earliest you can meaningfully evaluate the bet.

---

## At a Glance: What the Reader Sees First

The document is designed to be scannable in a strict order. In 30 seconds a reader should absorb:

1. **Three summary cards** — Cost added (locked), Capacity freed (engineering hours returned to roadmap), Revenue upside (scenario range). The third card is focal — blue, dominant — because the upside is why you're having the conversation.
2. **Payback months** — M4–M6 range across scenarios. This is the most important number. It tells leadership how long before the bet is proven.
3. **The chart** — shaded band shows the conservative-to-optimistic range. The mid-case line shows the most likely path. The band's width communicates honest uncertainty.

Everything else in the document earns and defends those three things.

---

## The Logical Structure

### 1. Anchor (Summary Cards)
Three numbers, one dominant. Establish the cost, the freed capacity, and the revenue range before anything else. The reader orients here.

### 2. Mechanism (Conversion Funnel)
Show exactly where the tool touches the revenue chain. Not "this improves conversion" — *which* conversion rate, by how much, and what the baseline is. This is what separates a credible forecast from a guess. The funnel locks down:
- Acquisitions (locked — not a variable, it's a given)
- Trial-start rate (lever 1)
- Trial-to-paid rate (lever 2)
- Renewal rate (lever 3)

### 3. Outcome (P&L Chart, 24 months)
Net P&L over time — cumulative lift minus cumulative cost — across all three scenarios simultaneously. The shaded band between conservative and optimistic forces the reader to see the range, not a point estimate. The breakeven dot names the payback month on the chart itself.

### 4. Scenario Comparison (Three Positions)
Conservative / Mid / Optimistic side-by-side. Each shows payback month, M24 net, and the specific rate assumptions that produce it. Explicit about what has to be true for each outcome.

### 5. Cost Detail (Position Section)
The cost in detail — year 1 vs. year 2, and what specifically the money buys or retires. The + and × symbols distinguish "new capability added" from "old cost removed." This section is honest about the price and what it does.

### 6. Execution (Phases)
Three implementation phases with windows and names. This answers: "How would we actually do this?" It adds credibility and shows the cost is grounded in a real plan, not a guess.

### 7. Methodology (Footer Notes)
Where the numbers come from. Internal data sources, RC case studies, rate assumptions. This is the room that skeptical readers go to first — it should be legible, not buried.

---

## What This Is Not

- **Not a financial model** — the cost is locked (not derived from a spreadsheet), and revenue is explicitly scenario-modeled, not projected as a single number
- **Not a project plan** — the execution section shows phases, not tickets or milestones
- **Not a pitch deck** — no slides, no builds, no presenter required. It must work asynchronously
- **Not a dashboard** — it's a decision document for a specific moment in time, not an ongoing tracking view

---

## The One Thing It Has to Do

A reader who has never seen this document before should be able to answer four questions in under two minutes:

1. What does this cost, no matter what?
2. What is the revenue mechanism — how exactly does this tool affect the funnel?
3. What's the range of outcomes, and when do we break even in each?
4. What decision needs to be made, and what are we asking for?

If the one-pager can't answer all four without a verbal walkthrough, it has failed.

---

## Design Principles for the Tool Itself (the Workshop)

The workshop that builds the one-pager follows the same logic:

- **Left panel** — inputs. Everything the author controls: costs, labor, rate assumptions. Sliders show the marginal dollar impact of each lever so the author understands what they're betting on.
- **Center panel** — the bet sheet in real time. How the data assembles into the argument. The author sees the document forming as they move inputs.
- **Right panel** — live preview. The exact artifact the reader will receive, at minimap scale. Style and layout are switchable here so the author can match the doc to the audience.

The workshop should feel like authoring a document you're proud to send, not filling out a form.
