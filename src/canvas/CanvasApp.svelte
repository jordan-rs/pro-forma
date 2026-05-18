<script lang="ts">
  import './canvas.css'
  import CanvasView from './CanvasView.svelte'
  import BlockSidebar from './BlockSidebar.svelte'
  import ExportDialog from './ExportDialog.svelte'
  import { canvasState } from './canvasStore'
  import { saveToFile, loadFromFile } from './persistence'
  import { loadCanvasState } from './canvasStore'

  let showExport = $state(false)

  async function onSave() {
    await saveToFile($canvasState)
  }

  async function onLoad() {
    const loaded = await loadFromFile()
    if (loaded) loadCanvasState(loaded)
  }

  function onFitToView() {
    document.getElementById('canvas-fit-btn')?.click()
  }
</script>

<div class="canvas-shell">
  <BlockSidebar />

  <div class="canvas-toolbar">
    <button class="ctb-btn" onclick={onFitToView}>Fit view</button>
    <div class="spacer"></div>
    <button class="ctb-btn" onclick={onLoad}>Open file…</button>
    <button class="ctb-btn" onclick={onSave}>Save file…</button>
    <button class="ctb-btn primary" onclick={() => showExport = true}>Export One-Pager ↓</button>
  </div>

  <CanvasView />
</div>

{#if showExport}
  <ExportDialog onclose={() => showExport = false} />
{/if}
