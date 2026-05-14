import type { ProFormaProject } from './schema'
import { defaultBlockIds } from './blocks/registry'

export const defaultProject: ProFormaProject = {
  meta: {
    title:    'Subscription management · 24-mo forecast',
    subtitle: 'RC replacement',
    product:  'EveryDollar / Ramsey',
    team:     'Platform',
    date:     'May 2026',
    context:  'RC replacement',
  },

  locked: [
    { id: 'acquisitions',  label: 'Acquisitions / yr',       value: 2_000_000, unit: '' },
    { id: 'renewalPrice',  label: 'Renewal price',           value: 79,        unit: '$' },
    { id: 'rcDiscountY1',  label: 'RC fee · Y1 discounted',  value: 163_000,   unit: '$' },
    { id: 'rcAnnualFee',   label: 'RC fee · Y2+ standard',   value: 232_000,   unit: '$' },
    { id: 'migrationY1',   label: 'Migration build · Y1',    value: 11_000,    unit: '$' },
  ],

  baseline: {
    trialStart: 9.5,
    trialPaid:  60,
    renewal:    47,
  },

  assumptions: {
    trialStart: 9.5,
    trialPaid:  60,
    renewal:    47,
  },

  scenarios: [
    { id: 'cons', name: 'Conservative', cssModifier: 'sc-cons', trialStartDelta: 0.5, trialPaidDelta: 1,  renewalDelta: 2 },
    { id: 'mid',  name: 'Mid',          cssModifier: 'sc-mid',  trialStartDelta: 1,   trialPaidDelta: 3,  renewalDelta: 4 },
    { id: 'opt',  name: 'Optimistic',   cssModifier: 'sc-opt',  trialStartDelta: 2,   trialPaidDelta: 5,  renewalDelta: 6 },
  ],

  laborTypes: [
    // Adding a new labor type (e.g. Marketing) = add an entry here.
    // Compute and UI both iterate this array — no other changes needed.
    { id: 'engineering', label: 'Engineering', hourlyRate: 78, hoursPerMonth: 160 },
  ],

  laborComponents: [
    { id: 'subservice', name: 'Sub Service',       note: null,                 laborTypeId: 'engineering', today: 25, p3: 8,  max: 60 },
    { id: 'sca',        name: 'SCA checkout',      note: 'stays',              laborTypeId: 'engineering', today: 30, p3: 21, max: 60 },
    { id: 'webhooks',   name: 'Webhooks',          note: null,                 laborTypeId: 'engineering', today: 18, p3: 7,  max: 40 },
    { id: 'webpaywall', name: 'Web paywall',       note: 'new lever',          laborTypeId: 'engineering', today: 2,  p3: 4,  max: 30 },
    { id: 'authx',      name: 'AuthX',             note: 'retires sub path',   laborTypeId: 'engineering', today: 25, p3: 1,  max: 60 },
    { id: 'ufan',       name: 'UFan trio',         note: null,                 laborTypeId: 'engineering', today: 30, p3: 15, max: 60 },
    { id: 'voucher',    name: 'Voucher stack',     note: null,                 laborTypeId: 'engineering', today: 22, p3: 15, max: 50 },
    { id: 'avalara',    name: 'Avalara lambda',    note: 'tear-down',          laborTypeId: 'engineering', today: 15, p3: 2,  max: 40 },
    { id: 'stripe',     name: 'Stripe',            note: 'new integration',    laborTypeId: 'engineering', today: 5,  p3: 8,  max: 30 },
  ],

  content: {
    headline:       'Subscription management,',
    headlineAccent: 'restated.',
    deck: 'Replacing the in-house platform with RevenueCat. Three things change: the budget line, the engineering capacity available, the revenue capabilities at the funnel. Cost is locked. Revenue is scenario-modeled. Capacity reallocates the moment work stops.',

    summary: {
      cards: [
        { label: 'Cost added',      subtitle: 'cumulative over 24 months · locked, not a forecast',                  focal: false },
        { label: 'Capacity freed',  subtitle: 'per year · engineering hours redeployable to roadmap work',           focal: false },
        { label: 'Revenue upside',  subtitle: 'range across three positions · M24 net P&L · scenario-modeled',       focal: true  },
      ],
    },

    funnel: {
      title: 'Funnel as it stands <span class="a">/</span> where RC capabilities apply',
      meta:  '~static year over year · $79 renewal',
      stepNotes: [
        { how: 'trial-start · 7d',         rcNote: 'RC: paywall · offering · A/B' },
        { how: 'trial → paid · 15d',       rcNote: 'RC: in-trial · pricing tests' },
        { how: 'renew y/y',                rcNote: 'RC: recovery · dunning' },
      ],
      stageLabels: ['acquired / yr', 'trial starts / yr', 'paid conv / yr', 'renewals / yr'],
    },

    chart: {
      title:      'Net P&amp;L over 24 months — three positions on RC\'s lift potential',
      conclusion: 'All three positions pay back inside <span class="em">month 8</span>. The mid case nets <span class="em">+$2.26M</span> by M24. The conservative-to-optimistic range sits in the shaded band.',
    },

    scenarios: {
      title: 'Three positions <span class="a">/</span> combined lift across trial-start · trial→paid · renewal',
      meta:  'modeled 5–20% relative · RC studies cite 42–81%',
    },

    position: {
      lineItemLabel: 'subscription management line item — what changes',
      subText: '<span class="v">Y1 +$174K</span> (RC fee discounted, labor not yet bending) · <span class="v">Y2 +$201K</span> (RC at full $232K/yr, labor down to ~$70K)',
      buysLabel: 'what $375K buys / retires',
      items: [
        { text: 'marketer-operated paywall',    tag: 'new capability', type: 'plus' },
        { text: 'trial→paid experimentation',   tag: 'new capability', type: 'plus' },
        { text: 'recovery / dunning on Stripe', tag: 'new lever',      type: 'plus' },
        { text: 'AuthX off sub path',           tag: 'M9',             type: 'x'    },
        { text: 'legacy C# subscription service', tag: 'sunset M10',   type: 'x'    },
        { text: 'Avalara lambda tear-down',     tag: 'in flight',      type: 'x'    },
      ],
    },

    execution: {
      title: 'Execution path <span style="color:var(--accent)">/</span> three phases',
      meta:  '30–65 eng days · 3 engineers · ideal M12 · max M24',
      phases: [
        {
          label: 'P1', window: 'M0 → M3', name: 'Test',
          body: 'RC in test envs. Segment, AppsFlyer, Stripe fan-out wired. <span class="v">Nothing removed.</span>',
        },
        {
          label: 'P2', window: 'M3 → M9', name: 'Live + dual authority',
          body: 'Paywall <span class="a">M3</span>. Entitlements <span class="a">M5</span>. Stripe fan-out <span class="a">M7</span>. AuthX off <span class="a">M9</span>.',
        },
        {
          label: 'P3', window: 'M9 → M24', name: 'Global, or not',
          body: '<span class="v">Option B</span> at M9 — multi-BU or stay E$. C# sunset <span class="a">M10</span>. Steady from M12.',
        },
      ],
    },

    footer: 'Funnel: Ramsey internal data, last 4 quarters · 2M acquisitions × 9.5% × 60% × 47% × $79. Combined run-rates: Conservative $804K/yr (+$474K / +$150K / +$180K per lever), Mid $1.76M/yr, Optimistic $3.19M/yr. RC case studies cite 42–81% lift; modeled 5–20% relative per lever. Cost: Y1 +$174K, Y2 +$201K · RC fee $163K Y1 / $232K Y2+ per order form 9 Apr 2026. FTE = 160 hrs/mo at $150K/yr loaded; ~0.8 FTE freed = current ~1.4 FTE → ~0.6 FTE in Y2. Recurly off the table.',
  },

  compose: {
    blocks: defaultBlockIds,
    layout: 'mag',
    style:  'terminal',
  },
}
