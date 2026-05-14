import type { Component } from 'svelte'
import Header    from './Header.svelte'
import Headline  from './Headline.svelte'
import SummaryCards from './SummaryCards.svelte'
import Funnel    from './Funnel.svelte'
import Chart     from './Chart.svelte'
import Scenarios from './Scenarios.svelte'
import Position  from './Position.svelte'
import Execution from './Execution.svelte'
import Footer    from './Footer.svelte'

export interface BlockDefinition {
  id: string
  label: string
  required: boolean
  component: Component<any>
}

// To add a block: create a .svelte component, import it above, add an entry here.
// The composer UI and preview renderer both iterate this list — no other changes needed.
export const BLOCKS: BlockDefinition[] = [
  { id: 'header',    label: 'Header',    required: true,  component: Header },
  { id: 'headline',  label: 'Headline',  required: true,  component: Headline },
  { id: 'summary',   label: 'Summary',   required: false, component: SummaryCards },
  { id: 'funnel',    label: 'Funnel',    required: false, component: Funnel },
  { id: 'chart',     label: 'Chart',     required: false, component: Chart },
  { id: 'scenarios', label: 'Scenarios', required: false, component: Scenarios },
  { id: 'position',  label: 'Position',  required: false, component: Position },
  { id: 'execution', label: 'Execution', required: false, component: Execution },
  { id: 'footer',    label: 'Footer',    required: true,  component: Footer },
]

export const defaultBlockIds = BLOCKS.map(b => b.id)
