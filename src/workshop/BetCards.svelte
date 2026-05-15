<script lang="ts">
  import { onMount } from 'svelte'
  import { computed } from '../store'
  import type { ScenarioResult } from '../schema'

  let isSticky = $state(false)
  let sentinel: HTMLElement
  let betsEl: HTMLElement

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { isSticky = !entry.isIntersecting },
      { threshold: 0, rootMargin: '-48px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  })

  function fmtNet(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }

  function pbWidth(sc: ScenarioResult): number {
    if (!sc.paybackMonth) return 100
    return Math.min((sc.paybackMonth / 24) * 100, 100)
  }

  function pbLabel(sc: ScenarioResult): string {
    if (!sc.paybackMonth) return 'No breakeven in 24 months'
    return `Month ${sc.paybackMonth.toFixed(1)} of 24`
  }

  // cssModifier → CSS variable names
  function scColor(mod: string): string {
    if (mod === 'sc-cons') return 'var(--workshop-sc-cons)'
    if (mod === 'sc-mid')  return 'var(--workshop-sc-mid)'
    return 'var(--workshop-sc-opt)'
  }
  function scSoft(mod: string): string {
    if (mod === 'sc-cons') return 'var(--workshop-sc-cons-soft)'
    if (mod === 'sc-mid')  return 'var(--workshop-sc-mid-soft)'
    return 'var(--workshop-sc-opt-soft)'
  }
</script>

<!-- Sentinel: IntersectionObserver watches this to detect when cards pin to top -->
<div bind:this={sentinel} style="height:1px; pointer-events:none;"></div>

<div bind:this={betsEl} class="bc-wrap" class:sticky={isSticky}>
  {#each $computed.scenarioResults as sc}
    <div class="bc-card" style="--sc-color:{scColor(sc.cssModifier)}; --sc-soft:{scSoft(sc.cssModifier)}">
      <div class="bc-name">{sc.name}</div>
      <div class="bc-net">{fmtNet(sc.m24Net)}</div>
      <div class="bc-run-rate">2-year net return</div>

      <div class="bc-pb-section">
        <div class="bc-pb-label">Breakeven</div>
        <div class="bc-pb-track">
          <div
            class="bc-pb-fill"
            class:no-breakeven={!sc.paybackMonth}
            style="width: {pbWidth(sc)}%"
          ></div>
          {#if sc.paybackMonth}
            <div class="bc-pb-dot" style="left: {pbWidth(sc)}%"></div>
          {/if}
        </div>
        <div class="bc-pb-month" class:no-be={!sc.paybackMonth}>{pbLabel(sc)}</div>
      </div>

      <div class="bc-leverage">{sc.leverage}</div>
    </div>
  {/each}
</div>

<style>
.bc-wrap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 5;
  transition: box-shadow 0.2s;
}
.bc-wrap.sticky {
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

.bc-card {
  background: var(--workshop-bg-2);
  border: 1px solid var(--workshop-rule);
  border-left: 3px solid var(--sc-color);
  border-radius: 4px;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: padding 0.2s;
}
.sticky .bc-card {
  padding: 10px 14px 8px;
}

.bc-name {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sc-color);
  font-family: var(--workshop-sans);
  font-weight: 600;
  margin-bottom: 4px;
}
.bc-net {
  font-size: 26px;
  font-weight: 700;
  color: var(--workshop-fg);
  font-family: var(--workshop-mono);
  letter-spacing: -0.02em;
  line-height: 1;
  transition: font-size 0.2s;
}
.sticky .bc-net { font-size: 20px; }
.bc-run-rate {
  font-size: 11px;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-sans);
  margin-bottom: 10px;
}
.sticky .bc-run-rate { display: none; }

/* Payback bar */
.bc-pb-section { margin-top: 2px; }
.bc-pb-label {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--workshop-fg-3);
  margin-bottom: 5px;
  font-family: var(--workshop-sans);
  font-weight: 500;
}
.sticky .bc-pb-label { display: none; }
.bc-pb-track {
  position: relative;
  height: 10px;
  background: var(--workshop-bg-3);
  border-radius: 5px;
  overflow: visible;
}
.bc-pb-fill {
  height: 10px;
  border-radius: 5px;
  background: var(--sc-soft);
  border: 1px solid var(--sc-color);
  transition: width 0.3s ease;
}
.bc-pb-fill.no-breakeven {
  background: rgba(220,38,38,0.15);
  border-color: #DC2626;
  width: 100% !important;
}
.bc-pb-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--workshop-bg);
  border: 2px solid var(--sc-color);
  pointer-events: none;
}
.bc-pb-month {
  font-size: 10px;
  font-family: var(--workshop-sans);
  color: var(--workshop-fg-2);
  margin-top: 5px;
  text-align: center;
}
.bc-pb-month.no-be { color: var(--workshop-negative); }
.sticky .bc-pb-month { display: none; }

.bc-leverage {
  font-size: 10px;
  color: var(--workshop-fg-3);
  font-family: var(--workshop-mono);
  margin-top: 8px;
  border-top: 1px solid var(--workshop-rule);
  padding-top: 6px;
}
.sticky .bc-leverage { display: none; }
</style>
