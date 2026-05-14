<script lang="ts">
  import { project } from '../store'
  import Panel from './Panel.svelte'

  const sliders = [
    { key: 'trialStart' as const, label: 'Trial-start rate',   note: 'first 7d after acquisition', min: 6,  max: 15, step: 0.1 },
    { key: 'trialPaid'  as const, label: 'Trial → paid rate',  note: 'within 15d of trial',         min: 50, max: 80, step: 0.5 },
    { key: 'renewal'    as const, label: 'Renewal rate',       note: 'year over year',              min: 40, max: 65, step: 0.5 },
  ]

  function setAssumption(key: 'trialStart' | 'trialPaid' | 'renewal', value: number) {
    project.update(p => ({ ...p, assumptions: { ...p.assumptions, [key]: value } }))
  }

  function pos(min: number, max: number, value: number): number {
    return (value - min) / (max - min)
  }

  function deltaClass(delta: number): string {
    if (delta > 0.05) return 'pos'
    if (delta < -0.05) return 'neg'
    return 'zero'
  }

  function fmtDelta(delta: number): string {
    if (Math.abs(delta) < 0.05) return '±0pp'
    const sign = delta > 0 ? '+' : '−'
    return `${sign}${Math.abs(delta).toFixed(1)}pp`
  }
</script>

<Panel title="Assumptions">
  {#each sliders as s}
    {@const value    = $project.assumptions[s.key]}
    {@const baseline = $project.baseline[s.key]}
    {@const delta    = value - baseline}
    <div class="pf-slider-row">
      <div class="top">
        <div class="lab">{s.label} <span class="note">{s.note}</span></div>
        <div class="val">
          {value.toFixed(1)}%
          <span class="delta {deltaClass(delta)}">{fmtDelta(delta)}</span>
        </div>
      </div>
      <div class="pf-slider-wrap" style="--pos: {pos(s.min, s.max, baseline)}">
        <div class="pf-baseline-marker">
          <div class="lab">{baseline}%</div>
          <div class="tick"></div>
        </div>
        <input
          type="range"
          min={s.min} max={s.max} step={s.step}
          value={value}
          oninput={e => setAssumption(s.key, parseFloat(e.currentTarget.value))}
        />
      </div>
    </div>
  {/each}
</Panel>
