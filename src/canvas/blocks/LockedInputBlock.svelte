<script lang="ts">
  import type { LockedInputBlockData } from '../canvasSchema'
  import { updateBlock } from '../canvasStore'

  let { block }: { block: LockedInputBlockData } = $props()

  function fmt(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }

  const fields: { key: keyof typeof block; label: string; unit: string }[] = [
    { key: 'acquisitions',  label: 'Acquisitions/yr',  unit: ''  },
    { key: 'renewalPrice',  label: 'Renewal price',    unit: '$' },
    { key: 'rcFeeY1',       label: 'RC fee · Y1',      unit: '$' },
    { key: 'rcFeeY2',       label: 'RC fee · Y2+',     unit: '$' },
    { key: 'migrationCost', label: 'Migration · Y1',   unit: '$' },
  ]

  let editingKey = $state<string | null>(null)
  let editValue  = $state('')

  function startEdit(key: string, current: number) {
    editingKey = key
    editValue  = String(current)
  }

  function commitEdit(key: keyof typeof block) {
    const n = parseFloat(editValue)
    if (!isNaN(n) && n >= 0) {
      updateBlock(block.id, { [key]: n } as Partial<LockedInputBlockData>)
    }
    editingKey = null
  }

  function onKeydown(e: KeyboardEvent, key: keyof typeof block) {
    if (e.key === 'Enter') commitEdit(key)
    if (e.key === 'Escape') editingKey = null
  }
</script>

<div class="locked-body">
  {#each fields as f, i}
    <div class="locked-row">
      <span class="locked-label">{f.label}</span>
      {#if editingKey === f.key}
        <input
          class="locked-input"
          type="number"
          bind:value={editValue}
          onblur={() => commitEdit(f.key as keyof typeof block)}
          onkeydown={(e) => onKeydown(e, f.key as keyof typeof block)}
          autofocus
        />
      {:else}
        <button
          class="locked-value"
          onclick={() => startEdit(f.key, block[f.key as keyof typeof block] as number)}
        >
          {fmt(block[f.key as keyof typeof block] as number)}
        </button>
      {/if}
      <!-- Output port anchor (visual only; actual dot rendered by CanvasView) -->
      <span class="port-label" data-port={f.key}>→</span>
    </div>
  {/each}
</div>

<style>
  .locked-body {
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .locked-row {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 26px;
  }

  .locked-label {
    font: 11px/1 var(--workshop-sans);
    color: var(--workshop-fg-3);
    flex: 1;
    white-space: nowrap;
  }

  .locked-value {
    font: 12px/1 var(--workshop-mono);
    color: var(--workshop-fg);
    background: var(--workshop-bg-3);
    border: 1px solid var(--workshop-rule);
    border-radius: 3px;
    padding: 3px 6px;
    cursor: pointer;
    min-width: 60px;
    text-align: right;
  }
  .locked-value:hover { border-color: var(--workshop-accent); }

  .locked-input {
    font: 12px/1 var(--workshop-mono);
    color: var(--workshop-fg);
    background: var(--workshop-bg-3);
    border: 1px solid var(--workshop-accent);
    border-radius: 3px;
    padding: 3px 6px;
    min-width: 60px;
    text-align: right;
    outline: none;
    width: 80px;
  }

  .port-label {
    font: 11px/1 var(--workshop-mono);
    color: var(--workshop-accent);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0.6;
  }
</style>
