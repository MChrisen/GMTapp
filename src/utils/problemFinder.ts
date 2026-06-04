import { pastExamQuestions } from '../data/examAids';
import { workedExamples } from '../data/examples';
import { pdfCorpus } from '../data/pdfCorpus';
import { getPdfSource } from '../data/pdfManifest';
import type { PastExamQuestion, WorkedExample } from '../data/types';
import { getFormulaFinderIndex, normalizeToCanonicalKey, type CanonicalVariableKey } from './formulaFinder';

type ProblemRecordBase = {
  id: string;
  title: string;
  formulaIds: string[];
  givenKeys: CanonicalVariableKey[];
};

type ExampleRecord = ProblemRecordBase & {
  kind: 'example';
  pattern: string;
};

type ExamRecord = ProblemRecordBase & {
  kind: 'exam';
  year: PastExamQuestion['year'];
  cue: string;
};

type PdfRecord = ProblemRecordBase & {
  kind: 'pdf';
  sourceId: string;
  sourceTitle: string;
  page: number;
  snippet: string;
};

export type ProblemRecord = ExampleRecord | ExamRecord | PdfRecord;

export type SelectedCoverageHit = {
  selectedKey: CanonicalVariableKey;
  matchedTaskKeys: CanonicalVariableKey[];
  usedHierarchy: boolean;
};

export type ProblemMatch = ProblemRecord & {
  matchedKeys: CanonicalVariableKey[];
  missingSelectedKeys: CanonicalVariableKey[];
  extraTaskKeys: CanonicalVariableKey[];
  coveragePercent: number;
  precisionPercent: number;
  similarityPercent: number;
  selectedCoverageHits: SelectedCoverageHit[];
  score: number;
};

type FindProblemInputs = {
  givenKeys: CanonicalVariableKey[];
  strictExact?: boolean;
  maxResults?: number;
};

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

const GREEK_WORDS = new Set([
  'theta',
  'omega',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'eta',
  'lambda',
  'mu',
  'nu',
  'xi',
  'rho',
  'sigma',
  'tau',
  'phi',
  'psi',
  'pi',
]);

const SYMBOL_BLACKLIST = new Set([
  'eller',
  'eventuelt',
  'samme',
  'kendt',
  'ukendt',
  'med',
  'uden',
  'for',
  'fra',
  'til',
  'ved',
  'som',
  'hvis',
  'skal',
  'find',
  'sporg',
  'spørg',
  'opgave',
  'system',
  'proces',
  'total',
  'forst',
  'først',
]);

const KEYWORD_HINTS: Array<{ regex: RegExp; keys: CanonicalVariableKey[] }> = [
  { regex: /starthastighed|begyndelsesfart|v[_\s]?0|v₀/i, keys: ['v_0'] },
  { regex: /hastighed|fart|slutfart/i, keys: ['v', 'v_0'] },
  { regex: /acceleration|opbremsning/i, keys: ['a'] },
  { regex: /vinkel|grader|radian|rad/i, keys: ['theta'] },
  { regex: /tid|sekund|minut|time|flyvetid|varighed/i, keys: ['t', 'Delta_t', 'T'] },
  { regex: /afstand|strækning|position|vandret/i, keys: ['x', 'Delta_x', 'r'] },
  { regex: /højde|lodret/i, keys: ['y', 'h'] },
  { regex: /masse|masser|kg/i, keys: ['m', 'm_1', 'm_2', 'M'] },
  { regex: /radius|baneradius|omkreds/i, keys: ['r', 'R', 'R_J'] },
  { regex: /tryk|bar|pa|kpa/i, keys: ['p'] },
  { regex: /volumen|liter|m3|m³/i, keys: ['V', 'Delta_V'] },
  { regex: /temperatur|kelvin|celsius/i, keys: ['T', 'T_K', 'T_C', 'Delta_T'] },
  { regex: /mol|stofmængde|molekyle/i, keys: ['n', 'N'] },
  { regex: /kraft|snorkraft|tension|normal|friktion/i, keys: ['F', 'N', 'f_k', 'f_s', 'T'] },
  { regex: /varme|energi|kwh|joule/i, keys: ['Q', 'W', 'U', 'K'] },
  { regex: /moment|drejningsmoment|torque/i, keys: ['tau'] },
  { regex: /inertimoment/i, keys: ['I'] },
  { regex: /virkningsgrad|effektivitet/i, keys: ['eta'] },
  { regex: /cop|fryser|kølemaskine|varmepumpe/i, keys: ['COP'] },
  { regex: /gravitation|satellit|planet|jord/i, keys: ['G', 'M', 'r'] },
];

const KEY_FALLBACK_PRIORITY: CanonicalVariableKey[] = [
  'm',
  'm_1',
  'm_2',
  'g',
  'theta',
  'x',
  'y',
  'h',
  'v_0',
  'v',
  'a',
  't',
  'r',
  'p',
  'V',
  'n',
  'T',
  'Q',
  'W',
  'F',
  'N',
  'mu_k',
  'mu_s',
  'eta',
  'COP',
  'I',
  'tau',
];

const BASE_INDEX = getFormulaFinderIndex();
const ALL_CANONICAL_KEYS = new Set<CanonicalVariableKey>(BASE_INDEX.variableMeta.keys());

const HIERARCHICAL_PARENT_ALIASES: Record<string, CanonicalVariableKey[]> = {
  // If user selects parent key, include its sub-keys.
  m: ['M', 'm_1', 'm_2', 'm_i'],
  v: ['v_0', 'v_1', 'v_2', 'v_0x', 'v_0y', 'v_x', 'v_y'],
  x: ['x_0', 'x_cm'],
  y: ['y_0'],
  F: ['F_x', 'F_y', 'F_par', 'F_perp', 'F_g', 'F_c'],
  T: ['T_C', 'T_K', 'T_h', 'T_c'],
  p: ['p_i', 'p_f'],
  V: ['V_i', 'V_f', 'Delta_V'],
  Q: ['Q_h', 'Q_c'],
  R: ['R_J', 'R_air', 'R_total'],
};

const normalizeToken = (raw: string) =>
  raw
    .trim()
    .replace(/[₀-₉]/g, (char) => SUBSCRIPT_DIGITS[char] ?? char)
    .replace(/[−–]/g, '-');

const isMeaningfulCanonicalKey = (key: CanonicalVariableKey): boolean => {
  const normalized = key.trim();
  if (!normalized || normalized === 'unknown') return false;
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return false;
  if (!/[A-Za-z]/.test(normalized)) return false;
  if (SYMBOL_BLACKLIST.has(normalized.toLowerCase())) return false;
  return true;
};

const isPotentialSymbol = (token: string): boolean => {
  const trimmed = token.trim();
  if (!trimmed) return false;
  if (/^\d+(?:[.,]\d+)?$/.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (SYMBOL_BLACKLIST.has(lower)) return false;
  if (GREEK_WORDS.has(lower)) return true;
  const hasGreek = /[ΔΘΩα-ω]/.test(trimmed);
  const hasDigitOrSubscript = /[₀-₉0-9_]/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  if (hasGreek || hasDigitOrSubscript) return true;
  if (hasUpper && trimmed.length <= 3) return true;
  return trimmed.length <= 2;
};

const resolveToPoolKey = (key: CanonicalVariableKey, pool: Set<CanonicalVariableKey>): CanonicalVariableKey | null => {
  if (!isMeaningfulCanonicalKey(key)) return null;

  const resolveAgainst = (space: Set<CanonicalVariableKey>): CanonicalVariableKey | null => {
    if (space.has(key)) return key;
    const fallback = [...space].find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    return fallback ?? null;
  };

  if (pool.size === 0) {
    return resolveAgainst(ALL_CANONICAL_KEYS);
  }

  const direct = resolveAgainst(pool);
  if (direct) return direct;

  const global = resolveAgainst(ALL_CANONICAL_KEYS);
  if (!global) return null;
  if (pool.has(global)) return global;
  const foldedInPool = [...pool].find((candidate) => candidate.toLowerCase() === global.toLowerCase());
  return foldedInPool ?? null;
};

const expandSelectedKeyCoverage = (selectedKey: CanonicalVariableKey): Set<CanonicalVariableKey> => {
  const out = new Set<CanonicalVariableKey>([selectedKey]);
  for (const key of ALL_CANONICAL_KEYS) {
    if (key.startsWith(`${selectedKey}_`)) out.add(key);
  }
  for (const alias of HIERARCHICAL_PARENT_ALIASES[selectedKey] ?? []) {
    if (ALL_CANONICAL_KEYS.has(alias)) out.add(alias);
  }
  return out;
};

const isTaskLikePage = (sourceId: string, text: string): boolean => {
  if (sourceId.startsWith('exam-')) return true;
  return /(spørgsmål|opgave|beregn|bestem|find|udregn|vis at|eksempel|example|\?)/i.test(text);
};

function formulaKeyPool(formulaIds: string[]): Set<CanonicalVariableKey> {
  const byFormula = new Map(BASE_INDEX.formulaRecords.map((record) => [record.formulaId, record.canonicalKeys]));
  const pool = new Set<CanonicalVariableKey>();
  for (const formulaId of formulaIds) {
    const keys = byFormula.get(formulaId);
    if (!keys) continue;
    for (const key of keys) pool.add(key);
  }
  return pool;
}

function inferGivenKeys(textBlocks: string[], formulaIds: string[], extraPool: Set<CanonicalVariableKey> = new Set()): CanonicalVariableKey[] {
  const formulaPool = formulaKeyPool(formulaIds);
  for (const key of extraPool) formulaPool.add(key);
  const symbolKeys = new Set<CanonicalVariableKey>();
  const hintKeys = new Set<CanonicalVariableKey>();

  for (const text of textBlocks) {
    const normalizedText = normalizeToken(text);
    const symbolCandidates = normalizedText.match(/[A-Za-zΔΘΩα-ω₀-₉0-9_]+/g) ?? [];

    for (const raw of symbolCandidates) {
      if (!isPotentialSymbol(raw)) continue;
      const candidate = normalizeToCanonicalKey(normalizeToken(raw));
      if (!candidate || candidate === 'unknown') continue;
      const resolved = resolveToPoolKey(candidate, formulaPool);
      if (resolved) symbolKeys.add(resolved);
    }

    for (const hint of KEYWORD_HINTS) {
      if (!hint.regex.test(normalizedText)) continue;
      for (const rawKey of hint.keys) {
        const resolved = resolveToPoolKey(rawKey, formulaPool);
        if (resolved) hintKeys.add(resolved);
      }
    }
  }

  const keys = new Set<CanonicalVariableKey>();
  for (const key of symbolKeys) keys.add(key);
  // Only expand with hint-keys when symbols are sparse.
  if (symbolKeys.size < 2) {
    for (const key of hintKeys) keys.add(key);
  }

  // If extraction missed everything, pick likely "given" symbols from linked formulas.
  if (keys.size === 0 && formulaPool.size > 0) {
    for (const key of KEY_FALLBACK_PRIORITY) {
      if (formulaPool.has(key)) keys.add(key);
      if (keys.size >= 4) break;
    }
    if (keys.size === 0) {
      for (const key of formulaPool) {
        keys.add(key);
        if (keys.size >= 4) break;
      }
    }
  }

  return [...keys].slice(0, 8);
}

function buildProblemIndex() {
  const examples: ExampleRecord[] = workedExamples.map((example) => ({
    kind: 'example',
    id: example.id,
    title: example.title,
    pattern: example.pattern,
    formulaIds: example.formulaIds,
    givenKeys: inferGivenKeys(example.givens, example.formulaIds),
  }));

  const exampleKeyMap = new Map(examples.map((entry) => [entry.id, new Set(entry.givenKeys)]));

  const exams: ExamRecord[] = pastExamQuestions.map((question) => {
    const extraPool = new Set<CanonicalVariableKey>();
    for (const exampleId of question.exampleIds) {
      const keys = exampleKeyMap.get(exampleId);
      if (!keys) continue;
      for (const key of keys) extraPool.add(key);
    }
    const inferred = inferGivenKeys(
      [question.title, question.cue, ...question.keywords.slice(0, 6)],
      question.formulaIds,
      extraPool,
    );
    const overlapWithExamples = inferred.filter((key) => extraPool.has(key));
    const givenKeys =
      extraPool.size > 0 && overlapWithExamples.length >= 2
        ? overlapWithExamples
        : extraPool.size > 0 && inferred.length > extraPool.size + 2
          ? [...extraPool].slice(0, 6)
          : inferred;
    return {
      kind: 'exam',
      id: question.id,
      year: question.year,
      cue: question.cue,
      title: question.title,
      formulaIds: question.formulaIds,
      givenKeys,
    };
  });

  const pdfTasksRaw: PdfRecord[] = [];

  for (const source of pdfCorpus) {
    const sourceMeta = getPdfSource(source.sourceId);
    for (const page of source.pages) {
      if (!isTaskLikePage(source.sourceId, page.text)) continue;
      const givenKeys = inferGivenKeys([page.text, page.keywords.join(' ')], []);
      if (givenKeys.length === 0) continue;
      const compactSnippet = page.text.replace(/\s+/g, ' ').trim().slice(0, 180);
      pdfTasksRaw.push({
        kind: 'pdf',
        id: `${source.sourceId}#${page.page}`,
        title: `${sourceMeta?.shortTitle ?? source.sourceId} · side ${page.page}`,
        sourceId: source.sourceId,
        sourceTitle: sourceMeta?.shortTitle ?? source.sourceId,
        page: page.page,
        snippet: compactSnippet,
        formulaIds: [],
        givenKeys,
      });
    }
  }

  const pdfTasks = pdfTasksRaw;

  return { examples, exams, pdfTasks, all: [...examples, ...exams, ...pdfTasks] as ProblemRecord[] };
}

const INDEX = buildProblemIndex();

export function getProblemFinderIndex() {
  return INDEX;
}

export function getExampleGivenKeys(exampleId: WorkedExample['id']): CanonicalVariableKey[] {
  return INDEX.examples.find((entry) => entry.id === exampleId)?.givenKeys ?? [];
}

export function getExamGivenKeys(questionId: PastExamQuestion['id']): CanonicalVariableKey[] {
  return INDEX.exams.find((entry) => entry.id === questionId)?.givenKeys ?? [];
}

export function findProblemMatches(inputs: FindProblemInputs): ProblemMatch[] {
  const selected = [...new Set(inputs.givenKeys.filter(Boolean))];
  const selectedCoverage = new Map(selected.map((key) => [key, expandSelectedKeyCoverage(key)]));
  const strictExact = inputs.strictExact ?? true;
  const maxResults = Math.max(1, Math.min(240, inputs.maxResults ?? 60));

  if (selected.length === 0) return [];

  const matches: ProblemMatch[] = [];
  for (const record of INDEX.all) {
    const taskSet = new Set(record.givenKeys);
    const selectedCoverageHits: SelectedCoverageHit[] = selected.map((selectedKey) => {
      const coverage = selectedCoverage.get(selectedKey)!;
      const matchedTaskKeys = record.givenKeys.filter((taskKey) => coverage.has(taskKey));
      const usedHierarchy = matchedTaskKeys.some((taskKey) => taskKey !== selectedKey);
      return { selectedKey, matchedTaskKeys, usedHierarchy };
    });

    const missingSelected = selectedCoverageHits
      .filter((entry) => entry.matchedTaskKeys.length === 0)
      .map((entry) => entry.selectedKey);

    const matchedTaskKeys = [...new Set(selectedCoverageHits.flatMap((entry) => entry.matchedTaskKeys))];

    const extraTask = record.givenKeys.filter((taskKey) =>
      !selected.some((selectedKey) => selectedCoverage.get(selectedKey)!.has(taskKey)),
    );

    const isMatch = strictExact
      ? missingSelected.length === 0 && extraTask.length === 0
      : missingSelected.length === 0;
    if (!isMatch) continue;

    const coveragePercent = Math.round(((selected.length - missingSelected.length) / Math.max(1, selected.length)) * 100);
    const precisionPercent = Math.round((matchedTaskKeys.length / Math.max(1, record.givenKeys.length)) * 100);
    const similarityPercent = Math.round(coveragePercent * 0.72 + precisionPercent * 0.28);

    let score = similarityPercent;
    score += matchedTaskKeys.length * 3;
    score -= extraTask.length * 3.5;
    if (record.kind === 'exam') score += 1;
    if (record.kind === 'example') score += 0.6;

    matches.push({
      ...record,
      matchedKeys: matchedTaskKeys,
      missingSelectedKeys: missingSelected,
      extraTaskKeys: extraTask,
      coveragePercent,
      precisionPercent,
      similarityPercent,
      selectedCoverageHits,
      score,
    });
  }

  return matches
    .sort((a, b) => {
      if (b.similarityPercent !== a.similarityPercent) return b.similarityPercent - a.similarityPercent;
      if (b.score !== a.score) return b.score - a.score;
      if (a.kind !== b.kind) {
        const rank = (kind: ProblemRecord['kind']) => (kind === 'exam' ? 0 : kind === 'example' ? 1 : 2);
        return rank(a.kind) - rank(b.kind);
      }
      if (a.kind === 'exam' && b.kind === 'exam' && a.year !== b.year) return b.year - a.year;
      return a.title.localeCompare(b.title, 'da');
    })
    .slice(0, maxResults);
}

