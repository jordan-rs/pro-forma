# ADR-006: localStorage Persistence, No Backend

**Status:** Accepted  
**Date:** 2026-05-14

## Context

ProForma is a single-author tool — one person builds the business case in a browser tab, then exports it. The primary persistence requirement is "don't lose work if I close the tab."

Options considered:

| Option | Tradeoff |
|---|---|
| No persistence (session only) | Author loses all work on refresh. Not acceptable for a document that may take hours to build. |
| File-based save/load (JSON download) | Explicit save discipline required. Easy to forget. Good for portability, bad as the primary persistence model. |
| Hosted database / API | Requires auth, a backend, a deployment. Adds operational surface for a single-user tool with no collaboration requirement. |
| **localStorage (auto-save)** | Zero infrastructure. Persists across tab close/refresh. Auto-saves on every edit via store subscription. |

## Decision

The `project` Svelte store subscribes to `localStorage` on every change:

```ts
project.subscribe(persist)
```

On load, `store.ts` reads from `localStorage` first, falls back to the default template if the key is missing or the JSON is corrupted. ID migration runs at load time (see ADR-007) to handle theme/layout renames between sessions.

JSON import/export (`importProject` / `exportProjectJSON`) are provided as a portability escape hatch — authors can save a `.json` snapshot and reload it in any browser.

## Consequences

**Positive:**
- Zero infrastructure, zero auth, zero deployment for persistence.
- Auto-save is invisible and instant — no "save" button, no unsaved-changes warning needed.
- The JSON export/import functions enable project portability and backup without any server.

**Negative:**
- Storage is browser- and origin-scoped. Switching browsers, clearing site data, or using private browsing loses the project unless the author exported a JSON.
- No history, no undo beyond what the browser session holds in memory.
- localStorage quota (~5MB) is more than enough for the current schema, but large embedded assets (e.g., if images were ever added) would exceed it.
- No multi-device or multi-user access — ProForma is intentionally single-author, single-machine.
