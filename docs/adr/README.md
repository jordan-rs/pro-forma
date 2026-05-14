# Architecture Decision Records

| # | Title | Status |
|---|---|---|
| [001](001-single-file-html-output.md) | Single-File HTML Output via vite-plugin-singlefile | Accepted |
| [002](002-svelte5-vite-workshop.md) | Svelte 5 + Vite as the Workshop Framework | Accepted |
| [003](003-token-driven-theme-system.md) | Token-Driven CSS Theme System with a Contract Layer | Accepted |
| [004](004-pure-compute-layer.md) | Pure Compute Layer Shared Between Workshop and Export | Accepted |
| [005](005-registry-pattern.md) | Registry Pattern for Blocks, Themes, and Layouts | Accepted |
| [006](006-localstorage-persistence.md) | localStorage Persistence, No Backend | Accepted |
| [007](007-schema-first-data-model.md) | Schema-First Data Model — No Derived State Stored | Accepted |
| [008](008-static-export-with-studio-bar.md) | Static Export with Embedded Studio Bar (No Live Sliders) | Accepted |

## Format

Each ADR captures: **Context** (the forces at play), **Decision** (what was chosen and why), **Consequences** (what it enables and what it constrains). Open decisions or future extensions are documented as **Negative** consequences rather than separate proposals, so they stay close to the reasoning that created the constraint.

To propose a new decision, copy any existing file, increment the number, and set Status to `Proposed`.
