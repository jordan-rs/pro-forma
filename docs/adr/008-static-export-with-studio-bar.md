# ADR-008: Static Export with Embedded Studio Bar (No Live Sliders)

**Status:** Accepted  
**Date:** 2026-05-14

## Context

The exported one-pager is a document, not an app. Recipients are stakeholders — typically executives or cross-functional partners — who need to read the business case, not rebuild it. However, the author may want recipients to be able to switch between themes or layouts, since different readers have different preferences for visual density and format.

Two dimensions of interactivity were evaluated independently:

**Financial sliders (trial rates, labor inputs):** Exposing these in the export would let recipients change the numbers, potentially undermining the author's intent. The business case makes a specific argument; the author controls the assumptions, not the recipient.

**Theme/layout switching:** Purely cosmetic. Letting recipients flip to a layout that reads better on their screen or in their context adds value without changing any numbers or conclusions.

## Decision

The exported one-pager is **static** for all financial data. Sliders, inputs, and assumptions are baked in at export time using the values from the workshop. There is no way to modify numbers from the exported file.

The export does include a **studio bar** — a fixed overlay at the top of the page — that lets the recipient switch themes and layouts. This is implemented as lightweight vanilla JS embedded directly in the HTML output. It reads from the `THEMES` and `LAYOUTS` registries (baked into the export at build time) and applies CSS classes to the document root.

The studio bar:
- Uses its own narrow CSS palette (not theme tokens, not workshop tokens) so it looks consistent regardless of which theme is displayed.
- Is positioned sticky at the top of the page, outside the one-pager content area.
- Does not persist its selection — each page load starts with the author's chosen theme/layout.

## Consequences

**Positive:**
- Author retains full control over the argument. Numbers cannot be changed by recipients.
- Recipients still get a useful interaction: format the doc for their own reading preference.
- The studio bar adds zero maintenance burden when themes/layouts are added — it reads from the same registries the workshop uses.
- The export is a single file with no JavaScript framework — the studio bar is ~50 lines of vanilla JS.

**Negative:**
- Recipients cannot explore "what if" scenarios. For use cases where that is the point (e.g., sharing a sensitivity model for joint review), the author would need to screen-share the workshop, not send the export.
- Block rendering in the export is via hand-templated HTML strings in `generateOnePager.ts`, not via Svelte's SSR. This means display logic is duplicated between the `.svelte` block components and the exporter — a drift risk if a block's visual output changes.
- The studio bar's theme selection does not persist across page loads. Recipients who prefer a different theme than the author's choice will re-select it on each open.
