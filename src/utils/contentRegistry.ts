import { calculatorById, calculators } from '../data/calculators';
import { exampleById, problemPatterns, workedExamples } from '../data/examples';
import { formulaById, formulasWithExamples } from '../data/formulas';

export const contentRegistry = {
  formulas: formulasWithExamples,
  examples: workedExamples,
  patterns: problemPatterns,
  calculators,
  formulaById,
  exampleById,
  calculatorById,
};
