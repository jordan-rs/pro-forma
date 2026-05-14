export interface ThemeDefinition {
  id: string
  label: string
  cssClass: string  // applied to .pf-sheet root
}

export const THEMES: ThemeDefinition[] = [
  { id: 'terminal',      label: 'Terminal',      cssClass: 'style-terminal' },
  { id: 'editorial',     label: 'Editorial',     cssClass: 'style-editorial' },
  { id: 'modernist',     label: 'Modernist',     cssClass: 'style-modernist' },
  { id: 'institutional', label: 'Institutional', cssClass: 'style-institutional' },
  { id: 'brutalist',     label: 'Brutalist',     cssClass: 'style-brutalist' },
]

export const defaultThemeId = 'terminal'
