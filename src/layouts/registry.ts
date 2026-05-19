export interface LayoutDefinition {
  id: string
  label: string
  description: string
  cssClass: string  // applied to .pf-sheet root alongside the theme class
}

export const LAYOUTS: LayoutDefinition[] = [
  { id: 'stack',     label: 'Stack',     description: 'Single column',                              cssClass: 'layout-stack' },
  { id: 'grid',      label: 'Hero-grid', description: '2-col equal',                                cssClass: 'layout-grid' },
  { id: 'mag',       label: 'Magazine',  description: '1.45fr / 1fr split',                         cssClass: 'layout-mag' },
  { id: 'brief',     label: 'Briefing',  description: '3-col center-weighted',                      cssClass: 'layout-brief' },
  { id: 'narrative', label: 'Decision',  description: 'Four-act narrative: Bet · Mechanism · Payback · Ask', cssClass: 'layout-narrative' },
  { id: 'betsheet',  label: 'Bet Sheet', description: 'Scenarios as hero, cost with weight, mechanism below',  cssClass: 'layout-betsheet' },
]

export const defaultLayoutId = 'mag'
