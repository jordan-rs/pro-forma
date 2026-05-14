/* ═══════════════════════════════════════════════════════════════════════════
   THEMES · REGISTRY
   ═══════════════════════════════════════════════════════════════════════════
   The single source of truth for which themes appear in the Workshop
   picker. Order here = order in the UI. Every entry must match a `.style-*`
   class in `./<id>.css` and be imported in `./index.css`.
   =========================================================================== */

export interface ThemeDefinition {
  id: string                // stable identifier, persisted in saved projects
  label: string             // human-readable, shown in the picker
  description: string       // tooltip / one-line vibe summary
  cssClass: string          // applied to .pf-sheet root (e.g. 'style-clean')
}

export const THEMES: ThemeDefinition[] = [
  { id: 'clean',         label: 'Clean',         description: 'Stripe/Notion calm. Blue accent. The default.',     cssClass: 'style-clean' },
  { id: 'editorial',     label: 'Editorial',     description: 'FT salmon paper. Serif italic. Magazine mood.',     cssClass: 'style-editorial' },
  { id: 'terminal',      label: 'Terminal',      description: 'Dark + chartreuse. Mono body. Dashboard mood.',     cssClass: 'style-terminal' },
  { id: 'modern',        label: 'Modern',        description: 'IBM Plex Serif + purple. Editorial with edge.',     cssClass: 'style-modern' },
  { id: 'institutional', label: 'Institutional', description: 'Navy + antique gold. Hedge-fund tear-sheet.',       cssClass: 'style-institutional' },
  { id: 'paper',         label: 'Paper',         description: 'Pure B&W. Montserrat. Prints beautifully.',         cssClass: 'style-paper' },
  { id: 'brutalist',     label: 'Brutalist',     description: 'Anti-grid. Thick rules. Uppercase. Loud.',          cssClass: 'style-brutalist' },
  { id: 'bento',         label: 'Bento',         description: 'Peach paper + soft blue. Friendly modular tiles.',  cssClass: 'style-bento' },
]

export const defaultThemeId = 'clean'
