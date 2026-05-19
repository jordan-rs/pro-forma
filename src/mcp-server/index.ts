import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  ensureRunning, broadcastState, isRunning, getUrl, getPort,
  getIdleMinutes, minutesUntilClose, extendLifetime, resetActivity, stopServer,
} from './httpServer'
import { getState, mergeState } from './briefState'
import { computeBriefScenarios } from './computeBridge'

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const INSTRUCTIONS = `
You are helping the user build a ProForma decision brief. The brief has four acts:
  Act I   — The Bet: the decision question stated boldly
  Act II  — Why It Works: the variables and formula that model the payoff
  Act III — When We Know: computed scenario outcomes (payback month, M24 net)
  Act IV  — The Decision: recommendation, ask, what yes unlocks, cost of delay

Your job:
1. Call ensure_app_running. Tell the user the URL. Ask them to open it in a browser.
2. Ask: "What decision are you trying to make, and what's the initiative behind it?"
3. From their answer, extract:
   - Key variables (uncertain things that affect the outcome)
   - Conservative / base / optimistic values for each variable
   - A formula that computes annual payoff from those variables
   - Total cost: year 1 and year 2+
4. Call update_brief with variables + formula + costs + meta.
5. Call get_brief_computed. Read the payback month and M24 net.
6. Use those numbers to write Act IV (recommendation, ask, what yes unlocks, cost of delay).
7. Call update_brief again with the full narrative content.
8. Tell the user: "Your brief is ready. You can adjust any values directly in the form, then export."

Variable naming rules:
- Names must be valid identifiers: letters, numbers, underscores, no spaces
- Use descriptive names: trial_start_rate, not tsr
- Always provide three values (low, base, high) — never just a point estimate
- If the user gives one number, estimate ±20% as a starting range and say so

Formula rules:
- Only + − * / and parentheses
- Result should be annual revenue uplift (positive = benefit)
- Costs go in costY1/costY2 fields, not the formula

If the decision doesn't have a clean numeric payoff (brand, hiring, etc.), say so and suggest Canvas mode instead.
`.trim()

// ─── INPUT SCHEMAS ────────────────────────────────────────────────────────────

const variableSchema = z.object({
  id:    z.string().optional(),
  name:  z.string().describe('Identifier used in formula — letters/numbers/underscores only'),
  label: z.string().describe('Human-readable name'),
  unit:  z.string().optional().default('').describe('Display suffix: $, %, users, etc.'),
  base:  z.number().describe('Most-likely value'),
  low:   z.number().describe('Conservative / pessimistic value'),
  high:  z.number().describe('Optimistic value'),
})

const updateBriefSchema = z.object({
  meta: z.object({
    title:   z.string().optional(),
    product: z.string().optional(),
    context: z.string().optional(),
    date:    z.string().optional().describe('ISO date string, e.g. 2026-05-19'),
  }).optional(),

  variables: z.array(variableSchema).optional().describe(
    'Replaces the entire variable list. Omit to leave existing variables unchanged.'
  ),

  revenueFormula: z.string().optional().describe(
    'Arithmetic expression over variable names: + - * / and parens only. Evaluates to annual revenue uplift.'
  ),

  costY1: z.number().optional().describe('Total incremental cost, Year 1 ($)'),
  costY2: z.number().optional().describe('Total incremental cost, Year 2+ ($). Defaults to costY1 if omitted.'),

  content: z.object({
    decision:       z.string().optional().describe('Act I — the bet / decision question. State it boldly.'),
    mechanism:      z.string().optional().describe('Act II — how this creates value. One or two sentences.'),
    recommendation: z.string().optional().describe('Act IV — the recommendation statement.'),
    ask:            z.string().optional().describe('What approval or budget is being sought.'),
    whatYesUnlocks: z.string().optional().describe('Concrete outcomes of a yes decision.'),
    costOfDelay:    z.string().optional().describe('What waiting costs per month or quarter.'),
    footer:         z.string().optional().describe('Assumptions, caveats, attributions.'),
  }).optional(),

  compose: z.object({
    style:  z.string().optional().describe('Theme id: clean, studio, terminal, contract'),
    layout: z.string().optional().describe('Layout id: narrative, mag'),
  }).optional(),
})

// ─── SERVER SETUP ─────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: 'proforma-brief', version: '1.0.0' },
  { instructions: INSTRUCTIONS },
)

// ─── TOOLS ────────────────────────────────────────────────────────────────────

server.registerTool('ensure_app_running', {
  description: 'Start the ProForma Brief web app and return its URL. Call this before any other tool.',
}, async () => {
  const { url, port, started } = await ensureRunning()
  resetActivity()
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ url, port, status: started ? 'started' : 'already_running' }),
    }],
  }
})

server.registerTool('update_brief', {
  description: 'Set brief variables, formula, costs, and/or narrative content. Deep-merges into current state; arrays replace entirely.',
  inputSchema: updateBriefSchema,
}, async (input) => {
  await ensureRunning()
  resetActivity()

  // Assign IDs to new variables that lack them
  if (input.variables) {
    input.variables = input.variables.map((v, i) => ({
      ...v,
      id: v.id ?? `v-${Date.now()}-${i}`,
      unit: v.unit ?? '',
    }))
  }

  const updated = mergeState(input as Parameters<typeof mergeState>[0])
  broadcastState()

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ ok: true, briefState: updated }),
    }],
  }
})

server.registerTool('get_brief_computed', {
  description: 'Run the payoff formula through the compute kernel three times (low/base/high). Returns payback month and M24 net for each scenario.',
}, async () => {
  resetActivity()
  const result = computeBriefScenarios(getState())
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(result),
    }],
  }
})

server.registerTool('get_app_status', {
  description: 'Check whether the web app is running, its URL, and how much idle time remains.',
}, async () => {
  const running = isRunning()
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        running,
        url: getUrl(),
        port: getPort(),
        idleMinutes: running ? getIdleMinutes() : null,
        minutesUntilClose: running ? minutesUntilClose() : null,
      }),
    }],
  }
})

server.registerTool('extend_lifetime', {
  description: 'Push the web app idle timer out. Default 30 minutes.',
  inputSchema: z.object({
    minutes: z.number().default(30).describe('How many minutes to extend the idle timeout'),
  }),
}, async (input) => {
  extendLifetime(input.minutes)
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ ok: true, extendedMinutes: input.minutes }),
    }],
  }
})

server.registerTool('close_app', {
  description: 'Stop the web app HTTP server and free the port.',
}, async () => {
  stopServer()
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ ok: true }),
    }],
  }
})

// ─── TRANSPORT ────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(err => {
  process.stderr.write(String(err) + '\n')
  process.exit(1)
})
