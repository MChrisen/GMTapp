import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const read = (path) => readFileSync(resolve(ROOT, path), 'utf8');

const formulasSrc = read('src/data/formulas.ts');
const vectorFormulasSrc = read('src/data/vectorFormulas.ts');
const combinedFormulasSrc = `${formulasSrc}\n${vectorFormulasSrc}`;
const examplesSrc = read('src/data/examples.ts');
const calculatorsSrc = read('src/data/calculators.ts');
const examAidsSrc = read('src/data/examAids.ts');

const collectIds = (source, pattern) => Array.from(source.matchAll(pattern)).map((m) => m[1]);
const unique = (values) => Array.from(new Set(values));

const formulaIds = unique(collectIds(combinedFormulasSrc, /id:\s*'([^']+)'/g));
const exampleIds = unique(collectIds(examplesSrc, /id:\s*'([^']+)'/g));
const patternIds = unique(collectIds(examplesSrc, /id:\s*'(pattern-[^']+)'/g));
const calculatorIds = unique(collectIds(calculatorsSrc, /id:\s*'([^']+)'/g));
const sourceIds = unique(collectIds(read('src/data/pdfManifest.ts'), /id:\s*'([^']+)'/g));

const refIds = (source, key) =>
  collectIds(source, new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, 'g'))
    .flatMap((chunk) => collectIds(chunk, /'([^']+)'/g));

const fail = (message) => {
  console.error(`[validate:data] ${message}`);
  process.exitCode = 1;
};

const ensureRefs = (refs, validSet, label) => {
  for (const ref of refs) {
    if (!validSet.has(ref)) fail(`${label} contains unknown id: ${ref}`);
  }
};

const warn = (message) => {
  console.warn(`[validate:data] warn ${message}`);
};

ensureRefs(refIds(examplesSrc, 'formulaIds'), new Set(formulaIds), 'examples.formulaIds');
ensureRefs(refIds(examplesSrc, 'exampleIds'), new Set(exampleIds), 'patterns.exampleIds');
ensureRefs(refIds(examplesSrc, 'calculatorIds'), new Set(calculatorIds), 'patterns.calculatorIds');
ensureRefs(refIds(combinedFormulasSrc, 'relatedFormulaIds'), new Set(formulaIds), 'formulas.relatedFormulaIds');
ensureRefs(refIds(examAidsSrc, 'formulaIds'), new Set(formulaIds), 'examAids.formulaIds');
ensureRefs(refIds(examAidsSrc, 'exampleIds'), new Set(exampleIds), 'examAids.exampleIds');
ensureRefs(refIds(examAidsSrc, 'patternIds'), new Set(patternIds), 'examAids.patternIds');
ensureRefs(refIds(examAidsSrc, 'calculatorIds'), new Set(calculatorIds), 'examAids.calculatorIds');

const sourceRefs = collectIds(
  `${combinedFormulasSrc}\n${examplesSrc}\n${examAidsSrc}`,
  /sourceId:\s*'([^']+)'/g,
);
ensureRefs(sourceRefs, new Set(sourceIds), 'sourceId references');

const formulaExampleLinks = new Map(
  Array.from(formulasSrc.matchAll(/'([^']+)':\s*\[([^\]]*)\]/g)).map((match) => [
    match[1],
    collectIds(match[2], /'([^']+)'/g),
  ]),
);
const formulasWithoutExamples = formulaIds.filter((id) => !(formulaExampleLinks.get(id)?.length > 0));
const patternsWithoutExamples = Array.from(examplesSrc.matchAll(/id:\s*'(pattern-[^']+)'[\s\S]*?exampleIds:\s*\[([^\]]*)\]/g))
  .filter((match) => collectIds(match[2], /'([^']+)'/g).length === 0)
  .map((match) => match[1]);
const patternsWithoutCalculators = Array.from(examplesSrc.matchAll(/id:\s*'(pattern-[^']+)'[\s\S]*?calculatorIds:\s*\[([^\]]*)\]/g))
  .filter((match) => collectIds(match[2], /'([^']+)'/g).length === 0)
  .map((match) => match[1]);
const examQuestionsWithoutExamples = Array.from(examAidsSrc.matchAll(/id:\s*'(exam[^']+)'[\s\S]*?exampleIds:\s*\[([^\]]*)\]/g))
  .filter((match) => collectIds(match[2], /'([^']+)'/g).length === 0)
  .map((match) => match[1]);

if (formulasWithoutExamples.length) warn(`formulas without examples=${formulasWithoutExamples.length}`);
if (patternsWithoutExamples.length) warn(`patterns without examples: ${patternsWithoutExamples.join(', ')}`);
if (patternsWithoutCalculators.length) warn(`patterns without calculators: ${patternsWithoutCalculators.join(', ')}`);
if (examQuestionsWithoutExamples.length) warn(`exam questions without examples: ${examQuestionsWithoutExamples.join(', ')}`);

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log(
  `[validate:data] OK formulas=${formulaIds.length} examples=${exampleIds.length} patterns=${patternIds.length} calculators=${calculatorIds.length}`,
);
