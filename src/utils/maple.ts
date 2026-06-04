/**
 * Convert the LaTeX form of a formula into Maple-ready input.
 *
 * The LaTeX strings are structured (\dfrac, \sqrt, \cos, _{}, ^{}, \Delta ...),
 * which makes them a far more reliable source than the loose `equation` text.
 */

const GREEK_WORDS = [
  'theta',
  'vartheta',
  'omega',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'lambda',
  'mu',
  'nu',
  'rho',
  'sigma',
  'tau',
  'phi',
  'varphi',
  'psi',
  'chi',
  'varepsilon',
  'epsilon',
  'eta',
  'kappa',
  'xi',
  'zeta',
  'Omega',
  'Theta',
  'Phi',
  'Psi',
  'Gamma',
  'Lambda',
];

const UNICODE_GREEK: Array<[string, string]> = [
  ['θ', 'theta'],
  ['ω', 'omega'],
  ['α', 'alpha'],
  ['β', 'beta'],
  ['γ', 'gamma'],
  ['τ', 'tau'],
  ['ρ', 'rho'],
  ['σ', 'sigma'],
  ['μ', 'mu'],
  ['λ', 'lambda'],
  ['φ', 'phi'],
  ['η', 'eta'],
  ['Σ', ''],
  ['Δ', 'Delta'],
];

const SUPERSCRIPTS: Array<[string, string]> = [
  ['²', '^2'],
  ['³', '^3'],
  ['⁴', '^4'],
  ['⁵', '^5'],
  ['⁶', '^6'],
  ['⁷', '^7'],
  ['⁸', '^8'],
  ['⁹', '^9'],
  ['¹', '^1'],
  ['⁰', '^0'],
];

function readBraceGroup(input: string, braceIndex: number): { content: string; end: number } {
  let depth = 0;
  for (let i = braceIndex; i < input.length; i++) {
    if (input[i] === '{') depth++;
    else if (input[i] === '}') {
      depth--;
      if (depth === 0) return { content: input.slice(braceIndex + 1, i), end: i };
    }
  }
  return { content: input.slice(braceIndex + 1), end: input.length };
}

function replaceFractions(input: string): string {
  const re = /\\(?:dfrac|tfrac|frac)\s*\{/;
  let s = input;
  let guard = 0;
  let match = re.exec(s);
  while (match && guard++ < 400) {
    const braceStart = match.index + match[0].length - 1;
    const numerator = readBraceGroup(s, braceStart);
    let j = numerator.end + 1;
    while (s[j] === ' ') j++;
    if (s[j] !== '{') break;
    const denominator = readBraceGroup(s, j);
    s = `${s.slice(0, match.index)}((${numerator.content})/(${denominator.content}))${s.slice(denominator.end + 1)}`;
    match = re.exec(s);
  }
  return s;
}

function replaceSqrt(input: string): string {
  const re = /\\sqrt\s*\{/;
  let s = input;
  let guard = 0;
  let match = re.exec(s);
  while (match && guard++ < 400) {
    const braceStart = match.index + match[0].length - 1;
    const group = readBraceGroup(s, braceStart);
    s = `${s.slice(0, match.index)} sqrt(${group.content})${s.slice(group.end + 1)}`;
    match = re.exec(s);
  }
  return s;
}

function finalizeExpression(expr: string): string {
  let e = expr;
  for (const [symbol, replacement] of SUPERSCRIPTS) {
    e = e.split(symbol).join(replacement);
  }
  e = e.replace(/·/g, '*').replace(/−/g, '-');
  e = e.replace(/\s+/g, ' ').trim();
  // Insert explicit multiplication between adjacent value tokens separated by space.
  for (let pass = 0; pass < 4; pass++) {
    e = e.replace(/([0-9A-Za-z_)\]])\s+(?=[0-9A-Za-z_(])/g, '$1*');
  }
  e = e.replace(/\s+/g, '');
  e = e.replace(/\)\(/g, ')*(');
  // number directly before "(" implies multiplication, but keep function calls intact.
  e = e.replace(/([0-9])\(/g, '$1*(');
  return e;
}

/** Returns one Maple equation string per relation in the formula. */
export function latexToMapleEquations(latex: string): string[] {
  let s = latex;

  s = s.replace(/\{,\}/g, '.');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\!/g, '');
  s = s.replace(/\\[,;:]/g, ' ');
  s = s.replace(/\\ /g, ' ');
  s = s.replace(/~/g, ' ');
  s = s.replace(/\\qquad|\\quad/g, ' ');
  s = s.replace(/\\cdot|\\times/g, '*');

  // Protect inequality operators so the later split on "=" never breaks them.
  s = s.replace(/\\leq|≤/g, '\u0001');
  s = s.replace(/\\geq|≥/g, '\u0002');
  s = s.replace(/\\neq|≠/g, '\u0003');

  s = s.replace(/\\(?:vec|hat|bar|overline|overrightarrow|dot|ddot)\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\(?:vec|hat|bar|dot|ddot)\s*([A-Za-z])/g, '$1');
  s = s.replace(/\\(?:text|mathrm|mathit|operatorname)\s*\{([^{}]*)\}/g, '$1');

  // Strip big operators together with their limits (\int_{a}^{b}, \sum_i ...).
  s = s.replace(/\\(?:sum|int|prod|oint)(?:_\{[^{}]*\}|_[A-Za-z0-9])?(?:\^\{[^{}]*\}|\^[A-Za-z0-9])?/g, ' ');

  // Subscript labels that are LaTeX words, e.g. F_{\parallel}.
  s = s.replace(/\\parallel/g, 'par').replace(/\\perp/g, 'perp');

  s = replaceFractions(s);
  s = replaceSqrt(s);

  // Trig / log with an immediate greek or letter argument, e.g. \cos\theta.
  // Leading spaces below mark multiplication boundaries (e.g. v_0\cos -> v_0 cos).
  s = s.replace(
    /\\(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp)\s*\\([A-Za-z]+)/g,
    (_match, fn: string, arg: string) => ` ${fn}(${arg})`,
  );
  s = s.replace(/\\(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp)/g, ' $1');

  // Delta + variable becomes a single Maple identifier.
  s = s.replace(/\\Delta\s*([A-Za-z])/g, ' Delta_$1');
  s = s.replace(/Δ\s*([A-Za-z])/g, ' Delta_$1');

  s = s.replace(/\\pi/g, ' Pi').replace(/π/g, ' Pi');

  // Negative lookahead (not \b) so trailing subscripts like \mu_k survive.
  for (const word of GREEK_WORDS) {
    s = s.replace(new RegExp(`\\\\${word}(?![A-Za-z])`, 'g'), ` ${word}`);
  }

  s = s.replace(/\\sum|\\int|\\prod|\\partial/g, '');

  for (const [unicode, replacement] of UNICODE_GREEK) {
    s = s.split(unicode).join(replacement ? ` ${replacement}` : '');
  }

  s = s.replace(/_\{([^{}]*)\}/g, '_$1');
  s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');

  // Drop any leftover LaTeX commands and stray braces.
  s = s.replace(/\\[A-Za-z]+/g, '');
  s = s.replace(/[{}]/g, '');

  const restore = (value: string) => value.replace(/\u0001/g, '<=').replace(/\u0002/g, '>=').replace(/\u0003/g, '<>');

  const equations: string[] = [];
  for (const rawSegment of s.split(',')) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    if (segment.includes('=')) {
      const sides = segment.split('=').map((side) => finalizeExpression(side)).filter(Boolean);
      if (sides.length < 2) continue;
      for (let i = 1; i < sides.length; i++) {
        equations.push(restore(`${sides[0]} = ${sides[i]}`));
      }
      continue;
    }

    const marker = segment.includes('\u0001')
      ? { char: '\u0001', op: '<=' }
      : segment.includes('\u0002')
        ? { char: '\u0002', op: '>=' }
        : segment.includes('\u0003')
          ? { char: '\u0003', op: '<>' }
          : null;
    if (marker) {
      const sides = segment.split(marker.char).map((side) => finalizeExpression(side)).filter(Boolean);
      if (sides.length === 2) equations.push(`${sides[0]} ${marker.op} ${sides[1]}`);
    }
  }
  return equations;
}

/**
 * Build a copy/paste-ready Maple snippet.
 * @param latex formula LaTeX
 * @param constantAssignments lines like `g := 9.82;`
 */
export function buildMapleSnippet(latex: string, constantAssignments: string[] = []): string {
  const equations = latexToMapleEquations(latex);
  if (!equations.length) return '';

  const FUNCTION_NAMES = new Set(['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'exp', 'sqrt']);
  const RESERVED = new Set(['Pi', 'true', 'false']);
  const symbols = new Set<string>();

  for (const equation of equations) {
    const tokens = equation.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? [];
    for (const token of tokens) {
      if (FUNCTION_NAMES.has(token) || RESERVED.has(token)) continue;
      symbols.add(token);
    }
  }

  const lines: string[] = [];
  if (symbols.size > 0) {
    lines.push(`unassign(${[...symbols].sort().map((symbol) => `'${symbol}'`).join(', ')}):`);
  }

  if (constantAssignments.length > 0) {
    const assignments = constantAssignments
      .map((line) => line.trim().replace(/[;:]$/, ''))
      .filter(Boolean)
      .map((line) => `${line}:`);
    lines.push(...assignments, '');
  }

  const equationAssignments = equations.map((equation, index) => `eq${index + 1} := ${equation}:`);
  lines.push(...equationAssignments);
  return lines.join('\n');
}
