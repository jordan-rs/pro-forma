<script lang="ts">
  import { project } from '../store'
  import Panel from './Panel.svelte'

  function setContent<K extends keyof typeof $project.content>(key: K, value: typeof $project.content[K]) {
    project.update(p => ({ ...p, content: { ...p.content, [key]: value } }))
  }

  function setCardLabel(index: number, field: 'label' | 'subtitle', value: string) {
    project.update(p => {
      const cards = [...p.content.summary.cards] as typeof p.content.summary.cards
      cards[index] = { ...cards[index], [field]: value }
      return { ...p, content: { ...p.content, summary: { cards } } }
    })
  }

  function setBuyItem(index: number, field: keyof typeof $project.content.position.items[0], value: string) {
    project.update(p => {
      const items = [...p.content.position.items]
      items[index] = { ...items[index], [field]: value } as typeof items[0]
      return { ...p, content: { ...p.content, position: { ...p.content.position, items } } }
    })
  }

  function setPhase(index: number, field: keyof typeof $project.content.execution.phases[0], value: string) {
    project.update(p => {
      const phases = [...p.content.execution.phases] as typeof p.content.execution.phases
      phases[index] = { ...phases[index], [field]: value }
      return { ...p, content: { ...p.content, execution: { ...p.content.execution, phases } } }
    })
  }
</script>

<Panel title="Headline">
  <div class="pf-field">
    <label>Headline text</label>
    <input type="text" value={$project.content.headline}
      oninput={e => setContent('headline', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Accent word</label>
    <input type="text" value={$project.content.headlineAccent}
      oninput={e => setContent('headlineAccent', e.currentTarget.value)}/>
  </div>
  <div class="pf-field">
    <label>Deck</label>
    <textarea value={$project.content.deck}
      oninput={e => setContent('deck', e.currentTarget.value)}></textarea>
  </div>
</Panel>

<Panel title="Summary Cards" open={false}>
  {#each $project.content.summary.cards as card, i}
    <div style="border-bottom: 1px solid #1E1E26; padding-bottom: 10px; margin-bottom: 2px;">
      <div class="pf-field">
        <label>Card {i + 1} label</label>
        <input type="text" value={card.label}
          oninput={e => setCardLabel(i, 'label', e.currentTarget.value)}/>
      </div>
      <div class="pf-field">
        <label>Card {i + 1} subtitle</label>
        <input type="text" value={card.subtitle}
          oninput={e => setCardLabel(i, 'subtitle', e.currentTarget.value)}/>
      </div>
    </div>
  {/each}
</Panel>

<Panel title="Funnel" open={false}>
  <div class="pf-field">
    <label>Section meta</label>
    <input type="text" value={$project.content.funnel.meta}
      oninput={e => setContent('funnel', { ...$project.content.funnel, meta: e.currentTarget.value })}/>
  </div>
  {#each $project.content.funnel.stepNotes as step, i}
    <div class="pf-field">
      <label>Step {i + 1} RC note</label>
      <input type="text" value={step.rcNote} oninput={e => {
        const stepNotes = [...$project.content.funnel.stepNotes] as typeof $project.content.funnel.stepNotes
        stepNotes[i] = { ...stepNotes[i], rcNote: e.currentTarget.value }
        setContent('funnel', { ...$project.content.funnel, stepNotes })
      }}/>
    </div>
  {/each}
</Panel>

<Panel title="Chart" open={false}>
  <div class="pf-field">
    <label>Conclusion text</label>
    <textarea value={$project.content.chart.conclusion}
      oninput={e => setContent('chart', { ...$project.content.chart, conclusion: e.currentTarget.value })}></textarea>
  </div>
</Panel>

<Panel title="Position — Buys List" open={false}>
  <div class="pf-field">
    <label>Line item label</label>
    <input type="text" value={$project.content.position.lineItemLabel}
      oninput={e => setContent('position', { ...$project.content.position, lineItemLabel: e.currentTarget.value })}/>
  </div>
  <div class="pf-field">
    <label>Sub text</label>
    <textarea value={$project.content.position.subText}
      oninput={e => setContent('position', { ...$project.content.position, subText: e.currentTarget.value })}></textarea>
  </div>
  {#each $project.content.position.items as item, i}
    <div class="pf-field">
      <label>Item {i + 1}</label>
      <input type="text" value={item.text}
        oninput={e => setBuyItem(i, 'text', e.currentTarget.value)}/>
    </div>
  {/each}
</Panel>

<Panel title="Execution" open={false}>
  {#each $project.content.execution.phases as phase, i}
    <div style="border-bottom: 1px solid #1E1E26; padding-bottom: 10px; margin-bottom: 2px;">
      <div class="pf-field">
        <label>Phase {i + 1} name</label>
        <input type="text" value={phase.name}
          oninput={e => setPhase(i, 'name', e.currentTarget.value)}/>
      </div>
      <div class="pf-field">
        <label>Phase {i + 1} body</label>
        <textarea value={phase.body}
          oninput={e => setPhase(i, 'body', e.currentTarget.value)}></textarea>
      </div>
    </div>
  {/each}
</Panel>

<Panel title="Footer Notes" open={false}>
  <div class="pf-field">
    <textarea value={$project.content.footer}
      oninput={e => setContent('footer', e.currentTarget.value)}
      style="min-height: 80px;"></textarea>
  </div>
</Panel>
