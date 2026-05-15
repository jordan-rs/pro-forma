<script lang="ts">
  import { project, computed } from '../store'

  // ── Locked input helpers ───────────────────────────────────────────────────
  function locked(id: string) {
    return $project.locked.find(l => l.id === id)?.value ?? 0
  }
  function fmtLocked(id: string): string {
    const v = locked(id)
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }
  function setLocked(id: string, value: number) {
    project.update(p => ({
      ...p,
      locked: p.locked.map(l => l.id === id ? { ...l, value } : l),
    }))
  }

  // ── Labor helpers ──────────────────────────────────────────────────────────
  function setComponent(id: string, mode: 'today' | 'p3', value: number) {
    project.update(p => ({
      ...p,
      laborComponents: p.laborComponents.map(c =>
        c.id === id ? { ...c, [mode]: value } : c
      ),
    }))
  }
  function setRate(laborTypeId: string, hourlyRate: number) {
    project.update(p => ({
      ...p,
      laborTypes: p.laborTypes.map(lt =>
        lt.id === laborTypeId ? { ...lt, hourlyRate } : lt
      ),
    }))
  }

  // ── Assumption slider helpers ──────────────────────────────────────────────
  const sliders = [
    { key: 'trialStart' as const, label: 'Trial-start rate',  note: '7d post-acquisition', min: 6,  max: 15, step: 0.1 },
    { key: 'trialPaid'  as const, label: 'Trial → paid rate', note: 'within 15d of trial',  min: 50, max: 80, step: 0.5 },
    { key: 'renewal'    as const, label: 'Renewal rate',      note: 'year over year',       min: 40, max: 65, step: 0.5 },
  ]

  function setAssumption(key: 'trialStart' | 'trialPaid' | 'renewal', value: number) {
    project.update(p => ({ ...p, assumptions: { ...p.assumptions, [key]: value } }))
  }

  function pos(min: number, max: number, value: number): number {
    return ((value - min) / (max - min)) * 100
  }

  function fmtImpact(n: number): string {
    const sign = n >= 0 ? '+' : '−'
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
    return `${sign}$${abs.toFixed(0)}`
  }

  // ── Collapsible sections ───────────────────────────────────────────────────
  let lockedOpen  = true
  let laborOpen   = true
  let ratesOpen   = true
</script>

<!-- ── Locked Inputs ─────────────────────────────────────────────────────── -->
<div class="wl-section">
  <button class="wl-section-hdr" onclick={() => lockedOpen = !lockedOpen}>
    <span class="wl-section-title">Locked Inputs</span>
    <span class="wl-chevron" class:open={lockedOpen}>›</span>
  </button>
  {#if lockedOpen}
    <div class="wl-section-body">
      <div class="wl-locked-stat-row">
        <span class="wl-locked-pill">{(locked('acquisitions') / 1_000_000).toFixed(0)}M</span>
        <span class="wl-locked-label">acquisitions / yr</span>
        <span class="wl-locked-badge">locked</span>
      </div>
      <div class="wl-locked-stat-row">
        <span class="wl-locked-pill">${locked('renewalPrice')}</span>
        <span class="wl-locked-label">renewal price</span>
        <span class="wl-locked-badge">locked</span>
      </div>
      <div class="wl-cost-grid">
        {#each $project.locked.filter(l => !['acquisitions','renewalPrice'].includes(l.id)) as item}
          <div class="wl-cost-item">
            <div class="wl-cost-label">{item.label}</div>
            <div class="wl-cost-val">
              <input
                type="number"
                value={item.value}
                onchange={e => setLocked(item.id, parseFloat(e.currentTarget.value) || 0)}
              />
              <span class="wl-cost-unit">{item.unit || '$'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- ── Labor Components ───────────────────────────────────────────────────── -->
<div class="wl-section">
  <button class="wl-section-hdr" onclick={() => laborOpen = !laborOpen}>
    <span class="wl-section-title">Engineering Labor</span>
    <span class="wl-chevron" class:open={laborOpen}>›</span>
  </button>
  {#if laborOpen}
    <div class="wl-section-body">
      {#each $project.laborTypes as lt}
        {@const totals = $computed.laborByType.find(l => l.laborTypeId === lt.id)}
        {@const components = $project.laborComponents.filter(c => c.laborTypeId === lt.id)}
        <div class="wl-labor-summary">
          <span>
            {totals?.todayHrs ?? 0} hrs/mo now
            → <span class="wl-positive">{totals?.p3Hrs ?? 0} hrs/mo at steady state</span>
          </span>
          <div class="wl-rate-row">
            <span class="wl-rate-label">$/hr</span>
            <input
              type="number"
              class="wl-rate-input"
              value={lt.hourlyRate}
              min="20" max="500" step="1"
              onchange={e => setRate(lt.id, parseFloat(e.currentTarget.value) || 0)}
            />
          </div>
        </div>
        {#each components as comp}
          <div class="wl-tech-row">
            <div class="wl-tech-name-row">
              <span class="wl-tech-name">{comp.name}{#if comp.note} <span class="wl-tech-note">{comp.note}</span>{/if}</span>
              <span class="wl-tech-vals">{comp.today}<span class="wl-arrow">→</span><span class="wl-p3">{comp.p3}</span></span>
            </div>
            <div class="wl-dual">
              <span class="wl-dual-lab">Now</span>
              <input
                type="range"
                min="0" max={comp.max} step="1"
                value={comp.today}
                oninput={e => setComponent(comp.id, 'today', parseInt(e.currentTarget.value))}
              />
              <span class="wl-dual-lab">P3</span>
              <input
                type="range"
                class="p3-slider"
                min="0" max={comp.max} step="1"
                value={comp.p3}
                oninput={e => setComponent(comp.id, 'p3', parseInt(e.currentTarget.value))}
              />
            </div>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<!-- ── Conversion Rate Sliders ────────────────────────────────────────────── -->
<div class="wl-section">
  <button class="wl-section-hdr" onclick={() => ratesOpen = !ratesOpen}>
    <span class="wl-section-title">Conversion Rates</span>
    <span class="wl-chevron" class:open={ratesOpen}>›</span>
  </button>
  {#if ratesOpen}
    <div class="wl-section-body">
      {#each sliders as s}
        {@const value    = $project.assumptions[s.key]}
        {@const baseline = $project.baseline[s.key]}
        {@const impact   = $computed.sliderImpacts[s.key]}
        {@const moved    = Math.abs(value - baseline) > 0.001}
        <div class="wl-rate-slider-row">
          <div class="wl-rs-top">
            <div class="wl-rs-label">{s.label} <span class="wl-rs-note">{s.note}</span></div>
            <div class="wl-rs-val">{value.toFixed(1)}%</div>
          </div>
          <div class="wl-slider-wrap" style="--bl-pos: {pos(s.min, s.max, baseline)}%">
            <div class="wl-baseline-tick"></div>
            <input
              type="range"
              min={s.min} max={s.max} step={s.step}
              value={value}
              oninput={e => setAssumption(s.key, parseFloat(e.currentTarget.value))}
            />
          </div>
          <div class="wl-rs-impact" class:moved>
            {#if moved}
              <span class="wl-impact-num" class:positive={impact >= 0} class:negative={impact < 0}>
                {fmtImpact(impact)}
              </span>
              <span class="wl-impact-label">vs baseline on 2-yr return</span>
            {:else}
              <span class="wl-impact-at-baseline">at baseline · {baseline}%</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
