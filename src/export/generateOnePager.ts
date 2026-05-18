// ═════════════════════════════════════════════════════════════════════════════
// EXPORT · One-pager HTML generator
// ═════════════════════════════════════════════════════════════════════════════
// Builds a self-contained HTML file from a ProFormaProject. The output bundles
// theme CSS, layout CSS, base styles, and the studio bar (style/layout
// switcher overlay so recipients can flip themes themselves).
//
// FOR LLMs EDITING THIS FILE
// -----------------------------------------------------------------------------
// - Adding a new theme? Two things to update here:
//     1. The FONTS constant — add any new font families the theme uses to the
//        Google Fonts URL.
//     2. Nothing else — the studio bar reads from THEMES registry, so the new
//        theme will auto-appear in the switcher.
// - Adding a new layout? Same — just update the registry, no changes here.
// =============================================================================

import type { ComputedOutputs, ProFormaProject, BuyItem, ExecutionPhase } from '../schema'
import { compute, fmtMoneyS, fmtCount } from '../compute'
import { THEMES } from '../themes/registry'
import { LAYOUTS } from '../layouts/registry'

// ─── CSS BUNDLES (imported as raw strings by Vite) ──────────────────────────
// Each file must be imported individually with ?raw — Vite gives the literal
// file text, so @import chains inside index.css would NOT be followed.
// We concatenate in dependency order so the exported HTML is self-contained.

import contractCSS      from '../themes/_contract.css?raw'
import baseCSS          from '../themes/_base.css?raw'
import cleanCSS         from '../themes/clean.css?raw'
import editorialCSS     from '../themes/editorial.css?raw'
import terminalCSS      from '../themes/terminal.css?raw'
import modernCSS        from '../themes/modern.css?raw'
import institutionalCSS from '../themes/institutional.css?raw'
import paperCSS         from '../themes/paper.css?raw'
import brutalistCSS     from '../themes/brutalist.css?raw'
import bentoCSS         from '../themes/bento.css?raw'
import layoutsCSS       from '../layouts/layouts.css?raw'

// Assembled: defaults → base components → per-theme token overrides
const themesCSS = [
  contractCSS, baseCSS,
  cleanCSS, editorialCSS, terminalCSS, modernCSS,
  institutionalCSS, paperCSS, brutalistCSS, bentoCSS,
].join('\n')


// ─── FONT LOADING ───────────────────────────────────────────────────────────
// Every font family referenced by ANY theme must be loaded here. The export
// runs offline-friendly (single HTML file), so this single <link> covers all
// 8 themes' typographic needs.
//
// When adding a new theme: add its fonts (display, body, mono) to the URL.

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&family=Archivo+Narrow:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Serif:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inconsolata:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Montserrat:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=Poppins:wght@300;400;500;600;700&family=PT+Mono&family=Roboto:wght@300;400;500;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..600&display=swap" rel="stylesheet">`


// ─── STUDIO BAR CSS ─────────────────────────────────────────────────────────
// The style/layout switcher overlay shipped with every exported one-pager.
// It uses its own narrow palette (not theme tokens, not workshop tokens) so
// it looks consistent no matter which theme the user flips to.

const STUDIO_BAR_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #16161C; }
  .studio-bar {
    position: sticky; top: 0; z-index: 100;
    background: #0A0A0E; border-bottom: 1px solid #25252E;
    padding: 12px 24px; display: flex; gap: 22px; align-items: center; flex-wrap: wrap;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    color: #B5B5BD; font-size: 11px;
  }
  .studio-bar .grp { display: flex; gap: 4px; align-items: center; }
  .studio-bar .lbl {
    color: #6D6D78; text-transform: uppercase;
    margin-right: 8px; font-size: 9px; letter-spacing: 0.18em;
  }
  .studio-bar button {
    background: transparent; color: #B5B5BD; border: 1px solid #25252E;
    padding: 5px 10px; font-family: inherit; font-size: 10px;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; transition: all 0.12s;
  }
  .studio-bar button:hover { border-color: #C8FF00; color: #FFFFFF; }
  .studio-bar button.on {
    background: #C8FF00; color: #0A0A0E;
    border-color: #C8FF00; font-weight: 600;
  }
  .canvas { padding: 28px; min-height: calc(100vh - 60px); background: #16161C; }`


// ─── STUDIO BAR (style/layout switcher in exported one-pager) ───────────────

function renderStudioBar(p: ProFormaProject): string {
  const styleButtons = THEMES.map(t =>
    `<button data-style="${t.id}" class="${p.compose.style === t.id ? 'on' : ''}">${t.label}</button>`
  ).join('')
  const layoutButtons = LAYOUTS.map(l =>
    `<button data-layout="${l.id}" class="${p.compose.layout === l.id ? 'on' : ''}">${l.label}</button>`
  ).join('')

  return `
    <div class="studio-bar">
      <div class="grp"><span class="lbl">STYLE</span>${styleButtons}</div>
      <div class="grp"><span class="lbl">LAYOUT</span>${layoutButtons}</div>
    </div>`
}


// ─── TOGGLE SCRIPT (shipped with every one-pager) ──────────────────────────

const TOGGLE_SCRIPT = `
<script>
  (function(){
    var body = document.querySelector('.pf-sheet');
    document.querySelectorAll('[data-style]').forEach(function(btn){
      btn.addEventListener('click', function(){
        body.className = body.className.replace(/style-\\w+/, 'style-' + btn.dataset.style);
        document.querySelectorAll('[data-style]').forEach(function(b){ b.classList.toggle('on', b===btn); });
      });
    });
    document.querySelectorAll('[data-layout]').forEach(function(btn){
      btn.addEventListener('click', function(){
        body.className = body.className.replace(/layout-\\w+/, 'layout-' + btn.dataset.layout);
        document.querySelectorAll('[data-layout]').forEach(function(b){ b.classList.toggle('on', b===btn); });
      });
    });
  })();
<\/script>`


// ─── BLOCK RENDERERS ────────────────────────────────────────────────────────

function renderHeader(p: ProFormaProject): string {
  return `
    <div class="c-header">
      <div class="left">
        <span>${esc(p.meta.product)}</span>
        <span>${esc(p.meta.context)}</span>
      </div>
      <div class="right">
        <span class="a">${esc(p.meta.title)}</span>
        <span>${esc(p.meta.date)}</span>
      </div>
    </div>`
}

function renderHeadline(p: ProFormaProject): string {
  const headline = p.content.headline.replace(
    p.content.headlineAccent,
    `<span class="ac">${esc(p.content.headlineAccent)}</span>`
  )
  return `
    <div class="c-headline">
      <h1>${headline}</h1>
      <p class="deck">${p.content.deck}</p>
    </div>`
}

function renderSummaryCards(p: ProFormaProject, c: ComputedOutputs): string {
  const cons = c.scenarioResults.find(s => s.cssModifier === 'sc-cons')
  const opt  = c.scenarioResults.find(s => s.cssModifier === 'sc-opt')
  const rangeStr = (cons && opt)
    ? `${fmtMoneyS(cons.m24Net)} – ${fmtMoneyS(opt.m24Net)}`
    : fmtMoneyS(c.netM24)
  const values = [fmtMoneyS(c.costAdded24mo), `~${c.capacityFreedFTE.toFixed(1)} FTE`, rangeStr]
  const cards = p.content.summary.cards.map((card, i) => `
    <div class="card${card.focal ? ' focal' : ''}">
      <div class="lab">${esc(card.label)}</div>
      <div class="num">${values[i]}</div>
      <div class="sub">${esc(card.subtitle)}</div>
    </div>`).join('')
  return `<div class="c-summary">${cards}</div>`
}

function renderFunnel(p: ProFormaProject, c: ComputedOutputs): string {
  const f   = p.content.funnel
  const acq = p.locked.find(l => l.id === 'acquisitions')?.value ?? 0
  const stages = [
    { count: fmtCount(acq),             label: f.stageLabels[0] },
    { count: fmtCount(c.newTrials),     label: f.stageLabels[1] },
    { count: fmtCount(c.newPaid),       label: f.stageLabels[2] },
    { count: fmtCount(c.newRenewals),   label: f.stageLabels[3] },
  ]
  const rates = [
    `${p.assumptions.trialStart.toFixed(1)}%`,
    `${p.assumptions.trialPaid.toFixed(1)}%`,
    `${p.assumptions.renewal.toFixed(1)}%`,
  ]

  const flow = [0, 1, 2].map(i => `
    <div class="stage"><div class="cnt">${stages[i].count}</div><div class="lab">${esc(stages[i].label)}</div></div>
    <div class="step">
      <div class="rate">${rates[i]}</div>
      <div class="how">${esc(f.stepNotes[i].how)}</div>
      <div class="rc">${esc(f.stepNotes[i].rcNote)}</div>
    </div>`).join('') + `
    <div class="stage"><div class="cnt">${stages[3].count}</div><div class="lab">${esc(stages[3].label)}</div></div>`

  return `
    <div class="c-funnel">
      <div class="head">
        <div class="t">${f.title}</div>
        <div class="meta">${esc(f.meta)}</div>
      </div>
      <div class="flow">${flow}</div>
    </div>`
}

function renderChart(p: ProFormaProject, c: ComputedOutputs): string {
  const Y_ZERO   = 285
  const PX_PER_K = 280 / 5500
  const netToY   = (n: number) => Y_ZERO - n * PX_PER_K / 1000
  const monthToX = (t: number) => 50 + (t / 24) * 930

  const midPoints = c.chartPoints.map(pt =>
    `${monthToX(pt.month).toFixed(1)},${netToY(pt.net).toFixed(1)}`
  ).join(' ')

  function scenarioLine(m24Net: number): string {
    return Array.from({ length: 9 }, (_, i) => {
      const t = i * 3
      return `${monthToX(t).toFixed(1)},${netToY(m24Net * t / 24).toFixed(1)}`
    }).join(' ')
  }

  const cons = c.scenarioResults.find(s => s.cssModifier === 'sc-cons')
  const mid  = c.scenarioResults.find(s => s.cssModifier === 'sc-mid')
  const opt  = c.scenarioResults.find(s => s.cssModifier === 'sc-opt')

  const consLine = cons ? scenarioLine(cons.m24Net) : ''
  const optLine  = opt  ? scenarioLine(opt.m24Net)  : ''
  const rangePath = (cons && opt)
    ? `M${optLine.split(' ').join(' L')} L${consLine.split(' ').reverse().join(' L')} Z`
    : ''

  const bePoint = c.chartPoints.find((pt, i) => i > 0 && pt.net >= 0 && c.chartPoints[i - 1].net < 0)
  const beX = bePoint ? monthToX(bePoint.month) : null
  const endY = c.chartPoints.length ? netToY(c.chartPoints[c.chartPoints.length - 1].net) : Y_ZERO

  return `
    <div class="c-chart">
      <div class="head">
        <div class="t">${p.content.chart.title}</div>
        <div class="conclusion">${p.content.chart.conclusion}</div>
      </div>
      <svg class="pnl" viewBox="0 0 1020 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <line x1="50" y1="81"  x2="980" y2="81"  class="grid-h"/>
        <line x1="50" y1="183" x2="980" y2="183" class="grid-h"/>
        ${rangePath ? `<path class="range" d="${rangePath}"/>` : ''}
        ${consLine ? `<polyline class="l-cons" points="${consLine}"/>` : ''}
        ${optLine  ? `<polyline class="l-opt"  points="${optLine}"/>` : ''}
        <polyline class="l-mid" points="${midPoints}"/>
        <line x1="50" y1="285" x2="980" y2="285" class="zero"/>
        ${beX ? `<circle cx="${beX.toFixed(1)}" cy="285" r="4.5" class="be"/>
          <text x="${beX.toFixed(1)}" y="304" class="be-text" text-anchor="middle">MID · M${bePoint!.month.toFixed(1)}</text>` : ''}
        <g text-anchor="end">
          <text x="42" y="85"  class="ax-text">+$4M</text>
          <text x="42" y="187" class="ax-text">+$2M</text>
          <text x="42" y="289" class="ax-zero">$0</text>
        </g>
        <g text-anchor="middle">
          <text x="50"    y="328" class="ax-text">M0</text>
          <text x="282.5" y="328" class="ax-text">M6</text>
          <text x="515"   y="328" class="ax-text">M12</text>
          <text x="747.5" y="328" class="ax-text">M18</text>
          <text x="980"   y="328" class="ax-text">M24</text>
        </g>
        ${opt  ? `<text x="990" y="${(netToY(opt.m24Net) + 4).toFixed(1)}"  class="lbl-edge">OPT &nbsp;&nbsp;${opt.m24Net >= 0 ? '+' : ''}$${(opt.m24Net/1_000_000).toFixed(2)}M</text>` : ''}
        ${mid  ? `<text x="990" y="${(endY + 4).toFixed(1)}"                 class="lbl-mid" >MID &nbsp;${mid.m24Net >= 0 ? '+' : ''}$${(mid.m24Net/1_000_000).toFixed(2)}M</text>` : ''}
        ${cons ? `<text x="990" y="${(netToY(cons.m24Net) + 4).toFixed(1)}" class="lbl-edge">CONS ${cons.m24Net >= 0 ? '+' : ''}$${(cons.m24Net/1_000).toFixed(0)}K</text>` : ''}
      </svg>
    </div>`
}

function renderScenarios(p: ProFormaProject, c: ComputedOutputs): string {
  const cols = c.scenarioResults.map(sc => `
    <div class="sc ${sc.cssModifier}">
      <div class="name">${esc(sc.name)}</div>
      <div class="pb-l">payback</div>
      <div class="pb">${sc.paybackMonth ? `M${sc.paybackMonth.toFixed(1)}` : '> M24'}</div>
      <div class="m24-l">M24 net</div>
      <div class="m24">${fmtMoneyS(sc.m24Net)}</div>
      <div class="lev">${esc(sc.leverage)}</div>
    </div>`).join('')

  return `
    <div class="c-scenarios">
      <div class="head">
        <div class="t">${p.content.scenarios.title}</div>
        <div class="meta">${esc(p.content.scenarios.meta)}</div>
      </div>
      <div class="grid-3">${cols}</div>
    </div>`
}

function renderPosition(p: ProFormaProject, c: ComputedOutputs): string {
  const items = p.content.position.items.map((item: BuyItem) => `
    <li>
      <span><span class="${item.type === 'plus' ? 'plus' : 'x'}">${item.type === 'plus' ? '+' : '×'}</span> ${esc(item.text)}</span>
      <span class="tag">${esc(item.tag)}</span>
    </li>`).join('')

  return `
    <div class="c-position">
      <div class="lead">
        <div class="label">${esc(p.content.position.lineItemLabel)}</div>
        <div class="big">${fmtMoneyS(c.costAdded24mo)}</div>
        <div class="sub">${p.content.position.subText}</div>
      </div>
      <div class="buys">
        <div class="label">${esc(p.content.position.buysLabel)}</div>
        <ul>${items}</ul>
      </div>
    </div>`
}

function renderExecution(p: ProFormaProject): string {
  const phases = p.content.execution.phases.map((ph: ExecutionPhase) => `
    <div class="ph">
      <div class="lab">${esc(ph.label)}<span class="w"> · ${esc(ph.window)}</span></div>
      <div class="nm">${esc(ph.name)}</div>
      <div class="bd">${ph.body}</div>
    </div>`).join('')

  return `
    <div class="c-execution">
      <div class="head">
        <div class="t">${p.content.execution.title}</div>
        <div class="meta">${esc(p.content.execution.meta)}</div>
      </div>
      <div class="phases">${phases}</div>
    </div>`
}

function renderAsk(p: ProFormaProject): string {
  const a = p.content.ask
  return `
    <div class="c-ask">
      <div class="ca-rec">${esc(a.recommendation)}</div>
      <div class="ca-grid">
        <div class="ca-item">
          <div class="ca-label">What we're asking for</div>
          <div class="ca-body">${esc(a.ask)}</div>
        </div>
        <div class="ca-item">
          <div class="ca-label">What yes unlocks</div>
          <div class="ca-body">${esc(a.whatYesUnlocks)}</div>
        </div>
        <div class="ca-item">
          <div class="ca-label">Cost of delay</div>
          <div class="ca-body">${esc(a.costOfDelay)}</div>
        </div>
      </div>
    </div>`
}

function renderFooter(p: ProFormaProject): string {
  return `
    <div class="c-footer">
      <span class="tag">notes</span>${esc(p.content.footer)}
    </div>`
}


// ─── BLOCK DISPATCH ────────────────────────────────────────────────────────

const RENDERERS: Record<string, (p: ProFormaProject, c: ComputedOutputs) => string> = {
  header:    (p)    => renderHeader(p),
  headline:  (p)    => renderHeadline(p),
  summary:   (p, c) => renderSummaryCards(p, c),
  funnel:    (p, c) => renderFunnel(p, c),
  chart:     (p, c) => renderChart(p, c),
  scenarios: (p, c) => renderScenarios(p, c),
  position:  (p, c) => renderPosition(p, c),
  execution: (p)    => renderExecution(p),
  ask:       (p)    => renderAsk(p),
  footer:    (p)    => renderFooter(p),
}


// ─── MAIN EXPORT ───────────────────────────────────────────────────────────

export function generateOnePager(project: ProFormaProject): string {
  const c           = compute(project)
  const themeClass  = THEMES.find(t => t.id === project.compose.style)?.cssClass   ?? 'style-clean'
  const layoutClass = LAYOUTS.find(l => l.id === project.compose.layout)?.cssClass ?? 'layout-mag'

  const blocks = project.compose.blocks
    .filter(id => RENDERERS[id])
    .map(id => RENDERERS[id](project, c))
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(project.meta.title)}</title>
  ${FONTS}
  <style>
${STUDIO_BAR_CSS}
${themesCSS}
${layoutsCSS}
  </style>
</head>
<body>
${renderStudioBar(project)}
<div class="canvas">
  <div class="pf-sheet ${themeClass} ${layoutClass}">
    <div class="pf-sheet-main">
${blocks}
    </div>
  </div>
</div>
${TOGGLE_SCRIPT}
</body>
</html>`
}


// ─── DOWNLOAD HELPER ───────────────────────────────────────────────────────

export function downloadOnePager(project: ProFormaProject) {
  const html     = generateOnePager(project)
  const slug     = project.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const filename = `${slug || 'proforma'}.html`
  const blob     = new Blob([html], { type: 'text/html' })
  const a        = document.createElement('a')
  a.href         = URL.createObjectURL(blob)
  a.download     = filename
  a.click()
  URL.revokeObjectURL(a.href)
}


// ─── UTILITY ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
