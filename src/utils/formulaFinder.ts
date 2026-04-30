import type { Formula, Variable } from '../data/types';
import { formulas } from '../data/formulas';

/** Canonical variable identifier — lowercase ascii-ish keys stable across LaTeX/symbol variants */
export type CanonicalVariableKey = string;

export type CanonicalVariableMeta = {
  key: CanonicalVariableKey;
  /** Prefer latex-like primary label */
  labelLaTeX: string;
  /** Short Danish-ish descriptor when consistent across occurrences */
  nameHint: string;
  /** Representative units when consistent */
  unitHint?: string;
  aliases: Set<string>;
};

export type FormulaVariableCanonicalRecord = {
  formulaId: string;
  canonicalKeys: Set<CanonicalVariableKey>;
};

export type FinderInputs = {
  /** Selected canonical keys that must all be present */
  givenKeys: CanonicalVariableKey[];
  /** Optional canonical key that must also appear (solve-for output) */
  outputKey?: CanonicalVariableKey | null;
};

export type FinderResult = {
  formula: Formula;
  score: number;
  canonicalKeysInFormula: CanonicalVariableKey[];
};

/** Prefer these keys first in the picker (readable exam symbols). Rest follow alphabetically by label. */
export const CURATED_VARIABLE_ORDER: CanonicalVariableKey[] = [
  'v',
  'v_0',
  'v_1',
  'a',
  't',
  'T',
  'x',
  'y',
  'z',
  'theta',
  'm',
  'F',
  'N',
  'g',
  'mu',
  'mu_k',
  'mu_s',
  'W',
  'K',
  'U',
  'Q',
  'p',
  'V',
  'n',
  'R',
  'omega',
  'alpha',
  'tau',
  'r',
  'I',
  'L',
  'delta_x',
  'delta_t',
  'h',
];

/** Explicit synonyms merged after normalization */
const SYNONYM_MERGE: Record<string, CanonicalVariableKey> = {
  θ: 'theta',
  ϑ: 'theta',
  ω: 'omega',
  Ω: 'Omega',
  μ: 'mu',
  ν: 'nu',
  ρ: 'rho',
  σ: 'sigma',
  τ: 'tau',
  π: 'pi',
  λ: 'lambda',
  φ: 'phi',
  ψ: 'psi',
  χ: 'chi',
  γ: 'gamma',
  η: 'eta',
  κ: 'kappa',
  ξ: 'xi',
  δ: 'delta',
};

const stripWrappers = (input: string): string => {
  let s = input.trim();
  while (s.startsWith('\\(') && s.endsWith('\\)')) {
    s = s.slice(2, -2).trim();
  }
  while (s.startsWith('\\[') && s.endsWith('\\]')) {
    s = s.slice(2, -2).trim();
  }
  return s;
};

const stripVecHatBar = (s: string): string =>
  s.replace(/\\vec\{([^}]*)\}/g, '$1').replace(/\\hat\{([^}]*)\}/g, '$1').replace(/\\bar\{([^}]*)\}/g, '$1');

/**
 * Normalize one LaTeX-ish fragment to a canonical variable key.
 */
export function normalizeToCanonicalKey(raw: string): CanonicalVariableKey {
  let s = stripWrappers(raw);
  s = stripVecHatBar(s);
  // Δx / \Delta x → delta_x (must run before generic \Delta stripping)
  s = s.replace(/Δ\s*([a-zA-Z])/g, 'delta_$1');
  s = s.replace(/\\Delta\s*([a-zA-Z])/g, 'delta_$1');

  // Common Greek commands → ascii tokens
  s = s.replace(/\\theta\b/gi, 'theta');
  s = s.replace(/\\Theta\b/g, 'Theta');
  s = s.replace(/\\omega\b/gi, 'omega');
  s = s.replace(/\\Omega\b/g, 'Omega');
  s = s.replace(/\\alpha\b/gi, 'alpha');
  s = s.replace(/\\beta\b/gi, 'beta');
  s = s.replace(/\\gamma\b/gi, 'gamma');
  s = s.replace(/\\delta\b/gi, 'delta');
  s = s.replace(/\\Delta\b/g, 'Delta');
  s = s.replace(/\\mu\b/gi, 'mu');
  s = s.replace(/\\sigma\b/gi, 'sigma');
  s = s.replace(/\\tau\b/gi, 'tau');
  s = s.replace(/\\rho\b/gi, 'rho');
  s = s.replace(/\\lambda\b/gi, 'lambda');
  s = s.replace(/\\nu\b/gi, 'nu');
  s = s.replace(/\\pi\b/gi, 'pi');
  s = s.replace(/\\varepsilon\b/gi, 'varepsilon');
  s = s.replace(/\\partial\b/gi, 'partial');

  // \text{avg} etc → _avg
  s = s.replace(/\\text\{([^}]*)\}/gi, '_$1');

  // Collapse whitespace
  s = s.replace(/\s+/g, '');
  s = s.replace(/^\,+|\,+$/g, '');

  // Unicode Greek letters sometimes appear raw in symbol field
  for (const [unicodeChar, replacement] of Object.entries(SYNONYM_MERGE)) {
    if (s.includes(unicodeChar)) {
      s = s.replace(new RegExp(unicodeChar, 'g'), replacement);
    }
  }

  // Braced superscripts/subscripts
  s = s.replace(/\^\{([^}]+)\}/g, '^$1');
  s = s.replace(/_\{([^}]+)\}/g, '_$1');

  // Delta x → delta_x (after Delta substitution)
  s = s.replace(/^delta([a-z])$/i, 'delta_$1');
  s = s.replace(/^Delta([a-z])$/i, 'delta_$1');

  // Letter + digits → letter_digits (v0 → v_0)
  s = s.replace(/^([a-z])([0-9]+)$/i, '$1_$2');

  // Merge Δ-prefixed remnants (keep Latin case — V vs v, T vs t)
  let merged = s.replace(/^delta(?=[a-z])/i, 'delta_').replace(/^delta__/, 'delta_');

  const lowerProbe = merged.toLowerCase();
  if (SYNONYM_MERGE[merged] ?? SYNONYM_MERGE[lowerProbe]) {
    merged = SYNONYM_MERGE[merged] ?? SYNONYM_MERGE[lowerProbe]!;
  }

  const isGreekWord = /^(theta|omega|alpha|beta|gamma|delta|sigma|tau|rho|lambda|nu|pi|phi|psi|chi|eta|kappa|xi|varepsilon|partial|Omega|Theta)$/;
  if (isGreekWord.test(merged)) {
    merged = merged.toLowerCase();
  } else if (/^[a-z]+$/i.test(merged) && merged.length > 1 && !merged.includes('_')) {
    merged = merged.toLowerCase();
  } else {
    merged = merged.replace(/([a-z])([A-Z])/g, '$1_$2');
  }

  const cleaned = merged.replace(/\\/g, '');

  return cleaned || 'unknown';
}

export function splitVariableFragments(variable: Variable): string[] {
  const primary = (variable.latex ?? variable.symbol).trim();
  if (primary.includes(',')) {
    return primary
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [primary];
}

function mergeCanonicalMeta(into: Map<CanonicalVariableKey, CanonicalVariableMeta>, key: CanonicalVariableKey, variable: Variable, fragment: string) {
  let meta = into.get(key);
  const labelPref = variable.latex ?? fragment;
  if (!meta) {
    meta = {
      key,
      labelLaTeX: labelPref,
      nameHint: variable.name,
      unitHint: variable.unit,
      aliases: new Set<string>(),
    };
    into.set(key, meta);
  }
  meta.aliases.add(fragment);
  meta.aliases.add(variable.symbol);
  if (variable.latex) meta.aliases.add(variable.latex);
  if (labelPref.length < meta.labelLaTeX.length || meta.labelLaTeX.includes(',')) {
    meta.labelLaTeX = labelPref;
  }
}

function curatedRank(key: CanonicalVariableKey): number {
  const idx = CURATED_VARIABLE_ORDER.indexOf(key);
  return idx === -1 ? 1000 + key.charCodeAt(0) : idx;
}

export function sortVariablesForPicker(metaList: CanonicalVariableMeta[]): CanonicalVariableMeta[] {
  return [...metaList].sort((a, b) => {
    const diff = curatedRank(a.key) - curatedRank(b.key);
    if (diff !== 0) return diff;
    return a.labelLaTeX.localeCompare(b.labelLaTeX, 'da');
  });
}

export function buildFormulaFinderIndex(allFormulas: Formula[]) {
  const variableMeta = new Map<CanonicalVariableKey, CanonicalVariableMeta>();
  const formulaRecords: FormulaVariableCanonicalRecord[] = [];

  for (const formula of allFormulas) {
    const keys = new Set<CanonicalVariableKey>();
    for (const variable of formula.variables) {
      const fragments = splitVariableFragments(variable);
      for (const fragment of fragments) {
        const key = normalizeToCanonicalKey(fragment);
        mergeCanonicalMeta(variableMeta, key, variable, fragment);
        keys.add(key);
      }
    }
    formulaRecords.push({ formulaId: formula.id, canonicalKeys: keys });
  }

  const sortedVariables = sortVariablesForPicker(Array.from(variableMeta.values()));

  return { variableMeta, formulaRecords, sortedVariables };
}

const INDEX = buildFormulaFinderIndex(formulas);

function runDevSanityChecks() {
  const idx = INDEX.formulaRecords;
  const mustHaveCombo = (keys: CanonicalVariableKey[]) =>
    idx.some((r) => keys.every((k) => r.canonicalKeys.has(k)));

  const checks: Array<{ ok: boolean; label: string }> = [
    { ok: mustHaveCombo(['m', 'g']), label: 'm+g → weight-like' },
    { ok: mustHaveCombo(['v_0', 'theta']), label: 'v0+theta → projectile' },
    { ok: mustHaveCombo(['p', 'V', 'T']), label: 'p+V+T ideal gas' },
    { ok: mustHaveCombo(['Q', 'm']), label: 'Q+m heat' },
  ];

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.warn('[formulaFinder] Sanity checks failed:', failed.map((f) => f.label).join('; '));
  }
}

if (import.meta.env?.DEV) {
  runDevSanityChecks();
}

export function getFormulaFinderIndex() {
  return INDEX;
}

export function findFormulas(inputs: FinderInputs): FinderResult[] {
  const given = new Set(inputs.givenKeys.filter(Boolean));
  const outputKey = inputs.outputKey ?? null;

  if (!given.size && !outputKey) {
    return [];
  }

  const formulaById = new Map(formulas.map((f) => [f.id, f]));
  const results: FinderResult[] = [];

  for (const record of INDEX.formulaRecords) {
    const formula = formulaById.get(record.formulaId);
    if (!formula) continue;

    if (given.size) {
      let ok = true;
      for (const key of given) {
        if (!record.canonicalKeys.has(key)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }

    if (outputKey && !record.canonicalKeys.has(outputKey)) continue;

    const keysArr = [...record.canonicalKeys];
    let score = 0;

    const givenArr = [...given];
    const matchedGivenCount = givenArr.filter((k) => record.canonicalKeys.has(k)).length;
    score += matchedGivenCount * 12;

    if (outputKey && record.canonicalKeys.has(outputKey)) score += 25;

    // Prefer tighter formulas (fewer extra symbols) when givens match
    const extras = keysArr.filter((k) => !given.has(k) && k !== outputKey).length;
    score -= extras * 0.15;

    if (formula.relatedExampleIds?.length) score += 4;
    if (formula.calculatorId) score += 3;
    if (formula.sources.length) score += 1;

    results.push({ formula, score, canonicalKeysInFormula: keysArr });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.formula.name.localeCompare(b.formula.name, 'da');
  });
  return results;
}

export function filterVariablesForPicker(search: string, sorted: CanonicalVariableMeta[]) {
  const q = search.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter(
    (meta) =>
      meta.key.toLowerCase().includes(q) ||
      meta.labelLaTeX.toLowerCase().includes(q) ||
      meta.nameHint.toLowerCase().includes(q) ||
      [...meta.aliases].some((a) => a.toLowerCase().includes(q)),
  );
}

export type AdvancedFinderStep = {
  formula: Formula;
  producedKey: CanonicalVariableKey;
  usedKnownKeys: CanonicalVariableKey[];
  missingKeys: CanonicalVariableKey[];
};

export type AdvancedFinderChain = {
  steps: AdvancedFinderStep[];
  derivedKeys: CanonicalVariableKey[];
  finalKnownKeys: CanonicalVariableKey[];
  totalMissingCount: number;
  score: number;
};

export type AdvancedFinderInputs = {
  givenKeys: CanonicalVariableKey[];
  targetKey: CanonicalVariableKey;
  maxDepth?: number;
  maxMissingPerStep?: number;
  maxResults?: number;
};

type SolverState = {
  known: Set<CanonicalVariableKey>;
  steps: AdvancedFinderStep[];
  usedFormulaIds: Set<string>;
  score: number;
  totalMissingCount: number;
};

function scoreStep(
  formula: Formula,
  usedKnown: CanonicalVariableKey[],
  missing: CanonicalVariableKey[],
  producedKey: CanonicalVariableKey,
  previous?: Formula,
): number {
  let score = 0;
  score += usedKnown.length * 9;
  score -= missing.length * 5;
  if (formula.calculatorId) score += 3;
  if (formula.relatedExampleIds.length > 0) score += 2;
  if (formula.sources.length > 0) score += 1;
  if (previous?.id && (previous.relatedFormulaIds ?? []).includes(formula.id)) score += 2;
  if (previous?.id && (formula.relatedFormulaIds ?? []).includes(previous.id)) score += 2;
  if (previous?.category && previous.category === formula.category) score += 1;
  if (producedKey === 'W') score += 0.5;
  return score;
}

function visitKeyForLayer(state: SolverState): string {
  return `${[...state.known].sort().join(',')}|${[...state.usedFormulaIds].sort().join(',')}`;
}

function dedupeLayerStates(states: SolverState[]): SolverState[] {
  const best = new Map<string, SolverState>();
  for (const s of states) {
    const k = visitKeyForLayer(s);
    const prev = best.get(k);
    if (!prev) {
      best.set(k, s);
      continue;
    }
    if (
      s.totalMissingCount < prev.totalMissingCount ||
      (s.totalMissingCount === prev.totalMissingCount && s.score > prev.score)
    ) {
      best.set(k, s);
    }
  }
  return [...best.values()];
}

function chainFromSolverState(state: SolverState): AdvancedFinderChain {
  return {
    steps: state.steps,
    derivedKeys: state.steps.map((s) => s.producedKey),
    finalKnownKeys: [...state.known],
    totalMissingCount: state.totalMissingCount,
    score: state.score,
  };
}

export function findAdvancedFormulaChains(inputs: AdvancedFinderInputs): AdvancedFinderChain[] {
  const given = new Set(inputs.givenKeys.filter(Boolean));
  const targetKey = inputs.targetKey;
  const maxDepth = Math.max(1, Math.min(8, inputs.maxDepth ?? 4));
  const maxMissingPerStep = Math.max(0, Math.min(4, inputs.maxMissingPerStep ?? 2));
  const maxResults = Math.max(1, Math.min(20, inputs.maxResults ?? 8));

  if (!given.size || !targetKey) {
    return [];
  }
  if (given.has(targetKey)) {
    return [
      {
        steps: [],
        derivedKeys: [],
        finalKnownKeys: [...given],
        totalMissingCount: 0,
        score: 999,
      },
    ];
  }

  const formulaById = new Map(formulas.map((f) => [f.id, f]));
  const initial: SolverState = {
    known: new Set(given),
    steps: [],
    usedFormulaIds: new Set<string>(),
    score: 0,
    totalMissingCount: 0,
  };

  const buckets: SolverState[][] = [];
  buckets[0] = [initial];
  const completed: AdvancedFinderChain[] = [];
  const POOL_CAP = Math.min(48, Math.max(maxResults * 8, maxResults + 12));
  let expansions = 0;
  const MAX_EXPANSIONS = 28000;

  depthLoop: for (let depth = 0; depth <= maxDepth; depth++) {
    const layer = buckets[depth];
    if (!layer?.length) continue;

    layer.sort(
      (a, b) =>
        a.totalMissingCount - b.totalMissingCount || b.score - a.score || a.steps.length - b.steps.length,
    );

    const children: SolverState[] = [];

    for (const current of layer) {
      if (current.known.has(targetKey)) {
        completed.push(chainFromSolverState(current));
        if (completed.length >= POOL_CAP) break depthLoop;
        continue;
      }
      if (current.steps.length >= maxDepth) continue;

      for (const record of INDEX.formulaRecords) {
        if (expansions >= MAX_EXPANSIONS) break depthLoop;
        if (current.usedFormulaIds.has(record.formulaId)) continue;
        const formula = formulaById.get(record.formulaId);
        if (!formula) continue;

        const keys = [...record.canonicalKeys];
        const usableKnown = keys.filter((key) => current.known.has(key));
        if (usableKnown.length === 0) continue;

        const producible = keys.filter((key) => !current.known.has(key));
        if (producible.length === 0) continue;

        for (const producedKey of producible) {
          const requiredOthers = keys.filter((k) => k !== producedKey);
          const missing = requiredOthers.filter((k) => !current.known.has(k));
          if (missing.length > maxMissingPerStep) continue;

          expansions += 1;
          const previousFormula = current.steps[current.steps.length - 1]?.formula;
          const delta = scoreStep(formula, usableKnown, missing, producedKey, previousFormula);

          const nextKnown = new Set(current.known);
          nextKnown.add(producedKey);

          const nextSteps = [
            ...current.steps,
            {
              formula,
              producedKey,
              usedKnownKeys: usableKnown,
              missingKeys: missing,
            },
          ];
          const nextUsed = new Set(current.usedFormulaIds);
          nextUsed.add(formula.id);

          children.push({
            known: nextKnown,
            steps: nextSteps,
            usedFormulaIds: nextUsed,
            score: current.score + delta,
            totalMissingCount: current.totalMissingCount + missing.length,
          });
        }
      }
    }

    if (completed.length >= POOL_CAP) break depthLoop;

    if (depth < maxDepth && children.length > 0) {
      buckets[depth + 1] = dedupeLayerStates(children);
    }

    if (expansions >= MAX_EXPANSIONS) break depthLoop;
  }

  completed.sort((a, b) => {
    if (a.steps.length !== b.steps.length) return a.steps.length - b.steps.length;
    if (a.totalMissingCount !== b.totalMissingCount) return a.totalMissingCount - b.totalMissingCount;
    return b.score - a.score;
  });

  const unique = new Map<string, AdvancedFinderChain>();
  for (const chain of completed) {
    const sig = chain.steps.map((s) => `${s.formula.id}:${s.producedKey}`).join('>');
    const prev = unique.get(sig);
    if (!prev) {
      unique.set(sig, chain);
      continue;
    }
    if (
      chain.steps.length < prev.steps.length ||
      (chain.steps.length === prev.steps.length &&
        chain.totalMissingCount < prev.totalMissingCount) ||
      (chain.steps.length === prev.steps.length &&
        chain.totalMissingCount === prev.totalMissingCount &&
        chain.score > prev.score)
    ) {
      unique.set(sig, chain);
    }
  }

  return [...unique.values()]
    .sort((a, b) => {
      if (a.steps.length !== b.steps.length) return a.steps.length - b.steps.length;
      if (a.totalMissingCount !== b.totalMissingCount) return a.totalMissingCount - b.totalMissingCount;
      return b.score - a.score;
    })
    .slice(0, maxResults);
}
