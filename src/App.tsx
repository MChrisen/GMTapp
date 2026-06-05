import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen,
  Columns2,
  FlaskConical,
  LibraryBig,
  Moon,
  Radar,
  Route,
  Search,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Figure } from './components/Figure';
import { Math as TexMath } from './components/Math';
import { PdfViewer } from './components/PdfViewer';
import { UnitConverter } from './components/UnitConverter';
import { VariablePicker, pickerEntryLabel } from './components/VariablePicker';
import { useGlobalHotkeys } from './features/navigation/useGlobalHotkeys';
import { useAppSearch } from './features/search/useAppSearch';
import { calculatorById, calculators } from './data/calculators';
import { pastExamQuestions, stuckCues, supplementalNumericExamples } from './data/examAids';
import { exampleById, patternById, problemPatterns, workedExamples } from './data/examples';
import { formulaById, formulasWithExamples } from './data/formulas';
import { pdfCorpus } from './data/pdfCorpus';
import { CONSTANT_CATEGORIES, PHYSICAL_CONSTANTS, SUBSTANCE_PROPERTIES } from './data/constants';
import type { PhysicalConstant } from './data/constants';
import { getPdfSource, pdfHref, pdfSources, resolvePdfOpenTarget } from './data/pdfManifest';
import type {
  CalculatorDefinition,
  Formula,
  ProblemPattern,
  SourceRef,
  WorkedExample,
} from './data/types';
import { cleanSnippet } from './utils/cleanText';
import {
  findAdvancedFormulaChains,
  findFormulas,
  getFormulaFinderIndex,
} from './utils/formulaFinder';
import { sourceLabel, sourceUrl } from './utils/linkResolver';
import { buildMapleSnippet } from './utils/maple';
import { finderPresets } from './data/finderPresets';
import { ExamSimulator } from './features/exam/ExamSimulator';
import { HotkeyHelp } from './components/HotkeyHelp';
import { SidebarShortcuts } from './components/SidebarShortcuts';
import type { AppState, FormulasMode, ProblemsMode, ReferenceMode, View } from './types/appState';
import { buildMapleSnippetForExample } from './utils/mapleExample';
import { explainProblemMatch, findProblemMatches, getExampleGivenKeys, getExamGivenKeys } from './utils/problemFinder';
import type { SearchResults } from './utils/search';
import { useBookmarks, useLocalStorage, useRecent } from './utils/storage';
import './styles.css';

const FORMULAS_MODE_STORAGE_KEY = 'gmt:formulas-mode';
const PROBLEMS_MODE_STORAGE_KEY = 'gmt:problems-mode';
const REFERENCE_MODE_STORAGE_KEY = 'gmt:reference-mode';

function readStoredFormulasMode(): FormulasMode {
  if (typeof window === 'undefined') return 'cards';
  try {
    const raw = sessionStorage.getItem(FORMULAS_MODE_STORAGE_KEY);
    if (!raw) return 'cards';
    const v = JSON.parse(raw) as unknown;
    if (v === 'cards' || v === 'finder' || v === 'advancedFinder' || v === 'calculators' || v === 'sheet') return v;
  } catch {
    /* ignore */
  }
  return 'cards';
}

function readStoredProblemsMode(): ProblemsMode {
  if (typeof window === 'undefined') return 'patterns';
  try {
    const raw = sessionStorage.getItem(PROBLEMS_MODE_STORAGE_KEY);
    if (raw === 'patterns' || raw === 'examples' || raw === 'exam') return raw;
  } catch {
    /* ignore */
  }
  return 'patterns';
}

function readStoredReferenceMode(): ReferenceMode {
  if (typeof window === 'undefined') return 'tools';
  try {
    const raw = sessionStorage.getItem(REFERENCE_MODE_STORAGE_KEY);
    if (raw === 'tools' || raw === 'sources') return raw;
  } catch {
    /* ignore */
  }
  return 'tools';
}

const categories = Array.from(new Set(formulasWithExamples.map((formula) => formula.category)));

const NAV_ITEMS: Array<{ id: View; label: string; description: string; icon: LucideIcon }> = [
  { id: 'formulas', label: 'Formler', description: 'Alle formler, finder og beregnere', icon: BookOpen },
  { id: 'problems', label: 'Problemer', description: 'Problemtyper, eksempler, eksamen', icon: FlaskConical },
  { id: 'reference', label: 'Konstanter', description: 'Konstanter, enheder og PDF', icon: LibraryBig },
];
const VIEW_IDS: View[] = ['formulas', 'problems', 'reference'];

const VIEW_TITLES: Record<View, string> = {
  formulas: 'Formler',
  problems: 'Problemer',
  reference: 'Konstanter',
};

const VIEW_LEADS: Record<View, string> = {
  formulas: 'Komplet formelbibliotek med links til guider, PDF og Maple-kopi.',
  problems: 'Alle problemtyper kategoriseret med hurtig guide og detaljerede eksempler.',
  reference: 'Eksamensrelevante konstanter, enheder og PDF-kilder samlet ét sted.',
};

const FORMULAS_TAB_LABELS: Record<FormulasMode, string> = {
  cards: 'Bibliotek',
  finder: 'Formelfinder',
  advancedFinder: 'Kædefinder',
  calculators: 'Beregnere',
  sheet: 'Hurtigark',
};

const PROBLEMS_TAB_LABELS: Record<ProblemsMode, string> = {
  patterns: 'Problemtyper',
  examples: 'Eksempler',
  exam: 'Eksamen Navigator',
};

const REFERENCE_TAB_LABELS: Record<ReferenceMode, string> = {
  tools: 'Konstanter',
  sources: 'PDF-kilder',
};

function viewSectionLabel(
  view: View,
  formulasMode: FormulasMode,
  problemsMode: ProblemsMode,
  referenceMode: ReferenceMode,
): string | null {
  switch (view) {
    case 'formulas':
      return `Formler · ${FORMULAS_TAB_LABELS[formulasMode]}`;
    case 'problems':
      return `Problemer · ${PROBLEMS_TAB_LABELS[problemsMode]}`;
    case 'reference':
      return `Konstanter · ${REFERENCE_TAB_LABELS[referenceMode]}`;
    default:
      return null;
  }
}

function ViewHeader({
  view,
  formulasMode,
  problemsMode,
  referenceMode,
}: {
  view: View;
  formulasMode: FormulasMode;
  problemsMode: ProblemsMode;
  referenceMode: ReferenceMode;
}) {
  const sectionLabel = viewSectionLabel(view, formulasMode, problemsMode, referenceMode);
  return (
    <header className="view-header">
      <div className="view-header-main">
        <h2 className="view-title">{VIEW_TITLES[view]}</h2>
        {sectionLabel ? <span className="view-breadcrumb">{sectionLabel}</span> : null}
      </div>
      <p className="muted small view-lead">{VIEW_LEADS[view]}</p>
    </header>
  );
}

type NavSnapshot = {
  view: View;
  selectedFormulaId: string;
  selectedExampleId: string;
  selectedCalculatorId: string;
  selectedPatternId: string;
  selectedExamQuestionId: string;
};

type UnitOption = {
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

const UNIT_OPTIONS: Record<string, UnitOption[]> = {
  m: [
    { label: 'm', toBase: (v) => v, fromBase: (v) => v },
    { label: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { label: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  'm³': [
    { label: 'm³', toBase: (v) => v, fromBase: (v) => v },
    { label: 'L', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: 'mL', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
  ],
  s: [
    { label: 's', toBase: (v) => v, fromBase: (v) => v },
    { label: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { label: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
  ],
  kg: [
    { label: 'kg', toBase: (v) => v, fromBase: (v) => v },
    { label: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  ],
  mol: [{ label: 'mol', toBase: (v) => v, fromBase: (v) => v }],
  'm²': [
    { label: 'm²', toBase: (v) => v, fromBase: (v) => v },
    { label: 'cm²', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
  ],
  N: [
    { label: 'N', toBase: (v) => v, fromBase: (v) => v },
    { label: 'kN', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  'N m': [{ label: 'N m', toBase: (v) => v, fromBase: (v) => v }],
  'kg m²': [{ label: 'kg m²', toBase: (v) => v, fromBase: (v) => v }],
  J: [
    { label: 'J', toBase: (v) => v, fromBase: (v) => v },
    { label: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  'J/(kg K)': [{ label: 'J/(kg K)', toBase: (v) => v, fromBase: (v) => v }],
  'J/kg': [{ label: 'J/kg', toBase: (v) => v, fromBase: (v) => v }],
  'm² K/W': [{ label: 'm² K/W', toBase: (v) => v, fromBase: (v) => v }],
  Pa: [
    { label: 'Pa', toBase: (v) => v, fromBase: (v) => v },
    { label: 'kPa', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: 'bar', toBase: (v) => v * 1e5, fromBase: (v) => v / 1e5 },
    { label: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
  ],
  'm/s': [
    { label: 'm/s', toBase: (v) => v, fromBase: (v) => v },
    { label: 'km/t', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
  ],
  'm/s²': [
    { label: 'm/s²', toBase: (v) => v, fromBase: (v) => v },
    { label: 'cm/s²', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  ],
  'rad/s²': [{ label: 'rad/s²', toBase: (v) => v, fromBase: (v) => v }],
  K: [
    { label: 'K', toBase: (v) => v, fromBase: (v) => v },
    { label: '°C', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
  ],
  '°C': [
    { label: '°C', toBase: (v) => v, fromBase: (v) => v },
    { label: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  W: [
    { label: 'W', toBase: (v) => v, fromBase: (v) => v },
    { label: 'kW', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  'rad/s': [
    { label: 'rad/s', toBase: (v) => v, fromBase: (v) => v },
    { label: 'rpm', toBase: (v) => (v * 2 * Math.PI) / 60, fromBase: (v) => (v * 60) / (2 * Math.PI) },
  ],
  grader: [
    { label: 'grader', toBase: (v) => v, fromBase: (v) => v },
    { label: 'rad', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
  ],
};

const getPatternCategory = (pattern: ProblemPattern): 'Mekanik' | 'Termodynamik' => {
  const thermoIds = new Set([
    'pattern-thermo-pv',
    'pattern-ideal-gas',
    'pattern-heat',
    'pattern-heat-transfer',
    'pattern-cop',
    'pattern-thermal-expansion',
  ]);
  return thermoIds.has(pattern.id) ? 'Termodynamik' : 'Mekanik';
};

const FORMULA_CONSTANT_HINTS: Record<string, string[]> = {
  'universal-gravitation': ['G', 'M_J', 'R_J'],
  'orbital-speed': ['G', 'M_J', 'R_J'],
  'orbital-period': ['G', 'M_J', 'R_J'],
  'heat-capacity': ['c_vand'],
  'latent-heat': ['L_f is', 'L_v vand'],
  'ideal-gas-law': ['R'],
  'ideal-gas-density': ['R_air'],
  'stefan-boltzmann': ['σ'],
};

const MAPLE_CONSTANT_ASSIGNMENTS: Record<string, string> = {
  g: 'g := 9.82;',
  G: 'G := 6.674e-11;',
  R: 'R := 8.314;',
  R_air: 'R_air := 287;',
  k_B: 'k_B := 1.381e-23;',
  N_A: 'N_A := 6.022e23;',
  σ: 'sigma := 5.670e-8;',
  c_vand: 'c := 4186;',
  'L_f is': 'L_f := 3.33e5;',
  'L_v vand': 'L_v := 2.26e6;',
  M_J: 'M := 5.97e24;',
  R_J: 'R_J := 6.37e6;',
  '0 °C': 'T0 := 273.15;',
};

function mapleCopyTextForFormula(formula: Formula, includeConstants: boolean): string {
  const constantAssignments = includeConstants
    ? constantsForFormula(formula)
        .map((constant) => MAPLE_CONSTANT_ASSIGNMENTS[constant.symbol])
        .filter((line): line is string => Boolean(line))
    : [];
  const snippet = buildMapleSnippet(formula.latex, constantAssignments);
  if (snippet.trim()) return snippet;
  const fallback = formula.equation.trim();
  return fallback ? `eq1 := ${fallback}:` : '';
}

function constantsForFormula(formula: Formula): PhysicalConstant[] {
  const hits = new Set<string>();
  const names = formula.variables.map((variable) => variable.name.toLocaleLowerCase('da-DK'));
  if (names.some((name) => name.includes('tyngdeacceleration'))) hits.add('g');
  if (names.some((name) => name.includes('gravitationskonstant'))) hits.add('G');
  if (names.some((name) => name.includes('gaskonstant'))) hits.add('R');
  if (names.some((name) => name.includes('boltzmann'))) hits.add('k_B');
  if (names.some((name) => name.includes('avogadro'))) hits.add('N_A');
  if (names.some((name) => name.includes('stefan'))) hits.add('σ');
  if (names.some((name) => name.includes('varmekapacitet'))) hits.add('c_vand');
  if (names.some((name) => name.includes('smeltevarme'))) hits.add('L_f is');
  if (names.some((name) => name.includes('fordampningsvarme'))) hits.add('L_v vand');

  for (const symbol of FORMULA_CONSTANT_HINTS[formula.id] ?? []) {
    hits.add(symbol);
  }

  return PHYSICAL_CONSTANTS.filter((constant) => hits.has(constant.symbol));
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return 'ikke defineret';
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 1e-3 || absolute >= 1e6)) return value.toExponential(4);
  return Number.parseFloat(value.toPrecision(6)).toString();
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightTokens = (query: string) =>
  Array.from(
    new Set(
      query
        .toLocaleLowerCase('da-DK')
        .split(/[^\p{L}\p{N}_]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length > 1),
    ),
  ).sort((a, b) => b.length - a.length);

function HighlightedText({ text, query }: { text: string; query: string }) {
  const tokens = highlightTokens(query);
  if (!tokens.length) return text;
  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'giu');
  const parts = text.split(matcher).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        tokens.some((token) => part.toLocaleLowerCase('da-DK') === token) ? (
          <mark key={`${part}-${index}`} className="search-hit-mark">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function App() {
  const [view, setViewRaw] = useState<View>('formulas');
  const [query, setQuery] = useState('');
  const [includePdfInSearch, setIncludePdfInSearch] = useLocalStorage<boolean>('gmt:include-pdf-search', false);
  const [selectedFormulaId, setSelectedFormulaId] = useState(formulasWithExamples[0]?.id ?? '');
  const [selectedExampleId, setSelectedExampleId] = useState(workedExamples[0]?.id ?? '');
  const [selectedCalculatorId, setSelectedCalculatorId] = useState(calculators[0]?.id ?? '');
  const [selectedPatternId, setSelectedPatternId] = useState(problemPatterns[0]?.id ?? '');
  const [selectedExamQuestionId, setSelectedExamQuestionId] = useState(pastExamQuestions[0]?.id ?? '');
  const [examMode, setExamMode] = useLocalStorage<boolean>('gmt:exam-mode', false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [formulasMode, setFormulasMode] = useState<FormulasMode>(readStoredFormulasMode);
  const [problemsMode, setProblemsMode] = useState<ProblemsMode>(readStoredProblemsMode);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(readStoredReferenceMode);
  const [pdfViewer, setPdfViewer] = useState<{ sourceId: string; page: number } | null>(null);
  const [pdfDocked, setPdfDocked] = useLocalStorage<boolean>('gmt:pdf-docked', true);
  const [finderPrefillKeys, setFinderPrefillKeys] = useState<string[] | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('gmt:dark-mode', false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchPopoverRef = useRef<HTMLDivElement | null>(null);
  const navHistoryRef = useRef<NavSnapshot[]>([]);
  const restoredSessionRef = useRef(false);
  const skipNextPersistRef = useRef(false);
  const { toggle: toggleBookmark, isBookmarked, bookmarks } = useBookmarks();

  const openFinderWithKeys = useCallback((keys: string[]) => {
    setFinderPrefillKeys(keys);
    setFormulasMode('finder');
    setViewRaw('formulas');
    setIsSearchOpen(false);
  }, []);

  const clearFinderPrefill = useCallback(() => setFinderPrefillKeys(null), []);
  const { recent: recentFormulas, push: pushRecentFormula } = useRecent('gmt:recent-formulas', 6);
  const { recent: recentExamples, push: pushRecentExample } = useRecent('gmt:recent-examples', 4);

  const snapshot = useCallback(
    (): NavSnapshot => ({
      view,
      selectedFormulaId,
      selectedExampleId,
      selectedCalculatorId,
      selectedPatternId,
      selectedExamQuestionId,
    }),
    [selectedCalculatorId, selectedExamQuestionId, selectedExampleId, selectedFormulaId, selectedPatternId, view],
  );

  const pushHistory = useCallback(() => {
    navHistoryRef.current = [...navHistoryRef.current, snapshot()].slice(-80);
    setCanGoBack(navHistoryRef.current.length > 0);
  }, [snapshot]);

  const restoreSnapshot = useCallback((entry: NavSnapshot) => {
    setViewRaw(VIEW_IDS.includes(entry.view) ? entry.view : 'formulas');
    setSelectedFormulaId(entry.selectedFormulaId);
    setSelectedExampleId(entry.selectedExampleId);
    setSelectedCalculatorId(entry.selectedCalculatorId);
    setSelectedPatternId(entry.selectedPatternId);
    setSelectedExamQuestionId(entry.selectedExamQuestionId);
  }, []);

  const goBack = useCallback(() => {
    const previous = navHistoryRef.current[navHistoryRef.current.length - 1];
    if (!previous) return;
    navHistoryRef.current = navHistoryRef.current.slice(0, -1);
    setCanGoBack(navHistoryRef.current.length > 0);
    restoreSnapshot(previous);
  }, [restoreSnapshot]);

  const setView = useCallback(
    (nextView: View) => {
      setIsSearchOpen(false);
      if (nextView === view) return;
      pushHistory();
      setViewRaw(nextView);
    },
    [pushHistory, view],
  );

  const selectFormula = useCallback(
    (id: string) => {
      pushHistory();
      setSelectedFormulaId(id);
      setViewRaw('formulas');
      setFormulasMode('cards');
      setIsSearchOpen(false);
      pushRecentFormula(id);
    },
    [pushHistory, pushRecentFormula],
  );
  const selectExample = useCallback(
    (id: string) => {
      pushHistory();
      setSelectedExampleId(id);
      setViewRaw('problems');
      setProblemsMode('examples');
      setIsSearchOpen(false);
      pushRecentExample(id);
    },
    [pushHistory, pushRecentExample],
  );
  const selectCalculator = useCallback((id: string) => {
    pushHistory();
    setSelectedCalculatorId(id);
    setViewRaw('formulas');
    setFormulasMode('calculators');
    setIsSearchOpen(false);
  }, [pushHistory]);
  const selectPattern = useCallback((id: string) => {
    pushHistory();
    setSelectedPatternId(id);
    setViewRaw('problems');
    setProblemsMode('patterns');
    setIsSearchOpen(false);
  }, [pushHistory]);
  const selectExamQuestion = useCallback((id: string) => {
    pushHistory();
    setSelectedExamQuestionId(id);
    setViewRaw('problems');
    setProblemsMode('exam');
    setIsSearchOpen(false);
  }, [pushHistory]);

  const hasQuery = query.trim().length > 0;
  const searchExpanded = hasQuery || isSearchOpen || searchFocused;
  const { isUpdating: searchIsUpdating, results: searchResults } = useAppSearch(query, includePdfInSearch);

  useGlobalHotkeys({
    setView,
    setQuery,
    goBack,
    hasQuery,
    searchInputRef,
  });

  const openPdf = useCallback(
    (sourceId: string, page = 1) => {
      if (examMode && !window.confirm('Åbn PDF i appen på den valgte side?')) return;
      setPdfViewer({ sourceId, page });
    },
    [examMode],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a[href*=".pdf"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const target = resolvePdfOpenTarget(href);
      if (!target) return;
      event.preventDefault();
      openPdf(target.sourceId, target.page);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [openPdf]);

  useEffect(() => {
    if (!hasQuery) {
      setIsSearchOpen(false);
    }
  }, [hasQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (searchPopoverRef.current?.contains(target)) return;
      if (searchInputRef.current?.contains(target)) return;
      setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(FORMULAS_MODE_STORAGE_KEY, JSON.stringify(formulasMode));
    } catch {
      /* ignore */
    }
  }, [formulasMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PROBLEMS_MODE_STORAGE_KEY, problemsMode);
    } catch {
      /* ignore */
    }
  }, [problemsMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(REFERENCE_MODE_STORAGE_KEY, referenceMode);
    } catch {
      /* ignore */
    }
  }, [referenceMode]);

  useEffect(() => {
    const raw = sessionStorage.getItem('gmt:nav-state');
    restoredSessionRef.current = true;
    if (!raw) return;
    try {
      skipNextPersistRef.current = true;
      restoreSnapshot(JSON.parse(raw) as NavSnapshot);
    } catch {
      sessionStorage.removeItem('gmt:nav-state');
    }
  }, [restoreSnapshot]);

  useEffect(() => {
    if (!restoredSessionRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    sessionStorage.setItem('gmt:nav-state', JSON.stringify(snapshot()));
  }, [snapshot]);

  const state: AppState = {
    view,
    setView,
    canGoBack,
    goBack,
    examMode,
    query,
    setQuery,
    includePdfInSearch,
    setIncludePdfInSearch,
    searchResults,
    selectFormula,
    selectExample,
    selectCalculator,
    selectPattern,
    selectExamQuestion,
    selectedFormulaId,
    selectedExampleId,
    selectedCalculatorId,
    selectedPatternId,
    selectedExamQuestionId,
    searchInputRef,
    formulasMode,
    setFormulasMode,
    problemsMode,
    setProblemsMode,
    referenceMode,
    setReferenceMode,
    openPdf,
    pdfDocked,
    setPdfDocked,
    finderPrefillKeys,
    openFinderWithKeys,
    clearFinderPrefill,
    showBookmarksOnly,
    setShowBookmarksOnly,
    darkMode,
    setDarkMode,
  };

  const selectedFormula = formulaById(selectedFormulaId) ?? formulasWithExamples[0];
  const selectedExample = exampleById(selectedExampleId) ?? workedExamples[0];
  const selectedCalculator = calculatorById(selectedCalculatorId) ?? calculators[0];
  const selectedPattern = patternById(selectedPatternId) ?? problemPatterns[0];
  const selectedExamQuestion =
    pastExamQuestions.find((question) => question.id === selectedExamQuestionId) ?? pastExamQuestions[0];

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`app-shell${examMode ? ' exam-mode' : ''}${darkMode ? ' theme-dark' : ''}${pdfViewer && pdfDocked ? ' pdf-split-active' : ''}`}>
      <a className="skip-link" href="#view-stage">
        Spring til indhold
      </a>
      <header className="app-chrome app-chrome--slim">
        <div className="chrome-brand">
          <Radar size={20} aria-hidden="true" className="chrome-brand-icon" />
          <div>
            <h1>GMT Eksamenhjælp</h1>
            <p className="chrome-tagline">
              Offline · {formulasWithExamples.length} formler · {problemPatterns.length} problemtyper · {pdfSources.length}{' '}
              PDF-kilder
            </p>
          </div>
        </div>
        <div className="chrome-actions" role="group" aria-label="Indstillinger">
          <button
            type="button"
            className={`chrome-toggle${darkMode ? ' active' : ''}`}
            onClick={() => setDarkMode((current) => !current)}
            aria-pressed={darkMode}
            title={darkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
          >
            {darkMode ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
            <span>{darkMode ? 'Mørk' : 'Lys'}</span>
          </button>
          <button
            type="button"
            className={`chrome-toggle${pdfDocked ? ' active' : ''}`}
            onClick={() => setPdfDocked((current) => !current)}
            aria-pressed={pdfDocked}
            title="Vis PDF ved siden af indholdet i stedet for som overlay"
          >
            <Columns2 size={15} aria-hidden="true" />
            <span>{pdfDocked ? 'PDF delt' : 'PDF overlay'}</span>
          </button>
          <button
            type="button"
            className={`chrome-toggle${examMode ? ' active' : ''}`}
            onClick={() => setExamMode((current) => !current)}
            aria-pressed={examMode}
            title="Kræv bekræftelse før en PDF åbnes (eksamenssikker)"
          >
            <ShieldCheck size={15} aria-hidden="true" />
            <span>{examMode ? 'Bekræft PDF' : 'Eksamenstilstand'}</span>
          </button>
        </div>
      </header>

      <div className="app-frame">
        <nav className="nav-rail" aria-label="App navigation">
          {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? 'active' : ''}
              type="button"
              data-view={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </button>
          ))}
          <SidebarShortcuts
            state={state}
            recentFormulas={recentFormulas}
            recentExamples={recentExamples}
            bookmarks={bookmarks}
          />
        </nav>

        <section className="content-canvas">
          <div className="command-area">
            <section
              className={`search-panel command-bar${searchExpanded ? ' is-expanded' : ' is-compact'}`}
              role="search"
              aria-label="Søg i appen"
            >
              <div className="command-row">
                <div className="search-input-wrap">
                  <Search className="search-icon" size={16} aria-hidden="true" />
                  <input
                    id="search"
                    ref={searchInputRef}
                    value={query}
                    role="combobox"
                    aria-expanded={hasQuery && isSearchOpen}
                    aria-controls="search-results-panel"
                    aria-autocomplete="list"
                    aria-label="Søg i formler, guider, beregnere og PDF"
                    onChange={(event) => {
                      const next = event.target.value;
                      setQuery(next);
                      setIsSearchOpen(next.trim().length > 0);
                    }}
                    onFocus={() => {
                      setSearchFocused(true);
                      if (query.trim().length > 0) setIsSearchOpen(true);
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setSearchFocused(false), 120);
                    }}
                    placeholder="Søg: pV, skråplan, Carnot, moment, idealgas …  (⌘K)"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {hasQuery && (
                    <button type="button" className="clear-button" onClick={() => setQuery('')} aria-label="Ryd søgning">
                      ×
                    </button>
                  )}
                </div>
                <div className="search-inline-actions" aria-label="Navigation">
                  <button type="button" onClick={goBack} disabled={!canGoBack} title="Alt + ←">
                    Tilbage
                  </button>
                </div>
              </div>
              {searchIsUpdating && (
                <p className="muted small search-status">Opdaterer resultater for &ldquo;{query}&rdquo;...</p>
              )}
              <div className="search-expanded-block">
                <div className="quick-tags" aria-label="Forslag til søgning">
                  {['projektil', 'skråplan', 'moment', 'pV', 'idealgas', 'carnot', 'COP', 'satellit'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setQuery(tag);
                        setIsSearchOpen(true);
                        searchInputRef.current?.focus();
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="command-footer">
                  <label className="search-option">
                    <input
                      type="checkbox"
                      checked={includePdfInSearch}
                      onChange={(event) => setIncludePdfInSearch(event.target.checked)}
                    />
                    Medtag PDF-tekst (langsommere)
                  </label>
                </div>
              </div>
            </section>

            {hasQuery && isSearchOpen && (
              <div className="search-popover" ref={searchPopoverRef} id="search-results-panel">
                <UniversalSearchResults state={state} />
              </div>
            )}
          </div>

          <div className={`content-body${pdfViewer && pdfDocked ? ' content-body--pdf-split' : ''}`}>
          <main className="view-stage" id="view-stage" tabIndex={-1}>
            <ViewHeader
              view={view}
              formulasMode={formulasMode}
              problemsMode={problemsMode}
              referenceMode={referenceMode}
            />
            {view === 'formulas' && (
              <>
                <div className="sub-tab-row">
                  <div className="sub-tabs" role="tablist" aria-label="Formler-visning">
                    {/* Sub-tabs only switch local mode; they do not push onto the back stack (unlike setView / selection navigators). */}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formulasMode === 'cards'}
                      className={formulasMode === 'cards' ? 'active' : ''}
                      onClick={() => setFormulasMode('cards')}
                    >
                      Bibliotek
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formulasMode === 'finder'}
                      className={formulasMode === 'finder' ? 'active' : ''}
                      onClick={() => setFormulasMode('finder')}
                    >
                      Formelfinder
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formulasMode === 'advancedFinder'}
                      className={formulasMode === 'advancedFinder' ? 'active' : ''}
                      onClick={() => setFormulasMode('advancedFinder')}
                    >
                      Kædefinder
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formulasMode === 'calculators'}
                      className={formulasMode === 'calculators' ? 'active' : ''}
                      onClick={() => setFormulasMode('calculators')}
                    >
                      Beregnere
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formulasMode === 'sheet'}
                      className={formulasMode === 'sheet' ? 'active' : ''}
                      onClick={() => setFormulasMode('sheet')}
                    >
                      Hurtigark
                    </button>
                  </div>
                </div>
                {formulasMode === 'cards' ? (
                  <FormulaLibrary
                    state={state}
                    selectedFormula={selectedFormula}
                    isBookmarked={isBookmarked}
                    toggleBookmark={toggleBookmark}
                  />
                ) : formulasMode === 'finder' ? (
                  <FormulaFinder state={state} />
                ) : formulasMode === 'advancedFinder' ? (
                  <AdvancedFormulaFinder state={state} />
                ) : formulasMode === 'calculators' ? (
                  <CalculatorHub state={state} selectedCalculator={selectedCalculator} />
                ) : (
                  <FormulaSheetView state={state} />
                )}
              </>
            )}
            {view === 'problems' && (
              <>
                <div className="sub-tab-row">
                  <div className="sub-tabs" role="tablist" aria-label="Opgaver-visning">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={problemsMode === 'patterns'}
                      className={problemsMode === 'patterns' ? 'active' : ''}
                      onClick={() => setProblemsMode('patterns')}
                    >
                      Problemtyper
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={problemsMode === 'examples'}
                      className={problemsMode === 'examples' ? 'active' : ''}
                      onClick={() => setProblemsMode('examples')}
                    >
                      Eksempler
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={problemsMode === 'exam'}
                      className={problemsMode === 'exam' ? 'active' : ''}
                      onClick={() => setProblemsMode('exam')}
                    >
                      Eksamen Navigator
                    </button>
                  </div>
                </div>
                {problemsMode === 'patterns' ? (
                  <ProblemPatterns state={state} selectedPattern={selectedPattern} />
                ) : problemsMode === 'examples' ? (
                  <ExamplesView
                    state={state}
                    selectedExample={selectedExample}
                    isBookmarked={isBookmarked}
                    toggleBookmark={toggleBookmark}
                  />
                ) : (
                  <>
                    <ExamDecoderView state={state} selectedQuestion={selectedExamQuestion} />
                    <ExamSimulator state={state} />
                  </>
                )}
              </>
            )}
            {view === 'reference' && (
              <>
                <div className="sub-tab-row">
                  <div className="sub-tabs" role="tablist" aria-label="Reference-visning">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={referenceMode === 'tools'}
                      className={referenceMode === 'tools' ? 'active' : ''}
                      onClick={() => setReferenceMode('tools')}
                    >
                      Konstanter og enheder
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={referenceMode === 'sources'}
                      className={referenceMode === 'sources' ? 'active' : ''}
                      onClick={() => setReferenceMode('sources')}
                    >
                      Kilder (PDF)
                    </button>
                  </div>
                </div>
                {referenceMode === 'tools' ? <ToolsView /> : <SourcesView />}
              </>
            )}
          </main>

          {pdfViewer && pdfDocked && (
            <PdfViewer
              key={`${pdfViewer.sourceId}-${pdfViewer.page}`}
              docked
              sourceId={pdfViewer.sourceId}
              page={pdfViewer.page}
              onClose={() => setPdfViewer(null)}
            />
          )}
          </div>

          <footer className="hint-bar">
            <kbd>⌘K</kbd> / <kbd>/</kbd> søg · <kbd>Esc</kbd> ryd · <kbd>Alt+1…3</kbd> hovedside · <kbd>Alt+←</kbd> tilbage · <kbd>?</kbd> genveje
          </footer>
        </section>
      </div>

      {pdfViewer && !pdfDocked && (
        <PdfViewer sourceId={pdfViewer.sourceId} page={pdfViewer.page} onClose={() => setPdfViewer(null)} />
      )}
      <HotkeyHelp />
    </div>
  );
}

function UniversalSearchResults({ state }: { state: AppState }) {
  const { query, selectFormula, selectExample, selectCalculator, selectPattern, selectExamQuestion, searchResults: results } = state;
  const [activeIndex, setActiveIndex] = useState(0);
  const bestMatch =
    results.examQuestions[0]
      ? { label: 'Eksamen Navigator', title: `${results.examQuestions[0].year}: ${results.examQuestions[0].title}`, action: () => selectExamQuestion(results.examQuestions[0].id) }
      : results.patterns[0]
        ? { label: 'Problemguide', title: results.patterns[0].title, action: () => selectPattern(results.patterns[0].id) }
        : results.formulas[0]
          ? { label: 'Formel', title: results.formulas[0].name, action: () => selectFormula(results.formulas[0].id) }
          : results.calculators[0]
            ? { label: 'Beregner', title: results.calculators[0].title, action: () => selectCalculator(results.calculators[0].id) }
            : results.examples[0]
              ? { label: 'Eksempel', title: results.examples[0].title, action: () => selectExample(results.examples[0].id) }
              : null;
  const keyboardTargets = useMemo(
    () => [
      ...(bestMatch ? [{ id: 'best', action: bestMatch.action }] : []),
      ...results.formulas.slice(0, 8).map((formula) => ({ id: formula.id, action: () => selectFormula(formula.id) })),
      ...results.patterns.slice(0, 6).map((pattern) => ({ id: pattern.id, action: () => selectPattern(pattern.id) })),
      ...results.calculators.slice(0, 6).map((calculator) => ({ id: calculator.id, action: () => selectCalculator(calculator.id) })),
      ...results.examples.slice(0, 6).map((example) => ({ id: example.id, action: () => selectExample(example.id) })),
      ...results.examQuestions.slice(0, 6).map((question) => ({ id: question.id, action: () => selectExamQuestion(question.id) })),
    ],
    [bestMatch, results.calculators, results.examQuestions, results.examples, results.formulas, results.patterns, selectCalculator, selectExamQuestion, selectExample, selectFormula, selectPattern],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    document.querySelector('.search-results .keyboard-active')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!keyboardTargets.length) return;
      const active = document.activeElement;
      const inSearchFlow = active?.closest('.command-area') != null;
      if (
        (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'SELECT') &&
        !inSearchFlow
      ) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, keyboardTargets.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        keyboardTargets[activeIndex]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, keyboardTargets]);

  const kbClass = (index: number) => (activeIndex === index ? ' keyboard-active' : '');

  return (
    <section className="search-results">
      <header className="search-results-head">
        <h2>Resultater for &ldquo;{query}&rdquo;</h2>
        <span className="muted small">
          {results.formulas.length} formler · {results.patterns.length} problemtyper · {results.calculators.length} beregnere ·{' '}
          {results.examples.length} eksempler · {results.examQuestions.length} eksamensmatch · {results.pdfHits.length} PDF-træf
          {keyboardTargets.length > 0 && (
            <> · <kbd>↑</kbd>/<kbd>↓</kbd> + <kbd>Enter</kbd> vælger</>
          )}
        </span>
      </header>
      {(() => {
        let ki = 0;
        return (
          <>
      {bestMatch && (
        <button type="button" className={`best-match-card${kbClass(ki++)}`} onClick={bestMatch.action}>
          <span className="tag">Bedste næste klik · {bestMatch.label}</span>
          <strong><HighlightedText text={bestMatch.title} query={query} /></strong>
          <small>Åbn dette først, hvis du vil hurtigst videre.</small>
        </button>
      )}

      <div className="results-grid">
        <ResultGroup title="Formler" count={results.formulas.length}>
          {results.formulas.slice(0, 8).map((formula) => (
            <button key={formula.id} type="button" className={`result-card${kbClass(ki++)}`} onClick={() => selectFormula(formula.id)}>
              <header>
                <strong><HighlightedText text={formula.name} query={query} /></strong>
                <span className="tag">{formula.category}</span>
              </header>
              <TexMath tex={formula.latex} block />
              <small><HighlightedText text={formula.topic} query={query} /></small>
            </button>
          ))}
        </ResultGroup>

        <ResultGroup title="Problemtyper" count={results.patterns.length}>
          {results.patterns.slice(0, 6).map((pattern) => (
            <button key={pattern.id} type="button" className={`result-card${kbClass(ki++)}`} onClick={() => selectPattern(pattern.id)}>
              <header>
                <strong><HighlightedText text={pattern.title} query={query} /></strong>
              </header>
              <small><HighlightedText text={pattern.recognition} query={query} /></small>
              <small className="muted"><HighlightedText text={pattern.cueWords.slice(0, 4).join(' · ')} query={query} /></small>
            </button>
          ))}
        </ResultGroup>

        <ResultGroup title="Beregnere" count={results.calculators.length}>
          {results.calculators.slice(0, 6).map((calculator) => (
            <button key={calculator.id} type="button" className={`result-card${kbClass(ki++)}`} onClick={() => selectCalculator(calculator.id)}>
              <header>
                <strong><HighlightedText text={calculator.title} query={query} /></strong>
              </header>
              <TexMath tex={calculator.latex} block />
              <small>{calculator.category}</small>
            </button>
          ))}
        </ResultGroup>

        <ResultGroup title="Eksempler" count={results.examples.length}>
          {results.examples.slice(0, 6).map((example) => (
            <button key={example.id} type="button" className={`result-card${kbClass(ki++)}`} onClick={() => selectExample(example.id)}>
              <header>
                <strong><HighlightedText text={example.title} query={query} /></strong>
                <span className="tag">{example.difficulty}</span>
              </header>
              <small><HighlightedText text={example.pattern} query={query} /></small>
            </button>
          ))}
        </ResultGroup>

        <ResultGroup title="Eksamen Navigator" count={results.examQuestions.length}>
          {results.examQuestions.slice(0, 6).map((question) => (
            <button key={question.id} type="button" className={`result-card${kbClass(ki++)}`} onClick={() => selectExamQuestion(question.id)}>
              <header>
                <strong><HighlightedText text={`${question.year}: ${question.title}`} query={query} /></strong>
                <span className="tag">{getPdfSource(question.source.sourceId)?.shortTitle}</span>
              </header>
              <small><HighlightedText text={question.cue} query={query} /></small>
              <small className="muted"><HighlightedText text={question.firstMove} query={query} /></small>
            </button>
          ))}
        </ResultGroup>

        <ResultGroup title="PDF-tekstmatch" count={results.pdfHits.length} wide>
          {results.pdfHits.slice(0, 10).map((hit) => (
            <a
              key={`${hit.sourceId}-${hit.page}`}
              className="result-card"
              href={pdfHref(hit.sourceId, hit.page)}
              target="_blank"
              rel="noreferrer"
            >
              <header>
                <strong><HighlightedText text={`${hit.sourceTitle} · side ${hit.page}`} query={query} /></strong>
              </header>
              <small className="snippet"><HighlightedText text={hit.text} query={query} /></small>
            </a>
          ))}
        </ResultGroup>
      </div>
          </>
        );
      })()}
    </section>
  );
}

function ResultGroup({
  title,
  count,
  children,
  wide,
}: {
  title: string;
  count: number;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`results-group${wide ? ' wide' : ''}`}>
      <header>
        <h3>{title}</h3>
        <span className="count">{count}</span>
      </header>
      <div className="result-cards">{count === 0 ? <p className="muted small">Ingen match.</p> : children}</div>
    </section>
  );
}

function StuckCueHelper({ state }: { state: AppState }) {
  const [cueQuery, setCueQuery] = useState('');
  const matches = cueQuery.trim()
    ? stuckCues.filter((cue) =>
        [cue.cue, cue.likelyMeans, cue.firstMove, cue.keywords.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(cueQuery.toLowerCase()),
      )
    : stuckCues;

  return (
    <div className="stuck-helper">
      <label className="field">
        Skriv et ord fra opgaven
        <input
          value={cueQuery}
          onChange={(event) => setCueQuery(event.target.value)}
          placeholder="fx 'højde', 'trisse', 'pV', 'is', 'tipper', 'satellit'..."
        />
      </label>
      <div className="cue-grid">
        {matches.slice(0, 7).map((cue) => (
          <article key={cue.id} className="cue-card">
            <h3>{cue.cue}</h3>
            <p><strong>Det betyder ofte:</strong> {cue.likelyMeans}</p>
            <p><strong>Første move:</strong> {cue.firstMove}</p>
            <div className="pill-row">
              {cue.patternIds.map((id) => {
                const pattern = patternById(id);
                return (
                  <button key={id} type="button" onClick={() => state.selectPattern(id)}>
                    {pattern?.title ?? id}
                  </button>
                );
              })}
              {cue.calculatorIds.slice(0, 2).map((id) => {
                const calculator = calculatorById(id);
                return calculator ? (
                  <button key={id} type="button" onClick={() => state.selectCalculator(id)}>
                    {calculator.title}
                  </button>
                ) : null;
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProblemSolverWizard({ state }: { state: AppState }) {
  const [input, setInput] = useState('');
  const tokens = input
    .toLowerCase()
    .split(/[\s,.;:!?()]+/)
    .filter(Boolean);

  const rankedCues = useMemo(() => {
    return stuckCues
      .map((cue) => {
        const haystack = [cue.cue, cue.likelyMeans, cue.firstMove, cue.keywords.join(' ')].join(' ').toLowerCase();
        const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
        return { cue, score };
      })
      .filter((entry) => (tokens.length ? entry.score > 0 : true))
      .sort((a, b) => b.score - a.score);
  }, [tokens]);

  const bestCue = rankedCues[0]?.cue ?? stuckCues[0];
  const bestPattern = bestCue?.patternIds.map((id) => patternById(id)).find((entry): entry is ProblemPattern => Boolean(entry));
  const bestFormula = bestPattern?.formulaIds.map((id) => formulaById(id)).find((entry): entry is Formula => Boolean(entry));
  const bestCalculator = bestPattern?.calculatorIds
    .map((id) => calculatorById(id))
    .find((entry): entry is CalculatorDefinition => Boolean(entry));
  const bestExample = bestPattern?.exampleIds.map((id) => exampleById(id)).find((entry): entry is WorkedExample => Boolean(entry));

  return (
    <section className="card wide">
      <h2>Fra opgave til løsning</h2>
      <p className="muted small">Skriv stikord fra opgaven — få problemtype, formel og eksempel i tre trin.</p>
      <label className="field">
        Opgavens stikord
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="fx 'snor trisse acceleration' eller 'pV adiabat arbejde'..."
        />
      </label>
      <div className="wizard-grid">
        <article className="subcard">
          <h3>1) Genkend type</h3>
          <p><strong>Tolkning:</strong> {bestCue?.likelyMeans ?? 'Ingen match endnu.'}</p>
          <p><strong>Første move:</strong> {bestCue?.firstMove ?? 'Skriv 1-3 stikord for at få forslag.'}</p>
          {bestPattern && (
            <button type="button" onClick={() => state.selectPattern(bestPattern.id)}>
              Åbn problemtype: {bestPattern.title}
            </button>
          )}
        </article>
        <article className="subcard">
          <h3>2) Sæt model op</h3>
          <p className="muted small">Start med kerneformlen før talindsættelse.</p>
          <div className="pill-row">
            {bestFormula && (
              <button type="button" onClick={() => state.selectFormula(bestFormula.id)}>
                Formel: {bestFormula.name}
              </button>
            )}
            {bestCalculator && (
              <button type="button" onClick={() => state.selectCalculator(bestCalculator.id)}>
                Regner: {bestCalculator.title}
              </button>
            )}
          </div>
        </article>
        <article className="subcard">
          <h3>3) Tjek med eksempel</h3>
          <p className="muted small">Sammenlign struktur, enheder og fortegn med et lignende eksempel.</p>
          {bestExample ? (
            <button type="button" onClick={() => state.selectExample(bestExample.id)}>
              Eksempel: {bestExample.title}
            </button>
          ) : (
            <p className="muted small">Ingen direkte eksempelkobling endnu for dette match.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function ExamReadyChecklist({ state, compact = false }: { state: AppState; compact?: boolean }) {
  const diagnostics = useMemo(runCalculatorDiagnostics, []);
  const passedDiagnostics = diagnostics[0]?.ok ?? false;
  const completePatterns = problemPatterns.filter((pattern) => pattern.exampleIds.length && pattern.formulaIds.length).length;
  const readyItems = [
    { label: 'Beregner-diagnostik', ok: passedDiagnostics, detail: diagnostics[0]?.detail ?? 'Ikke kørt' },
    { label: 'PDF-bibliotek', ok: pdfSources.length >= 15, detail: `${pdfSources.length} lokale kilder registreret` },
    { label: 'Problemguide-dækning', ok: completePatterns === problemPatterns.length, detail: `${completePatterns}/${problemPatterns.length} typer har formler og eksempler` },
    { label: 'Desktop-app', ok: true, detail: 'Start GMT.command — eget vindue, PDF i Preview' },
  ];

  return (
    <section className={`card wide${compact ? ' exam-ready-compact' : ''}`}>
      <div className="detail-head">
        <div>
          <p className="eyebrow">Før eksamen</p>
          <h2>{compact ? 'Klar til eksamen?' : 'Eksamenskontrol'}</h2>
          <p className="muted small">
            {compact ? 'Tjek at alt er grønt før du går i gang.' : 'Kør denne liste før eksamen — alt skal være grønt eller forstået.'}
          </p>
        </div>
        {!compact && (
          <button
            type="button"
            onClick={() => {
              state.setReferenceMode('tools');
              state.setView('reference');
            }}
          >
            Åbn værktøj
          </button>
        )}
      </div>
      <div className="variable-grid">
        {readyItems.map((item) => (
          <div key={item.label} className={item.ok ? 'diag-pass' : 'diag-fail'}>
            <strong>{item.ok ? 'Klar' : 'Tjek'} · {item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="muted small">
          Brug <strong>Start GMT.command</strong> (Mac) eller <strong>Start GMT.bat</strong> (Windows) — eget vindue (Electron). PDF’er åbnes i Preview.
        </p>
      )}
    </section>
  );
}

function ProblemWorkspace({ state, embedded = false }: { state: AppState; embedded?: boolean }) {
  const question =
    pastExamQuestions.find((entry) => entry.id === state.selectedExamQuestionId) ?? pastExamQuestions[0];
  const patterns = question.patternIds.map((id) => patternById(id)).filter((entry): entry is ProblemPattern => Boolean(entry));
  const formulas = question.formulaIds.map((id) => formulaById(id)).filter((entry): entry is Formula => Boolean(entry));
  const calculatorsForQuestion = question.calculatorIds
    .map((id) => calculatorById(id))
    .filter((entry): entry is CalculatorDefinition => Boolean(entry));
  const examplesForQuestion = question.exampleIds.map((id) => exampleById(id)).filter((entry): entry is WorkedExample => Boolean(entry));
  const sourceRefs = [question.source, ...examplesForQuestion.flatMap((example) => example.sources)];
  const firstPattern = patterns[0];
  const firstFormula = formulas[0];
  const firstCalculator = calculatorsForQuestion[0];
  const firstExample = examplesForQuestion[0];

  return (
    <section className={`card wide workspace-card${embedded ? ' workspace-card--embedded' : ''}`}>
      {!embedded && (
        <header className="workspace-head">
          <div>
            <p className="eyebrow">Ét problem ad gangen</p>
            <h2>Opgave-arbejdsrum</h2>
            <p className="muted small">
              Metode, formler, beregner og PDF for den valgte eksamensopgave — samlet ét sted.
            </p>
          </div>
        <div className="workspace-head-actions">
          <button
            type="button"
            onClick={() => {
              state.setProblemsMode('exam');
              state.setView('problems');
            }}
          >
            Åbn i Eksamen Navigator
          </button>
          {firstPattern && (
            <button type="button" onClick={() => state.selectPattern(firstPattern.id)}>
              Åbn hovedtype
            </button>
          )}
        </div>
        </header>
      )}

      <div className="workspace-toolbar">
        <label className="field workspace-select">
          Aktiv eksamensopgave
          <select value={question.id} onChange={(event) => state.selectExamQuestion(event.target.value)}>
            {pastExamQuestions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.year}: {entry.title}
              </option>
            ))}
          </select>
        </label>
        <div className="workspace-quick-actions" aria-label="Hurtige spring for aktiv opgave">
          <button
            type="button"
            onClick={() => {
              state.setProblemsMode('exam');
              state.setView('problems');
            }}
          >
            Spørgsmålet
          </button>
          {firstPattern && (
            <button type="button" onClick={() => state.selectPattern(firstPattern.id)}>
              Problemtype
            </button>
          )}
          {firstFormula && (
            <button type="button" onClick={() => state.selectFormula(firstFormula.id)}>
              Kerneformel
            </button>
          )}
          {firstCalculator && (
            <button type="button" onClick={() => state.selectCalculator(firstCalculator.id)}>
              Beregner
            </button>
          )}
          {firstExample && (
            <button type="button" onClick={() => state.selectExample(firstExample.id)}>
              Eksempel
            </button>
          )}
        </div>
      </div>

      <section className="subcard workspace-brief">
        <h3>Løs denne opgave nu</h3>
        <p><strong>Nøgleord:</strong> {question.cue}</p>
        <p><strong>Første move:</strong> {question.firstMove}</p>
      </section>

      <div className="workspace-columns">
        <div className="workspace-main">
          <section className="subcard">
            <h3>Nøgleformler</h3>
            {formulas.length === 0 ? (
              <p className="muted small">Ingen direkte formellink på denne opgave endnu.</p>
            ) : (
              <div className="formula-strip">
                {formulas.map((formula) => (
                  <button key={formula.id} type="button" className="formula-mini" onClick={() => state.selectFormula(formula.id)}>
                    <strong>{formula.name}</strong>
                    <TexMath tex={formula.latex} block />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="subcard">
            <h3>Beregnere til opgaven</h3>
            {calculatorsForQuestion.length === 0 ? (
              <p className="muted small">Ingen direkte beregner-link. Brug formler + eksempel-flow.</p>
            ) : (
              <div className="workspace-calculators">
                {calculatorsForQuestion.slice(0, 2).map((calculator) => (
                  <article key={calculator.id} className="workspace-calculator">
                    <header className="detail-head compact">
                      <h4>{calculator.title}</h4>
                      <button type="button" onClick={() => state.selectCalculator(calculator.id)}>
                        Åbn fuld beregner
                      </button>
                    </header>
                    <Calculator calculator={calculator} state={state} embedded />
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="subcard">
            <h3>Matchende eksempler</h3>
            {examplesForQuestion.length === 0 ? (
              <p className="muted small">Ingen direkte eksempelkobling endnu for denne opgave.</p>
            ) : (
              <div className="example-list">
                {examplesForQuestion.map((example) => (
                  <button key={example.id} type="button" className="example-card" onClick={() => state.selectExample(example.id)}>
                    <Figure id={example.figureId} />
                    <div>
                      <strong>{example.title}</strong>
                      <small>{example.pattern}</small>
                      <small className="muted">{example.steps[0]}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="workspace-side">
          <section className="subcard">
            <h3>Problemtyper</h3>
            {patterns.length === 0 ? (
              <p className="muted small">Ingen direkte problemtype koblet til denne opgave.</p>
            ) : (
              <>
                <div className="pill-row">
                  {patterns.map((pattern) => (
                    <button key={pattern.id} type="button" onClick={() => state.selectPattern(pattern.id)}>
                      {pattern.title}
                    </button>
                  ))}
                </div>
                <ol className="recipe">
                  {patterns[0].method.slice(0, 4).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </>
            )}
          </section>

          <section className="subcard">
            <h3>PDF-kilder til denne opgave</h3>
            <SourceLinks refs={sourceRefs} />
          </section>
        </aside>
      </div>
    </section>
  );
}

function Overview({
  state,
  bookmarks,
  isBookmarked,
  recentFormulas,
  recentExamples,
}: {
  state: AppState;
  bookmarks: Set<string>;
  isBookmarked: (id: string) => boolean;
  recentFormulas: string[];
  recentExamples: string[];
}) {
  const bookmarkedFormulas = formulasWithExamples.filter((formula) => bookmarks.has(formula.id));
  const bookmarkedExamples = workedExamples.filter((example) => bookmarks.has(`example:${example.id}`));
  const patternCoverage = problemPatterns
    .map((pattern) => {
      const linkedExamQuestions = pastExamQuestions.filter((question) => question.patternIds.includes(pattern.id));
      return {
        pattern,
        examCount: linkedExamQuestions.length,
        exampleCount: pattern.exampleIds.length,
      };
    })
    .filter((entry) => entry.examCount > 0)
    .sort((a, b) => b.examCount - a.examCount);

  return (
    <div className="overview-layout">
      <section className="card overview-hero" aria-labelledby="overview-hero-title">
        <h3 id="overview-hero-title">Hvad vil du lave nu?</h3>
        <p className="muted small">Vælg et spor – eller brug søgefeltet øverst (⌘K).</p>
        <div className="action-grid">
          <button
            type="button"
            className="action-card primary"
            onClick={() => {
              state.searchInputRef.current?.focus();
              state.searchInputRef.current?.select();
            }}
          >
            <Search size={18} aria-hidden="true" />
            <strong>Søg på tværs</strong>
            <span>Formler, guider, beregnere og PDF</span>
          </button>
          <button
            type="button"
            className="action-card"
            onClick={() => {
              state.setProblemsMode('patterns');
              state.setView('problems');
            }}
          >
            <Route size={18} aria-hidden="true" />
            <strong>Find problemtype</strong>
            <span>Genkend opgaven og følg metoden</span>
          </button>
          <button
            type="button"
            className="action-card"
            onClick={() => {
              state.setFormulasMode('cards');
              state.setView('formulas');
            }}
          >
            <BookOpen size={18} aria-hidden="true" />
            <strong>Formelbibliotek</strong>
            <span>{formulasWithExamples.length} formler med forklaring</span>
          </button>
          <button
            type="button"
            className="action-card"
            onClick={() => {
              state.setProblemsMode('exam');
              state.setView('problems');
            }}
          >
            <FlaskConical size={18} aria-hidden="true" />
            <strong>Eksamen Navigator</strong>
            <span>Tidligere opgaver og løsningsflow</span>
          </button>
        </div>
      </section>

      <ProblemSolverWizard state={state} />
      <ExamReadyChecklist state={state} compact />

      <details className="card compact-panel workspace-details">
        <summary>Opgave-arbejdsrum (ét eksamensspor ad gangen)</summary>
        <p className="muted small">
          Samler metode, formler, beregner og PDF for den valgte eksamensopgave. Åbn også via Opgaver → Eksamen.
        </p>
        <ProblemWorkspace state={state} embedded />
      </details>

      <div className="overview-supports">
        <details className="card compact-panel">
          <summary>Genveje</summary>
          <ul className="shortcut-list">
            <li><kbd>⌘K</kbd> / <kbd>/</kbd> — søg</li>
            <li><kbd>Esc</kbd> — ryd søgning</li>
            <li><kbd>Alt+1…3</kbd> — skift hovedside</li>
            <li><kbd>Alt+←</kbd> — tilbage</li>
          </ul>
        </details>

        <details className="card compact-panel">
          <summary>Ofte i eksamen ({patternCoverage.length} typer)</summary>
          <ul className="shortcut-list">
            {patternCoverage.slice(0, 6).map(({ pattern, examCount }) => (
              <li key={pattern.id}>
                <button type="button" className="inline-link" onClick={() => state.selectPattern(pattern.id)}>
                  {pattern.title}
                </button>
                <span className="muted small"> · {examCount} eksamensmatch</span>
              </li>
            ))}
          </ul>
        </details>

        <details className="card compact-panel" open={bookmarkedFormulas.length > 0 || bookmarkedExamples.length > 0}>
          <summary>Bogmærker</summary>
          {bookmarkedFormulas.length === 0 && bookmarkedExamples.length === 0 ? (
            <p className="muted small">Tryk ☆ på en formel eller et eksempel for hurtig adgang her.</p>
          ) : (
            <div className="result-cards">
              {bookmarkedFormulas.slice(0, 4).map((formula) => (
                <button key={formula.id} type="button" className="result-card" onClick={() => state.selectFormula(formula.id)}>
                  <header><strong>{formula.name}</strong></header>
                  <TexMath tex={formula.latex} block />
                </button>
              ))}
              {bookmarkedExamples.slice(0, 4).map((example) => (
                <button key={example.id} type="button" className="result-card" onClick={() => state.selectExample(example.id)}>
                  <header><strong>{example.title}</strong></header>
                  <small>{example.pattern}</small>
                </button>
              ))}
            </div>
          )}
        </details>

        {(recentFormulas.length > 0 || recentExamples.length > 0) && (
          <details className="card compact-panel" open>
            <summary>Seneste</summary>
            <div className="pill-row">
              {recentFormulas.slice(0, 4).map((id) => {
                const formula = formulaById(id);
                return formula ? (
                  <button key={id} type="button" onClick={() => state.selectFormula(id)}>
                    {formula.name}
                  </button>
                ) : null;
              })}
              {recentExamples.slice(0, 4).map((id) => {
                const example = exampleById(id);
                return example ? (
                  <button key={id} type="button" onClick={() => state.selectExample(id)}>
                    {example.title}
                  </button>
                ) : null;
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function FormulaFinder({ state }: { state: AppState }) {
  const { pickerEntries, sortedVariables, variableMeta } = useMemo(() => getFormulaFinderIndex(), []);
  const [givenKeys, setGivenKeys] = useState(() => new Set<string>());
  const [outputKey, setOutputKey] = useState('');
  const [strictProblemMatch, setStrictProblemMatch] = useState(true);
  const [problemScope, setProblemScope] = useState<'all' | 'exam' | 'example' | 'pdf'>('all');

  useEffect(() => {
    if (!state.finderPrefillKeys?.length) return;
    setGivenKeys(new Set(state.finderPrefillKeys));
    state.clearFinderPrefill();
  }, [state, state.finderPrefillKeys]);

  const selectedGivenKeys = [...givenKeys];

  const results = useMemo(
    () =>
      findFormulas({
        givenKeys: selectedGivenKeys,
        outputKey: outputKey || null,
      }),
    [selectedGivenKeys, outputKey],
  );

  const problemMatches = useMemo(
    () =>
      findProblemMatches({
        givenKeys: selectedGivenKeys,
        strictExact: strictProblemMatch,
        maxResults: 120,
      }),
    [selectedGivenKeys, strictProblemMatch],
  );

  const nearestProblemMatches = useMemo(() => {
    if (!strictProblemMatch || selectedGivenKeys.length === 0 || problemMatches.length > 0) return [];
    const relaxed = findProblemMatches({
      givenKeys: selectedGivenKeys,
      strictExact: false,
      maxResults: 24,
    });
    const exactSet = new Set(problemMatches.map((entry) => `${entry.kind}:${entry.id}`));
    return relaxed.filter((entry) => !exactSet.has(`${entry.kind}:${entry.id}`)).slice(0, 10);
  }, [strictProblemMatch, selectedGivenKeys, problemMatches]);

  const visibleProblemMatches = useMemo(
    () => (problemScope === 'all' ? problemMatches : problemMatches.filter((entry) => entry.kind === problemScope)),
    [problemMatches, problemScope],
  );
  const visibleNearestProblemMatches = useMemo(
    () =>
      problemScope === 'all'
        ? nearestProblemMatches
        : nearestProblemMatches.filter((entry) => entry.kind === problemScope),
    [nearestProblemMatches, problemScope],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const row of results) {
      const cat = row.formula.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(row);
    }
    return [...map.entries()];
  }, [results]);

  const toggleGiven = (key: string) => {
    setGivenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const labelFor = (key: string) => pickerEntryLabel(pickerEntries, key) || variableMeta.get(key)?.labelLaTeX || key;
  const needsSelection = givenKeys.size === 0 && !outputKey;
  const topFormula = results[0]?.formula;
  const topProblem = visibleProblemMatches[0] ?? visibleNearestProblemMatches[0];
  const hasGivenSelection = givenKeys.size > 0;

  return (
    <div className="formula-finder">
      <section className="card formula-finder-controls">
        <header className="formula-finder-head">
          <div>
            <p className="eyebrow">Formel + Opgavefinder</p>
            <h2>Find både formler og opgaver ud fra variable</h2>
            <p className="muted small">
              Vælg størrelserne fra opgaven. Du får både formler og opgaver med samme begyndelsesvariable.
            </p>
          </div>
        </header>

        <VariablePicker
          label="Variable i opgaven"
          hint="Vælg alle størrelser du får oplyst. Vælger du fx m, matcher den også m₁/m₂/M (men ikke omvendt)."
          entries={pickerEntries}
          chipVariables={sortedVariables}
          selectedKeys={givenKeys}
          onToggle={toggleGiven}
          entryLabel={labelFor}
        />

        <div className="finder-presets">
          <span className="muted small">Hurtige valg:</span>
          <div className="pill-row">
            {finderPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                onClick={() => setGivenKeys(new Set(preset.givenKeys))}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="finder-control-grid">
          <label className="finder-output">
            <span className="muted small">Ønsket output (valgfrit)</span>
            <select value={outputKey} onChange={(event) => setOutputKey(event.target.value)}>
              <option value="">— Ingen særlig outputvariabel —</option>
              {pickerEntries.map((entry) => (
                <option key={entry.id} value={entry.canonicalKey}>
                  {entry.disambiguation ? `${entry.nameHint} (${entry.disambiguation})` : entry.nameHint}
                </option>
              ))}
            </select>
          </label>
          <label className="finder-strict-toggle">
            <input
              type="checkbox"
              checked={strictProblemMatch}
              onChange={(event) => setStrictProblemMatch(event.target.checked)}
            />
            Kræv præcis samme begyndelsesvariable i opgavematch
          </label>
        </div>
      </section>

      {hasGivenSelection && (topFormula || topProblem) && (
        <section className="card finder-assistant">
          <h3>Næste bedste skridt</h3>
          <div className="pill-row">
            {topFormula && (
              <button type="button" onClick={() => state.selectFormula(topFormula.id)}>
                Start med formel: {topFormula.name}
              </button>
            )}
            {topProblem &&
              (topProblem.kind === 'exam' ? (
                <button type="button" onClick={() => state.selectExamQuestion(topProblem.id)}>
                  Se lignende eksamensopgave: {topProblem.year}
                </button>
              ) : topProblem.kind === 'example' ? (
                <button type="button" onClick={() => state.selectExample(topProblem.id)}>
                  Se lignende løst eksempel
                </button>
              ) : (
                <button type="button" onClick={() => state.openPdf(topProblem.sourceId, topProblem.page)}>
                  Se lignende PDF-opgave
                </button>
              ))}
          </div>
        </section>
      )}

      <section className="finder-results-wrap card">
        <header className="finder-results-head">
          <h3>Formelresultater</h3>
          <span className="muted small">
            {needsSelection
              ? 'Vælg mindst én variabel eller en ønsket output.'
              : `${results.length} formel${results.length === 1 ? '' : 'er'}`}
          </span>
        </header>

        {!needsSelection && results.length === 0 && (
          <p className="muted finder-empty">Ingen formler matcher alle valgte variable. Prøv at fjerne én eller ændre output.</p>
        )}

        <div className="finder-results">
          {grouped.map(([category, rows]) => (
            <div key={category} className="finder-result-group">
              <h4 className="category-heading finder-result-group-title">{category}</h4>
              <div className="finder-result-group-cards">
                {rows.map(({ formula, canonicalKeysInFormula }) => {
                  const givenMatched = selectedGivenKeys.filter((k) => canonicalKeysInFormula.includes(k));
                  const outOk = outputKey && canonicalKeysInFormula.includes(outputKey);
                  return (
                    <article key={formula.id} className="finder-result-card">
                      <header>
                        <strong>{formula.name}</strong>
                        <span className="tag">{formula.topic}</span>
                      </header>
                      <div className="equation-preview">
                        <TexMath tex={formula.latex} block />
                      </div>
                      <div className="match-badges">
                        <span className="badge badge-given">
                          Kendte:{' '}
                          {givenMatched.length
                            ? givenMatched.map((k, i) => (
                                <span key={k} className="badge-math">
                                  {i > 0 ? <span className="badge-sep"> </span> : null}
                                  <TexMath tex={labelFor(k)} />
                                </span>
                              ))
                            : '—'}
                        </span>
                        {outputKey && (
                          <span className={`badge badge-out${outOk ? ' ok' : ''}`}>
                            Output <TexMath tex={labelFor(outputKey)} />: {outOk ? 'findes i formlen' : 'mangler'}
                          </span>
                        )}
                        {formula.calculatorId && <span className="badge badge-tool">Beregner</span>}
                        {formula.relatedExampleIds.length > 0 && <span className="badge badge-tool">Eksempel</span>}
                      </div>
                      <button type="button" className="finder-open-formula" onClick={() => state.selectFormula(formula.id)}>
                        Åbn formel i biblioteket
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="finder-results-wrap card problem-finder-results">
        <header className="finder-results-head">
          <h3>Opgaver med samme variable</h3>
          <span className="muted small">
            {!hasGivenSelection
              ? 'Vælg mindst én variabel.'
              : `${visibleProblemMatches.length} opgave${visibleProblemMatches.length === 1 ? '' : 'r'}`}
          </span>
        </header>

        <div className="mini-filter finder-scope-filter">
          {(
            [
              { id: 'all', label: `Alle (${problemMatches.length})` },
              { id: 'exam', label: `Eksamen (${problemMatches.filter((entry) => entry.kind === 'exam').length})` },
              { id: 'example', label: `Eksempler (${problemMatches.filter((entry) => entry.kind === 'example').length})` },
              { id: 'pdf', label: `PDF (${problemMatches.filter((entry) => entry.kind === 'pdf').length})` },
            ] as const
          ).map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={problemScope === scope.id ? 'active' : undefined}
              onClick={() => setProblemScope(scope.id)}
            >
              {scope.label}
            </button>
          ))}
        </div>

        {hasGivenSelection && visibleProblemMatches.length === 0 && (
          <p className="muted finder-empty">
            Ingen opgaver matcher {strictProblemMatch ? 'præcist' : 'alle'} valgte variable.
          </p>
        )}

        <div className="problem-match-grid">
          {visibleProblemMatches.map((match) => {
            const examQuestion = match.kind === 'exam' ? pastExamQuestions.find((q) => q.id === match.id) : null;
            const sourceLabelText =
              match.kind === 'exam'
                ? `${match.year} · Eksamen`
                : match.kind === 'example'
                  ? `Eksempel · ${exampleById(match.id)?.pattern ?? match.pattern}`
                  : `PDF-opgave · ${match.sourceTitle}`;
            const cueText =
              match.kind === 'exam'
                ? examQuestion?.cue
                : match.kind === 'example'
                  ? exampleById(match.id)?.question
                  : match.snippet;
            return (
              <article key={`${match.kind}-${match.id}`} className="problem-match-card">
                <header>
                  <strong>{match.title}</strong>
                  <span className="tag">{sourceLabelText}</span>
                </header>
                {cueText ? <p className="muted small">{cleanSnippet(cueText, 170)}</p> : null}
                <p className="muted small match-explain">{explainProblemMatch(match)}</p>
                <div className="match-badges">
                  <span className="badge badge-out ok">Match: {match.similarityPercent}%</span>
                  <span className="badge">Dækning: {match.coveragePercent}%</span>
                  <span className="badge">Præcision: {match.precisionPercent}%</span>
                  <span className="badge badge-given">
                    Variable:{' '}
                    {match.givenKeys.map((key, index) => (
                      <span key={`${match.id}-${key}`} className="badge-math">
                        {index > 0 ? <span className="badge-sep"> </span> : null}
                        <TexMath tex={labelFor(key)} />
                      </span>
                    ))}
                  </span>
                </div>
                {match.selectedCoverageHits.some((entry) => entry.usedHierarchy) && (
                  <div className="problem-match-why">
                    {match.selectedCoverageHits
                      .filter((entry) => entry.usedHierarchy)
                      .map((entry) => (
                        <span key={`why-${match.id}-${entry.selectedKey}`} className="badge hierarchy-badge">
                          <TexMath tex={labelFor(entry.selectedKey)} />
                          <span>→</span>
                          {entry.matchedTaskKeys
                            .filter((key) => key !== entry.selectedKey)
                            .map((key, index) => (
                              <span key={`why-${match.id}-${entry.selectedKey}-${key}`} className="badge-math">
                                {index > 0 ? <span className="badge-sep"> </span> : null}
                                <TexMath tex={labelFor(key)} />
                              </span>
                            ))}
                        </span>
                      ))}
                  </div>
                )}
                <div className="pill-row">
                  {match.kind === 'exam' ? (
                    <>
                      <button type="button" onClick={() => state.selectExamQuestion(match.id)}>
                        Åbn i Eksamen Navigator
                      </button>
                      {examQuestion && (
                        <button type="button" onClick={() => state.openPdf(examQuestion.source.sourceId, examQuestion.source.page)}>
                          Åbn PDF-side
                        </button>
                      )}
                    </>
                  ) : match.kind === 'example' ? (
                    <button type="button" onClick={() => state.selectExample(match.id)}>
                      Åbn løst eksempel
                    </button>
                  ) : (
                    <button type="button" onClick={() => state.openPdf(match.sourceId, match.page)}>
                      Åbn PDF-side
                    </button>
                  )}
                  {match.formulaIds[0] && (
                    <button type="button" onClick={() => state.selectFormula(match.formulaIds[0]!)}>
                      Åbn primær formel
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {strictProblemMatch && visibleProblemMatches.length === 0 && visibleNearestProblemMatches.length > 0 && (
          <section className="near-match-block">
            <h4>Nærmeste lignende opgaver</h4>
            <p className="muted small">
              Disse er tæt på, men har ekstra variable i forhold til dit præcise valg.
            </p>
            <div className="problem-match-grid">
              {visibleNearestProblemMatches.map((match) => {
                const examQuestion = match.kind === 'exam' ? pastExamQuestions.find((q) => q.id === match.id) : null;
                return (
                  <article key={`near-${match.kind}-${match.id}`} className="problem-match-card near">
                    <header>
                      <strong>{match.title}</strong>
                      <span className="tag">{match.kind === 'exam' ? `${match.year} · Eksamen` : match.kind === 'example' ? 'Eksempel' : 'PDF-opgave'}</span>
                    </header>
                    <div className="match-badges">
                      <span className="badge badge-out">Match: {match.similarityPercent}%</span>
                      <span className="badge">Ekstra variable: {match.extraTaskKeys.length}</span>
                      {match.extraTaskKeys.slice(0, 4).map((key) => (
                        <span key={`near-extra-${match.id}-${key}`} className="badge badge-math">
                          <TexMath tex={labelFor(key)} />
                        </span>
                      ))}
                    </div>
                    <div className="pill-row">
                      {match.kind === 'exam' ? (
                        <>
                          <button type="button" onClick={() => state.selectExamQuestion(match.id)}>
                            Åbn i Eksamen Navigator
                          </button>
                          {examQuestion && (
                            <button type="button" onClick={() => state.openPdf(examQuestion.source.sourceId, examQuestion.source.page)}>
                              Åbn PDF-side
                            </button>
                          )}
                        </>
                      ) : match.kind === 'example' ? (
                        <button type="button" onClick={() => state.selectExample(match.id)}>
                          Åbn løst eksempel
                        </button>
                      ) : (
                        <button type="button" onClick={() => state.openPdf(match.sourceId, match.page)}>
                          Åbn PDF-side
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function AdvancedFormulaFinder({ state }: { state: AppState }) {
  const { pickerEntries, sortedVariables, variableMeta } = useMemo(() => getFormulaFinderIndex(), []);
  const [givenKeys, setGivenKeys] = useState(() => new Set<string>());
  const [maxDepth, setMaxDepth] = useState(4);

  const chains = useMemo(() => {
    if (givenKeys.size === 0) return [];
    return findAdvancedFormulaChains({
      givenKeys: [...givenKeys],
      targetKey: null,
      maxDepth,
      maxMissingPerStep: 2,
      maxResults: 8,
    });
  }, [givenKeys, maxDepth]);

  const toggleGiven = (key: string) => {
    setGivenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const labelFor = (key: string) => pickerEntryLabel(pickerEntries, key) || variableMeta.get(key)?.labelLaTeX || key;
  const selectionReady = givenKeys.size >= 2;

  return (
    <div className="advanced-finder">
      <section className="card advanced-finder-controls">
        <header className="advanced-finder-head">
          <p className="eyebrow">Kædefinder</p>
          <h2>Find formler der binder dine variable sammen</h2>
          <p className="muted small">
            Vælg alle størrelser i opgaven (mindst to). Du behøver ikke vælge output — formler kan omskrives, så kæder vises
            for alle relevante kombinationer.
          </p>
        </header>

        <VariablePicker
          label="Variable i opgaven"
          hint="Fx m, g og W — eller p, V og T (temperatur)."
          entries={pickerEntries}
          chipVariables={sortedVariables}
          selectedKeys={givenKeys}
          onToggle={toggleGiven}
          entryLabel={labelFor}
        />

        <label className="advanced-finder-depth">
          <span className="muted small">Maks trin: {maxDepth}</span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={maxDepth}
            onChange={(event) => setMaxDepth(Number(event.target.value))}
          />
          <span className="muted small advanced-depth-hint">
            Flere tilladte trin giver flere kæder — sorteret med korteste først.
          </span>
        </label>
      </section>

      <section className="card advanced-finder-results">
        <header className="advanced-results-head">
          <h3>Foreslåede kæder</h3>
          <span className="muted small">
            {!selectionReady
              ? 'Vælg mindst to variable.'
              : `${chains.length} kæde${chains.length === 1 ? '' : 'r'} fundet`}
          </span>
        </header>

        {givenKeys.size === 1 && (
          <p className="muted small">Tilføj mindst én variabel mere for at finde kæder mellem størrelser.</p>
        )}

        {selectionReady && chains.length === 0 && (
          <p className="muted small">
            Ingen kæder fundet inden for valgt dybde. Prøv højere dybde eller tilføj flere variable.
          </p>
        )}

        <div className="advanced-chain-list">
          {chains.map((chain, chainIndex) => (
            <article key={`${chainIndex}-${chain.score}`} className="advanced-chain-card">
              <header>
                <strong>Forslag {chainIndex + 1}</strong>
                <span className="muted small">
                  {chain.steps.length} trin · mangler i alt {chain.totalMissingCount}
                </span>
                {chainIndex === 0 && chain.steps.length > 0 ? (
                  <span className="badge badge-tool" title="Kortere kæder er listet før længere">
                    Korteste kæde først
                  </span>
                ) : null}
              </header>

              {chain.steps.length === 0 ? (
                <p className="muted small">Variable er allerede dækket af én formel.</p>
              ) : (
                <ol className="advanced-chain-steps">
                  {chain.steps.map((step, stepIndex) => (
                    <li key={`${step.formula.id}-${stepIndex}`} className="advanced-chain-step">
                      <div className="advanced-step-head">
                        <strong>Trin {stepIndex + 1}: {step.formula.name}</strong>
                        <span className="tag">{step.formula.category}</span>
                      </div>
                      <TexMath tex={step.formula.latex} block />
                      <div className="advanced-step-badges">
                        <span className="badge">
                          Kan isolere <TexMath tex={labelFor(step.producedKey)} />
                        </span>
                        <span className="badge">
                          Bruger kendte:{' '}
                          {step.usedKnownKeys.length > 0
                            ? step.usedKnownKeys.map((key, i) => (
                                <span key={`${step.formula.id}-${key}`} className="badge-math">
                                  {i > 0 ? ' ' : ''}
                                  <TexMath tex={labelFor(key)} />
                                </span>
                              ))
                            : '—'}
                        </span>
                        <span className={`badge${step.missingKeys.length ? '' : ' badge-out ok'}`}>
                          Mangler:{' '}
                          {step.missingKeys.length > 0
                            ? step.missingKeys.map((key, i) => (
                                <span key={`${step.formula.id}-m-${key}`} className="badge-math">
                                  {i > 0 ? ' ' : ''}
                                  <TexMath tex={labelFor(key)} />
                                </span>
                              ))
                            : 'ingen'}
                        </span>
                      </div>
                      <button type="button" onClick={() => state.selectFormula(step.formula.id)}>
                        Åbn formel
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FormulaLibrary({
  state,
  selectedFormula,
  isBookmarked,
  toggleBookmark,
}: {
  state: AppState;
  selectedFormula: Formula;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}) {
  const globalFiltered = state.query.trim() ? state.searchResults.formulas : formulasWithExamples;
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [listQuery, setListQuery] = useState('');

  const listFiltered = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return globalFiltered.filter((formula) => {
      if (state.showBookmarksOnly && !isBookmarked(formula.id)) return false;
      if (categoryFilter !== 'all' && formula.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        formula.name.toLowerCase().includes(q) ||
        formula.topic.toLowerCase().includes(q) ||
        formula.category.toLowerCase().includes(q) ||
        formula.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [globalFiltered, categoryFilter, listQuery, state.showBookmarksOnly, isBookmarked]);

  const visibleCategories = useMemo(() => {
    if (categoryFilter !== 'all') return [categoryFilter];
    return categories.filter((cat) => listFiltered.some((f) => f.category === cat));
  }, [categoryFilter, listFiltered]);

  return (
    <div className="formula-library-shell">
      <div className="library-toolbar card">
        {state.showBookmarksOnly && (
          <div className="library-bookmark-banner">
            <span>Kun bogmærkede formler</span>
            <button type="button" onClick={() => state.setShowBookmarksOnly(false)}>
              Vis alle
            </button>
          </div>
        )}
        <label className="library-search">
          <span className="sr-only">Filtrér formler i biblioteket</span>
          <input
            type="search"
            value={listQuery}
            onChange={(event) => setListQuery(event.target.value)}
            placeholder="Filtrér biblioteket: navn, emne eller nøgleord …"
            autoComplete="off"
          />
        </label>
        <div className="category-filter-row" role="tablist" aria-label="Formelkategorier">
          <button
            type="button"
            role="tab"
            aria-selected={categoryFilter === 'all'}
            className={categoryFilter === 'all' ? 'active' : undefined}
            onClick={() => setCategoryFilter('all')}
          >
            Alle ({globalFiltered.length})
          </button>
          {categories.map((category) => {
            const count = globalFiltered.filter((f) => f.category === category).length;
            if (!count) return null;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={categoryFilter === category}
                className={categoryFilter === category ? 'active' : undefined}
                onClick={() => setCategoryFilter(category)}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="split split--library">
        <aside className="list-panel list-panel--library" aria-label="Formelliste">
          {visibleCategories.length === 0 ? (
            <p className="muted small list-panel-empty">Ingen formler matcher filteret.</p>
          ) : (
            visibleCategories.map((category) => {
              const formulasInCategory = listFiltered.filter((formula) => formula.category === category);
              if (!formulasInCategory.length) return null;
              return (
                <section key={category} className="list-category-block">
                  <h3 className="category-heading">
                    {category}
                    <span className="category-count">{formulasInCategory.length}</span>
                  </h3>
                  {formulasInCategory.map((formula) => (
                    <button
                      key={formula.id}
                      className={formula.id === selectedFormula.id ? 'active item item--formula' : 'item item--formula'}
                      type="button"
                      onClick={() => state.selectFormula(formula.id)}
                    >
                      <span className="item-title">{formula.name}</span>
                      <small className="item-topic">{formula.topic}</small>
                    </button>
                  ))}
                </section>
              );
            })
          )}
        </aside>
        <FormulaDetail
          state={state}
          formula={selectedFormula}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
        />
      </div>
    </div>
  );
}

function FormulaDetail({
  state,
  formula,
  isBookmarked,
  toggleBookmark,
}: {
  state: AppState;
  formula: Formula;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}) {
  const calculator = formula.calculatorId ? calculatorById(formula.calculatorId) : undefined;
  const relatedFormulas = (formula.relatedFormulaIds ?? [])
    .map((id) => formulaById(id))
    .filter((entry): entry is Formula => Boolean(entry));
  const relatedExamples = formula.relatedExampleIds
    .map((id) => exampleById(id))
    .filter((entry): entry is WorkedExample => Boolean(entry));
  const linkedExamQuestions = pastExamQuestions.filter((question) => question.formulaIds.includes(formula.id));
  const linkedPatterns = problemPatterns.filter((pattern) => pattern.formulaIds.includes(formula.id));
  const relevantConstants = constantsForFormula(formula);
  const [mapleCopyStatus, setMapleCopyStatus] = useState<null | 'plain' | 'constants'>(null);

  const copyMaple = useCallback(
    async (includeConstants: boolean) => {
      const text = mapleCopyTextForFormula(formula, includeConstants);
      try {
        await navigator.clipboard?.writeText(text);
        setMapleCopyStatus(includeConstants ? 'constants' : 'plain');
        window.setTimeout(() => setMapleCopyStatus(null), 1600);
      } catch {
        setMapleCopyStatus(null);
      }
    },
    [formula],
  );

  const conditions = [...formula.assumptions, ...formula.notes];
  const hasConnections =
    relatedFormulas.length > 0 ||
    linkedPatterns.length > 0 ||
    relatedExamples.length > 0 ||
    formula.sources.length > 0 ||
    linkedExamQuestions.length > 0;

  return (
    <section className="card detail formula-detail">
      <header className="detail-head">
        <div className="detail-heading">
          <p className="detail-eyebrow">
            <span className="category-pill">{formula.category}</span>
            <span className="detail-topic">{formula.topic}</span>
          </p>
          <h2>{formula.name}</h2>
        </div>
        <button
          type="button"
          className={`bookmark-button${isBookmarked(formula.id) ? ' active' : ''}`}
          aria-pressed={isBookmarked(formula.id)}
          onClick={() => toggleBookmark(formula.id)}
        >
          {isBookmarked(formula.id) ? '★ Bogmærket' : '☆ Bogmærk'}
        </button>
      </header>

      <div className="equation-hero">
        <div className="equation-card">
          <TexMath tex={formula.latex} block />
        </div>
        <div className="equation-actions">
          <button type="button" onClick={() => copyMaple(false)}>
            Kopiér til Maple
          </button>
          <button type="button" className="ghost" onClick={() => copyMaple(true)}>
            Maple + konstanter
          </button>
          <span className="equation-copy-feedback" role="status">
            {mapleCopyStatus === 'plain'
              ? '✓ Ligning kopieret'
              : mapleCopyStatus === 'constants'
                ? '✓ Ligning + konstanter kopieret'
                : ''}
          </span>
        </div>
      </div>

      {formula.examTip && (
        <section className="subcard exam-tip-hero">
          <h3>Eksamenstip</h3>
          <p>{formula.examTip}</p>
        </section>
      )}

      <div className="formula-facts">
        <section className="subcard">
          <h3>Variabler</h3>
          <dl className="variable-legend">
            {formula.variables.map((variable) => (
              <div key={`${formula.id}-${variable.symbol}`} className="variable-legend-row">
                <dt>{variable.latex ? <TexMath tex={variable.latex} /> : variable.symbol}</dt>
                <dd>
                  <span>{variable.name}</span>
                  {variable.unit && <small>{variable.unit}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="subcard">
          <h3>Sådan bruges den</h3>
          <p className="use-when">{formula.useWhen}</p>
          {conditions.length > 0 && (
            <>
              <h4>Forudsætninger</h4>
              <ul className="condition-list">
                {conditions.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {relevantConstants.length > 0 && (
        <section className="subcard constants-subcard">
          <div className="subcard-head">
            <h3>Konstanter til denne formel</h3>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                state.setReferenceMode('tools');
                state.setView('reference');
              }}
            >
              Alle konstanter →
            </button>
          </div>
          <div className="constant-grid formula-constant-grid">
            {relevantConstants.map((entry) => (
              <div key={`${formula.id}-${entry.symbol}`} className="constant">
                <strong><TexMath tex={entry.latex} /></strong>
                <span>{entry.value}</span>
                <small>{entry.note}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {calculator && (
        <section className="subcard">
          <h3>Beregn direkte</h3>
          <Calculator calculator={calculator} state={state} embedded />
        </section>
      )}

      {hasConnections && (
        <details className="subcard connections accordion-block">
          <summary>
            <h3>Forbundet</h3>
            <span className="muted small">Relaterede formler, eksempler og eksamen</span>
          </summary>

          {relatedFormulas.length > 0 && (
            <div className="connection-block">
              <h4>Relaterede formler</h4>
              <div className="related-formula-grid">
                {relatedFormulas.map((related) => (
                  <button
                    key={related.id}
                    type="button"
                    className="related-formula-card"
                    onClick={() => state.selectFormula(related.id)}
                  >
                    <span className="related-formula-name">{related.name}</span>
                    <TexMath tex={related.latex} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {linkedPatterns.length > 0 && (
            <div className="connection-block">
              <h4>Bruges i opgavetyper</h4>
              <div className="pill-row">
                {linkedPatterns.map((pattern) => (
                  <button key={pattern.id} type="button" onClick={() => state.selectPattern(pattern.id)}>
                    {pattern.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {relatedExamples.length > 0 && (
            <div className="connection-block">
              <h4>Løste eksempler</h4>
              <div className="example-list">
                {relatedExamples.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    className="example-card"
                    onClick={() => state.selectExample(example.id)}
                  >
                    <Figure id={example.figureId} />
                    <div>
                      <strong>{example.title}</strong>
                      <small>{example.pattern}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {formula.sources.length > 0 && (
            <div className="connection-block">
              <h4>Læs i teorien (PDF)</h4>
              <SourceLinks refs={formula.sources} state={state} />
            </div>
          )}

          {linkedExamQuestions.length > 0 && (
            <div className="connection-block">
              <h4>Set til eksamen</h4>
              <div className="pill-row">
                {linkedExamQuestions.map((question) => (
                  <button key={question.id} type="button" onClick={() => state.selectExamQuestion(question.id)}>
                    {question.year}: {question.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </details>
      )}
    </section>
  );
}

function ProblemPatterns({
  state,
  selectedPattern,
}: {
  state: AppState;
  selectedPattern: ProblemPattern;
}) {
  const { selectFormula, selectCalculator, selectExample, selectPattern } = state;
  const finderIndex = useMemo(() => getFormulaFinderIndex(), []);
  const labelForKey = (key: string) =>
    pickerEntryLabel(finderIndex.pickerEntries, key) || finderIndex.variableMeta.get(key)?.labelLaTeX || key;
  const filtered = state.query.trim() ? state.searchResults.patterns : problemPatterns;
  const grouped = useMemo(() => {
    const source = filtered.length ? filtered : problemPatterns;
    return {
      Mekanik: source.filter((pattern) => getPatternCategory(pattern) === 'Mekanik'),
      Termodynamik: source.filter((pattern) => getPatternCategory(pattern) === 'Termodynamik'),
    };
  }, [filtered]);
  const patternExamples = selectedPattern.exampleIds
    .map((id) => exampleById(id))
    .filter((entry): entry is WorkedExample => Boolean(entry));
  const exampleSourceRefs = patternExamples.flatMap((example) => example.sources);
  const linkedExamQuestions = pastExamQuestions.filter((question) => question.patternIds.includes(selectedPattern.id));
  const primaryExample = patternExamples[0];
  const typicalGivenTexts = Array.from(new Set(patternExamples.flatMap((example) => example.givens))).slice(0, 7);
  const typicalGivenKeys = Array.from(new Set(patternExamples.flatMap((example) => getExampleGivenKeys(example.id))));

  return (
    <div className="split">
      <aside className="list-panel">
        {(['Mekanik', 'Termodynamik'] as const).map((groupName) => (
          <div key={groupName} className="list-category-block">
            <h3 className="category-heading">
              {groupName}
              <span className="category-count">{grouped[groupName].length}</span>
            </h3>
            {grouped[groupName].map((pattern) => (
              <button
                key={pattern.id}
                className={pattern.id === selectedPattern.id ? 'active item' : 'item'}
                type="button"
                onClick={() => selectPattern(pattern.id)}
              >
                <span>{pattern.title}</span>
                <small>{pattern.cueWords.slice(0, 4).join(' · ')}</small>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <section className="card detail pattern-detail">
        <header className="detail-head">
          <div className="detail-heading">
            <p className="detail-eyebrow">
              <span className="category-pill">{getPatternCategory(selectedPattern)}</span>
              <span className="detail-topic">Opgavetype</span>
            </p>
            <h2>{selectedPattern.title}</h2>
          </div>
        </header>

        <section className="subcard recognition-card">
          <h3>Genkend opgaven</h3>
          <p>{selectedPattern.recognition}</p>
          {selectedPattern.cueWords.length > 0 && (
            <div className="cue-chips">
              {selectedPattern.cueWords.map((cue) => (
                <span key={cue} className="cue-chip">{cue}</span>
              ))}
            </div>
          )}
        </section>

        <div className="pattern-grid">
          <section className="subcard quick-guide">
            <h3>Hurtig guide</h3>
            <ol className="recipe compact">
              {selectedPattern.method.slice(0, 3).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="subcard pattern-method-card">
            <h3>Trin for trin</h3>
            <ol className="recipe numbered">
              {selectedPattern.method.map((step, index) => (
                <li key={step}>
                  <span className="step-num">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="subcard pattern-checklist no-print">
          <div className="subcard-head">
            <h3>Tjekliste til eksamen</h3>
            <button type="button" className="link-button" onClick={() => window.print()}>
              Print tjekliste
            </button>
          </div>
          {selectedPattern.figureId && <Figure id={selectedPattern.figureId} title={selectedPattern.title} />}
          <ol className="recipe numbered">
            {selectedPattern.method.map((step, index) => (
              <li key={`check-${step}`}>
                <span className="step-num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {selectedPattern.pitfalls && selectedPattern.pitfalls.length > 0 && (
            <ul className="condition-list">
              {selectedPattern.pitfalls.map((pitfall) => (
                <li key={pitfall}>
                  <strong>Typisk fejl:</strong> {pitfall}
                </li>
              ))}
            </ul>
          )}
        </section>

        {(typicalGivenTexts.length > 0 || typicalGivenKeys.length > 0) && (
          <section className="subcard">
            <h3>Typiske begyndelsesoplysninger</h3>
            {typicalGivenTexts.length > 0 && (
              <ul className="given-list">
                {typicalGivenTexts.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {typicalGivenKeys.length > 0 && (
              <>
                <div className="pill-row variable-chip-list">
                  {typicalGivenKeys.map((key) => (
                    <span key={`${selectedPattern.id}-${key}`} className="tag math-tag">
                      <TexMath tex={labelForKey(key)} />
                    </span>
                  ))}
                </div>
                <button type="button" onClick={() => state.openFinderWithKeys(typicalGivenKeys)}>
                  Find opgaver med disse variable
                </button>
              </>
            )}
          </section>
        )}

        {selectedPattern.formulaIds.length > 0 && (
          <section className="subcard">
            <h3>Formler du skal bruge</h3>
            <div className="related-formula-grid">
              {selectedPattern.formulaIds.map((id) => {
                const formula = formulaById(id);
                if (!formula) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className="related-formula-card"
                    onClick={() => selectFormula(id)}
                  >
                    <span className="related-formula-name">{formula.name}</span>
                    <TexMath tex={formula.latex} />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {primaryExample && (
          <section className="subcard pattern-example-focus">
            <div className="subcard-head">
              <h3>Gennemregnet eksempel</h3>
              <button type="button" className="link-button" onClick={() => selectExample(primaryExample.id)}>
                Åbn fuldt eksempel →
              </button>
            </div>
            <p className="example-title">{primaryExample.title}</p>
            <p className="example-question">{primaryExample.question}</p>
            {primaryExample.givens.length > 0 && (
              <p className="example-givens">
                <strong>Givet:</strong> {primaryExample.givens.slice(0, 4).join(' · ')}
              </p>
            )}
            <ol className="recipe compact">
              {primaryExample.steps.slice(0, 5).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="muted small">Kilde: {primaryExample.sources.map(sourceLabel).join(' · ')}</p>
          </section>
        )}

        {(selectedPattern.calculatorIds.length > 0 ||
          patternExamples.length > 1 ||
          exampleSourceRefs.length > 0 ||
          linkedExamQuestions.length > 0) && (
          <section className="subcard connections">
            <h3>Forbundet</h3>

            {selectedPattern.calculatorIds.length > 0 && (
              <div className="connection-block">
                <h4>Beregnere</h4>
                <div className="pill-row">
                  {selectedPattern.calculatorIds.map((id) => {
                    const calculator = calculatorById(id);
                    if (!calculator) return null;
                    return (
                      <button key={id} type="button" onClick={() => selectCalculator(id)}>
                        {calculator.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {patternExamples.length > 1 && (
              <div className="connection-block">
                <h4>Flere eksempler</h4>
                <div className="example-list">
                  {patternExamples.slice(1).map((example) => (
                    <button key={example.id} type="button" className="example-card" onClick={() => selectExample(example.id)}>
                      <Figure id={example.figureId} />
                      <div>
                        <strong>{example.title}</strong>
                        <small>{example.sources.map(sourceLabel).join(' · ')}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {exampleSourceRefs.length > 0 && (
              <div className="connection-block">
                <h4>Læs i teorien (PDF)</h4>
                <SourceLinks refs={exampleSourceRefs} state={state} />
              </div>
            )}

            {linkedExamQuestions.length > 0 && (
              <div className="connection-block">
                <h4>Set til eksamen</h4>
                <div className="pill-row">
                  {linkedExamQuestions.map((question) => (
                    <button key={question.id} type="button" onClick={() => state.selectExamQuestion(question.id)}>
                      {question.year}: {question.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </section>
    </div>
  );
}

function CalculatorHub({
  state,
  selectedCalculator,
}: {
  state: AppState;
  selectedCalculator: CalculatorDefinition;
}) {
  const filtered = state.query.trim() ? state.searchResults.calculators : calculators;
  const groupedCalculators = useMemo(() => {
    const source = filtered.length ? filtered : calculators;
    const order = [
      'Bevægelse',
      'Kræfter og statik',
      'Energi og impuls',
      'Rotation',
      'Gravitation',
      'Gas og termodynamik',
      'Varme og materialer',
      'Vektorer og diverse',
      'Enheder og diverse',
    ];
    return order
      .map((category) => ({
        category,
        items: source.filter((calculator) => (calculator.category ?? 'Enheder og diverse') === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filtered]);

  return (
    <div className="split">
      <aside className="list-panel">
        {groupedCalculators.map(({ category, items }) => (
          <div key={category} className="calculator-group list-category-block">
            <h3 className="category-heading">
              {category}
              <span className="category-count">{items.length}</span>
            </h3>
            {items.map((calculator) => (
              <button
                key={calculator.id}
                className={calculator.id === selectedCalculator.id ? 'active item' : 'item'}
                type="button"
                onClick={() => state.selectCalculator(calculator.id)}
              >
                <span>{calculator.title}</span>
                <small>{calculator.description}</small>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <Calculator calculator={selectedCalculator} state={state} />
    </div>
  );
}

function Calculator({
  calculator,
  state,
  embedded,
}: {
  calculator: CalculatorDefinition;
  state: AppState;
  embedded?: boolean;
}) {
  const [unknown, setUnknown] = useState(calculator.variables[0]?.key ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});

  useEffect(() => {
    setUnknown(calculator.variables[0]?.key ?? '');
    setValues({});
    setSelectedUnits(
      Object.fromEntries(
        calculator.variables.map((variable) => {
          const options = variable.unit ? UNIT_OPTIONS[variable.unit] : undefined;
          return [variable.key, options?.[0]?.label ?? variable.unit ?? ''];
        }),
      ),
    );
  }, [calculator.id]);

  const numericValues = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(values)) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) continue;
      const variable = calculator.variables.find((entry) => entry.key === key);
      const options = variable?.unit ? UNIT_OPTIONS[variable.unit] : undefined;
      const selected = options?.find((option) => option.label === selectedUnits[key]) ?? options?.[0];
      out[key] = selected ? selected.toBase(numeric) : numeric;
    }
    return out;
  }, [calculator.variables, selectedUnits, values]);

  const result = calculator.solve(numericValues, unknown);
  const missingInputs = calculator.variables
    .filter((variable) => variable.key !== unknown && !Number.isFinite(numericValues[variable.key]))
    .map((variable) => variable.label)
    .slice(0, 3);

  const formulaChips = calculator.formulaIds
    .map((id) => formulaById(id))
    .filter((entry): entry is Formula => Boolean(entry));
  const quickChecks = useMemo(() => {
    const checks = ['Brug SI-enheder før indsættelse.', 'Tjek fortegn på retning, varme/arbejde og acceleration.'];
    if (calculator.id.includes('temperature') || calculator.id.includes('ideal-gas') || calculator.id.includes('isothermal')) {
      checks.push('Temperatur skal være i kelvin i gas- og termodynamikformler.');
    }
    if (calculator.id.includes('projectile') || calculator.id.includes('constant-acceleration')) {
      checks.push('Sørg for at g indgår med minus i y-retning og samme tid t i begge retninger.');
      checks.push('Starthastighed kan indtastes i km/t — vælg enheden ved v₀.');
    }
    if (calculator.id.includes('orbit') || calculator.id.includes('circular')) {
      checks.push('Brug r = planetradius + højde, ikke kun højden.');
    }
    return checks;
  }, [calculator.id]);
  const unknownVariable = calculator.variables.find((variable) => variable.key === unknown);
  const unknownOptions = unknownVariable?.unit ? UNIT_OPTIONS[unknownVariable.unit] : undefined;
  const unknownSelected = unknownOptions?.find((option) => option.label === selectedUnits[unknown]) ?? unknownOptions?.[0];
  const convertedResult = result !== null && !Number.isNaN(result) && unknownSelected ? unknownSelected.fromBase(result) : result;
  const resultUnit = selectedUnits[unknown] ?? unknownVariable?.unit ?? '';
  const resultText =
    convertedResult !== null && !Number.isNaN(convertedResult)
      ? `${formatNumber(convertedResult)}${resultUnit ? ` ${resultUnit}` : ''}`
      : '';
  const activeConversionHints = calculator.variables
    .filter((variable) => variable.unit && UNIT_OPTIONS[variable.unit]?.length)
    .map((variable) => {
      const base = UNIT_OPTIONS[variable.unit!][0]?.label;
      const selected = selectedUnits[variable.key];
      return selected && base && selected !== base ? `${variable.label}: ${selected} -> ${base}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));
  const warnings = calculator.variables
    .filter((variable) => Number.isFinite(numericValues[variable.key]))
    .flatMap((variable) => {
      const value = numericValues[variable.key];
      if (variable.key.toLowerCase().startsWith('m') && variable.unit === 'kg' && value < 0) return [`${variable.label}: masse kan ikke være negativ.`];
      if (variable.unit === 'K' && value <= 0) return [`${variable.label}: kelvin-temperatur skal være over 0 K.`];
      if (['r', 'R', 'd', 'V', 'Vi', 'Vf'].includes(variable.key) && value === 0) return [`${variable.label}: nul kan give division med nul.`];
      return [];
    });

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper className={embedded ? 'embedded-calculator' : 'card detail'}>
      {!embedded && (
        <>
          <p className="eyebrow">Regner</p>
          <h2>{calculator.title}</h2>
          <p>{calculator.description}</p>
          <div className="equation-card">
            <TexMath tex={calculator.latex} block />
          </div>
        </>
      )}
      <label className="field">
        Ukendt
        <select value={unknown} onChange={(event) => setUnknown(event.target.value)}>
          {calculator.variables.map((variable) => (
            <option key={variable.key} value={variable.key}>
              {variable.label}
            </option>
          ))}
        </select>
      </label>
      <div className="calculator-grid">
        {calculator.variables.map((variable) => (
          <label key={variable.key} className={variable.key === unknown ? 'field disabled' : 'field'}>
            <span className="field-label">
              {variable.latex ? <TexMath tex={variable.latex} /> : variable.label}
              {variable.unit && <span className="unit"> ({variable.unit})</span>}
            </span>
            <input
              disabled={variable.key === unknown}
              inputMode="decimal"
              value={values[variable.key] ?? ''}
              placeholder={variable.key === unknown ? 'løses' : 'indtast værdi'}
              onChange={(event) => setValues((current) => ({ ...current, [variable.key]: event.target.value }))}
            />
            {variable.unit && UNIT_OPTIONS[variable.unit] && (
              <select
                value={selectedUnits[variable.key] ?? UNIT_OPTIONS[variable.unit][0].label}
                onChange={(event) =>
                  setSelectedUnits((current) => ({
                    ...current,
                    [variable.key]: event.target.value,
                  }))
                }
              >
                {UNIT_OPTIONS[variable.unit].map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
      <div className={result === null || Number.isNaN(result) ? 'result muted' : 'result'}>
        {result === null || Number.isNaN(result)
          ? `Kan ikke løse endnu. Udfyld flere inputfelter${missingInputs.length ? ` (fx ${missingInputs.join(', ')})` : ''}, og undgå nul i nævnere/ugyldige rødder.`
          : calculator.explanation(numericValues, unknown, convertedResult ?? result)}
      </div>
      {convertedResult !== null && !Number.isNaN(convertedResult) && unknownVariable?.unit && (
        <p className="muted small">
          Resultat i valgt enhed: {resultText}
        </p>
      )}
      {resultText && (
        <button type="button" className="copy-result" onClick={() => navigator.clipboard?.writeText(resultText)}>
          Kopiér resultat
        </button>
      )}
      {activeConversionHints.length > 0 && (
        <p className="muted small">Automatisk konvertering aktiv: {activeConversionHints.join(' · ')}</p>
      )}
      {warnings.length > 0 && (
        <div className="warning-list">
          {warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}
      <section className="subcard">
        <h3>Fejltjek (30 sek)</h3>
        <ul>
          {quickChecks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </section>
      {!embedded && formulaChips.length > 0 && (
        <>
          <h3>Relaterede formler</h3>
          <div className="pill-row">
            {formulaChips.map((formula) => (
              <button key={formula.id} type="button" onClick={() => state.selectFormula(formula.id)}>
                {formula.name}
              </button>
            ))}
          </div>
        </>
      )}
    </Wrapper>
  );
}

function ExamplesView({
  state,
  selectedExample,
  isBookmarked,
  toggleBookmark,
}: {
  state: AppState;
  selectedExample: WorkedExample;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}) {
  const filtered = state.query.trim() ? state.searchResults.examples : workedExamples;
  const id = `example:${selectedExample.id}`;
  const numericExample = selectedExample.numericExample ?? supplementalNumericExamples[selectedExample.id];
  const [showFigure, setShowFigure] = useState(false);
  const [revealedStep, setRevealedStep] = useState(0);
  const [mapleCopyStatus, setMapleCopyStatus] = useState(false);
  const finderIndex = useMemo(() => getFormulaFinderIndex(), []);
  const labelForKey = (key: string) =>
    pickerEntryLabel(finderIndex.pickerEntries, key) || finderIndex.variableMeta.get(key)?.labelLaTeX || key;
  const givenVariableKeys = getExampleGivenKeys(selectedExample.id);
  const quickPlan = selectedExample.steps.slice(0, 3);
  const patternLinks = problemPatterns.filter((pattern) => pattern.exampleIds.includes(selectedExample.id));
  const linkedExamQuestions = pastExamQuestions.filter(
    (question) =>
      question.exampleIds.includes(selectedExample.id) ||
      question.formulaIds.some((formulaId) => selectedExample.formulaIds.includes(formulaId)),
  );

  useEffect(() => {
    setShowFigure(false);
    setRevealedStep(0);
  }, [selectedExample.id]);

  const copyExampleMaple = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(buildMapleSnippetForExample(selectedExample));
      setMapleCopyStatus(true);
      window.setTimeout(() => setMapleCopyStatus(false), 1600);
    } catch {
      setMapleCopyStatus(false);
    }
  }, [selectedExample]);

  return (
    <div className="split">
      <aside className="list-panel">
        {filtered.map((example) => (
          <button
            key={example.id}
            className={example.id === selectedExample.id ? 'active item' : 'item'}
            type="button"
            onClick={() => state.selectExample(example.id)}
          >
            <span>{example.title}</span>
            <small>{example.pattern}</small>
          </button>
        ))}
      </aside>
      <section className="card detail example-detail">
        <header className="detail-head">
          <div className="detail-heading">
            <p className="detail-eyebrow">
              <span className="category-pill">{selectedExample.difficulty}</span>
              <span className="detail-topic">{selectedExample.pattern}</span>
            </p>
            <h2>{selectedExample.title}</h2>
          </div>
          <button
            type="button"
            className={`bookmark-button${isBookmarked(id) ? ' active' : ''}`}
            onClick={() => toggleBookmark(id)}
          >
            {isBookmarked(id) ? '★ Bogmærket' : '☆ Bogmærk'}
          </button>
        </header>

        <section className="subcard">
          <h3>Opgaven i én linje</h3>
          <p>{selectedExample.question}</p>
        </section>

        <div className="example-grid">
          <section className="subcard">
            <h3>Begyndelsesoplysninger</h3>
            <ul className="given-list">
              {selectedExample.givens.map((given) => (
                <li key={given}>{given}</li>
              ))}
            </ul>
            {givenVariableKeys.length > 0 && (
              <div className="pill-row variable-chip-list">
                {givenVariableKeys.map((key) => (
                  <span key={`${selectedExample.id}-${key}`} className="tag math-tag">
                    <TexMath tex={labelForKey(key)} />
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="subcard quick-guide">
            <h3>Hurtig plan (30 sek)</h3>
            <ol className="recipe compact">
              {quickPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        {numericExample && (
          <section className="subcard numeric-example">
            <h3>Konkret taleksempel</h3>
            <p className="muted">{numericExample.description}</p>
            <div className="variable-grid">
              {numericExample.values.map((entry) => (
                <div key={entry.label}>
                  <strong>{entry.label}</strong>
                  <span>{entry.value}</span>
                </div>
              ))}
              <div className="result-row">
                <strong>{numericExample.result.label}</strong>
                <span>{numericExample.result.value}</span>
              </div>
            </div>
          </section>
        )}

        <section className="subcard">
          <div className="subcard-head">
            <h3>Trin for trin (selvtest)</h3>
            <button type="button" onClick={copyExampleMaple}>
              {mapleCopyStatus ? '✓ Maple kopieret' : 'Kopiér formler til Maple'}
            </button>
          </div>
          <ol className="recipe numbered">
            {selectedExample.steps.slice(0, revealedStep + 1).map((step, index) => (
              <li key={step}>
                <span className="step-num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="pill-row">
            <button
              type="button"
              disabled={revealedStep >= selectedExample.steps.length - 1}
              onClick={() => setRevealedStep((value) => Math.min(value + 1, selectedExample.steps.length - 1))}
            >
              Vis næste trin
            </button>
            <button type="button" onClick={() => setRevealedStep(selectedExample.steps.length - 1)}>
              Vis alle trin
            </button>
            <button type="button" className="ghost" onClick={() => setRevealedStep(0)}>
              Skjul igen
            </button>
          </div>
        </section>

        <section className="subcard">
          <h3>Formler i opgaven</h3>
          <div className="related-formula-grid">
            {selectedExample.formulaIds.map((id) => {
              const formula = formulaById(id);
              if (!formula) return null;
              return (
                <button key={id} type="button" className="related-formula-card" onClick={() => state.selectFormula(id)}>
                  <span className="related-formula-name">{formula.name}</span>
                  <TexMath tex={formula.latex} />
                </button>
              );
            })}
          </div>
        </section>

        {selectedExample.figureId && (
          <section className="subcard">
            <div className="subcard-head">
              <h3>Illustration</h3>
              <button type="button" className="link-button" onClick={() => setShowFigure((value) => !value)}>
                {showFigure ? 'Skjul' : 'Vis'} illustration
              </button>
            </div>
            {showFigure ? (
              <Figure id={selectedExample.figureId} title={selectedExample.title} />
            ) : (
              <p className="muted small">Vis kun når du vil se skitsen — resten af guiden holdes tekstfokuseret.</p>
            )}
          </section>
        )}

        {(patternLinks.length > 0 || linkedExamQuestions.length > 0 || selectedExample.sources.length > 0) && (
          <section className="subcard">
            <h3>Forbundet</h3>
            {patternLinks.length > 0 && (
              <div className="connection-block">
                <h4>Problemtype</h4>
                <div className="pill-row">
                  {patternLinks.map((pattern) => (
                    <button key={pattern.id} type="button" onClick={() => state.selectPattern(pattern.id)}>
                      {pattern.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {linkedExamQuestions.length > 0 && (
              <div className="connection-block">
                <h4>Match i Eksamen Navigator</h4>
                <div className="pill-row">
                  {linkedExamQuestions.map((question) => (
                    <button key={question.id} type="button" onClick={() => state.selectExamQuestion(question.id)}>
                      {question.year}: {question.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedExample.sources.length > 0 && (
              <div className="connection-block">
                <h4>Læs i teorien (PDF)</h4>
                <SourceLinks refs={selectedExample.sources} state={state} />
              </div>
            )}
          </section>
        )}
      </section>
    </div>
  );
}

function ExamDecoderView({
  state,
  selectedQuestion,
}: {
  state: AppState;
  selectedQuestion: (typeof pastExamQuestions)[number];
}) {
  const finderIndex = useMemo(() => getFormulaFinderIndex(), []);
  const labelForKey = (key: string) =>
    pickerEntryLabel(finderIndex.pickerEntries, key) || finderIndex.variableMeta.get(key)?.labelLaTeX || key;
  const givenVariableKeys = getExamGivenKeys(selectedQuestion.id);
  const years = useMemo(() => Array.from(new Set(pastExamQuestions.map((question) => question.year))).sort((a, b) => a - b), []);
  const [year, setYear] = useState<'all' | string>('all');
  const filtered = pastExamQuestions.filter((question) => year === 'all' || question.year.toString() === year);
  const sameSkeleton = pastExamQuestions
    .filter(
      (question) =>
        question.id !== selectedQuestion.id &&
        question.patternIds.some((id) => selectedQuestion.patternIds.includes(id)),
    )
    .slice(0, 4);

  return (
    <div className="split">
      <aside className="list-panel">
        <div className="mini-filter">
          {(['all', ...years.map(String)] as const).map((value) => (
            <button key={value} type="button" className={year === value ? 'active' : undefined} onClick={() => setYear(value)}>
              {value === 'all' ? 'Alle' : value}
            </button>
          ))}
        </div>
        {filtered.map((question) => (
          <button
            key={question.id}
            className={question.id === selectedQuestion.id ? 'active item' : 'item'}
            type="button"
            onClick={() => state.selectExamQuestion(question.id)}
          >
            <span>{question.year}: {question.title}</span>
            <small>{question.cue}</small>
          </button>
        ))}
      </aside>

      <section className="card detail exam-detail">
        <header className="detail-head">
          <div className="detail-heading">
            <p className="detail-eyebrow">
              <span className="category-pill">{selectedQuestion.year}</span>
              <span className="detail-topic">Eksamen Navigator</span>
            </p>
            <h2>{selectedQuestion.title}</h2>
          </div>
        </header>
        <div className="decoder-lead">
          <p><strong>Nøgleord:</strong> {selectedQuestion.cue}</p>
          <p><strong>Første move:</strong> {selectedQuestion.firstMove}</p>
        </div>
        {givenVariableKeys.length > 0 && (
          <section className="subcard">
            <h3>Begyndelsesvariable (labeling)</h3>
            <div className="pill-row variable-chip-list">
              {givenVariableKeys.map((key) => (
                <span key={`${selectedQuestion.id}-${key}`} className="tag math-tag">
                  <TexMath tex={labelForKey(key)} />
                </span>
              ))}
            </div>
            <div className="pill-row">
              <button type="button" className="primary" onClick={() => state.openFinderWithKeys(givenVariableKeys)}>
                Find lignende opgaver i finder
              </button>
            </div>
          </section>
        )}
        <section className="subcard">
          <h3>Næste bedste handling</h3>
          <div className="pill-row">
            {selectedQuestion.patternIds.map((id) => (
              <button key={id} type="button" onClick={() => state.selectPattern(id)}>
                Problemtype: {patternById(id)?.title ?? id}
              </button>
            ))}
            {selectedQuestion.calculatorIds
              .map((id) => calculatorById(id))
              .filter((calculator): calculator is CalculatorDefinition => Boolean(calculator))
              .map((calculator) => (
                <button key={calculator.id} type="button" onClick={() => state.selectCalculator(calculator.id)}>
                  Beregner: {calculator.title}
                </button>
              ))}
            {selectedQuestion.exampleIds.map((id) => (
              <button key={id} type="button" onClick={() => state.selectExample(id)}>
                Eksempel: {exampleById(id)?.title ?? id}
              </button>
            ))}
          </div>
        </section>

        <section className="subcard">
          <h3>Formler til spørgsmålet</h3>
          <div className="formula-strip">
            {selectedQuestion.formulaIds
              .map((id) => formulaById(id))
              .filter((formula): formula is Formula => Boolean(formula))
              .map((formula) => (
                <button key={formula.id} type="button" className="formula-mini" onClick={() => state.selectFormula(formula.id)}>
                  <strong>{formula.name}</strong>
                  <TexMath tex={formula.latex} block />
                </button>
              ))}
          </div>
        </section>

        <section className="subcard">
          <h3>Matchende eksempler</h3>
          <div className="example-list">
            {selectedQuestion.exampleIds
              .map((id) => exampleById(id))
              .filter((example): example is WorkedExample => Boolean(example))
              .map((example) => (
                <button key={example.id} type="button" className="example-card" onClick={() => state.selectExample(example.id)}>
                  <Figure id={example.figureId} />
                  <div>
                    <strong>{example.title}</strong>
                    <small>{example.pattern}</small>
                  </div>
                </button>
              ))}
          </div>
        </section>

        <section className="subcard">
          <h3>PDF-kilde</h3>
          <SourceLinks refs={[selectedQuestion.source]} state={state} />
        </section>
        {sameSkeleton.length > 0 && (
          <section className="subcard">
            <h3>Samme løsningsskelet</h3>
            <div className="pill-row">
              {sameSkeleton.map((question) => (
                <button key={question.id} type="button" onClick={() => state.selectExamQuestion(question.id)}>
                  {question.year}: {question.title}
                </button>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function FormulaSheetView({ state }: { state: AppState }) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Formula['category']>('all');
  const filtered =
    selectedCategory === 'all'
      ? formulasWithExamples
      : formulasWithExamples.filter((formula) => formula.category === selectedCategory);

  return (
    <section className="card detail formula-sheet-view">
      <header className="detail-head no-print">
        <div>
          <p className="eyebrow">Print / repetition</p>
          <h2>Hurtigark</h2>
          <p className="muted">
            Kompakt formelark med antagelser. Brug browserens printdialog eller gem som PDF.
          </p>
        </div>
        <button type="button" className="primary" onClick={() => window.print()}>
          Print / gem som PDF
        </button>
      </header>

      <div className="pill-row no-print sheet-filter">
        <button type="button" className={selectedCategory === 'all' ? 'active' : undefined} onClick={() => setSelectedCategory('all')}>
          Alle
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? 'active' : undefined}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="print-title">
        <h1>GMT Hurtigark</h1>
        <p>Formler, antagelser og kildepejlemærker til hurtig repetition.</p>
      </div>

      <div className="sheet-grid">
        {categories.map((category) => {
          const formulas = filtered.filter((formula) => formula.category === category);
          if (!formulas.length) return null;
          return (
            <section key={category} className="sheet-section">
              <h3>{category}</h3>
              {formulas.map((formula) => (
                <article key={formula.id} className="sheet-formula">
                  <button type="button" className="sheet-link no-print" onClick={() => state.selectFormula(formula.id)}>
                    Åbn
                  </button>
                  <div>
                    <strong>{formula.name}</strong>
                    <small>{formula.topic}</small>
                  </div>
                  <TexMath tex={formula.latex} block />
                  <p>{formula.assumptions[0]}</p>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}

type CalculatorDiagnostic = {
  name: string;
  ok: boolean;
  detail: string;
};

const runCalculatorDiagnostics = (): CalculatorDiagnostic[] => {
  const approx = (actual: number | null, expected: number, tolerance = 1e-3) =>
    typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));

  const byId = (id: string) => calculators.find((calculator) => calculator.id === id);
  const out: CalculatorDiagnostic[] = [];

  const suvat = byId('constant-acceleration');
  out.push({
    name: 'SUVAT: v = v0 + a t',
    ok: approx(suvat?.solve({ v0: 10, a: 2, t: 3 }, 'v') ?? null, 16),
    detail: 'Forventet 16 m/s ved v0=10, a=2, t=3.',
  });

  const idealGas = byId('ideal-gas');
  out.push({
    name: 'Idealgas: pV = nRT',
    ok: approx(idealGas?.solve({ p: 101325, V: 0.0246, T: 300 }, 'n') ?? null, 1, 5e-3),
    detail: 'Forventet ca. 1 mol ved 101325 Pa, 0.0246 m³, 300 K.',
  });

  const work = byId('work');
  out.push({
    name: 'Arbejde: W = F d cosθ',
    ok: approx(work?.solve({ F: 100, d: 5, theta: 0 }, 'W') ?? null, 500),
    detail: 'Forventet 500 J ved F=100 N, d=5 m, θ=0°.',
  });
  out.push({
    name: 'Arbejde: theta=90 er ikke inverterbar',
    ok: work?.solve({ W: 100, d: 5, theta: 90 }, 'F') === null,
    detail: 'Ved cos(90°)=0 skal ukendt kraft ikke løses numerisk.',
  });

  const orbit = byId('orbit');
  out.push({
    name: 'Orbit: v = √(GM/r)',
    ok: approx(orbit?.solve({ M: 5.97e24, r: 6.75e6 }, 'v') ?? null, 7679, 1.5e-2),
    detail: 'Forventet ca. 7.68 km/s i lav jordbane.',
  });

  const projectile = byId('projectile');
  out.push({
    name: 'Projektil: tophøjde',
    ok: approx(projectile?.solve({ v0: 20, theta: 30, y0: 0 }, 'yMax') ?? null, 5.09, 2e-2),
    detail: 'Forventet ca. 5,1 m for v₀=20 m/s og θ=30°.',
  });

  const heat = byId('heat');
  out.push({
    name: 'Varme: Q = mcΔT',
    ok: approx(heat?.solve({ m: 2, c: 4186, dT: 10 }, 'Q') ?? null, 83720),
    detail: 'Forventet 83.72 kJ for 2 kg vand og 10 K.',
  });

  const atwood = byId('atwood');
  out.push({
    name: 'Atwood: acceleration',
    ok: approx(atwood?.solve({ m1: 4, m2: 6 }, 'a') ?? null, 1.964),
    detail: 'Forventet ca. 1,96 m/s² for 4 kg og 6 kg.',
  });

  const statics = byId('statics');
  out.push({
    name: 'Statik: symmetrisk ophaeng',
    ok: approx(statics?.solve({ W: 100, theta1: 45, theta2: 45 }, 'T1') ?? null, 70.71, 2e-3),
    detail: 'Forventet ca. 70.7 N i hver snor.',
  });

  const momentum = byId('momentum');
  out.push({
    name: 'Impuls: faelles slutfart',
    ok: approx(momentum?.solve({ m1: 2, v1i: 3, m2: 1, v2i: 0 }, 'vf') ?? null, 2),
    detail: 'Forventet 2 m/s for uelastisk stod.',
  });

  const relative = byId('relative-velocity');
  out.push({
    name: 'Relativ hastighed: resultant',
    ok: approx(relative?.solve({ vxOwn: 3, vyOwn: 4, vxMedium: 1, vyMedium: 0 }, 'speed') ?? null, Math.sqrt(32)),
    detail: 'Forventet √32 m/s ved komponentaddition.',
  });

  const total = out.length;
  const passed = out.filter((entry) => entry.ok).length;
  out.unshift({
    name: 'Samlet status',
    ok: passed === total,
    detail: `${passed}/${total} checks bestået.`,
  });
  return out;
};

function ToolsView() {
  const diagnostics = useMemo(runCalculatorDiagnostics, []);
  return (
    <div className="grid two">
      <section className="card wide">
        <h2>Fysiske konstanter</h2>
        <p className="muted small">Typiske værdier fra pensum og Appendix E — brug Reference under eksamen.</p>
        {CONSTANT_CATEGORIES.map((category) => {
          const rows = PHYSICAL_CONSTANTS.filter((c) => c.category === category);
          if (!rows.length) return null;
          return (
            <div key={category} className="constant-category">
              <h3 className="constant-category-title">{category}</h3>
              <div className="constant-grid">
                {rows.map((entry) => (
                  <div key={entry.symbol} className="constant">
                    <strong>
                      <TexMath tex={entry.latex} />
                    </strong>
                    <span>{entry.value}</span>
                    <small>{entry.note}</small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      <section className="card">
        <h2>Enhedsomregner</h2>
        <UnitConverter />
        <p className="muted small">
          Tip: indtast tal i venstre felt; tryk på <span aria-hidden="true">⇄</span> for at bytte retning.
        </p>
      </section>
      <section className="card wide">
        <h2>Almindelige stoffers data</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Stof</th>
              <th>c [J/(kg K)]</th>
              <th>L_smelte [J/kg]</th>
              <th>L_fordamp [J/kg]</th>
            </tr>
          </thead>
          <tbody>
            {SUBSTANCE_PROPERTIES.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.c}</td>
                <td>{row.melt}</td>
                <td>{row.vapor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Brug værdier ved standardbetingelser; tjek altid PDF-tabellerne for præcise tal.</p>
      </section>
      <section className="card wide">
        <h2>Beregner-validering</h2>
        <p className="muted small">Automatisk sanity-check af udvalgte nøgleberegnere og referencecases.</p>
        <div className="variable-grid">
          {diagnostics.map((entry) => (
            <div key={entry.name} className={entry.ok ? 'diag-pass' : 'diag-fail'}>
              <strong>{entry.ok ? 'PASS' : 'FAIL'} - {entry.name}</strong>
              <span>{entry.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourcesView() {
  const [filter, setFilter] = useState<'all' | 'lecture' | 'exam'>('all');
  const lectures = pdfSources.filter((source) => source.kind === 'lecture');
  const exams = pdfSources.filter((source) => source.kind === 'exam');

  return (
    <div className="grid two">
      <section className="card">
        <header className="card-head">
          <h2>Lokale PDF'er</h2>
          <div className="pill-row">
            {(['all', 'lecture', 'exam'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'active' : undefined}
                onClick={() => setFilter(value)}
              >
                {value === 'all' ? 'Alle' : value === 'lecture' ? 'Forelæsninger' : 'Eksamenssæt'}
              </button>
            ))}
          </div>
        </header>
        <div className="source-list">
          {(filter === 'all' ? pdfSources : filter === 'lecture' ? lectures : exams).map((source) => (
            <a key={source.id} href={pdfHref(source.id)} target="_blank" rel="noreferrer">
              <strong>{source.title}</strong>
              <span>{source.topic}</span>
            </a>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Tip</h2>
        <p>
          Kombiner eksamenssæt-løsningerne med problemtyperne i appen for at træne genkendelse. Søgefeltet rammer
          PDF-teksten direkte — søg fx på et nøgleord fra opgaven for at finde forelæsningssiden bag formlen.
        </p>
        <p className="muted small">
          Bemærk: PDF-teksten er udtrukket automatisk og indeholder enkelte sammenhængende ord. Brug formler-fanen
          for læsbart materiale.
        </p>
      </section>
      <section className="card wide">
        <h2>Direkte adgang til alle sider</h2>
        <p className="muted small">Klik en kilde for at åbne den i en ny fane. Sidetal er klikbare i søgeresultater.</p>
        <div className="page-grid">
          {pdfCorpus.map((source) => {
            const meta = getPdfSource(source.sourceId);
            return (
              <details key={source.sourceId}>
                <summary>
                  <strong>{meta?.shortTitle ?? source.sourceId}</strong>
                  <span>{meta?.title ?? source.sourceId}</span>
                  <span className="count">{source.pageCount} sider</span>
                </summary>
                <div className="page-list">
                  {Array.from({ length: source.pageCount }, (_, index) => index + 1).map((page) => (
                    <a key={page} href={pdfHref(source.sourceId, page)} target="_blank" rel="noreferrer">
                      {page}
                    </a>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SourceLinks({ refs, state }: { refs: SourceRef[]; state?: AppState }) {
  if (!refs.length) {
    return <p className="muted small">Ingen direkte PDF-reference.</p>;
  }
  return (
    <div className="source-links">
      {refs.map((ref) => {
        const href = sourceUrl(ref);
        const pageMatch = href.match(/#page=(\d+)/);
        const page = pageMatch ? Number(pageMatch[1]) : 1;
        return (
          <a
            key={`${ref.sourceId}-${ref.page}-${ref.label ?? ''}`}
            href={href}
            onClick={(event) => {
              if (state) {
                event.preventDefault();
                state.openPdf(ref.sourceId, page);
              }
            }}
          >
            {sourceLabel(ref)}
          </a>
        );
      })}
    </div>
  );
}

export { cleanSnippet };
export default App;
