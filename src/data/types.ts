export type SourceRef = {
  sourceId: string;
  page: number;
  label?: string;
};

export type Variable = {
  symbol: string;
  latex?: string;
  name: string;
  unit?: string;
};

export type Formula = {
  id: string;
  name: string;
  category: FormulaCategory;
  topic: string;
  equation: string;
  latex: string;
  description: string;
  useWhen: string;
  examTip: string;
  variables: Variable[];
  assumptions: string[];
  notes: string[];
  keywords: string[];
  sources: SourceRef[];
  calculatorId?: string;
  relatedExampleIds: string[];
  relatedFormulaIds?: string[];
};

export type FormulaCategory =
  | 'Kinematik'
  | 'Vektorer'
  | 'Krafter'
  | 'Arbejde og energi'
  | 'Impuls'
  | 'Rotation'
  | 'Statik'
  | 'Gravitation'
  | 'Termodynamik'
  | 'Konstanter og enheder';

export type WorkedExample = {
  id: string;
  title: string;
  pattern: string;
  difficulty: 'hurtig' | 'middel' | 'sammensat';
  givens: string[];
  question: string;
  steps: string[];
  formulaIds: string[];
  sources: SourceRef[];
  keywords: string[];
  figureId?: FigureId;
  numericExample?: NumericExample;
};

export type NumericExample = {
  description: string;
  values: { label: string; value: string }[];
  result: { label: string; value: string };
};

export type ProblemPattern = {
  id: string;
  title: string;
  cueWords: string[];
  recognition: string;
  method: string[];
  formulaIds: string[];
  calculatorIds: string[];
  exampleIds: string[];
  figureId?: FigureId;
  pitfalls?: string[];
};

export type CalculatorVariable = {
  key: string;
  label: string;
  latex?: string;
  unit?: string;
};

export type CalculatorDefinition = {
  id: string;
  title: string;
  category?: string;
  description: string;
  latex: string;
  formulaIds: string[];
  variables: CalculatorVariable[];
  solve: (values: Record<string, number>, unknown: string) => number | null;
  explanation: (values: Record<string, number>, unknown: string, result: number) => string;
};

export type PdfCorpusPage = {
  page: number;
  text: string;
  keywords: string[];
};

export type PdfCorpusSource = {
  sourceId: string;
  pageCount: number;
  pages: PdfCorpusPage[];
};

export type PastExamQuestion = {
  id: string;
  year: 2023 | 2024 | 2025;
  title: string;
  source: SourceRef;
  cue: string;
  firstMove: string;
  patternIds: string[];
  formulaIds: string[];
  calculatorIds: string[];
  exampleIds: string[];
  keywords: string[];
};

export type StuckCue = {
  id: string;
  cue: string;
  likelyMeans: string;
  firstMove: string;
  patternIds: string[];
  formulaIds: string[];
  calculatorIds: string[];
  keywords: string[];
};

export type FigureId =
  | 'projectile'
  | 'projectile-cliff'
  | 'incline'
  | 'incline-cylinder'
  | 'atwood'
  | 'pulley-block'
  | 'cable-statics'
  | 'rotation'
  | 'orbit'
  | 'pv-cycle'
  | 'pv-isotherm'
  | 'pv-adiabat'
  | 'gas-bottle'
  | 'calorimetry'
  | 'wall-rvalue'
  | 'cop-freezer'
  | 'free-body'
  | 'spring'
  | 'collision'
  | 'center-of-mass'
  | 'vector-relative';
