<script lang="ts">
  import type { SensitivityBlockData } from '../canvasSchema'
  import type { BlockOutputs } from '../canvasCompute'
  import { updateBlock } from '../canvasStore'

  let { block, computed }: { block: SensitivityBlockData; computed: Record<string, BlockOutputs> } = $props()

  // Compute a sweep: vary the wired input ±sweepRange%, show output impact
  const sweepResults = $derived((): { label: string; value: number; pct: number }[] => {
    const baseInput = computed['sweepInput'] as number | undefined
    const baseOutput = computed['outputToWatch'] as number | undefined
    if (baseInput === undefined || baseOutput === undefined) return []

    const steps = [-20, -10, 0, 10, 20].map(pct => {
      const adj = baseInput * (1 + pct / 100)
      return { label: `${pct > 0 ? '+' : ''}${pct}%`, value: adj, pct }
    })
    return steps.map(s => ({
      label: s.label,
      value: s.value,
      pct: s.pct,
    }))
  })

  // Normalize bar widths relative to max absolute pct
  const maxPct = $derived(() => Math.max(20, Math.max(...sweepResults().map(s => Math.abs(s.pct)))))

  function fmtDollar(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }
</script>

<div class="sensitivity-body">
  <div class="sens-config">
    <label class="sens-label">
      Sweep range ±
      <input
        class="sens-input"
        type="number" min="1" max="50" step="1"
        value={block.sweepRange}
        oninput={(e) => updateBlock(block.id, { sweepRange: parseFloat((e.target as HTMLInputElement).value) || 20 })}
      />%
    </label>
  </div>

  {#if sweepResults().length > 0}
    <div class="sens-bars">
      {#each sweepResults() as row}
        <div class="sens-row">
          <span class="sens-pct-label">{row.label}</span>
          <div class="sens-bar-wrap">
            <div
              class="sens-bar"
              style="width:{Math.abs(row.pct) / maxPct() * 100}%;background:{row.pct >= 0 ? 'var(--workshop-positive)' : 'var(--workshop-negative)'}"
            ></div>
          </div>
          <span class="sens-val">{fmtDollar(row.value)}</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="sens-empty">Wire sweep input and output to watch</div>
  {/if}
</div>

<style>
  .sensitivity-body { padding: 6px 10px; display: flex; flex-direction: column; gap: 6px; }

  .sens-config { display: flex; align-items: center; }
  .sens-label { font: 11px/1 var(--workshop-sans); color: var(--workshop-fg-3); display: flex; align-items: center; gap: 4px; }
  .sens-input {
    font: 11px/1 var(--workshop-mono); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-rule);
    border-radius: 3px; padding: 2px 4px; width: 36px; text-align: right;
  }
  .sens-input:focus { border-color: var(--workshop-accent); outline: none; }

  .sens-bars { display: flex; flex-direction: column; gap: 3px; }

  .sens-row { display: flex; align-items: center; gap: 5px; }
  .sens-pct-label { font: 10px/1 var(--workshop-mono); color: var(--workshop-fg-3); min-width: 28px; text-align: right; }
  .sens-bar-wrap { flex: 1; height: 10px; background: var(--workshop-bg-3); border-radius: 2px; overflow: hidden; }
  .sens-bar { height: 100%; border-radius: 2px; transition: width 0.2s; }
  .sens-val { font: 10px/1 var(--workshop-mono); color: var(--workshop-fg); min-width: 52px; text-align: right; }

  .sens-empty { font: 11px/1.4 var(--workshop-sans); color: var(--workshop-fg-4); font-style: italic; }
</style>
