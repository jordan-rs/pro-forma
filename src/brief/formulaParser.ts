// ─── FORMULA PARSER ──────────────────────────────────────────────────────────
// Parses simple arithmetic over variable names and numeric literals.
// Supported: identifiers, numbers, + - * / ( )  — nothing else.
// "Anything more complex belongs in Canvas" — the grammar boundary is intentional.
//
// Grammar:
//   expr   := term   (( '+' | '-' ) term)*
//   term   := factor (( '*' | '/' ) factor)*
//   factor := '-' factor | '(' expr ')' | number | identifier

// ─── PUBLIC TYPES ─────────────────────────────────────────────────────────────

export type EvalFn = (vars: Record<string, number>) => number

export type ParseResult =
  | { ok: true;  fn: EvalFn; refs: string[] }
  | { ok: false; error: string }

// ─── TOKENIZER ────────────────────────────────────────────────────────────────

type Token =
  | { type: 'num';    value: number; text: string }
  | { type: 'ident';  name: string;  text: string }
  | { type: 'op';     char: '+' | '-' | '*' | '/'; text: string }
  | { type: 'lparen'; text: '(' }
  | { type: 'rparen'; text: ')' }

function tokenize(input: string): Token[] | string {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const c = input[i]

    if (/\s/.test(c)) { i++; continue }

    // Number (integer or decimal)
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let raw = ''
      while (i < input.length && /[0-9.]/.test(input[i])) raw += input[i++]
      const val = parseFloat(raw)
      if (isNaN(val)) return `Invalid number: "${raw}"`
      tokens.push({ type: 'num', value: val, text: raw })
      continue
    }

    // Identifier (variable name)
    if (/[a-zA-Z_]/.test(c)) {
      let name = ''
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) name += input[i++]
      tokens.push({ type: 'ident', name, text: name })
      continue
    }

    // Operators
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ type: 'op', char: c as '+' | '-' | '*' | '/', text: c })
      i++
      continue
    }

    if (c === '(') { tokens.push({ type: 'lparen', text: '(' }); i++; continue }
    if (c === ')') { tokens.push({ type: 'rparen', text: ')' }); i++; continue }

    return `Unexpected character: "${c}"`
  }

  return tokens
}

// ─── RECURSIVE DESCENT PARSER ────────────────────────────────────────────────

class Parser {
  pos = 0

  constructor(
    private readonly tokens: Token[],
    private readonly refs: string[],
  ) {}

  peek(): Token | undefined { return this.tokens[this.pos] }

  consume(): Token {
    const t = this.tokens[this.pos]
    if (!t) throw new Error('Unexpected end of expression')
    this.pos++
    return t
  }

  parseExpr(): EvalFn {
    let left = this.parseTerm()
    for (;;) {
      const t = this.peek()
      if (t?.type !== 'op' || (t.char !== '+' && t.char !== '-')) break
      this.consume()
      const right = this.parseTerm()
      if (t.char === '+') { const l = left, r = right; left = v => l(v) + r(v) }
      else                { const l = left, r = right; left = v => l(v) - r(v) }
    }
    return left
  }

  parseTerm(): EvalFn {
    let left = this.parseFactor()
    for (;;) {
      const t = this.peek()
      if (t?.type !== 'op' || (t.char !== '*' && t.char !== '/')) break
      this.consume()
      const right = this.parseFactor()
      if (t.char === '*') {
        const l = left, r = right
        left = v => l(v) * r(v)
      } else {
        const l = left, r = right
        left = v => {
          const d = r(v)
          if (d === 0) throw new Error('Division by zero')
          return l(v) / d
        }
      }
    }
    return left
  }

  parseFactor(): EvalFn {
    const t = this.peek()
    if (!t) throw new Error('Expected an expression')

    // Unary minus
    if (t.type === 'op' && t.char === '-') {
      this.consume()
      const inner = this.parseFactor()
      return v => -inner(v)
    }

    // Parenthesised expression
    if (t.type === 'lparen') {
      this.consume()
      const inner = this.parseExpr()
      const close = this.consume()
      if (close.type !== 'rparen') throw new Error('Expected closing parenthesis')
      return inner
    }

    // Number literal
    if (t.type === 'num') {
      this.consume()
      return () => t.value
    }

    // Variable reference
    if (t.type === 'ident') {
      this.consume()
      this.refs.push(t.name)
      const name = t.name
      return v => {
        if (!(name in v)) throw new Error(`Unknown variable: "${name}"`)
        return v[name]
      }
    }

    throw new Error(`Unexpected token: "${t.text}"`)
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export function parseFormula(formula: string): ParseResult {
  const trimmed = formula.trim()
  if (!trimmed) return { ok: false, error: 'Formula is empty' }

  const tokens = tokenize(trimmed)
  if (typeof tokens === 'string') return { ok: false, error: tokens }

  const refs: string[] = []
  const parser = new Parser(tokens, refs)

  try {
    const fn = parser.parseExpr()
    if (parser.pos < tokens.length) {
      return { ok: false, error: `Unexpected token: "${tokens[parser.pos].text}"` }
    }
    return { ok: true, fn, refs: [...new Set(refs)] }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Convenience: parse once, evaluate with given variable values.
// Returns the numeric result or an error string.
export function evalFormula(formula: string, vars: Record<string, number>): number | string {
  if (!formula.trim()) return 0

  const parsed = parseFormula(formula)
  if (!parsed.ok) return parsed.error

  try {
    return parsed.fn(vars)
  } catch (e) {
    return (e as Error).message
  }
}
