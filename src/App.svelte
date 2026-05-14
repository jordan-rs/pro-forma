<script lang="ts">
  import './app.css'
  import './workshop/workshop.css'
  import Preview from './preview/Preview.svelte'
  import PanelCompose     from './workshop/PanelCompose.svelte'
  import PanelMeta        from './workshop/PanelMeta.svelte'
  import PanelLocked      from './workshop/PanelLocked.svelte'
  import PanelAssumptions from './workshop/PanelAssumptions.svelte'
  import PanelLabor       from './workshop/PanelLabor.svelte'
  import PanelContent     from './workshop/PanelContent.svelte'
  import { resetToTemplate, exportProjectJSON, importProject, project } from './store'
  import { downloadOnePager } from './export/generateOnePager'

  function downloadJSON() {
    const blob = new Blob([exportProjectJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'proforma.json'
    a.click()
  }

  function loadJSON() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try { importProject(JSON.parse(text)) } catch { alert('Invalid file') }
    }
    input.click()
  }
</script>

<div class="pf-shell">
  <header class="pf-topbar">
    <span class="brand">ProForma</span>
    <span class="sep">|</span>
    <span>Workshop</span>
    <div class="pf-topbar-actions">
      <button class="pf-topbar-btn" onclick={loadJSON}>Import</button>
      <button class="pf-topbar-btn" onclick={downloadJSON}>Save JSON</button>
      <button class="pf-topbar-btn" onclick={resetToTemplate}>Reset</button>
      <button class="pf-topbar-btn primary" onclick={() => downloadOnePager($project)}>Export One-Pager ↓</button>
    </div>
  </header>

  <aside class="pf-sidebar">
    <PanelCompose />
    <PanelMeta />
    <PanelLocked />
    <PanelAssumptions />
    <PanelLabor />
    <PanelContent />
  </aside>

  <main class="pf-preview">
    <Preview />
  </main>
</div>

<style>
  /* Layout-only style local to this component. Colors stay in app.css. */
  .pf-topbar-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
</style>
