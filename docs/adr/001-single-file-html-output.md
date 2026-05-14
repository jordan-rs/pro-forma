# ADR-001: Single-File HTML Output via vite-plugin-singlefile

**Status:** Accepted  
**Date:** 2026-05-14

## Context

ProForma produces a deliverable that needs to be shareable with stakeholders who have no access to hosted infrastructure, no Node.js, and no build toolchain. The output is a business case document — closer to a PDF than a web app. Recipients need to open it, read it, and optionally switch themes or layouts. That's it.

Options considered:

| Option | Tradeoff |
|---|---|
| Hosted web app (e.g. Vercel/Netlify deploy) | Requires a URL, login, and ongoing hosting. The audience is internal stakeholders who shouldn't need an account to read a document. |
| Multi-file static bundle (JS + CSS + HTML) | Needs a web server or a browser that allows local file:// cross-origin loads. Fragile to email or Slack as a zip. |
| PDF export | Loses the live theme/layout switcher. Snapshots one look permanently. |
| **Single self-contained HTML file** | Opens in any browser from any location — desktop, email attachment, Slack download. Zero infrastructure. |

## Decision

Use `vite-plugin-singlefile` to inline all JavaScript, CSS, and assets into a single `.html` file at build time. The exported one-pager is this file — it ships with bundled theme CSS, layout CSS, font references, computed data, and a lightweight studio bar for theme/layout switching.

The workshop (authoring environment) itself is a separate Vite dev server and is never shipped to stakeholders.

## Consequences

**Positive:**
- Zero deployment: the output is a file, not a service.
- Universally shareable — email, Slack, Notion embed, Dropbox.
- No dependency on ProForma infrastructure after export.
- Recipients can switch themes/layouts without sending back to the author.

**Negative:**
- File size grows with every new theme font family added to the `FONTS` constant in `generateOnePager.ts`. (Currently ~15 Google Fonts families loaded via CDN `<link>` — still needs network for fonts on first load.)
- No live interactivity in the export: sliders, edits, and re-computation require the workshop.
- Debugging export rendering requires building and opening the output, not just running `npm run dev`.
