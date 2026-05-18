<script lang="ts">
  import type { DriverBlockData } from '../canvasSchema'
  import type { BlockOutputs } from '../canvasCompute'
  import { updateBlock } from '../canvasStore'

  let { block, computed }: { block: DriverBlockData; computed: Record<string, BlockOutputs> } = $props()

  const categories = [
    { value: 'revenue',       label: 'Revenue' },
    { value: 'variable_cost', label: 'Variable cost' },
    { value: 'fixed_cost',    label: 'Fixed cost' },
    { value: 'capex',         label: 'Capex' },
  ] as const

  function fmtDollar(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  function set<K extends keyof DriverBlockData>(key: K, value: DriverBlockData[K]) {
    updateBlock(block.id, { [key]: value } as Partial<DriverBlockData>)
  }

  let editingBase = $state(false)
  let baseEdit    = $state('')

  const totalY1 = $derived((computed['totalY1'] as number | undefined) ?? block.baseValue)
  const totalY2 = $derived((computed['totalY2'] as number | undefined) ?? block.baseValue)
</script>

<div class="driver-body">
  <div class="dr-row">
    <span class="dr-label">Category</span>
    <select
      class="dr-select"
      value={block.category}
      onchange={(e) => set('category', (e.target as HTMLSelectElement).value as DriverBlockData['category'])}
    >
      {#each categories as c}
        <option value={c.value}>{c.label}</option>
      {/each}
    </select>
  </div>

  <div class="dr-row">
    <span class="dr-label">Base value</span>
    {#if editingBase}
      <input
        class="dr-input"
        type="number"
        bind:value={baseEdit}
        onblur={() => { set('baseValue', parseFloat(baseEdit) || block.baseValue); editingBase = false }}
        onkeydown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') editingBase = false }}
        autofocus
      />
    {:else}
      <button class="dr-value" onclick={() => { baseEdit = String(block.baseValue); editingBase = true }}>
        {fmtDollar(block.baseValue)}
      </button>
    {/if}
  </div>

  <div class="dr-row">
    <span class="dr-label">Growth/yr</span>
    <div class="dr-slider-wrap">
      <input
        class="dr-slider"
        type="range"
        min="-50" max="100" step="1"
        value={block.growthRate}
        oninput={(e) => set('growthRate', parseFloat((e.target as HTMLInputElement).value))}
      />
      <span class="dr-slider-val">{block.growthRate > 0 ? '+' : ''}{block.growthRate}%</span>
    </div>
  </div>

  <div class="dr-outputs">
    <div class="dr-out">
      <span class="dr-out-label">Y1</span>
      <span class="dr-out-val">{fmtDollar(totalY1)}</span>
    </div>
    <div class="dr-out">
      <span class="dr-out-label">Y2</span>
      <span class="dr-out-val">{fmtDollar(totalY2)}</span>
    </div>
  </div>
</div>

<style>
  .driver-body { padding: 6px 10px; display: flex; flex-direction: column; gap: 5px; }

  .dr-row { display: flex; align-items: center; gap: 6px; }
  .dr-label { font: 11px/1 var(--workshop-sans); color: var(--workshop-fg-3); flex: 1; }

  .dr-select {
    font: 11px/1 var(--workshop-sans); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-rule);
    border-radius: 3px; padding: 3px 4px; cursor: pointer;
  }
  .dr-select:focus { border-color: var(--workshop-accent); outline: none; }

  .dr-value {
    font: 12px/1 var(--workshop-mono); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-rule);
    border-radius: 3px; padding: 3px 6px; cursor: pointer; min-width: 60px; text-align: right;
  }
  .dr-value:hover { border-color: var(--workshop-accent); }

  .dr-input {
    font: 12px/1 var(--workshop-mono); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-accent);
    border-radius: 3px; padding: 3px 6px; outline: none; width: 80px; text-align: right;
  }

  .dr-slider-wrap { display: flex; align-items: center; gap: 4px; flex: 1; }
  .dr-slider { flex: 1; height: 3px; accent-color: var(--workshop-accent); cursor: pointer; }
  .dr-slider-val { font: 11px/1 var(--workshop-mono); color: var(--workshop-fg); min-width: 36px; text-align: right; }

  .dr-outputs {
    display: flex; gap: 8px; margin-top: 2px;
    padding-top: 5px; border-top: 1px solid var(--workshop-rule);
  }
  .dr-out { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .dr-out-label { font: 9px/1 var(--workshop-sans); color: var(--workshop-fg-4); text-transform: uppercase; letter-spacing: 0.06em; }
  .dr-out-val { font: 12px/1 var(--workshop-mono); color: var(--workshop-accent); }
</style>
