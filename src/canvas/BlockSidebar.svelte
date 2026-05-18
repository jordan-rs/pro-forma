<script lang="ts">
  import { BLOCK_TYPE_META } from './canvasSchema'
  import type { CanvasBlockType, CanvasState } from './canvasSchema'
  import { addBlock, loadCanvasState, resetCanvas, canvasState } from './canvasStore'
  import { vendorDecision } from './templates/vendorDecision'
  import { buildVsBuy } from './templates/buildVsBuy'
  import { newInitiative } from './templates/newInitiative'

  const CANVAS_CENTER = { x: 400, y: 300 }

  function placeBlock(type: CanvasBlockType) {
    const x = CANVAS_CENTER.x + Math.round((Math.random() - 0.5) * 80)
    const y = CANVAS_CENTER.y + Math.round((Math.random() - 0.5) * 80)
    addBlock(type, x, y)
  }

  function onDragStart(e: DragEvent, type: CanvasBlockType) {
    e.dataTransfer?.setData('canvas-block-type', type)
  }

  const templates = [
    { label: 'Vendor Decision',    fn: vendorDecision,  desc: 'RC migration · Conservative / Mid / Optimistic' },
    { label: 'Build vs. Buy',      fn: buildVsBuy,      desc: 'Cost comparison · break-even point' },
    { label: 'New Initiative',     fn: newInitiative,   desc: 'Capex + revenue ramp · cash-flow timing' },
  ]

  // Inline replacement confirmation — replaces the browser confirm() dialog
  let pendingAction = $state<{ label: string; action: () => void } | null>(null)

  function requestTemplate(t: { label: string; fn: () => CanvasState }) {
    if ($canvasState.blocks.length === 0) {
      loadCanvasState(t.fn())
      return
    }
    pendingAction = { label: t.label, action: () => loadCanvasState(t.fn()) }
  }

  function requestNewCanvas() {
    if ($canvasState.blocks.length === 0) return
    pendingAction = { label: 'blank canvas', action: () => resetCanvas() }
  }

  function confirmAction() {
    pendingAction?.action()
    pendingAction = null
  }
</script>

<aside class="canvas-sidebar">
  <!-- Inline replacement confirmation -->
  {#if pendingAction}
    <div class="csb-confirm">
      <div class="csb-confirm-text">Replace current canvas with <strong>{pendingAction.label}</strong>?</div>
      <div class="csb-confirm-row">
        <button class="csb-confirm-btn danger" onclick={confirmAction}>Replace</button>
        <button class="csb-confirm-btn" onclick={() => pendingAction = null}>Cancel</button>
      </div>
    </div>
  {/if}

  <!-- New blank canvas -->
  <div class="csb-section" style="padding-bottom:10px">
    <button class="csb-template-btn" onclick={requestNewCanvas}>+ New blank canvas</button>
  </div>

  <!-- Block palette -->
  <div class="csb-section">
    <div class="csb-section-title">Blocks</div>
    {#each BLOCK_TYPE_META as meta}
      <button
        class="csb-block-chip"
        draggable="true"
        ondragstart={(e) => onDragStart(e, meta.type)}
        onclick={() => placeBlock(meta.type)}
        title={meta.description}
      >
        <span class="csb-chip-label">{meta.label}</span>
        <span class="csb-chip-desc">{meta.description}</span>
      </button>
    {/each}
  </div>

  <!-- Templates -->
  <div class="csb-section">
    <div class="csb-section-title">Templates</div>
    {#each templates as t}
      <button class="csb-template-btn" onclick={() => requestTemplate(t)} title={t.desc}>
        <strong>{t.label}</strong><br>
        <span style="font-size:10px;color:var(--workshop-fg-3)">{t.desc}</span>
      </button>
    {/each}
  </div>
</aside>
