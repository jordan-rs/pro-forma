# ADR-002: Svelte 5 + Vite as the Workshop Framework

**Status:** Accepted  
**Date:** 2026-05-14

## Context

ProForma's workshop is a live authoring environment: sliders update numbers in real time, content fields update the preview instantly, and theme/layout changes re-render without a page load. The framework needs to handle reactive derived state (computed financials from slider values) and produce a build artifact (the one-pager HTML) that contains no framework runtime.

Options considered:

| Option | Tradeoff |
|---|---|
| Vanilla JS + DOM manipulation | Manageable for a small fixed feature set; becomes painful as panels, blocks, and themes grow. No reactivity primitives — all derived state wired by hand. |
| React | Mature ecosystem, but heavier runtime, Context API boilerplate for shared state, and JSX overhead. The output HTML would embed a React bundle or require SSG. |
| Vue 3 | Comparable to Svelte in reactivity and bundle size. Less ergonomic for the compile-to-vanilla-HTML output story. |
| **Svelte 5 (runes)** | Compiles to vanilla JS — no framework runtime in the output. Runes syntax (`$state`, `$derived`, `$props`) gives fine-grained reactivity with less boilerplate than hooks. Excellent fit for the token-driven CSS theme system. |

## Decision

Use Svelte 5 with the runes API (`$state`, `$derived`, `$props`, `$effect`) throughout the workshop. Vite is the build tool, with `@sveltejs/vite-plugin-svelte` for Svelte compilation.

Reactivity flows:
- `project` (writable Svelte store) → source of truth for all user edits.
- `computed` (derived store) → `compute(project)` runs on every project change, producing `ComputedOutputs`.
- Blocks receive both `project` fields and `computed` outputs as props; they never compute directly.

## Consequences

**Positive:**
- No framework runtime in the exported HTML — the one-pager is clean vanilla JS/CSS.
- Runes are a natural fit for the store → derived → UI pattern without Context or Provider boilerplate.
- Component-per-block structure maps cleanly to the block registry pattern (see ADR-005).
- Hot module replacement during dev makes theme/layout iteration fast.

**Negative:**
- Svelte 5 runes were in RC/early release at project start — some API surface was not yet stable.
- Smaller ecosystem than React: fewer ready-made components, less StackOverflow coverage.
- `svelte-check` is the only type-checker; it runs separately from `tsc` and must be remembered in CI.
- Export rendering (via `generateOnePager.ts`) does not use Svelte's SSR — it hand-templates HTML strings, which means block rendering logic is duplicated between `.svelte` files and the exporter.
