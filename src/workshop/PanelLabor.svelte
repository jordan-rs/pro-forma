<script lang="ts">
  // Renders one section per laborType — zero code changes needed when a new type is added.
  import { project, computed } from '../store'
  import Panel from './Panel.svelte'

  function setRate(laborTypeId: string, hourlyRate: number) {
    project.update(p => ({
      ...p,
      laborTypes: p.laborTypes.map(lt =>
        lt.id === laborTypeId ? { ...lt, hourlyRate } : lt
      ),
    }))
  }

  function setComponent(id: string, mode: 'today' | 'p3', value: number) {
    project.update(p => ({
      ...p,
      laborComponents: p.laborComponents.map(c =>
        c.id === id ? { ...c, [mode]: value } : c
      ),
    }))
  }
</script>

{#each $project.laborTypes as lt}
  {@const totals = $computed.laborByType.find(l => l.laborTypeId === lt.id)}
  {@const components = $project.laborComponents.filter(c => c.laborTypeId === lt.id)}

  <Panel title="{lt.label} Labor">
    <!-- Rate input -->
    <div class="pf-locked-row">
      <span class="lab">Loaded hourly rate</span>
      <input
        type="number"
        value={lt.hourlyRate}
        min="20" max="500" step="1"
        onchange={e => setRate(lt.id, parseFloat(e.currentTarget.value) || 0)}
      />
      <span class="unit">$/hr</span>
    </div>

    {#if totals}
      <div style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#6D6D78; letter-spacing:0.1em;">
        TODAY {totals.todayHrs}hrs/mo · {totals.todayFTE.toFixed(2)} FTE
        &nbsp;→&nbsp;
        P3 {totals.p3Hrs}hrs/mo · {totals.p3FTE.toFixed(2)} FTE
      </div>
    {/if}

    <!-- Per-component sliders -->
    {#each components as comp}
      <div class="pf-tech-row">
        <div class="name-row">
          <span class="name">{comp.name}{#if comp.note}<span class="note">{comp.note}</span>{/if}</span>
          <span class="vals">
            {comp.today}<span class="arrow">→</span><span class="p3">{comp.p3}</span>
          </span>
        </div>
        <div class="dual">
          <span class="lab">Now</span>
          <input
            type="range"
            min="0" max={comp.max} step="1"
            value={comp.today}
            oninput={e => setComponent(comp.id, 'today', parseInt(e.currentTarget.value))}
          />
          <span class="lab">P3</span>
          <input
            type="range"
            class="p3-slider"
            min="0" max={comp.max} step="1"
            value={comp.p3}
            oninput={e => setComponent(comp.id, 'p3', parseInt(e.currentTarget.value))}
          />
        </div>
      </div>
    {/each}
  </Panel>
{/each}
