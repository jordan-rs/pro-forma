<script lang="ts">
  import { canvasState } from './canvasStore'
  import { canvasStateToProject } from './canvasExport'
  import { downloadOnePager } from '../export/generateOnePager'
  import Preview from '../preview/Preview.svelte'
  import { THEMES } from '../themes/registry'
  import { LAYOUTS } from '../layouts/registry'
  import { project as workshopProject } from '../store'
  import { writable } from 'svelte/store'

  let { onclose }: { onclose: () => void } = $props()

  // Local style/layout selection (starts from canvas compose state)
  let style  = $state($canvasState.compose.style)
  let layout = $state($canvasState.compose.layout)

  // Build a derived project for preview — use a local store so Preview.svelte
  // can subscribe to it without touching the workshop project store.
  const previewProject = writable(canvasStateToProject({ ...$canvasState, compose: { style, layout } }))

  $effect(() => {
    previewProject.set(canvasStateToProject({ ...$canvasState, compose: { style, layout } }))
  })

  function onStyleClick(id: string) {
    style = id
  }

  function onLayoutClick(id: string) {
    layout = id
  }

  async function exportHTML() {
    const p = canvasStateToProject({ ...$canvasState, compose: { style, layout } })
    downloadOnePager(p)
  }

  async function exportPDF() {
    const p = canvasStateToProject({ ...$canvasState, compose: { style, layout } })
    // Temporarily override the workshop project for printing
    workshopProject.set(p)
    await new Promise(r => setTimeout(r, 100))
    window.print()
    onclose()
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose()
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="export-backdrop" onclick={onBackdropClick}>
  <div class="export-dialog" role="dialog" aria-modal="true" aria-label="Export one-pager">
    <div class="ed-header">
      <span class="ed-title">Export One-Pager</span>
      <button class="ed-close" onclick={onclose} aria-label="Close">✕</button>
    </div>

    <div class="ed-body">
      <!-- Controls -->
      <div class="ed-controls">
        <div class="ed-section">
          <div class="ed-section-title">Style</div>
          <div class="ed-chips">
            {#each THEMES as t}
              <button
                class="ed-chip"
                class:active={style === t.id}
                title={t.description}
                onclick={() => onStyleClick(t.id)}
              >{t.label}</button>
            {/each}
          </div>
        </div>

        <div class="ed-section">
          <div class="ed-section-title">Layout</div>
          <div class="ed-chips">
            {#each LAYOUTS as l}
              <button
                class="ed-chip"
                class:active={layout === l.id}
                title={l.description}
                onclick={() => onLayoutClick(l.id)}
              >{l.label}</button>
            {/each}
          </div>
        </div>

        <div class="ed-section ed-section--actions">
          <div class="ed-section-title">Export as</div>
          <div class="ed-actions">
            <button class="ed-export-btn primary" onclick={exportHTML}>
              Standalone HTML ↓
            </button>
            <button class="ed-export-btn" onclick={exportPDF}>
              PDF (print)
            </button>
          </div>
          <p class="ed-note">HTML opens offline in any browser. PDF uses your browser's print dialog.</p>
        </div>
      </div>

      <!-- Preview -->
      <div class="ed-preview-wrap">
        <div class="ed-preview-label">Preview</div>
        <div class="ed-preview-scroll">
          <div class="ed-preview-zoom">
            <!-- Temporarily override workshop project store so Preview.svelte renders canvas data -->
            {#key `${style}-${layout}`}
              {@const _ = workshopProject.set(canvasStateToProject({ ...$canvasState, compose: { style, layout } }))}
              <Preview />
            {/key}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .export-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
  }

  .export-dialog {
    background: var(--workshop-bg);
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.2);
    width: 900px; max-width: 96vw;
    height: 620px; max-height: 92vh;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .ed-header {
    display: flex; align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid var(--workshop-rule);
    flex-shrink: 0;
  }
  .ed-title { font: 600 14px/1 var(--workshop-sans); color: var(--workshop-fg); flex: 1; }
  .ed-close {
    background: none; border: none; cursor: pointer;
    color: var(--workshop-fg-3); font-size: 14px; padding: 4px;
    border-radius: 4px;
  }
  .ed-close:hover { background: var(--workshop-bg-2); color: var(--workshop-fg); }

  .ed-body {
    display: grid; grid-template-columns: 260px 1fr;
    flex: 1; overflow: hidden;
  }

  .ed-controls {
    display: flex; flex-direction: column; gap: 0;
    border-right: 1px solid var(--workshop-rule);
    overflow-y: auto; padding: 16px;
  }

  .ed-section { margin-bottom: 16px; }
  .ed-section-title {
    font: 500 10px/1 var(--workshop-sans); color: var(--workshop-fg-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  .ed-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .ed-chip {
    background: var(--workshop-bg-2); border: 1px solid var(--workshop-rule-2);
    border-radius: 4px; padding: 4px 8px;
    font: 11px/1 var(--workshop-sans); color: var(--workshop-fg-2);
    cursor: pointer; transition: all 0.1s;
  }
  .ed-chip:hover { border-color: var(--workshop-accent); }
  .ed-chip.active {
    background: var(--workshop-accent); border-color: var(--workshop-accent);
    color: #fff; font-weight: 600;
  }

  .ed-section--actions { margin-top: auto; }
  .ed-actions { display: flex; flex-direction: column; gap: 6px; }
  .ed-export-btn {
    padding: 9px 14px; border-radius: 6px;
    font: 500 12px/1 var(--workshop-sans); cursor: pointer;
    border: 1px solid var(--workshop-rule-2);
    background: var(--workshop-bg-2); color: var(--workshop-fg);
    transition: all 0.1s;
  }
  .ed-export-btn:hover { border-color: var(--workshop-accent); color: var(--workshop-accent); }
  .ed-export-btn.primary {
    background: var(--workshop-accent); border-color: var(--workshop-accent);
    color: #fff;
  }
  .ed-export-btn.primary:hover { opacity: 0.9; }

  .ed-note { font: 10px/1.4 var(--workshop-sans); color: var(--workshop-fg-4); margin-top: 8px; }

  .ed-preview-wrap { display: flex; flex-direction: column; overflow: hidden; background: var(--workshop-bg-canvas); }
  .ed-preview-label {
    padding: 8px 14px; font: 500 10px/1 var(--workshop-sans);
    color: var(--workshop-fg-3); text-transform: uppercase; letter-spacing: 0.06em;
    border-bottom: 1px solid var(--workshop-rule); flex-shrink: 0;
    background: var(--workshop-bg);
  }
  .ed-preview-scroll { flex: 1; overflow: auto; padding: 16px; }
  .ed-preview-zoom {
    width: 1120px; zoom: 0.44;
    transform-origin: top left;
  }
</style>
