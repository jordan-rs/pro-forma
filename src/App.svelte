<script lang="ts">
  import './app.css'
  import './workshop/workshop.css'
  import WorkshopLeft  from './workshop/WorkshopLeft.svelte'
  import WorkshopRight from './workshop/WorkshopRight.svelte'
  import Preview       from './preview/Preview.svelte'
  import { resetToTemplate, exportProjectJSON, importProject, project } from './store'
  import { downloadOnePager } from './export/generateOnePager'
  import { THEMES } from './themes/registry'
  import { LAYOUTS } from './layouts/registry'

  function setStyle(id: string) {
    project.update(p => ({ ...p, compose: { ...p.compose, style: id } }))
  }
  function setLayout(id: string) {
    project.update(p => ({ ...p, compose: { ...p.compose, layout: id } }))
  }

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
    <span>{$project.meta.title}</span>
    <div class="pf-topbar-actions">
      <button class="pf-topbar-btn" onclick={loadJSON}>Import</button>
      <button class="pf-topbar-btn" onclick={downloadJSON}>Save JSON</button>
      <button class="pf-topbar-btn" onclick={resetToTemplate}>Reset</button>
      <button class="pf-topbar-btn primary" onclick={() => downloadOnePager($project)}>Export One-Pager ↓</button>
    </div>
  </header>

  <aside class="pf-left">
    <WorkshopLeft />
  </aside>

  <main class="pf-workshop">
    <WorkshopRight />
  </main>

  <div class="pf-preview-panel">
    <div class="pf-preview-label">
      <span class="pvl-dot"></span>
      Live Preview
    </div>
    <div class="pf-compose-bar">
      <div class="pcb-row">
        {#each THEMES as t}
          <button
            class="pcb-btn"
            class:active={$project.compose.style === t.id}
            title={t.description}
            onclick={() => setStyle(t.id)}
          >{t.label}</button>
        {/each}
      </div>
      <div class="pcb-row">
        {#each LAYOUTS as l}
          <button
            class="pcb-btn"
            class:active={$project.compose.layout === l.id}
            title={l.description}
            onclick={() => setLayout(l.id)}
          >{l.label}</button>
        {/each}
      </div>
    </div>
    <div class="pf-preview-zoom">
      <Preview />
    </div>
  </div>
</div>
