<script lang="ts">
  import type { ComparisonBlockData } from '../canvasSchema'
  import type { BlockOutputs } from '../canvasCompute'
  import type { ScenarioResult } from '../../schema'

  let { block, computed }: { block: ComparisonBlockData; computed: Record<string, BlockOutputs> } = $props()

  const scenarios = $derived((): ScenarioResult[] => {
    const raw = computed['scenarios']
    return Array.isArray(raw) ? (raw as ScenarioResult[]) : []
  })

  function fmtNet(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }

  const MODIFIER_COLORS: Record<string, string> = {
    'sc-cons': 'var(--workshop-sc-cons)',
    'sc-mid':  'var(--workshop-sc-mid)',
    'sc-opt':  'var(--workshop-sc-opt)',
  }
</script>

<div class="comparison-body">
  {#if scenarios().length > 0}
    <table class="cmp-table">
      <thead>
        <tr>
          <th class="cmp-th"></th>
          {#each scenarios() as sc}
            <th class="cmp-th" style="color:{MODIFIER_COLORS[sc.cssModifier] ?? 'var(--workshop-fg)'}">
              {sc.name}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cmp-row-label">M24 net</td>
          {#each scenarios() as sc}
            <td class="cmp-val" style="color:{sc.m24Net >= 0 ? 'var(--workshop-positive)' : 'var(--workshop-negative)'}">
              {fmtNet(sc.m24Net)}
            </td>
          {/each}
        </tr>
        <tr>
          <td class="cmp-row-label">Payback</td>
          {#each scenarios() as sc}
            <td class="cmp-val">
              {sc.paybackMonth !== null ? `M${sc.paybackMonth.toFixed(1)}` : '> M24'}
            </td>
          {/each}
        </tr>
        <tr>
          <td class="cmp-row-label">Δ levers</td>
          {#each scenarios() as sc}
            <td class="cmp-val cmp-leverage">{sc.leverage}</td>
          {/each}
        </tr>
      </tbody>
    </table>
  {:else}
    <div class="cmp-empty">Wire a Scenario block to see comparison</div>
  {/if}
</div>

<style>
  .comparison-body { padding: 6px 8px; overflow: auto; height: 100%; }

  .cmp-table { width: 100%; border-collapse: collapse; }

  .cmp-th {
    font: 9px/1 var(--workshop-sans); text-transform: uppercase;
    letter-spacing: 0.06em; padding: 2px 6px 4px;
    border-bottom: 1px solid var(--workshop-rule);
    text-align: right;
  }
  .cmp-th:first-child { text-align: left; }

  .cmp-row-label {
    font: 10px/1 var(--workshop-sans); color: var(--workshop-fg-3);
    padding: 4px 6px 4px 0; vertical-align: middle;
    white-space: nowrap;
  }

  .cmp-val {
    font: 11px/1 var(--workshop-mono); color: var(--workshop-fg);
    padding: 4px 6px; text-align: right; vertical-align: middle;
  }

  .cmp-leverage { font-size: 9px; color: var(--workshop-fg-4); }

  .cmp-empty {
    font: 11px/1.4 var(--workshop-sans); color: var(--workshop-fg-4);
    font-style: italic; padding: 8px 0;
  }
</style>
