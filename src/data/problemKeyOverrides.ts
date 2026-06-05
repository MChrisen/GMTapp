import type { CanonicalVariableKey } from '../utils/formulaFinder';

/** Manual given-variable labels for high-value exam PDF pages and tasks. */
export type ProblemKeyOverride = {
  sourceId: string;
  page: number;
  givenKeys: CanonicalVariableKey[];
};

export const problemKeyOverrides: ProblemKeyOverride[] = [
  { sourceId: 'exam-2023', page: 3, givenKeys: ['v_0', 'theta', 'y', 'x'] },
  { sourceId: 'exam-2023', page: 7, givenKeys: ['m_1', 'm_2', 'g', 'a'] },
  { sourceId: 'exam-2023', page: 9, givenKeys: ['m', 'theta', 'F', 'T'] },
  { sourceId: 'exam-2023', page: 11, givenKeys: ['A', 'Delta_T', 'R_total', 't'] },
  { sourceId: 'exam-2024', page: 5, givenKeys: ['m_1', 'm_2', 'g', 'a', 't'] },
  { sourceId: 'exam-2024', page: 7, givenKeys: ['m_1', 'm_2', 'r', 'G'] },
  { sourceId: 'exam-2025', page: 1, givenKeys: ['v_0', 'theta', 'y', 'x'] },
  { sourceId: 'exam-2025', page: 2, givenKeys: ['m_1', 'm_2', 'g', 'a'] },
];

export function overrideKeysForPdfPage(sourceId: string, page: number): CanonicalVariableKey[] | null {
  const hit = problemKeyOverrides.find((entry) => entry.sourceId === sourceId && entry.page === page);
  return hit ? [...hit.givenKeys] : null;
}

export function overrideKeysForExamId(examId: string): CanonicalVariableKey[] | null {
  const map: Record<string, CanonicalVariableKey[]> = {
    'exam-2023-projectile': ['v_0', 'theta', 'y', 'x'],
    'exam-2023-atwood': ['m_1', 'm_2', 'g', 'a'],
    'exam-2023-statics': ['m', 'theta', 'F', 'T'],
    'exam-2023-rvalue': ['A', 'Delta_T', 'R_total', 't'],
    'exam-2024-atwood': ['m_1', 'm_2', 'g', 'a', 't'],
    'exam-2024-satellite-force': ['m_1', 'm_2', 'r', 'G'],
  };
  return map[examId] ? [...map[examId]] : null;
}
