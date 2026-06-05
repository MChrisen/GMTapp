import { formulaById } from '../data/formulas';
import type { WorkedExample } from '../data/types';
import { buildMapleSnippet } from './maple';

export function buildMapleSnippetForExample(example: WorkedExample): string {
  const lines: string[] = [
    `# GMT — løst eksempel: ${example.title}`,
    `# Opgave: ${example.question.replace(/\s+/g, ' ').trim()}`,
    '',
  ];

  if (example.givens.length > 0) {
    lines.push('# Givet:');
    for (const given of example.givens) {
      lines.push(`#   ${given}`);
    }
    lines.push('');
  }

  let eq = 1;
  for (const formulaId of example.formulaIds) {
    const formula = formulaById(formulaId);
    if (!formula) continue;
    lines.push(`# ${formula.name}`);
    const snippet = buildMapleSnippet(formula.latex);
    lines.push(snippet);
    lines.push('');
    eq += 1;
  }

  lines.push('# Løsningsplan (trin):');
  example.steps.forEach((step, index) => {
    lines.push(`# ${index + 1}. ${step}`);
  });

  return lines.join('\n').trimEnd();
}
