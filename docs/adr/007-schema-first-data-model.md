# ADR-007: Schema-First Data Model — No Derived State Stored

**Status:** Accepted  
**Date:** 2026-05-14

## Context

Business case documents have two categories of data:

1. **Inputs** — things the author sets: labor hours, conversion rates, scenario deltas, prose content, theme/layout choice.
2. **Outputs** — things computed from inputs: payback month, M24 net revenue, FTE savings, chart points.

A naive implementation stores both. This creates consistency risks: stored outputs can drift from stored inputs when formulas change, and migrating saved projects means re-running or re-validating derived values.

## Decision

`ProFormaProject` (defined in `src/schema.ts`) stores **only inputs**. Every computed value lives in `ComputedOutputs`, which is derived entirely by `compute(project)` and never persisted.

The store exposes two values:
- `project` — writable, persisted to localStorage, contains only inputs.
- `computed` — Svelte derived store, recomputed on every `project` change, never stored.

Blocks receive both as props and render from them, but they never call compute themselves.

Additionally, `ProFormaProject` uses an **extensible array model** for capabilities that might grow:
- `laborTypes[]` + `laborComponents[]` — adding a new labor category (e.g., "Marketing") requires no code changes to compute or UI.
- `scenarios[]` — adding a fourth scenario requires only a new array entry.
- `locked[]` — named locked inputs (acquisition volume, pricing) are an array, not a fixed set of properties.

ID migration in `store.ts` handles capability renames (theme/layout IDs stored in `compose.style` and `compose.layout`) so old projects load gracefully after a refactor.

## Consequences

**Positive:**
- Saved projects never contain stale computed data — reloading always runs fresh math against the stored inputs.
- Formula changes are automatically reflected on next load with no migration needed.
- The schema is the single source of truth for what an author can configure. Adding a new input means adding it to `ProFormaProject`; the store, persistence, and import/export automatically include it.
- `compute` is a pure function of `ProFormaProject` — no hidden state, no surprise recompute triggers.

**Negative:**
- The schema currently mixes generic model fields (labor arrays, baseline rates) with template-specific fields (the RC-specific `locked` IDs like `'rcDiscountY1'`). These hardcoded lookups in `compute/index.ts` are a coupling smell that would need to be addressed if ProForma were generalized for non-subscription business models.
- `ProjectContent` uses fixed-length tuples (e.g., `cards: [SummaryCardContent, SummaryCardContent, SummaryCardContent]`) for content that is unlikely to need more than 3 items. This is a pragmatic constraint, not a modeled decision — changing the count later would require a schema migration.
