<script lang="ts">
  import type { CashFlowBlockData } from '../canvasSchema'
  import type { BlockOutputs } from '../canvasCompute'
  import type { ChartPoint } from '../../schema'
  import { updateBlock } from '../canvasStore'

  let { block, computed }: { block: CashFlowBlockData; computed: Record<string, BlockOutputs> } = $props()

  const SVG_W = 240
  const SVG_H = 70
  const PAD   = 8

  const chartPoints = $derived.by((): ChartPoint[] => {
    return (computed['chartPoints'] as unknown as ChartPoint[] | undefined) ?? []
  })

  const svgPath = $derived.by((): string => {
    if (chartPoints.length < 2) return ''
    const months = chartPoints.map(p => p.month)
    const nets   = chartPoints.map(p => p.net)
    const minM = Math.min(...months), maxM = Math.max(...months)
    const minN = Math.min(0, ...nets),  maxN = Math.max(0, ...nets)
    const rangeM = maxM - minM || 1
    const rangeN = maxN - minN || 1
    const sx = (m: number) => PAD + (m - minM) / rangeM * (SVG_W - PAD * 2)
    const sy = (n: number) => SVG_H - PAD - (n - minN) / rangeN * (SVG_H - PAD * 2)
    return chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.month).toFixed(1)} ${sy(p.net).toFixed(1)}`).join(' ')
  })

  const zeroY = $derived.by((): number => {
    if (chartPoints.length === 0) return SVG_H - PAD
    const nets = chartPoints.map(p => p.net)
    const minN = Math.min(0, ...nets), maxN = Math.max(0, ...nets)
    const rangeN = maxN - minN || 1
    return SVG_H - PAD - (0 - minN) / rangeN * (SVG_H - PAD * 2)
  })

  const paybackMonth = $derived.by((): number | null => {
    for (let i = 1; i < chartPoints.length; i++) {
      if (chartPoints[i - 1].net < 0 && chartPoints[i].net >= 0) return chartPoints[i].month
    }
    return null
  })

  const paybackX = $derived.by((): number | null => {
    if (paybackMonth === null || chartPoints.length === 0) return null
    const months = chartPoints.map(p => p.month)
    const minM = Math.min(...months), maxM = Math.max(...months)
    const rangeM = maxM - minM || 1
    return PAD + (paybackMonth - minM) / rangeM * (SVG_W - PAD * 2)
  })

  const finalNet = $derived.by((): number | null => {
    return chartPoints.length ? chartPoints[chartPoints.length - 1].net : null
  })

  function fmtNet(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }
</script>

<div class="cashflow-body">
  {#if chartPoints.length >= 2}
    <svg width={SVG_W} height={SVG_H} style="display:block;overflow:visible">
      <line x1={PAD} y1={zeroY} x2={SVG_W - PAD} y2={zeroY}
        stroke="var(--workshop-rule-2)" stroke-width="1" />
      <path d={svgPath} fill="none" stroke="var(--workshop-accent)" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" />
      {#if paybackMonth !== null && paybackX !== null}
        <circle cx={paybackX} cy={zeroY} r="3" fill="var(--workshop-positive)" />
      {/if}
    </svg>
    <div class="cf-stats">
      <div class="cf-stat">
        <span class="cf-stat-label">M{block.projectionMonths}</span>
        <span class="cf-stat-val" style="color:{finalNet !== null && finalNet >= 0 ? 'var(--workshop-positive)' : 'var(--workshop-negative)'}">
          {finalNet !== null ? fmtNet(finalNet) : '—'}
        </span>
      </div>
      {#if paybackMonth !== null}
        <div class="cf-stat">
          <span class="cf-stat-label">Payback</span>
          <span class="cf-stat-val" style="color:var(--workshop-positive)">M{paybackMonth.toFixed(1)}</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="cf-empty">Wire cost + lift inputs to compute cash flow</div>
    <div class="cf-months-row">
      <span class="cf-months-label">Projection</span>
      <input
        class="cf-months-input"
        type="number" min="12" max="60" step="12"
        value={block.projectionMonths}
        oninput={(e) => updateBlock(block.id, { projectionMonths: parseInt((e.target as HTMLInputElement).value) || 24 })}
      />
      <span class="cf-months-label">months</span>
    </div>
  {/if}
</div>

<style>
  .cashflow-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }

  .cf-stats { display: flex; gap: 12px; }
  .cf-stat  { display: flex; flex-direction: column; gap: 1px; }
  .cf-stat-label { font: 9px/1 var(--workshop-sans); color: var(--workshop-fg-4); text-transform: uppercase; letter-spacing: 0.06em; }
  .cf-stat-val   { font: 12px/1 var(--workshop-mono); }

  .cf-empty {
    font: 11px/1.4 var(--workshop-sans); color: var(--workshop-fg-4);
    font-style: italic; padding: 4px 0;
  }

  .cf-months-row { display: flex; align-items: center; gap: 4px; }
  .cf-months-label { font: 11px/1 var(--workshop-sans); color: var(--workshop-fg-3); }
  .cf-months-input {
    font: 11px/1 var(--workshop-mono); color: var(--workshop-fg);
    background: var(--workshop-bg-3); border: 1px solid var(--workshop-rule);
    border-radius: 3px; padding: 3px 5px; width: 48px; text-align: right;
  }
  .cf-months-input:focus { border-color: var(--workshop-accent); outline: none; }
</style>
