<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { briefStore, skipNextPost } from './briefStore'
  import { briefComputed } from './briefDerived'
  import BriefPreview from './BriefPreview.svelte'
  import type { BriefVariable } from './briefSchema'
  import { THEMES }  from '../themes/registry'
  import { LAYOUTS } from '../layouts/registry'
  import './brief.css'

  let eventSource: EventSource | null = null
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    const isMcpMode = window.location.port !== '5173'
      && window.location.port !== '5174'
      && window.location.port !== '4173'
    if (!isMcpMode) return

    eventSource = new EventSource('/api/events')
    eventSource.onmessage = (e) => {
      try {
        const state = JSON.parse(e.data)
        skipNextPost()
        briefStore.set(state)
      } catch { /* ignore malformed frames */ }
    }

    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
      }
    }, 30_000)
  })

  onDestroy(() => {
    eventSource?.close()
    if (heartbeatInterval) clearInterval(heartbeatInterval)
  })

  function updateMeta(key: keyof typeof $briefStore.meta, value: string) {
    briefStore.update(b => ({ ...b, meta: { ...b.meta, [key]: value } }))
  }

  function updateContent(key: keyof typeof $briefStore.content, value: string) {
    briefStore.update(b => ({ ...b, content: { ...b.content, [key]: value } }))
  }

  function addVariable() {
    const n = $briefStore.variables.length + 1
    const newVar: BriefVariable = {
      id: `v-${Date.now()}`,
      name: `var${n}`,
      label: '',
      unit: '',
      base: 0,
      low: 0,
      high: 0,
    }
    briefStore.update(b => ({ ...b, variables: [...b.variables, newVar] }))
  }

  function removeVariable(id: string) {
    briefStore.update(b => ({ ...b, variables: b.variables.filter(v => v.id !== id) }))
  }

  function updateVariable(id: string, patch: Partial<BriefVariable>) {
    briefStore.update(b => ({
      ...b,
      variables: b.variables.map(v => v.id === id ? { ...v, ...patch } : v),
    }))
  }

  function numericInput(id: string, field: 'base' | 'low' | 'high', raw: string) {
    const n = parseFloat(raw)
    if (!isNaN(n)) updateVariable(id, { [field]: n })
  }

  function setStyle(id: string) {
    briefStore.update(b => ({ ...b, compose: { ...b.compose, style: id } }))
  }
  function setLayout(id: string) {
    briefStore.update(b => ({ ...b, compose: { ...b.compose, layout: id } }))
  }

  const hasFormula = $derived($briefStore.revenueFormula.trim().length > 0)
  const formulaError = $derived($briefComputed.formulaError)
  const variableNames = $derived($briefStore.variables.map(v => v.name).filter(n => n))
</script>

<div class="pf-brief-body">

  <!-- ── LEFT: FORM ── -->
  <aside class="bf-form">

    <!-- Meta -->
    <section class="bf-section">
      <h3>Brief</h3>
      <label class="bf-field">
        <span>Title</span>
        <input
          value={$briefStore.meta.title}
          oninput={(e) => updateMeta('title', e.currentTarget.value)}
          placeholder="Decision Brief"
        />
      </label>
      <div class="bf-row-2">
        <label class="bf-field">
          <span>Product</span>
          <input
            value={$briefStore.meta.product}
            oninput={(e) => updateMeta('product', e.currentTarget.value)}
            placeholder="e.g. Mobile App"
          />
        </label>
        <label class="bf-field">
          <span>Date</span>
          <input
            type="date"
            value={$briefStore.meta.date}
            oninput={(e) => updateMeta('date', e.currentTarget.value)}
          />
        </label>
      </div>
      <label class="bf-field">
        <span>Context</span>
        <input
          value={$briefStore.meta.context}
          oninput={(e) => updateMeta('context', e.currentTarget.value)}
          placeholder="e.g. Q3 Planning"
        />
      </label>
    </section>

    <!-- Act I content -->
    <section class="bf-section">
      <h3>Act I · The Bet</h3>
      <label class="bf-field">
        <span>Decision question</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.decision}
          oninput={(e) => updateContent('decision', e.currentTarget.value)}
          placeholder="What decision are we making? State it boldly."
          rows="2"
        ></textarea>
      </label>
      <label class="bf-field">
        <span>Mechanism (deck subtitle)</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.mechanism}
          oninput={(e) => updateContent('mechanism', e.currentTarget.value)}
          placeholder="How does this create value? One or two sentences."
          rows="2"
        ></textarea>
      </label>
    </section>

    <!-- Variables -->
    <section class="bf-section">
      <div class="bf-section-head">
        <h3>Act II · Variables</h3>
        <button class="bf-add-btn" onclick={addVariable}>+ Add variable</button>
      </div>

      {#each $briefStore.variables as v (v.id)}
        <div class="bf-var-row">
          <div class="bf-var-top">
            <label class="bf-field" style="margin:0">
              <span>Name</span>
              <input
                value={v.name}
                oninput={(e) => updateVariable(v.id, { name: e.currentTarget.value.replace(/\s+/g, '_') })}
                placeholder="var_name"
              />
            </label>
            <label class="bf-field" style="margin:0">
              <span>Label</span>
              <input
                value={v.label}
                oninput={(e) => updateVariable(v.id, { label: e.currentTarget.value })}
                placeholder="Human label"
              />
            </label>
            <button class="bf-remove-btn" onclick={() => removeVariable(v.id)} title="Remove variable">×</button>
          </div>
          <div class="bf-var-ranges">
            <label>
              <span>Low</span>
              <input
                type="number"
                value={v.low}
                oninput={(e) => numericInput(v.id, 'low', e.currentTarget.value)}
              />
            </label>
            <label>
              <span>Base</span>
              <input
                type="number"
                value={v.base}
                oninput={(e) => numericInput(v.id, 'base', e.currentTarget.value)}
              />
            </label>
            <label>
              <span>High</span>
              <input
                type="number"
                value={v.high}
                oninput={(e) => numericInput(v.id, 'high', e.currentTarget.value)}
              />
            </label>
            <label>
              <span>Unit</span>
              <input
                value={v.unit}
                oninput={(e) => updateVariable(v.id, { unit: e.currentTarget.value })}
                placeholder="$"
              />
            </label>
          </div>
        </div>
      {/each}

      {#if $briefStore.variables.length === 0}
        <p style="font-size:11px; color:var(--workshop-fg-3); margin:4px 0 0;">
          Variables are referenced by name in the formula below.
        </p>
      {/if}
    </section>

    <!-- Formula -->
    <section class="bf-section">
      <h3>Act II · Payoff Formula</h3>
      <p style="font-size:10px; color:var(--workshop-fg-3); margin:0 0 8px;">
        Evaluates to annual revenue uplift. Uses + − * / and variable names.
      </p>

      <div class="bf-formula-wrap">
        <input
          class="bf-formula-input"
          class:error={hasFormula && !!formulaError}
          value={$briefStore.revenueFormula}
          oninput={(e) => briefStore.update(b => ({ ...b, revenueFormula: e.currentTarget.value }))}
          placeholder="e.g. users * conv_rate / 100 * price"
          spellcheck="false"
        />
        {#if hasFormula && formulaError}
          <p class="bf-formula-error">{formulaError}</p>
        {/if}
      </div>

      {#if variableNames.length > 0}
        <div class="bf-vars-available">
          {#each variableNames as name}
            <span class="bf-var-chip">{name}</span>
          {/each}
        </div>
      {/if}

      <div class="bf-cost-row" style="margin-top:12px;">
        <label class="bf-field">
          <span>Cost Year 1 ($)</span>
          <input
            type="number"
            value={$briefStore.costY1}
            oninput={(e) => { const n = parseFloat(e.currentTarget.value); if (!isNaN(n)) briefStore.update(b => ({ ...b, costY1: n })) }}
            placeholder="0"
          />
        </label>
        <label class="bf-field">
          <span>Cost Year 2+ ($)</span>
          <input
            type="number"
            value={$briefStore.costY2}
            oninput={(e) => { const n = parseFloat(e.currentTarget.value); if (!isNaN(n)) briefStore.update(b => ({ ...b, costY2: n })) }}
            placeholder="same as Y1"
          />
        </label>
      </div>
    </section>

    <!-- Act IV content -->
    <section class="bf-section">
      <h3>Act IV · The Decision</h3>
      <label class="bf-field">
        <span>Recommendation</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.recommendation}
          oninput={(e) => updateContent('recommendation', e.currentTarget.value)}
          placeholder="We recommend proceeding."
          rows="2"
        ></textarea>
      </label>
      <label class="bf-field">
        <span>What we're asking for</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.ask}
          oninput={(e) => updateContent('ask', e.currentTarget.value)}
          placeholder="$X budget approval for Q3."
          rows="2"
        ></textarea>
      </label>
      <label class="bf-field">
        <span>What yes unlocks</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.whatYesUnlocks}
          oninput={(e) => updateContent('whatYesUnlocks', e.currentTarget.value)}
          placeholder="Launch by Q4, $XM revenue in year 1..."
          rows="2"
        ></textarea>
      </label>
      <label class="bf-field">
        <span>Cost of delay</span>
        <textarea
          class="bf-textarea"
          value={$briefStore.content.costOfDelay}
          oninput={(e) => updateContent('costOfDelay', e.currentTarget.value)}
          placeholder="Each month of delay costs approximately..."
          rows="2"
        ></textarea>
      </label>
      <label class="bf-field">
        <span>Footer notes</span>
        <input
          value={$briefStore.content.footer}
          oninput={(e) => updateContent('footer', e.currentTarget.value)}
          placeholder="Assumptions, caveats..."
        />
      </label>
    </section>

  </aside>

  <!-- ── RIGHT: PREVIEW ── -->
  <div class="bf-preview">
    <div class="bf-preview-label">
      <span class="pvl-dot"></span>
      Live Preview
    </div>

    <div class="bf-compose-bar">
      <span class="pcb-label">Style</span>
      <div class="pcb-pills">
        {#each THEMES as t}
          <button
            class="pcb-btn"
            class:active={$briefStore.compose.style === t.id}
            title={t.description}
            onclick={() => setStyle(t.id)}
          >{t.label}</button>
        {/each}
      </div>
    </div>

    <div class="bf-preview-zoom">
      <BriefPreview />
    </div>
  </div>

</div>
