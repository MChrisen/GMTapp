import type { SourceRef } from './types';

export type ProblemTaskLevel = 'Type-I' | 'Type-II' | 'Type-III';
export type ProblemClusterCategory = 'Mekanik' | 'Termodynamik';

export type IndexedProblemTaskList = {
  level: ProblemTaskLevel;
  taskCodes: string[];
};

export type IndexedProblemCluster = {
  id: string;
  category: ProblemClusterCategory;
  title: string;
  summary: string;
  patternIds: string[];
  formulaIds: string[];
  exampleIds: string[];
  sourceRefs: SourceRef[];
  taskLists: IndexedProblemTaskList[];
};

const s = (sourceId: string, page: number, label?: string): SourceRef => ({ sourceId, page, label });
const codes = (chapter: number, numbers: number[]) => numbers.map((n) => `${chapter}-${n}`);

export const indexedProblemClusters: IndexedProblemCluster[] = [
  {
    id: 'idx-1d-kinematics',
    category: 'Mekanik',
    title: '1D bevagelse og SUVAT (kap. 1-2)',
    summary: 'Samme struktur med forskellige tal: acceleration, tid, distance og slutfart i en dimension.',
    patternIds: ['pattern-1d-kinematics'],
    formulaIds: [
      'average-velocity',
      'constant-acceleration-velocity',
      'constant-acceleration-position',
      'constant-acceleration-average-velocity',
      'constant-acceleration-no-time',
    ],
    exampleIds: ['ex-car-acceleration', 'ex-cannon-height'],
    sourceRefs: [s('lektion-01', 50, 'Type I/II-opgaver kap. 1-2')],
    taskLists: [
      { level: 'Type-I', taskCodes: [...codes(1, [15, 16, 33, 44, 54, 70, 71, 72, 73]), ...codes(2, [12, 14, 20, 23])] },
      { level: 'Type-II', taskCodes: [...codes(1, [20, 31, 45, 47, 49, 53, 55, 67]), ...codes(2, [39, 43, 49, 55, 59, 63, 75, 78])] },
    ],
  },
  {
    id: 'idx-vectors-projectile',
    category: 'Mekanik',
    title: 'Vektorer og projektil (kap. 3)',
    summary: 'Opgaver med komponentopdeling, vektoraddition, relativ hastighed og skraat kast.',
    patternIds: ['pattern-projectile', 'pattern-relative-velocity'],
    formulaIds: [
      'projectile-components',
      'projectile-position-x',
      'projectile-position-y',
      'projectile-range',
      'relative-velocity',
      'vector-addition',
      'angle-between-vectors',
    ],
    exampleIds: ['ex-projectile-castle', 'ex-cannon-height', 'ex-relative-wind'],
    sourceRefs: [s('lektion-01', 52, 'Naste uge / kap. 3-opgaver'), s('lektion-02', 28, 'Type I/II/III-opgaver kap. 3')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(3, [11, 14, 27, 41, 43, 80, 81]) },
      { level: 'Type-II', taskCodes: codes(3, [18, 20, 33, 35, 42, 62, 70, 77, 82]) },
      { level: 'Type-III', taskCodes: codes(3, [72, 89]) },
    ],
  },
  {
    id: 'idx-forces-newton',
    category: 'Mekanik',
    title: 'Krafter, snore, trisser og fjedre (kap. 4-5)',
    summary: 'Mange opgaver er samme model: fri-legeme-diagram + Newtons 2. lov i passende akser.',
    patternIds: ['pattern-forces'],
    formulaIds: [
      'newton-second-law',
      'weight',
      'friction-kinetic',
      'friction-static',
      'incline-components',
      'atwood-acceleration',
      'tension-atwood',
      'spring-force-hooke',
      'spring-equivalent-parallel',
      'spring-equivalent-series',
    ],
    exampleIds: ['ex-atwood', 'ex-incline-cylinder', 'ex-spring-helicopter'],
    sourceRefs: [s('lektion-02', 30, 'Naste uge / kap. 4+8-opgaver'), s('lektion-03', 40, 'Type I/II-opgaver kap. 4+5'), s('lektion-04', 29, 'Type I/II/III-opgaver kap. 5')],
    taskLists: [
      { level: 'Type-I', taskCodes: [...codes(4, [13, 16, 20, 25, 35, 53]), ...codes(5, [13, 17, 26, 27, 29, 35, 47, 64])] },
      { level: 'Type-II', taskCodes: [...codes(4, [28, 29, 44, 49, 51, 55, 57, 58]), ...codes(5, [11, 18, 23, 32, 42, 43, 53, 75])] },
      { level: 'Type-III', taskCodes: codes(5, [70]) },
    ],
  },
  {
    id: 'idx-energy',
    category: 'Mekanik',
    title: 'Arbejde og energibevarelse (kap. 6-7)',
    summary: 'Ens opgavetype med nye parametre: opskriv energiregnskab, isoler ukendt, indsæt tal til sidst.',
    patternIds: ['pattern-energy', 'pattern-work-power'],
    formulaIds: [
      'work-constant-force',
      'work-energy-theorem',
      'kinetic-energy',
      'gravitational-potential-earth',
      'spring-potential',
      'force-from-potential',
      'mechanical-energy',
      'power',
    ],
    exampleIds: ['ex-work-power', 'ex-energy-coaster', 'ex-rolling-sphere'],
    sourceRefs: [s('lektion-04', 31, 'Naste uge / kap. 6-opgaver'), s('lektion-05', 24, 'Type I/II-opgaver kap. 6'), s('lektion-06', 24, 'Type I/II/III-opgaver kap. 7')],
    taskLists: [
      { level: 'Type-I', taskCodes: [...codes(6, [11, 13, 18, 20, 26, 31, 51, 58]), ...codes(7, [9, 15, 18, 23, 25, 35, 39, 41])] },
      { level: 'Type-II', taskCodes: [...codes(6, [49, 57, 62, 71, 79, 81, 89]), ...codes(7, [24, 29, 45, 47, 49, 54, 56, 57, 65, 68])] },
      { level: 'Type-III', taskCodes: codes(7, [62]) },
    ],
  },
  {
    id: 'idx-circular-gravity',
    category: 'Mekanik',
    title: 'Cirkulaer bevagelse og gravitation (kap. 8)',
    summary: 'Baneopgaver med radius, periode, fart og central kraft/acceleration.',
    patternIds: ['pattern-circular-motion', 'pattern-orbit'],
    formulaIds: ['centripetal-acceleration', 'centripetal-force', 'universal-gravitation', 'orbital-speed', 'orbital-period'],
    exampleIds: ['ex-circular-turn', 'ex-satellite', 'ex-gravity-force'],
    sourceRefs: [s('lektion-03', 40, 'Type I/II-opgaver kap. 8'), s('lektion-02', 30, 'Naste uge / kap. 8-opgaver')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(8, [15]) },
      { level: 'Type-II', taskCodes: codes(8, [18, 27, 44, 59, 65]) },
      { level: 'Type-III', taskCodes: codes(8, [47]) },
    ],
  },
  {
    id: 'idx-momentum-com',
    category: 'Mekanik',
    title: 'Impuls, stod og massemidtpunkt (kap. 9)',
    summary: 'To hovedfamilier: bevarelsesligninger ved stod og vaegtede gennemsnit for center of mass.',
    patternIds: ['pattern-momentum', 'pattern-center-of-mass'],
    formulaIds: ['momentum', 'impulse', 'momentum-conservation', 'center-of-mass'],
    exampleIds: ['ex-momentum-collision', 'ex-center-of-mass-triangle'],
    sourceRefs: [s('lektion-06', 26, 'Naste uge / kap. 9-opgaver'), s('lektion-07', 32, 'Type I/II/III-opgaver kap. 9')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(9, [17, 29, 44, 61]) },
      { level: 'Type-II', taskCodes: codes(9, [11, 19, 26, 49, 52, 64, 79]) },
      { level: 'Type-III', taskCodes: codes(9, [41, 82]) },
    ],
  },
  {
    id: 'idx-rotation',
    category: 'Mekanik',
    title: 'Rotation og inertimoment (kap. 10)',
    summary: 'Standardstruktur: kinematik + momentligning + korrekt inertimoment + evt. rulningskobling.',
    patternIds: ['pattern-rotation'],
    formulaIds: [
      'angular-position',
      'angular-kinematics-velocity',
      'angular-kinematics-position',
      'angular-kinematics-no-time',
      'linear-angular-speed',
      'rolling-no-slip',
      'torque',
      'rotational-newton',
      'rotational-kinetic-energy',
      'rolling-total-kinetic-energy',
      'disk-inertia',
      'ring-inertia',
      'sphere-inertia',
      'rod-inertia',
      'parallel-axis-theorem',
      'angular-momentum',
      'torque-angular-momentum',
      'angular-momentum-conservation',
    ],
    exampleIds: ['ex-rotation-rpm', 'ex-parallel-axis', 'ex-rolling-sphere', 'ex-incline-cylinder'],
    sourceRefs: [s('lektion-07', 34, 'Naste uge / kap. 10-opgaver'), s('lektion-08', 38, 'Type I/II/III-opgaver kap. 10')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(10, [11, 12, 17, 21, 34]) },
      { level: 'Type-II', taskCodes: codes(10, [29, 30, 45, 51, 55, 57, 60, 67]) },
      { level: 'Type-III', taskCodes: codes(10, [65]) },
    ],
  },
  {
    id: 'idx-statics',
    category: 'Mekanik',
    title: 'Statik og ligevaegt (kap. 11-12)',
    summary: 'Ens opgavefamilie: sum af kraefter = 0 og sum af momenter = 0 om smart valgt punkt.',
    patternIds: ['pattern-statics'],
    formulaIds: ['static-equilibrium-forces', 'static-equilibrium-torque', 'torque', 'weight'],
    exampleIds: ['ex-statics-cable', 'ex-tipping-threshold'],
    sourceRefs: [s('lektion-08', 40, 'Naste uge / kap. 11+12-opgaver'), s('lektion-09', 43, 'Type I/II/III-opgaver kap. 11+12')],
    taskLists: [
      { level: 'Type-I', taskCodes: [...codes(11, [11, 21, 38]), ...codes(12, [13, 15, 16])] },
      { level: 'Type-II', taskCodes: [...codes(11, [13, 23, 35, 45, 46]), ...codes(12, [17, 21, 35, 38, 54, 55])] },
      { level: 'Type-III', taskCodes: [...codes(11, [47]), ...codes(12, [58])] },
    ],
  },
  {
    id: 'idx-heat',
    category: 'Termodynamik',
    title: 'Temperatur, varme og varmeledning (kap. 16)',
    summary: 'Kalorimetri- og varmeoverforselsopgaver med samme balanceprincip men andre tal/materialer.',
    patternIds: ['pattern-heat', 'pattern-thermal-expansion', 'pattern-heat-transfer'],
    formulaIds: ['thermal-expansion-linear', 'heat-capacity', 'latent-heat', 'heat-conduction-r', 'celsius-kelvin'],
    exampleIds: ['ex-calorimetry', 'ex-thermal-expansion', 'ex-wall-rvalue'],
    sourceRefs: [s('lektion-09', 45, 'Naste uge / kap. 16-opgaver'), s('lektion-10', 35, 'Type I/II/III-opgaver kap. 16')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(16, [19, 23, 25, 27, 45, 49]) },
      { level: 'Type-II', taskCodes: codes(16, [49, 53, 54, 55, 58, 62, 63, 67, 69, 73]) },
      { level: 'Type-III', taskCodes: codes(16, [75, 80]) },
    ],
  },
  {
    id: 'idx-ideal-gas',
    category: 'Termodynamik',
    title: 'Idealgas og mikromodel (kap. 17)',
    summary: 'For/efter-tilstande med pV=nRT, ofte med enheder og kelvin som klassiske faldgruber.',
    patternIds: ['pattern-ideal-gas'],
    formulaIds: ['ideal-gas-nrt', 'ideal-gas-nkt', 'gas-internal-energy', 'celsius-kelvin'],
    exampleIds: ['ex-gas-bottle'],
    sourceRefs: [s('lektion-10', 37, 'Naste uge / kap. 17-opgaver'), s('lektion-11', 21, 'Type I/II/III-opgaver kap. 17')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(17, [11, 15, 21, 22, 25, 45, 57]) },
      { level: 'Type-II', taskCodes: codes(17, [39, 43, 48, 51, 56, 65, 69, 73]) },
      { level: 'Type-III', taskCodes: codes(17, [74]) },
    ],
  },
  {
    id: 'idx-thermo-first-law',
    category: 'Termodynamik',
    title: 'pV-processer og 1. hovedsaetning (kap. 18)',
    summary: 'Isoterm/isobar/isochor/adiabat med ens metode: procesidentifikation, arbejde, varme, indre energi.',
    patternIds: ['pattern-thermo-pv'],
    formulaIds: [
      'first-law',
      'gas-work',
      'isobaric-work',
      'isochoric-work',
      'isothermal-ideal-gas',
      'adiabatic-process',
      'adiabatic-temperature-relation',
      'adiabatic-work-closed-form',
    ],
    exampleIds: ['ex-pv-cycle', 'ex-diesel-adiabat'],
    sourceRefs: [s('lektion-11', 23, 'Naste uge / kap. 18-opgaver'), s('lektion-12', 31, 'Type I/II/III-opgaver kap. 18')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(18, [12, 13, 16, 17, 21, 36, 41, 45, 48]) },
      { level: 'Type-II', taskCodes: codes(18, [18, 19, 25, 27, 39, 43, 44, 53, 62, 63]) },
      { level: 'Type-III', taskCodes: codes(18, [69, 73]) },
    ],
  },
  {
    id: 'idx-thermo-second-law',
    category: 'Termodynamik',
    title: 'Varmemaskiner, COP og Carnot (kap. 19)',
    summary: 'Samme opgaveskelet med forskellige tal: energiregnskab for kredsprocesser og effektivitet/COP.',
    patternIds: ['pattern-heat-engine', 'pattern-cop'],
    formulaIds: ['cop-refrigerator', 'cop-heat-pump', 'heat-engine-efficiency', 'carnot-efficiency', 'entropy-second-law'],
    exampleIds: ['ex-carnot-engine', 'ex-cop-freezer'],
    sourceRefs: [s('lektion-12', 33, 'Naste uge / kap. 19-opgaver'), s('lektion-13', 21, 'Type I/II/III-opgaver kap. 19')],
    taskLists: [
      { level: 'Type-I', taskCodes: codes(19, [11, 14, 15, 16, 32, 61]) },
      { level: 'Type-II', taskCodes: codes(19, [35, 39, 46, 47, 48, 60, 61]) },
      { level: 'Type-III', taskCodes: codes(19, [66]) },
    ],
  },
];

export const indexedTaskCount = indexedProblemClusters.reduce(
  (sum, cluster) => sum + cluster.taskLists.reduce((inner, list) => inner + list.taskCodes.length, 0),
  0,
);

export const indexedProblemCategories: ProblemClusterCategory[] = ['Mekanik', 'Termodynamik'];

export const indexedClustersByCategory = (category: ProblemClusterCategory) =>
  indexedProblemClusters.filter((cluster) => cluster.category === category);
