# ADR-005: Registry Pattern for Blocks, Themes, and Layouts

**Status:** Accepted  
**Date:** 2026-05-14

## Context

ProForma has three extensible capability dimensions:

- **Blocks** — the content sections that appear in a one-pager (Header, Chart, Scenarios, etc.)
- **Themes** — visual styles (clean, terminal, brutalist, etc.)
- **Layouts** — structural arrangements of blocks (stack, hero-grid, magazine, briefing)

Without a registry, adding a new block would require editing: the block component, the composer UI, the preview renderer, the export generator, and any type that enumerates valid block IDs. Same for themes and layouts.

## Decision

Each capability dimension has a registry file:

- `src/blocks/registry.ts` → `BLOCKS: BlockDefinition[]`
- `src/themes/registry.ts` → `THEMES: ThemeDefinition[]`
- `src/layouts/registry.ts` → `LAYOUTS: LayoutDefinition[]`

Each registry is a typed array of definition objects. The UI (composer panel, theme/layout selectors) iterates the arrays — it never hardcodes a list of known capabilities. Adding a capability is always exactly:

1. Create the file (`.svelte`, `.css`)
2. Add one entry to the registry
3. Add one `@import` to the CSS index if it's a theme

Nothing else changes. The composer, preview, and export auto-discover the new entry.

`ProFormaProject.compose` stores references to capabilities by `id` string (e.g., `style: 'terminal'`, `layout: 'mag'`, `blocks: ['header', 'chart', 'footer']`). The store applies ID migration on load (see ADR-007) so capability renames/removals don't corrupt saved projects.

## Consequences

**Positive:**
- Adding a block, theme, or layout is a self-contained change with a predictable surface area.
- The composer UI and preview are always in sync with available capabilities — no stale hardcoded lists.
- The export's studio bar (theme/layout switcher) also reads from the registries and requires no updates when capabilities are added.
- Clear convention makes it easy for future contributors (or LLMs) to extend the tool correctly.

**Negative:**
- All blocks in the registry must implement the same prop interface — adding a block with radically different data requirements may strain the current `any`-typed `component` field.
- Removing a required block (`required: true`) from the registry without migration logic would silently drop it from all saved projects.
- Registry arrays are imported at module load time — no lazy loading. For 9 blocks and 8 themes this is negligible; at larger scales it would warrant code splitting.
