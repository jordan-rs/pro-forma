# ADR-004: Pure Compute Layer Shared Between Workshop and Export

**Status:** Accepted  
**Date:** 2026-05-14

## Context

ProForma has two rendering contexts that need the same financial math:

1. **Workshop (live):** Svelte reactive store, sliders update in real time, `computed` store re-derives on every project change.
2. **Export (static):** `generateOnePager.ts` serializes a snapshot of the project into a static HTML string. Numbers in the output must match what the author saw in the workshop.

The risk with two rendering paths is drift: if the exporter uses a different formula for payback month than the workshop, the exported document shows different numbers than what the author approved.

## Decision

All financial computation lives in `src/compute/index.ts` as a single pure function:

```ts
export function compute(project: ProFormaProject): ComputedOutputs
```

- It takes only `ProFormaProject` as input.
- It returns only `ComputedOutputs` — never mutates state, never reads from stores.
- No Svelte reactivity, no DOM, no side effects.

Both the workshop (`store.ts` derived store) and the exporter (`generateOnePager.ts`) call this same function. There is one formula.

Formatting helpers (`fmtMoneyS`, `fmtCount`, `fmtPP`) are also exported from `compute/index.ts` and used in both contexts for the same reason.

## Consequences

**Positive:**
- Workshop and export are arithmetically identical by construction — not by testing.
- The compute layer is trivially testable (pure function, no mocks needed).
- New financial logic added to the compute layer is immediately available in both workshop and export without any wiring.
- The cost model structure (Y1/Y2 labor bend, quadratic ramp, payback search) is documented inline alongside the code rather than split across files.

**Negative:**
- The compute function takes the full `ProFormaProject` and returns the full `ComputedOutputs` — there is no incremental or partial recompute. For the current scale (milliseconds per run) this is irrelevant, but would need revisiting if the schema grew to thousands of rows.
- `compute/index.ts` currently encodes RC-specific assumptions (hardcoded labor bend percentages of 0% Y1 / 50% Y2, and specific `locked` field IDs like `'rcDiscountY1'`). These are template content, not generic model parameters — future generalization would need to move them to the schema.
