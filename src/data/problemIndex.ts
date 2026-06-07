import { pdfCorpus } from './pdfCorpus';
import type { SourceRef } from './types';

export type IndexedProblemMainCategory = 'Mekanik' | 'Termodynamik';
export type IndexedProblemKind = 'Eksamen' | 'Forelaesningseksempel';

export type IndexedProblemEntry = {
  id: string;
  kind: IndexedProblemKind;
  sourceId: string;
  title: string;
  summary: string;
  mainCategory: IndexedProblemMainCategory;
  subCategory: string;
  sourceRefs: SourceRef[];
  patternIds: string[];
  formulaIds: string[];
  exampleIds: string[];
};

const s = (sourceId: string, page: number, label?: string): SourceRef => ({ sourceId, page, label });

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
const short = (text: string, max = 220) => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);

const firstSentence = (text: string, fallback: string) => {
  const cut = clean(text).split(/[.!?]/)[0]?.trim() ?? '';
  return cut.length > 8 ? cut : fallback;
};

const lectureNumber = (sourceId: string) => {
  const m = sourceId.match(/^lektion-(\d{2})$/);
  return m ? Number(m[1]) : null;
};

const thermodynamicsKeywords =
  /temperatur|kelvin|celsius|varme|varmeledning|isolans|u-værdi|r-værdi|isoterm|isobar|isochor|adiabat|p v|pv|carnot|entropi|idealgas|\bgas\b|\bmol\b|tryk|volumen|kredsproces|varmepumpe|køleskab|fryser|smelte|fordamp|varmekapacitet|\bcop\b/i;

const classifyMainCategory = (sourceId: string, text: string): IndexedProblemMainCategory => {
  const lecture = lectureNumber(sourceId);
  if (lecture !== null) return lecture <= 9 ? 'Mekanik' : 'Termodynamik';
  return thermodynamicsKeywords.test(text) ? 'Termodynamik' : 'Mekanik';
};

const classifySubCategory = (mainCategory: IndexedProblemMainCategory, text: string) => {
  if (mainCategory === 'Mekanik') {
    if (/projektil|kanon|katapult|kast|skrænt|flyvetid|startfart/i.test(text)) return 'Projektil og skraat kast';
    if (/satellit|orbit|planet|raket|omløbstid|starlink|centripetal|cirkel/i.test(text)) return 'Gravitation og cirkelbevagelse';
    if (/rpm|omega|rotation|inertimoment|skive|hjul|ruller|karrusel|impulsmoment/i.test(text)) return 'Rotation og inertimoment';
    if (/moment|torque|ligevægt|tippe|vippe|stige|bjælke|biceps|klapbro|statik|trafiklys|wire/i.test(text)) {
      return 'Statik og momentbalance';
    }
    if (/stød|kollision|impuls|massemidtpunkt|center of mass|karussel/i.test(text)) return 'Impuls, stod og massemidtpunkt';
    if (/trisse|atwood|to klodser|masseløs snor|forbundet med en masseløs snor|lod/i.test(text)) return '2 masser og en trisse';
    if (/skråplan|hældning|friktion|rampe|lavine|kiste/i.test(text)) return 'Skraaplan og friktion';
    if (/relativ|vind|båd|flyver|vektor|månen|gennemsnitsaccelerationsvektor/i.test(text)) return 'Relativ hastighed og vektorer';
    if (/energi|arbejde|effekt|fjeder|bungee|loop|modelbane|højde/i.test(text)) return 'Arbejde og energibevarelse';
    return 'Generel mekanik';
  }

  if (/carnot|nyttevirkning|varmekraftmaskine|entropi|\bcop\b|køleskab|varmepumpe|kraftværk/i.test(text)) {
    return '2. hovedsaetning, Carnot og COP';
  }
  if (/adiabat|isoterm|isobar|isochor|p v|pv|kredsproces|diesel|arbejdet på gassen/i.test(text)) {
    return 'pV-processer og 1. hovedsaetning';
  }
  if (/idealgas|mol|boltzmann|tryk|volumen|gasflaske|molek/i.test(text)) {
    return 'Idealgas og gaskinetik';
  }
  if (/varme|temperatur|smelte|fordamp|is|vand|varmeledning|u-værdi|r-værdi|hestesko|varmtvands/i.test(text)) {
    return 'Temperatur, varme og faseovergange';
  }
  return 'Generel termodynamik';
};

const SUBCATEGORY_LINKS: Record<
  string,
  {
    patternIds: string[];
    formulaIds: string[];
    exampleIds: string[];
  }
> = {
  '2 masser og en trisse': {
    patternIds: ['pattern-forces'],
    formulaIds: ['newton-second-law', 'atwood-acceleration', 'tension-atwood'],
    exampleIds: ['ex-atwood'],
  },
  'Skraaplan og friktion': {
    patternIds: ['pattern-forces'],
    formulaIds: ['incline-components', 'friction-kinetic', 'newton-second-law', 'trig-right-triangle'],
    exampleIds: ['ex-incline-cylinder'],
  },
  'Projektil og skraat kast': {
    patternIds: ['pattern-projectile'],
    formulaIds: [
      'projectile-components',
      'projectile-position-x',
      'projectile-position-y',
      'projectile-trajectory-equation',
      'impact-speed-from-height',
      'speed-from-components',
      'kmh-to-ms',
      'trig-right-triangle',
      'trig-pythagorean-identity',
      'trig-double-angle-sine',
    ],
    exampleIds: ['ex-projectile-castle', 'ex-cannon-height'],
  },
  'Relativ hastighed og vektorer': {
    patternIds: ['pattern-relative-velocity'],
    formulaIds: ['relative-velocity', 'vector-addition', 'angle-between-vectors', 'speed-from-components', 'trig-right-triangle'],
    exampleIds: ['ex-relative-wind'],
  },
  'Gravitation og cirkelbevagelse': {
    patternIds: ['pattern-orbit', 'pattern-circular-motion'],
    formulaIds: [
      'universal-gravitation',
      'gravitational-potential-universal',
      'gravitational-energy-conservation',
      'escape-velocity',
      'orbital-radius-from-speed',
      'orbital-speed',
      'orbital-period',
      'centripetal-force',
      'conical-pendulum-angle',
      'conical-pendulum-radius',
      'conical-pendulum-vertical-balance',
    ],
    exampleIds: ['ex-satellite', 'ex-gravity-force', 'ex-circular-turn'],
  },
  'Rotation og inertimoment': {
    patternIds: ['pattern-rotation'],
    formulaIds: [
      'linear-angular-speed',
      'angular-frequency-relations',
      'revolutions-from-angle',
      'torque',
      'rotational-newton',
      'point-mass-inertia-sum',
      'parallel-axis-theorem',
    ],
    exampleIds: ['ex-rotation-rpm', 'ex-parallel-axis', 'ex-rolling-sphere'],
  },
  'Statik og momentbalance': {
    patternIds: ['pattern-statics'],
    formulaIds: ['static-equilibrium-forces', 'static-equilibrium-torque', 'torque', 'trig-right-triangle'],
    exampleIds: ['ex-statics-cable', 'ex-tipping-threshold'],
  },
  'Impuls, stod og massemidtpunkt': {
    patternIds: ['pattern-momentum', 'pattern-center-of-mass'],
    formulaIds: ['momentum', 'momentum-conservation', 'center-of-mass'],
    exampleIds: ['ex-momentum-collision', 'ex-center-of-mass-triangle'],
  },
  'Arbejde og energibevarelse': {
    patternIds: ['pattern-energy', 'pattern-work-power'],
    formulaIds: [
      'work-constant-force',
      'work-energy-theorem',
      'mechanical-energy',
      'pendulum-geometry',
      'power',
      'energy-from-power-time',
      'loop-minimum-speed',
    ],
    exampleIds: ['ex-work-power', 'ex-energy-coaster'],
  },
  'Temperatur, varme og faseovergange': {
    patternIds: ['pattern-heat', 'pattern-thermal-expansion', 'pattern-heat-transfer'],
    formulaIds: [
      'heat-capacity',
      'latent-heat',
      'calorimetry-energy-balance',
      'density-mass-volume',
      'thermal-expansion-linear',
      'heat-conduction-r',
      'energy-from-power-time',
    ],
    exampleIds: ['ex-calorimetry', 'ex-thermal-expansion', 'ex-wall-rvalue'],
  },
  'Idealgas og gaskinetik': {
    patternIds: ['pattern-ideal-gas'],
    formulaIds: [
      'ideal-gas-nrt',
      'ideal-gas-nkt',
      'isochoric-pressure-temperature',
      'molecules-and-moles',
      'gas-internal-energy',
      'celsius-kelvin',
    ],
    exampleIds: ['ex-gas-bottle'],
  },
  'pV-processer og 1. hovedsaetning': {
    patternIds: ['pattern-thermo-pv'],
    formulaIds: [
      'first-law',
      'gas-work',
      'isobaric-work',
      'isothermal-ideal-gas',
      'adiabatic-process',
      'adiabatic-temperature-pressure-relation',
      'adiabatic-gamma-from-states',
    ],
    exampleIds: ['ex-pv-cycle', 'ex-diesel-adiabat'],
  },
  '2. hovedsaetning, Carnot og COP': {
    patternIds: ['pattern-heat-engine', 'pattern-cop'],
    formulaIds: ['heat-engine-efficiency', 'carnot-efficiency', 'cop-refrigerator', 'entropy-second-law'],
    exampleIds: ['ex-carnot-engine', 'ex-cop-freezer'],
  },
};

const linksForSubCategory = (subCategory: string) =>
  SUBCATEGORY_LINKS[subCategory] ?? { patternIds: [], formulaIds: [], exampleIds: [] };

const sanitizeExamText = (rawText: string) =>
  clean(rawText)
    .replace(/, but if this were a real attempt, you would be blocked because: This quiz is currently not available\./gi, '')
    .replace(/^GMT skriftlig eksamen[\s\S]*?\/Prøvese\s*/i, '')
    .replace(/^GMT skriftlig eksamen[\s\S]*?\.{3,}\s*/i, '')
    .replace(/^GMT skriftlig re-eksamen[\s\S]*?\.{3,}\s*/i, '')
    .replace(/◀\s*GMT[\s\S]*?▶/gi, '')
    .replace(/Previouspage Nextpage/gi, '')
    .replace(/www\.\s*its\.\s*aau\.\s*dk\s*Helpanddocumentation/gi, '')
    .replace(/\bFORTS[ÆA]TTESE\s*[A-Z]?\b/gi, '')
    .replace(/\.{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripMultipleChoiceOptions = (text: string) => text.replace(/\bVælg en:\s*[\s\S]*$/i, '').trim();

const isLikelyExamTaskPage = (text: string) =>
  /\b(beregn|bestem|find|angiv|hvad|hvor|hvilken|hvor lang|hvor stor|hvor højt|betragt|antag|vælg en|starthastighed|acceleration|kraft|moment|temperatur|tryk|volumen|arbejde)\b/i.test(
    text,
  );

const extractExamTitle = (sourceId: string, page: number, sanitizedText: string) => {
  const withoutChoices = stripMultipleChoiceOptions(sanitizedText) || sanitizedText;
  const lead = withoutChoices.replace(/^[A-D]\)\s*/i, '').trim();
  const sentence = firstSentence(lead, `${sourceId} side ${page}`);
  return short(sentence, 140);
};

const extractLectureExampleEntries = (): IndexedProblemEntry[] => {
  const skipPage = /Type-I|Type-II|Type-III|Løsninger tiludvalgteopgaver|Næste uge Kapitel/i;
  const byId = new Map<string, IndexedProblemEntry>();
  const variantsByBase = new Map<string, string[]>();
  const lastPageById = new Map<string, number>();

  for (const source of pdfCorpus.filter((entry) => entry.sourceId.startsWith('lektion-'))) {
    for (const page of source.pages) {
      const text = clean(page.text);
      if (!text || skipPage.test(text) || !/(?:Example|Eksempel)\b/i.test(text)) continue;

      const numberMatch = text.match(/(?:Conceptual\s+)?(?:Example|Eksempel)\s*\(?([0-9]{1,2}(?:\.[0-9]+)?)\)?/i);
      const label = numberMatch ? `Eksempel ${numberMatch[1]}` : 'Eksempel';
      const baseId = numberMatch
        ? `lecture-${source.sourceId}-${numberMatch[1].replace('.', '-')}`
        : `lecture-${source.sourceId}-p${page.page}`;

      const afterMatch = numberMatch ? text.slice(text.indexOf(numberMatch[0]) + numberMatch[0].length).trim() : text;
      const parenthetical = afterMatch.match(/^\(([^)]+)\)/)?.[1]?.trim();
      const context = parenthetical || firstSentence(afterMatch, `side ${page.page}`);
      const title = `${label}: ${short(context, 90)}`;
      const summary = short(text, 260);
      const mainCategory = classifyMainCategory(source.sourceId, text);
      const subCategory = classifySubCategory(mainCategory, text);
      const links = linksForSubCategory(subCategory);

      let id = baseId;
      if (numberMatch) {
        const variants = variantsByBase.get(baseId) ?? [];
        const continuationId = variants.find((candidateId) => {
          const lastPage = lastPageById.get(candidateId);
          return lastPage !== undefined && page.page - lastPage <= 2;
        });
        if (continuationId) {
          id = continuationId;
        } else if (variants.length > 0) {
          id = `${baseId}-v${variants.length + 1}`;
        }
      }

      const existing = byId.get(id);
      if (existing) {
        existing.sourceRefs.push(s(source.sourceId, page.page, label));
        lastPageById.set(id, page.page);
        continue;
      }

      byId.set(id, {
        id,
        kind: 'Forelaesningseksempel',
        sourceId: source.sourceId,
        title,
        summary,
        mainCategory,
        subCategory,
        sourceRefs: [s(source.sourceId, page.page, label)],
        patternIds: links.patternIds,
        formulaIds: links.formulaIds,
        exampleIds: links.exampleIds,
      });
      lastPageById.set(id, page.page);
      variantsByBase.set(baseId, [...(variantsByBase.get(baseId) ?? []), id]);
    }
  }

  return Array.from(byId.values()).map((entry) => ({
    ...entry,
    sourceRefs: entry.sourceRefs.sort((a, b) => a.page - b.page),
  }));
};

const extractExamEntries = (): IndexedProblemEntry[] => {
  const entries: IndexedProblemEntry[] = [];

  for (const source of pdfCorpus.filter((entry) => entry.sourceId.startsWith('exam-'))) {
    for (const page of source.pages) {
      const text = clean(page.text);
      if (!text || text.length < 40) continue;

      const sanitized = sanitizeExamText(text);
      if (!sanitized || !isLikelyExamTaskPage(sanitized)) continue;

      const sanitizedNoChoices = stripMultipleChoiceOptions(sanitized) || sanitized;
      const title = extractExamTitle(source.sourceId, page.page, sanitizedNoChoices);
      const summary = short(sanitizedNoChoices, 260);
      const mainCategory = classifyMainCategory(source.sourceId, sanitized);
      const subCategory = classifySubCategory(mainCategory, sanitized);
      const links = linksForSubCategory(subCategory);

      entries.push({
        id: `exam-${source.sourceId}-p${page.page}`,
        kind: 'Eksamen',
        sourceId: source.sourceId,
        title,
        summary,
        mainCategory,
        subCategory,
        sourceRefs: [s(source.sourceId, page.page, `Opgaveside ${page.page}`)],
        patternIds: links.patternIds,
        formulaIds: links.formulaIds,
        exampleIds: links.exampleIds,
      });
    }
  }

  return entries;
};

export const indexedProblems: IndexedProblemEntry[] = [...extractExamEntries(), ...extractLectureExampleEntries()].sort((a, b) => {
  if (a.mainCategory !== b.mainCategory) return a.mainCategory.localeCompare(b.mainCategory, 'da');
  if (a.subCategory !== b.subCategory) return a.subCategory.localeCompare(b.subCategory, 'da');
  if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, 'da');
  if (a.sourceId !== b.sourceId) return a.sourceId.localeCompare(b.sourceId, 'da');
  return (a.sourceRefs[0]?.page ?? 0) - (b.sourceRefs[0]?.page ?? 0);
});

export const indexedProblemCount = indexedProblems.length;

export const indexedProblemMainCategories: IndexedProblemMainCategory[] = ['Mekanik', 'Termodynamik'];

export const indexedProblemSubcategories = (
  mainCategory: IndexedProblemMainCategory,
  entries: IndexedProblemEntry[] = indexedProblems,
) =>
  Array.from(new Set(entries.filter((entry) => entry.mainCategory === mainCategory).map((entry) => entry.subCategory))).sort((a, b) =>
    a.localeCompare(b, 'da'),
  );

export const indexedProblemsForSubcategory = (
  mainCategory: IndexedProblemMainCategory,
  subCategory: string,
  entries: IndexedProblemEntry[] = indexedProblems,
) =>
  entries.filter((entry) => entry.mainCategory === mainCategory && entry.subCategory === subCategory);
