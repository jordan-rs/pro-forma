<script lang="ts">
  import './app.css'
  import './workshop/workshop.css'
  import WorkshopLeft  from './workshop/WorkshopLeft.svelte'
  import WorkshopRight from './workshop/WorkshopRight.svelte'
  import Preview       from './preview/Preview.svelte'
  import CanvasApp     from './canvas/CanvasApp.svelte'
  import BriefView     from './brief/BriefView.svelte'
  import { resetToTemplate, exportProjectJSON, importProject, project } from './store'
  import { downloadOnePager } from './export/generateOnePager'
  import { THEMES } from './themes/registry'
  import { LAYOUTS } from './layouts/registry'

  type Mode = 'workshop' | 'canvas' | 'brief'
  let mode = $state<Mode>((localStorage.getItem('pf-mode') as Mode | null) ?? 'workshop')

  function setMode(m: Mode) {
    mode = m
    localStorage.setItem('pf-mode', m)
  }

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

<!-- Full-height outer shell — canvas and brief modes take over entirely -->
{#if mode === 'canvas'}
  <div class="pf-shell pf-shell--canvas">
    <header class="pf-topbar">
      <span class="brand">ProForma</span>
      <span class="sep">|</span>
      <div class="pf-mode-tabs">
        <button class="pf-mode-tab" onclick={() => setMode('workshop')}>Workshop</button>
        <button class="pf-mode-tab active" onclick={() => setMode('canvas')}>Canvas</button>
        <button class="pf-mode-tab" onclick={() => setMode('brief')}>Brief</button>
      </div>
    </header>
    <div class="pf-canvas-body">
      <CanvasApp />
    </div>
  </div>
{:else if mode === 'brief'}
  <div class="pf-shell pf-shell--brief">
    <header class="pf-topbar">
      <span class="brand">ProForma</span>
      <span class="sep">|</span>
      <div class="pf-mode-tabs">
        <button class="pf-mode-tab" onclick={() => setMode('workshop')}>Workshop</button>
        <button class="pf-mode-tab" onclick={() => setMode('canvas')}>Canvas</button>
        <button class="pf-mode-tab active" onclick={() => setMode('brief')}>Brief</button>
      </div>
    </header>
    <BriefView />
  </div>
{:else}
  <div class="pf-shell">
    <header class="pf-topbar">
      <span class="brand">ProForma</span>
      <span class="sep">|</span>
      <div class="pf-mode-tabs">
        <button class="pf-mode-tab active" onclick={() => setMode('workshop')}>Workshop</button>
        <button class="pf-mode-tab" onclick={() => setMode('canvas')}>Canvas</button>
        <button class="pf-mode-tab" onclick={() => setMode('brief')}>Brief</button>
      </div>
      <span class="pf-topbar-title">{$project.meta.title}</span>
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
{/if}
