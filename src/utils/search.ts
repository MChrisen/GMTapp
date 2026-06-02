import { calculators } from '../data/calculators';
import { pastExamQuestions } from '../data/examAids';
import { problemPatterns, workedExamples } from '../data/examples';
import { formulasWithExamples } from '../data/formulas';
import { pdfCorpus } from '../data/pdfCorpus';
import { getPdfSource } from '../data/pdfManifest';
import type { CalculatorDefinition, Formula, ProblemPattern, WorkedExample } from '../data/types';
import { cleanSnippet } from './cleanText';

export type SearchResults = {
  formulas: Formula[];
  examples: WorkedExample[];
  patterns: ProblemPattern[];
  calculators: CalculatorDefinition[];
  examQuestions: typeof pastExamQuestions;
  pdfHits: PdfHit[];
};

export type PdfHit = {
  sourceId: string;
  sourceTitle: string;
  page: number;
  text: string;
};

const SYNONYMS: Record<string, string[]> = {
  fart: ['hastighed', 'velocity', 'speed', 'v'],
  hastighed: ['hastighe', 'fart', 'velocity', 'speed', 'v'],
  bevægelse: ['bevaegelse', 'motion', 'kinematik', 'suvat'],
  acceleration: ['accelerationen', 'a', 'suvat'],
  kraft: ['newton', 'force', 'f', 'snor', 'trisse'],
  energi: ['energy', 'arbejde', 'effekt', 'højde', 'fart'],
  arbejde: ['work', 'energi', 'kraft', 'afstand'],
  effekt: ['power', 'watt', 'arbejde', 'energi'],
  pV: ['pv', 'tryk', 'volumen', 'isobar', 'isoterm', 'adiabat', 'isochor'],
  pv: ['pV', 'tryk', 'volumen', 'isobar', 'isoterm', 'adiabat', 'isochor'],
  tryk: ['pressure', 'p', 'bar', 'pa', 'gas'],
  volumen: ['volume', 'v', 'liter', 'm3', 'gas'],
  projektil: ['skråt', 'kast', 'katapult', 'kanon'],
  satellit: ['orbit', 'bane', 'omløbstid', 'gravitation'],
  gravitation: ['satellit', 'orbit', 'planet', 'bane'],
  friktion: ['mu', 'μ', 'skråplan'],
  temperatur: ['kelvin', 'celsius', 'varme'],
  varme: ['kalorimetri', 'temperatur', 'faseovergang'],
  carnot: ['nyttevirkning', 'varmekraftmaskine', 'η', 'effektivitet', 'kelvin'],
  nyttevirkning: ['carnot', 'effektivitet', 'varmekraftmaskine', 'η'],
  entropi: ['uorden', 'irreversibel', '2. hovedsætning', 'termodynamik'],
  varmekraftmaskine: ['carnot', 'nyttevirkning', 'motore', 'kraftværk'],
  varmepumpe: ['cop', 'køleskab', 'fryser', 'kølemaskine'],
  massemidtpunkt: ['center', 'mass', 'tyngdepunkt', 'com'],
  drejningsmoment: ['moment', 'torque', 'tau', 'rotation'],
  moment: ['drejningsmoment', 'torque', 'tau', 'statik'],
  stød: ['stod', 'kollision', 'impuls', 'momentum'],
  impuls: ['stød', 'kollision', 'momentum', 'bevægelsesmængde'],
  bevaegelsesmaengde: ['bevægelsesmængde', 'impuls', 'momentum'],
  bevægelsesmængde: ['bevaegelsesmaengde', 'impuls', 'momentum'],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[_,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (query: string) => normalize(query).split(' ').filter(Boolean);
type TokenGroup = string[];

const buildTokenGroups = (query: string): TokenGroup[] => {
  const tokens = tokenize(query);
  return tokens.map((token) => {
    const group = new Set<string>([token]);
    for (const alias of SYNONYMS[token] ?? []) group.add(alias.toLowerCase());
    return Array.from(group);
  });
};

const containsGroup = (target: string, group: TokenGroup) => {
  if (group.some((token) => target.includes(token))) return true;
  const words = target.split(' ');
  return group.some((token) => words.some((word) => word.startsWith(token)));
};

const matchesAllGroups = (target: string, groups: TokenGroup[]) => groups.every((group) => containsGroup(target, group));

const scoreField = (target: string, tokens: string[], weight: number) => {
  let score = 0;
  for (const token of tokens) {
    if (target.includes(token)) score += weight;
  }
  return score;
};

const rank = <T>(
  items: T[],
  groups: TokenGroup[],
  tokens: string[],
  toSearchText: (item: T) => string,
  weightedFields: Array<{ text: (item: T) => string; weight: number }>,
) => {
  if (!groups.length) return items;
  return items
    .map((item) => {
      const haystack = normalize(toSearchText(item));
      if (!matchesAllGroups(haystack, groups)) return { item, score: -1 };
      const score = weightedFields.reduce((sum, field) => sum + scoreField(normalize(field.text(item)), tokens, field.weight), 0);
      return { item, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
};

type SearchOptions = {
  includePdfHits?: boolean;
};

export function runSearch(query: string, options: SearchOptions = {}): SearchResults {
  const trimmed = query.trim();
  const groups = buildTokenGroups(trimmed);
  const tokens = groups.flat();

  const formulas = rank(
    formulasWithExamples,
    groups,
    tokens,
    (formula) =>
      [
        formula.name,
        formula.category,
        formula.topic,
        formula.description,
        formula.useWhen,
        formula.examTip,
        formula.equation,
        formula.latex,
        formula.keywords.join(' '),
        formula.variables.map((variable) => `${variable.symbol} ${variable.name}`).join(' '),
      ].join(' '),
    [
      { text: (formula) => formula.name, weight: 5 },
      { text: (formula) => formula.topic, weight: 4 },
      { text: (formula) => formula.latex, weight: 4 },
      { text: (formula) => formula.equation, weight: 3 },
      { text: (formula) => formula.keywords.join(' '), weight: 3 },
      { text: (formula) => formula.description, weight: 2 },
    ],
  );

  const examples = rank(
    workedExamples,
    groups,
    tokens,
    (example) =>
      [example.title, example.pattern, example.keywords.join(' '), example.steps.join(' '), example.givens.join(' '), example.question].join(' '),
    [
      { text: (example) => example.title, weight: 5 },
      { text: (example) => example.pattern, weight: 4 },
      { text: (example) => example.keywords.join(' '), weight: 3 },
      { text: (example) => example.question, weight: 3 },
    ],
  );

  const patterns = rank(
    problemPatterns,
    groups,
    tokens,
    (pattern) =>
      [pattern.title, pattern.recognition, pattern.cueWords.join(' '), pattern.method.join(' '), (pattern.pitfalls ?? []).join(' ')].join(' '),
    [
      { text: (pattern) => pattern.title, weight: 5 },
      { text: (pattern) => pattern.cueWords.join(' '), weight: 4 },
      { text: (pattern) => pattern.recognition, weight: 3 },
    ],
  );

  const calculatorMatches = rank(
    calculators,
    groups,
    tokens,
    (calculator) => [calculator.title, calculator.category ?? '', calculator.description, calculator.latex, calculator.formulaIds.join(' ')].join(' '),
    [
      { text: (calculator) => calculator.title, weight: 5 },
      { text: (calculator) => calculator.category ?? '', weight: 4 },
      { text: (calculator) => calculator.latex, weight: 4 },
      { text: (calculator) => calculator.description, weight: 3 },
    ],
  );

  const examQuestions = rank(
    pastExamQuestions,
    groups,
    tokens,
    (question) =>
      [
        question.year.toString(),
        question.title,
        question.cue,
        question.firstMove,
        question.keywords.join(' '),
        question.formulaIds.join(' '),
        question.patternIds.join(' '),
      ].join(' '),
    [
      { text: (question) => question.title, weight: 5 },
      { text: (question) => question.cue, weight: 4 },
      { text: (question) => question.firstMove, weight: 3 },
      { text: (question) => question.keywords.join(' '), weight: 3 },
    ],
  );

  const pdfHits: PdfHit[] =
    trimmed && options.includePdfHits
      ? pdfCorpus
          .flatMap((source) => {
            const meta = getPdfSource(source.sourceId);
            const sourceHaystack = normalize(
              [meta?.title, meta?.topic, meta?.shortTitle, source.sourceId.replace('lektion-', 'lektion ')].filter(Boolean).join(' '),
            );
            return source.pages
              .map((page) => {
                const haystack = normalize(`${sourceHaystack} ${page.text} ${page.keywords.join(' ')}`);
                if (!matchesAllGroups(haystack, groups)) return null;
                const score =
                  scoreField(haystack, tokens, 1) +
                  scoreField(normalize(page.keywords.join(' ')), tokens, 2) +
                  scoreField(sourceHaystack, tokens, 4);
                return {
                  sourceId: source.sourceId,
                  sourceTitle: meta?.shortTitle ?? source.sourceId,
                  page: page.page,
                  text: cleanSnippet(page.text, 320),
                  score,
                };
              })
              .filter((hit): hit is PdfHit & { score: number } => Boolean(hit))
              .sort((a, b) => b.score - a.score)
              .slice(0, 3);
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 24)
          .map(({ score: _score, ...hit }) => hit)
      : [];

  return {
    formulas,
    examples,
    patterns,
    calculators: calculatorMatches,
    examQuestions,
    pdfHits,
  };
}

export function totalCount(results: SearchResults): number {
  return (
    results.formulas.length +
    results.examples.length +
    results.patterns.length +
    results.calculators.length +
    results.examQuestions.length +
    results.pdfHits.length
  );
}
