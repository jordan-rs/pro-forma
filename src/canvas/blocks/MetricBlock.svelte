<script lang="ts">
  import type { MetricBlockData } from '../canvasSchema'
  import type { BlockOutputs } from '../canvasCompute'
  import type { ScenarioResult } from '../../schema'
  import { updateBlock } from '../canvasStore'

  let { block, computed }: { block: MetricBlockData; computed: Record<string, BlockOutputs> } = $props()

  // Resolve value: wired input overrides staticValue
  // If input is a ScenarioResult[], show the mid-case M24 net
  const resolvedValue = $derived((): { display: string; subtext: string } => {
    const raw = computed['value']

    if (Array.isArray(raw)) {
      // ScenarioResult[]
      const scenarios = raw as ScenarioResult[]
      if (scenarios.length === 0) return { display: '—', subtext: '' }
      const mid = scenarios[Math.floor(scenarios.length / 2)]
      if (block.title.toLowerCase().includes('payback')) {
        return {
          display: mid.paybackMonth !== null ? `M${mid.paybackMonth.toFixed(1)}` : '> M24',
          subtext: 'mid case',
        }
      }
      const n = mid.m24Net
      const sign = n >= 0 ? '+' : '−'
      const abs = Math.abs(n)
      const fmt = abs >= 1_000_000 ? `${sign}$${(abs / 1_000_000).toFixed(2)}M`
                : abs >= 1_000     ? `${sign}$${(abs / 1_000).toFixed(0)}K`
                : `${sign}$${abs.toFixed(0)}`
      return { display: fmt, subtext: 'mid case · M24' }
    }

    if (typeof raw === 'number') {
      const fmt = `${block.unit ?? ''}${raw.toFixed(0)}`
      return { display: fmt, subtext: '' }
    }

    if (block.staticValue !== null && block.staticValue !== undefined) {
      const n = block.staticValue
      const fmt = Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
                : Math.abs(n) >= 1_000     ? `$${(n / 1_000).toFixed(0)}K`
                : `${n}`
      return { display: `${block.unit ?? ''}${fmt}`, subtext: 'static' }
    }

    return { display: '—', subtext: 'wire a source or set static value' }
  })

  let editingTitle = $state(false)
  let titleEdit    = $state('')
</script>

<div class="metric-body">
  {#if editingTitle}
    <input
      class="metric-title-input"
      type="text"
      bind:value={titleEdit}
      onblur={() => { updateBlock(block.id, { title: titleEdit }); editingTitle = false }}
      onkeydown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') editingTitle = false }}
      autofocus
    />
  {:else}
    <button class="metric-title" onclick={() => { titleEdit = block.title; editingTitle = true }}>
      {block.title}
    </button>
  {/if}
  <div class="metric-value" style="color:{resolvedValue().display === '—' ? 'var(--workshop-fg-4)' : 'var(--workshop-fg)'}">
    {resolvedValue().display}
  </div>
  {#if resolvedValue().subtext}
    <div class="metric-subtext">{resolvedValue().subtext}</div>
  {/if}
</div>

<style>
  .metric-body {
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 2px;
    justify-content: center; height: 100%;
  }

  .metric-title {
    font: 10px/1 var(--workshop-sans); color: var(--workshop-fg-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    background: none; border: none; cursor: pointer; text-align: left;
    padding: 0;
  }
  .metric-title:hover { color: var(--workshop-accent); }

  .metric-title-input {
    font: 10px/1 var(--workshop-sans); color: var(--workshop-fg);
    border: none; border-bottom: 1px solid var(--workshop-accent);
    background: transparent; outline: none; padding: 0; width: 100%;
  }

  .metric-value {
    font: 700 22px/1 var(--workshop-mono);
    letter-spacing: -0.02em;
    margin-top: 2px;
  }

  .metric-subtext {
    font: 10px/1 var(--workshop-sans); color: var(--workshop-fg-4);
    margin-top: 2px;
  }
</style>
