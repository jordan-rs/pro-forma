# ADR-003: Token-Driven CSS Theme System with a Contract Layer

**Status:** Accepted  
**Date:** 2026-05-14

## Context

The original hardcoded HTML files used ad hoc inline styles and one-off class overrides per document. Porting that to a multi-theme system required a clear model for how themes share base behavior while diverging on visual expression.

Two naive approaches were ruled out early:

- **Per-theme full stylesheets:** Each theme re-implements all component styles. Works for 2 themes, becomes a maintenance disaster at 8+. Any layout change touches every theme file.
- **Selector overrides per theme:** Theme CSS files contain selectors like `.style-brutalist .card { border: 3px solid; }`. Components can diverge arbitrarily; no contract enforces consistency. Hard to audit.

## Decision

Use a three-layer CSS architecture:

1. **`_contract.css`** — Defines the complete set of CSS custom properties (tokens) that every theme must provide. Includes safe `:root` defaults. Is the single source of truth for what tokens exist. Documents intent and constraints inline (e.g., WCAG contrast minimums, semantic color rules).

2. **`_base.css`** — Styles every block component using **only tokens** from the contract. No hardcoded colors, no hardcoded type sizes. This layer is theme-agnostic; it defines shape, not skin.

3. **Individual theme files (`clean.css`, `terminal.css`, etc.)** — Approximately 50 lines each. Only override token values inside a single `.style-<name>` class. No selectors targeting component internals. The contract is the only API surface themes touch.

Workshop chrome (editor panels, sidebar, top bar) uses a **separate `--workshop-*` token namespace** in `_workshop.css`. The workshop stays dark/neutral regardless of the preview theme selected.

## Consequences

**Positive:**
- Adding a theme is ~50 lines with no component changes — copy a theme file, override tokens, add a registry entry and an `@import`.
- Removing a theme is safe: delete file, remove import, add a migration entry in `store.ts`.
- All component styling lives in `_base.css` — changing block layout or typography is a single-file edit that applies to all themes immediately.
- The contract documents design constraints (WCAG ratios, semantic meaning of color roles) inline where they're enforced.

**Negative:**
- Themes cannot express personality through component *shape* — only through color, typography, spacing, and radius tokens. Structural divergence (e.g., brutalist chart with no container vs. clean chart in a raised card) is not supported by token overrides alone.
- Chart components were identified as an exception: color tokens alone don't fully express chart personality (stroke weight, grid style, dot shape). A future "chart personality token" extension (Path B in `_contract.css`) is documented but not yet implemented.
- All theme fonts must be loaded globally in the export's `<link>` tag — unused themes still fetch fonts.
