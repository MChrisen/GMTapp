import type { CanonicalVariableKey } from '../utils/formulaFinder';

export type FinderPreset = {
  id: string;
  label: string;
  description: string;
  givenKeys: CanonicalVariableKey[];
};

export const finderPresets: FinderPreset[] = [
  {
    id: 'atwood',
    label: 'Trisse / Atwood',
    description: 'To masser, snor og trisse',
    givenKeys: ['m_1', 'm_2', 'g', 'a'],
  },
  {
    id: 'projectile-2025',
    label: 'Projektil (eksamen)',
    description: 'Skråt kast med v₀, vinkel og mål',
    givenKeys: ['v_0', 'theta', 'y', 'x'],
  },
  {
    id: 'ideal-gas',
    label: 'Idealgas',
    description: 'p, V, n og temperatur',
    givenKeys: ['p', 'V', 'n', 'T'],
  },
  {
    id: 'heat-wall',
    label: 'Varmetab gennem væg',
    description: 'Areal, ΔT og R-værdi',
    givenKeys: ['A', 'Delta_T', 'R_total'],
  },
  {
    id: 'orbit',
    label: 'Satellit / bane',
    description: 'Masse, radius og G',
    givenKeys: ['M', 'm', 'r', 'G'],
  },
];
