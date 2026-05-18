<script lang="ts">
  import type { ScenarioBlockData } from '../canvasSchema'
  import type { BlockOutputs, ScenarioOutputs } from '../canvasCompute'
  import type { ScenarioResult } from '../../schema'
  import { updateBlock } from '../canvasStore'

  let { block, computed }: { block: ScenarioBlockData; computed: Record<string, BlockOutputs> } = $props()

  function fmtNet(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }

  const results = $derived((): ScenarioResult[] => {
    const out = computed['scenarios'] as unknown as ScenarioResult[] | undefined
    return out ?? []
  })

  function setDelta(scId: string, key: 'trialStartDelta' | 'trialPaidDelta' | 'renewalDelta', val: number) {
    updateBlock(block.id, {
      scenarios: block.scenarios.map(s => s.id === scId ? { ...s, [key]: val } : s),
    })
  }

  function setName(scId: string, name: string) {
    updateBlock(block.id, {
      scenarios: block.scenarios.map(s => s.id === scId ? { ...s, name } : s),
    })
  }

  const MODIFIER_COLORS: Record<string, string> = {
    'sc-cons': 'var(--workshop-sc-cons)',
    'sc-mid':  'var(--workshop-sc-mid)',
    'sc-opt':  'var(--workshop-sc-opt)',
  }
</script>

<div class="scenario-body">
  <div class="sc-header-row">
    <span class="sc-col-label" style="flex:1.4">Scenario</span>
    <span class="sc-col-label">TS Δ</span>
    <span class="sc-col-label">TP Δ</span>
    <span class="sc-col-label">Rn Δ</span>
    <span class="sc-col-label" style="min-width:56px">M24 net</span>
  </div>

  {#each block.scenarios as sc, i}
    {@const result = results()[i]}
    <div class="sc-row">
      <input
        class="sc-name-input"
        type="text"
        value={sc.name}
        onblur={(e) => setName(sc.id, (e.target as HTMLInputElement).value)}
        onkeydown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        style="color:{MODIFIER_COLORS[sc.cssModifier] ?? 'var(--workshop-fg)'}"
      />
      <input class="sc-delta" type="number" step="0.5" value={sc.trialStartDelta}
        oninput={(e) => setDelta(sc.id, 'trialStartDelta', parseFloat((e.target as HTMLInputElement).value))} />
      <input class="sc-delta" type="number" step="0.5" value={sc.trialPaidDelta}
        oninput={(e) => setDelta(sc.id, 'trialPaidDelta',  parseFloat((e.target as HTMLInputElement).value))} />
      <input class="sc-delta" type="number" step="0.5" value={sc.renewalDelta}
        oninput={(e) => setDelta(sc.id, 'renewalDelta',    parseFloat((e.target as HTMLInputElement).value))} />
      <span class="sc-net" style="color:{result ? (result.m24Net >= 0 ? 'var(--workshop-positive)' : 'var(--workshop-negative)') : 'var(--workshop-fg-4)'}">
        {result ? fmtNet(result.m24Net) : '—'}
      </span>
    </div>
  {/each}

  {#if results().length > 0}
    <div class="sc-footer">
      {#each results() as r}
        <span class="sc-payback" style="color:{MODIFIER_COLORS[r.cssModifier] ?? 'var(--workshop-fg-3)'}">
          M{r.paybackMonth?.toFixed(1) ?? '—'}
        </span>
      {/each}
      <span class="sc-footer-label">payback</span>
    </div>
  {/if}
</div>

<style>
  .scenario-body { padding: 4px 8px; display: flex; flex-direction: column; gap: 3px; }

  .sc-header-row {
    display: flex; align-items: center; gap: 3px;
    padding-bottom: 3px; border-bottom: 1px solid var(--workshop-rule);
  }
  .sc-col-label { font: 9px/1 var(--workshop-sans); color: var(--workshop-fg-4); text-transform: uppercase; letter-spacing: 0.06em; min-width: 32px; text-align: right; }

  .sc-row { display: flex; align-items: center; gap: 3px; }

  .sc-name-input {
    font: 500 11px/1 var(--workshop-sans); flex: 1.4;
    background: transparent; border: none; outline: none; padding: 2px 0;
    min-width: 0;
  }
  .sc-name-input:focus { border-bottom: 1px solid var(--workshop-accent); }

  .sc-delta {
    font: 11px/1 var(--workshop-mono); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-rule);
    border-radius: 3px; padding: 2px 3px; text-align: right;
    width: 36px; min-width: 36px;
  }
  .sc-delta:focus { border-color: var(--workshop-accent); outline: none; }

  .sc-net { font: 11px/1 var(--workshop-mono); min-width: 56px; text-align: right; }

  .sc-footer {
    display: flex; align-items: center; gap: 4px;
    padding-top: 4px; border-top: 1px solid var(--workshop-rule); margin-top: 1px;
  }
  .sc-payback { font: 11px/1 var(--workshop-mono); }
  .sc-footer-label { font: 10px/1 var(--workshop-sans); color: var(--workshop-fg-4); margin-left: 2px; }
</style>
