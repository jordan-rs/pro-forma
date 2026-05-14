<script lang="ts">
  import type { ChartPoint, ScenarioResult } from '../schema'

  interface Props {
    title: string
    conclusion: string       // may contain <span> markup
    chartPoints: ChartPoint[]
    scenarioResults: ScenarioResult[]
  }
  let { title, conclusion, chartPoints, scenarioResults }: Props = $props()

  // SVG coordinate mapping
  // Y range: −$500K (y=310) → +$5M (y=30) — $0 at y=285
  const Y_ZERO  = 285
  const PX_PER_K = 280 / 5500  // pixels per $1K

  function netToY(net: number): number {
    return Y_ZERO - net * PX_PER_K / 1000
  }
  function monthToX(t: number): number {
    return 50 + (t / 24) * 930
  }

  // Derive polylines from chartPoints
  // For the static studio one-pager, we use the mid-scenario points as the primary line.
  // The range band uses cons/opt scenario endpoints.
  const midResult   = $derived(scenarioResults.find(s => s.cssModifier === 'sc-mid'))
  const consResult  = $derived(scenarioResults.find(s => s.cssModifier === 'sc-cons'))
  const optResult   = $derived(scenarioResults.find(s => s.cssModifier === 'sc-opt'))

  // Build mid polyline from chartPoints (workshop slider state)
  const midPoints = $derived(
    chartPoints.map(p => `${monthToX(p.month).toFixed(1)},${netToY(p.net).toFixed(1)}`).join(' ')
  )

  // Approximate cons/opt lines from scenario M24 endpoints (linear approximation from M0)
  function scenarioPolyline(m24Net: number): string {
    const pts: string[] = []
    for (let t = 0; t <= 24; t += 3) {
      const frac = t / 24
      const net = m24Net * frac
      pts.push(`${monthToX(t).toFixed(1)},${netToY(net).toFixed(1)}`)
    }
    return pts.join(' ')
  }

  const consPoints = $derived(consResult ? scenarioPolyline(consResult.m24Net) : '')
  const optPoints  = $derived(optResult  ? scenarioPolyline(optResult.m24Net)  : '')

  // Range polygon: opt curve forward + cons curve back
  const rangePath = $derived(() => {
    if (!consResult || !optResult) return ''
    const optPts = optPoints.split(' ')
    const consPts = consPoints.split(' ').reverse()
    return `M${optPts.join(' L')} L${consPts.join(' L')} Z`
  })

  // Break-even on mid line
  const bePoint = $derived(
    chartPoints.find((p, i) => i > 0 && p.net >= 0 && chartPoints[i - 1].net < 0)
  )
  const beX = $derived(bePoint ? monthToX(bePoint.month) : null)
  const beLabel = $derived(bePoint ? `MID · M${bePoint.month.toFixed(1)}` : null)

  const endY = $derived(
    chartPoints.length ? netToY(chartPoints[chartPoints.length - 1].net) : Y_ZERO
  )
</script>

<div class="c-chart">
  <div class="head">
    <div class="t">{@html title}</div>
    <div class="conclusion">{@html conclusion}</div>
  </div>

  <svg class="pnl" viewBox="0 0 1020 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <!-- grid -->
    <line x1="50" y1="81"  x2="980" y2="81"  class="grid-h"/>
    <line x1="50" y1="183" x2="980" y2="183" class="grid-h"/>

    <!-- range band -->
    {#if rangePath()}
      <path class="range" d={rangePath()}/>
    {/if}

    <!-- scenario edge lines -->
    {#if consPoints}<polyline class="l-cons" points={consPoints}/>{/if}
    {#if optPoints} <polyline class="l-opt"  points={optPoints}/>{/if}

    <!-- mid line (primary) -->
    <polyline class="l-mid" points={midPoints}/>

    <!-- zero rail -->
    <line x1="50" y1="285" x2="980" y2="285" class="zero"/>

    <!-- break-even marker -->
    {#if beX}
      <circle cx={beX} cy="285" r="4.5" class="be"/>
      <text x={beX} y="304" class="be-text" text-anchor="middle">{beLabel}</text>
    {/if}

    <!-- Y axis -->
    <g text-anchor="end">
      <text x="42" y="85"  class="ax-text">+$4M</text>
      <text x="42" y="187" class="ax-text">+$2M</text>
      <text x="42" y="289" class="ax-zero">$0</text>
    </g>

    <!-- X axis -->
    <g text-anchor="middle">
      <text x="50"   y="328" class="ax-text">M0</text>
      <text x="282.5" y="328" class="ax-text">M6</text>
      <text x="515"  y="328" class="ax-text">M12</text>
      <text x="747.5" y="328" class="ax-text">M18</text>
      <text x="980"  y="328" class="ax-text">M24</text>
    </g>

    <!-- endpoint labels -->
    {#if optResult}
      <text x="990" y={netToY(optResult.m24Net) + 4}  class="lbl-edge">OPT &nbsp;&nbsp;{optResult.m24Net >= 0 ? '+' : ''}${(optResult.m24Net/1_000_000).toFixed(2)}M</text>
    {/if}
    {#if midResult}
      <text x="990" y={endY + 4} class="lbl-mid">MID &nbsp;{midResult.m24Net >= 0 ? '+' : ''}${(midResult.m24Net/1_000_000).toFixed(2)}M</text>
    {/if}
    {#if consResult}
      <text x="990" y={netToY(consResult.m24Net) + 4} class="lbl-edge">CONS {consResult.m24Net >= 0 ? '+' : ''}${(consResult.m24Net/1_000).toFixed(0)}K</text>
    {/if}
  </svg>
</div>
