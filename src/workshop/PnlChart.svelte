<script lang="ts">
  import { computed } from '../store'
  import type { ChartPoint } from '../schema'

  // SVG coordinate space
  const VB_W = 1100
  const VB_H = 380
  const X0   = 60   // left margin
  const X1   = 1060 // right margin (data ends here)
  const Y_TOP = 30
  const Y_BOT = 350
  const Y_ZERO = 290  // where net = 0 sits

  // Dynamic range: compute min/max across all scenario chartPoints
  const allNets = $derived(
    $computed.scenarioResults.flatMap(s => s.chartPoints.map(p => p.net))
  )
  const dataMin = $derived(Math.min(...allNets, 0))
  const dataMax = $derived(Math.max(...allNets, 0))
  const ySpan   = $derived(Math.max(dataMax - dataMin, 100_000))

  function netToY(net: number): number {
    // Maps net to SVG y coordinate.
    // dataMin → Y_BOT,  dataMax → Y_TOP,  0 → Y_ZERO (pinned)
    // We need to solve for scale so that 0 maps to Y_ZERO:
    //   Y_ZERO = Y_BOT - (0 - dataMin) / ySpan * (Y_BOT - Y_TOP)
    // => (Y_BOT - Y_ZERO) / (Y_BOT - Y_TOP) = -dataMin / ySpan
    // This may not hold perfectly when dataMin/dataMax are lopsided,
    // so we use a simple linear map instead with $0 pinned at Y_ZERO.
    const pxPerDollar = (Y_BOT - Y_TOP) / ySpan
    return Y_ZERO - net * pxPerDollar
  }

  function monthToX(t: number): number {
    return X0 + (t / 24) * (X1 - X0)
  }

  function toPoints(pts: ChartPoint[]): string {
    return pts.map(p => `${monthToX(p.month).toFixed(1)},${netToY(p.net).toFixed(1)}`).join(' ')
  }

  function toRangePath(upper: ChartPoint[], lower: ChartPoint[]): string {
    const fwd = upper.map(p => `${monthToX(p.month).toFixed(1)},${netToY(p.net).toFixed(1)}`)
    const bck = lower.slice().reverse().map(p => `${monthToX(p.month).toFixed(1)},${netToY(p.net).toFixed(1)}`)
    return `M${fwd.join(' L')} L${bck.join(' L')} Z`
  }

  const cons = $derived($computed.scenarioResults.find(s => s.cssModifier === 'sc-cons'))
  const mid  = $derived($computed.scenarioResults.find(s => s.cssModifier === 'sc-mid'))
  const opt  = $derived($computed.scenarioResults.find(s => s.cssModifier === 'sc-opt'))

  const consPoints = $derived(cons ? toPoints(cons.chartPoints) : '')
  const midPoints  = $derived(mid  ? toPoints(mid.chartPoints)  : '')
  const optPoints  = $derived(opt  ? toPoints(opt.chartPoints)  : '')
  const rangePath  = $derived(opt && cons ? toRangePath(opt.chartPoints, cons.chartPoints) : '')

  const gridY1 = $derived(netToY(dataMax * 0.667))
  const gridY2 = $derived(netToY(dataMax * 0.333))

  function fmtAxisLabel(n: number): string {
    if (Math.abs(n) >= 1_000_000) return `${n > 0 ? '+' : ''}$${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000)     return `${n > 0 ? '+' : ''}$${(n / 1_000).toFixed(0)}K`
    return `$0`
  }

  function fmtEndLabel(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs/1_000_000).toFixed(2)}M`
    return `${sign}$${(abs/1_000).toFixed(0)}K`
  }
</script>

<div class="pc-card">
  <div class="pc-header">
    <div class="pc-title">Net return over 24 months — all three scenarios</div>
    <div class="pc-sub">Shaded band shows the range between conservative and optimistic.</div>
  </div>

  <svg viewBox="0 0 {VB_W} {VB_H}" xmlns="http://www.w3.org/2000/svg" class="pc-svg">
    <!-- Gridlines -->
    {#if gridY1 > Y_TOP && gridY1 < Y_BOT}
      <line x1={X0} y1={gridY1} x2={X1} y2={gridY1} class="pc-grid"/>
    {/if}
    {#if gridY2 > Y_TOP && gridY2 < Y_BOT}
      <line x1={X0} y1={gridY2} x2={X1} y2={gridY2} class="pc-grid"/>
    {/if}

    <!-- Range band -->
    {#if rangePath}
      <path d={rangePath} class="pc-band"/>
    {/if}

    <!-- Scenario lines: cons + opt behind, mid on top -->
    {#if consPoints}<polyline points={consPoints} class="pc-line pc-cons"/>{/if}
    {#if optPoints} <polyline points={optPoints}  class="pc-line pc-opt"/>{/if}
    {#if midPoints} <polyline points={midPoints}  class="pc-line pc-mid"/>{/if}

    <!-- Zero rail -->
    <line x1={X0} y1={Y_ZERO} x2={X1} y2={Y_ZERO} class="pc-zero"/>

    <!-- Y axis labels -->
    <text x={X0 - 6} y={gridY1 + 4}  class="pc-ax" text-anchor="end">{fmtAxisLabel(dataMax * 0.667)}</text>
    <text x={X0 - 6} y={gridY2 + 4}  class="pc-ax" text-anchor="end">{fmtAxisLabel(dataMax * 0.333)}</text>
    <text x={X0 - 6} y={Y_ZERO + 4}  class="pc-ax-zero" text-anchor="end">$0</text>

    <!-- X axis labels -->
    <text x={monthToX(0)}  y={Y_BOT + 22} class="pc-ax" text-anchor="middle">M0</text>
    <text x={monthToX(6)}  y={Y_BOT + 22} class="pc-ax" text-anchor="middle">M6</text>
    <text x={monthToX(12)} y={Y_BOT + 22} class="pc-ax" text-anchor="middle">M12</text>
    <text x={monthToX(18)} y={Y_BOT + 22} class="pc-ax" text-anchor="middle">M18</text>
    <text x={monthToX(24)} y={Y_BOT + 22} class="pc-ax" text-anchor="middle">M24</text>

    <!-- Endpoint labels -->
    {#if opt}
      <text x={X1 + 8} y={netToY(opt.m24Net) + 4}  class="pc-end-lbl pc-end-opt" text-anchor="start">OPT {fmtEndLabel(opt.m24Net)}</text>
    {/if}
    {#if mid}
      <text x={X1 + 8} y={netToY(mid.m24Net) + 4}  class="pc-end-lbl pc-end-mid" text-anchor="start">MID {fmtEndLabel(mid.m24Net)}</text>
    {/if}
    {#if cons}
      <text x={X1 + 8} y={netToY(cons.m24Net) + 4} class="pc-end-lbl pc-end-cons" text-anchor="start">CONS {fmtEndLabel(cons.m24Net)}</text>
    {/if}
  </svg>
</div>

<style>
.pc-card {
  background: var(--workshop-bg-2);
  border: 1px solid var(--workshop-rule);
  border-radius: 4px;
  padding: 16px 18px 12px;
}
.pc-header { margin-bottom: 12px; }
.pc-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--workshop-fg-2);
  font-family: var(--workshop-sans);
}
.pc-sub {
  font-size: 11px;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  margin-top: 3px;
}
.pc-svg { width: 100%; height: auto; display: block; overflow: visible; }

.pc-grid {
  stroke: var(--workshop-rule);
  stroke-width: 1;
}
.pc-zero {
  stroke: var(--workshop-fg-4);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}
.pc-band {
  fill: var(--workshop-sc-cons-soft);
  opacity: 0.6;
}

.pc-line {
  fill: none;
  stroke-width: 2;
}
.pc-cons { stroke: var(--workshop-sc-cons); stroke-dasharray: 6 3; opacity: 0.7; }
.pc-opt  { stroke: var(--workshop-sc-opt);  stroke-dasharray: 6 3; opacity: 0.7; }
.pc-mid  { stroke: var(--workshop-sc-mid);  stroke-width: 2.5; }

.pc-ax {
  font-size: 20px;
  fill: var(--workshop-fg-4);
  font-family: var(--workshop-mono);
}
.pc-ax-zero {
  font-size: 20px;
  fill: var(--workshop-fg-3);
  font-family: var(--workshop-mono);
}
.pc-end-lbl {
  font-size: 18px;
  font-family: var(--workshop-mono);
}
.pc-end-opt  { fill: var(--workshop-sc-opt); }
.pc-end-mid  { fill: var(--workshop-sc-mid); }
.pc-end-cons { fill: var(--workshop-sc-cons); }
</style>
