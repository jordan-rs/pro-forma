<script lang="ts">
  import type { AssumptionBlockData } from '../canvasSchema'
  import { updateBlock } from '../canvasStore'

  let { block }: { block: AssumptionBlockData } = $props()

  const sliders: {
    key: 'trialStart' | 'trialPaid' | 'renewal'
    baseKey: 'baselineTrialStart' | 'baselineTrialPaid' | 'baselineRenewal'
    label: string
    min: number
    max: number
    step: number
  }[] = [
    { key: 'trialStart', baseKey: 'baselineTrialStart', label: 'Trial-start',  min: 6,  max: 15, step: 0.1 },
    { key: 'trialPaid',  baseKey: 'baselineTrialPaid',  label: 'Trial→paid',   min: 50, max: 80, step: 0.5 },
    { key: 'renewal',    baseKey: 'baselineRenewal',    label: 'Renewal',      min: 40, max: 65, step: 0.5 },
  ]

  function pos(min: number, max: number, value: number): number {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  }

  function set(key: 'trialStart' | 'trialPaid' | 'renewal', v: number) {
    updateBlock(block.id, { [key]: v } as Partial<AssumptionBlockData>)
  }

  function setBaseline(key: 'baselineTrialStart' | 'baselineTrialPaid' | 'baselineRenewal', v: number) {
    updateBlock(block.id, { [key]: v } as Partial<AssumptionBlockData>)
  }
</script>

<div class="assumption-body">
  {#each sliders as s}
    <div class="slider-row">
      <div class="slider-header">
        <span class="slider-label">{s.label}</span>
        <span class="slider-value">{block[s.key].toFixed(s.step < 1 ? 1 : 0)}%</span>
      </div>
      <div class="slider-track-wrap">
        <!-- Baseline marker -->
        <div
          class="baseline-marker"
          style="left: {pos(s.min, s.max, block[s.baseKey])}%"
        ></div>
        <input
          class="slider-input"
          type="range"
          min={s.min}
          max={s.max}
          step={s.step}
          value={block[s.key]}
          oninput={(e) => set(s.key, parseFloat((e.target as HTMLInputElement).value))}
        />
      </div>
      <div class="slider-bounds">
        <span>{s.min}%</span>
        <span>{s.max}%</span>
      </div>
    </div>
  {/each}

  <!-- Live output summary: shows values flowing out to connected blocks -->
  <div class="assumption-outputs">
    <span class="ao-label">outputs →</span>
    <span class="ao-chip" title="Trial-start rate">{block.trialStart.toFixed(1)}%</span>
    <span class="ao-chip" title="Trial-to-paid rate">{block.trialPaid.toFixed(0)}%</span>
    <span class="ao-chip" title="Renewal rate">{block.renewal.toFixed(0)}%</span>
  </div>
</div>

<style>
  .assumption-body {
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .slider-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .slider-label {
    font: 11px/1 var(--workshop-sans);
    color: var(--workshop-fg-3);
  }

  .slider-value {
    font: 12px/1 var(--workshop-mono);
    color: var(--workshop-fg);
  }

  .slider-track-wrap {
    position: relative;
    height: 14px;
  }

  .baseline-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 10px;
    background: var(--workshop-rule-2);
    border-radius: 1px;
    pointer-events: none;
    z-index: 1;
  }

  .slider-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    appearance: none;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }
  .slider-input::-webkit-slider-runnable-track {
    height: 3px;
    background: var(--workshop-rule-2);
    border-radius: 2px;
  }
  .slider-input::-webkit-slider-thumb {
    appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--workshop-accent);
    border: 2px solid white;
    box-shadow: 0 0 0 1px var(--workshop-accent);
    margin-top: -4.5px;
    cursor: pointer;
  }

  .slider-bounds {
    display: flex;
    justify-content: space-between;
    font: 9px/1 var(--workshop-mono);
    color: var(--workshop-fg-4);
  }

  .assumption-outputs {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-top: 7px;
    border-top: 1px solid var(--workshop-rule);
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .ao-label {
    font: 9px/1 var(--workshop-sans);
    color: var(--workshop-fg-4);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ao-chip {
    font: 11px/1 var(--workshop-mono);
    color: var(--workshop-accent);
    background: var(--workshop-accent-bg-active);
    padding: 2px 6px;
    border-radius: 3px;
  }
</style>
