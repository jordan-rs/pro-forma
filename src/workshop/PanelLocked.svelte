<script lang="ts">
  import { project } from '../store'
  import Panel from './Panel.svelte'

  function setValue(id: string, value: number) {
    project.update(p => ({
      ...p,
      locked: p.locked.map(l => l.id === id ? { ...l, value } : l),
    }))
  }
</script>

<Panel title="Locked Inputs">
  {#each $project.locked as item}
    <div class="pf-locked-row">
      <span class="lab">{item.label}</span>
      <input
        type="number"
        value={item.value}
        onchange={e => setValue(item.id, parseFloat(e.currentTarget.value) || 0)}
      />
      <span class="unit">{item.unit}</span>
    </div>
  {/each}
</Panel>
