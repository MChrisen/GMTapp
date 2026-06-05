import type { Formula } from './types';

const v = (symbol: string, name: string, unit?: string, latex?: string) => ({ symbol, name, unit, latex });
const s = (sourceId: string, page: number, label?: string) => ({ sourceId, page, label });

type FormulaInput = {
  id: string;
  name: string;
  topic: string;
  equation: string;
  latex: string;
  variables: ReturnType<typeof v>[];
  assumptions: string[];
  keywords: string[];
  sources: ReturnType<typeof s>[];
  relatedFormulaIds?: string[];
};

const vectorFormula = (input: FormulaInput): Formula => ({
  id: input.id,
  name: input.name,
  category: 'Vektorer',
  topic: input.topic,
  equation: input.equation,
  latex: input.latex,
  description: `${input.name} — ${input.topic}. Nøgleord: ${input.keywords.slice(0, 4).join(', ')}.`,
  useWhen: 'Brug når opgaven handler om vektorer, vinkler mellem retninger, prik- eller krydsprodukt, eller komponentregning i 2D/3D.',
  examTip: input.assumptions[0] ?? 'Tegn vektorer med hale-spids og skriv komponenter med fortegn før tal.',
  variables: input.variables,
  assumptions: input.assumptions,
  notes: ['Tegn altid figur, vælg koordinatsystem og skriv fortegn før du indsætter tal.'],
  keywords: input.keywords,
  sources: input.sources,
  relatedExampleIds: [],
  relatedFormulaIds: input.relatedFormulaIds ?? [],
});

/** Almindelige vektorregneregler (GMT lektion 2 / kapitel 3–4). */
export const vectorFormulas: Formula[] = [
  vectorFormula({
    id: 'vector-magnitude',
    name: 'Længde af vektor',
    topic: 'Grundlæggende',
    equation: '|a| = sqrt(ax^2 + ay^2 + az^2)',
    latex: '|\\vec{a}| = \\sqrt{a_x^{2} + a_y^{2} + a_z^{2}}',
    variables: [
      v('|a|', 'længde af vektor', 'm', '|\\vec{a}|'),
      v('a_x', 'x-komponent', 'm', 'a_x'),
      v('a_y', 'y-komponent', 'm', 'a_y'),
      v('a_z', 'z-komponent', 'm', 'a_z'),
    ],
    assumptions: ['I 2D udelades z-leddet.'],
    keywords: ['længde', 'norm', 'størrelse', 'magnitude'],
    sources: [s('lektion-02', 7)],
    relatedFormulaIds: ['unit-vector', 'angle-between-vectors'],
  }),
  vectorFormula({
    id: 'unit-vector',
    name: 'Enhedsvektor',
    topic: 'Grundlæggende',
    equation: 'a_hat = a / |a|',
    latex: '\\hat{a} = \\dfrac{\\vec{a}}{|\\vec{a}|}',
    variables: [
      v('â', 'enhedsvektor', undefined, '\\hat{a}'),
      v('a', 'vektor', undefined, '\\vec{a}'),
      v('|a|', 'længde', undefined, '|\\vec{a}|'),
    ],
    assumptions: ['|a| ≠ 0.'],
    keywords: ['enhedsvektor', 'retning', 'normalisere'],
    sources: [s('lektion-02', 7)],
    relatedFormulaIds: ['vector-magnitude'],
  }),
  vectorFormula({
    id: 'vector-addition',
    name: 'Vektoraddition (komponenter)',
    topic: 'Grundlæggende',
    equation: 'c = a + b  =>  cx = ax + bx, cy = ay + by, cz = az + bz',
    latex:
      '\\vec{c} = \\vec{a} + \\vec{b} \\quad\\Leftrightarrow\\quad c_x = a_x + b_x,\\; c_y = a_y + b_y,\\; c_z = a_z + b_z',
    variables: [
      v('c', 'resultatvektor', undefined, '\\vec{c}'),
      v('a', 'første vektor', undefined, '\\vec{a}'),
      v('b', 'anden vektor', undefined, '\\vec{b}'),
    ],
    assumptions: ['Grafisk: hale-til-spids.'],
    keywords: ['addition', 'sum', 'komponenter', 'hale spids'],
    sources: [s('lektion-02', 6)],
    relatedFormulaIds: ['relative-velocity'],
  }),
  vectorFormula({
    id: 'vector-subtraction',
    name: 'Vektorsubtraktion',
    topic: 'Grundlæggende',
    equation: 'a - b = a + (-b)',
    latex: '\\vec{a} - \\vec{b} = \\vec{a} + (-\\vec{b})',
    variables: [
      v('a', 'vektor a', undefined, '\\vec{a}'),
      v('b', 'vektor b', undefined, '\\vec{b}'),
    ],
    assumptions: ['Vend b 180° og addér grafisk.'],
    keywords: ['subtraktion', 'forskel'],
    sources: [s('lektion-02', 7)],
    relatedFormulaIds: ['vector-addition'],
  }),
  vectorFormula({
    id: 'dot-product-components',
    name: 'Skalarprodukt (komponenter)',
    topic: 'Prikprodukt',
    equation: 'a · b = ax bx + ay by + az bz',
    latex: '\\vec{a} \\cdot \\vec{b} = a_x b_x + a_y b_y + a_z b_z',
    variables: [
      v('a·b', 'skalarprodukt', 'varierer', '\\vec{a}\\cdot\\vec{b}'),
      v('a_x', 'a x-komponent', undefined, 'a_x'),
      v('b_x', 'b x-komponent', undefined, 'b_x'),
    ],
    assumptions: ['Resultatet er en skalar (tal), ikke en vektor.'],
    keywords: ['prikprodukt', 'skalarprodukt', 'dot', 'komponenter'],
    sources: [s('lektion-02', 8), s('lektion-05', 9)],
    relatedFormulaIds: ['dot-product-angle', 'angle-between-vectors', 'work-dot-product'],
  }),
  vectorFormula({
    id: 'dot-product-angle',
    name: 'Skalarprodukt (vinkel)',
    topic: 'Prikprodukt',
    equation: 'a · b = |a| |b| cos(theta)',
    latex: '\\vec{a} \\cdot \\vec{b} = |\\vec{a}|\\,|\\vec{b}|\\,\\cos\\theta',
    variables: [
      v('a·b', 'skalarprodukt', undefined, '\\vec{a}\\cdot\\vec{b}'),
      v('|a|', 'længde af a', undefined, '|\\vec{a}|'),
      v('|b|', 'længde af b', undefined, '|\\vec{b}|'),
      v('θ', 'vinkel mellem vektorer', 'rad', '\\theta'),
    ],
    assumptions: ['θ er vinklen mellem vektorernes retninger (0–180°).'],
    keywords: ['prikprodukt', 'cos', 'vinkel', 'arbejde'],
    sources: [s('lektion-02', 8), s('lektion-05', 6)],
    relatedFormulaIds: ['dot-product-components', 'angle-between-vectors'],
  }),
  vectorFormula({
    id: 'angle-between-vectors',
    name: 'Vinkel mellem to vektorer',
    topic: 'Prikprodukt',
    equation: 'cos(theta) = (a · b) / (|a| |b|)',
    latex: '\\cos\\theta = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|\\,|\\vec{b}|}',
    variables: [
      v('θ', 'vinkel mellem vektorer', 'rad eller °', '\\theta'),
      v('a·b', 'skalarprodukt', undefined, '\\vec{a}\\cdot\\vec{b}'),
      v('|a|', 'længde af a', undefined, '|\\vec{a}|'),
      v('|b|', 'længde af b', undefined, '|\\vec{b}|'),
    ],
    assumptions: ['Brug cos⁻¹ kun når du har beregnet skalarprodukt og længder; tjek at |cos θ| ≤ 1.'],
    keywords: ['vinkel', 'mellem', 'vektorer', 'cos', 'prikprodukt'],
    sources: [s('lektion-02', 8), s('lektion-05', 11)],
    relatedFormulaIds: ['dot-product-components', 'dot-product-angle', 'vector-magnitude'],
  }),
  vectorFormula({
    id: 'vector-projection',
    name: 'Projektion af a på b',
    topic: 'Prikprodukt',
    equation: 'a_parallel = (a · b / |b|^2) b',
    latex: '\\vec{a}_{\\parallel} = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|^{2}}\\,\\vec{b}',
    variables: [
      v('a∥', 'projektion af a på b', undefined, '\\vec{a}_{\\parallel}'),
      v('a·b', 'skalarprodukt', undefined, '\\vec{a}\\cdot\\vec{b}'),
      v('|b|', 'længde af b', undefined, '|\\vec{b}|'),
    ],
    assumptions: ['|b| ≠ 0. Størrelsen af projektionen er |a| cos θ.'],
    keywords: ['projektion', 'komponent', 'parallel'],
    sources: [s('lektion-05', 11)],
    relatedFormulaIds: ['dot-product-angle', 'work-dot-product'],
  }),
  vectorFormula({
    id: 'cross-product-magnitude',
    name: 'Krydsprodukt (størrelse)',
    topic: 'Krydsprodukt',
    equation: '|a x b| = |a| |b| sin(theta)',
    latex: '|\\vec{a}\\times\\vec{b}| = |\\vec{a}|\\,|\\vec{b}|\\,\\sin\\theta',
    variables: [
      v('|a×b|', 'størrelse af krydsprodukt', undefined, '|\\vec{a}\\times\\vec{b}|'),
      v('|a|', 'længde af a', undefined, '|\\vec{a}|'),
      v('|b|', 'længde af b', undefined, '|\\vec{b}|'),
      v('θ', 'vinkel mellem vektorer', 'rad', '\\theta'),
    ],
    assumptions: ['Resultatet er arealet af parallelogrammet udspændt af a og b.'],
    keywords: ['krydsprodukt', 'sin', 'areal', 'momentarm'],
    sources: [s('lektion-02', 8), s('lektion-09', 6)],
    relatedFormulaIds: ['cross-product-2d', 'torque-cross-product'],
  }),
  vectorFormula({
    id: 'cross-product-2d',
    name: 'Krydsprodukt i 2D (z-komponent)',
    topic: 'Krydsprodukt',
    equation: '(a x b)_z = ax by - ay bx',
    latex: '(\\vec{a}\\times\\vec{b})_z = a_x b_y - a_y b_x',
    variables: [
      v('(a×b)_z', 'z-komponent af krydsprodukt', undefined, '(\\vec{a}\\times\\vec{b})_z'),
      v('a_x', 'a x-komponent', undefined, 'a_x'),
      v('b_y', 'b y-komponent', undefined, 'b_y'),
    ],
    assumptions: ['I 2D er krydsproduktet en skalar (z-led) — fortegn giver rotationsretning.'],
    keywords: ['krydsprodukt', '2d', 'z', 'determinant'],
    sources: [s('lektion-02', 8)],
    relatedFormulaIds: ['cross-product-magnitude', 'cross-product-cartesian'],
  }),
  vectorFormula({
    id: 'cross-product-cartesian',
    name: 'Krydsprodukt (kartesisk)',
    topic: 'Krydsprodukt',
    equation: 'a x b = (ay bz - az by, az bx - ax bz, ax by - ay bx)',
    latex:
      '\\vec{a}\\times\\vec{b} = \\bigl(a_y b_z - a_z b_y,\\; a_z b_x - a_x b_z,\\; a_x b_y - a_y b_x\\bigr)',
    variables: [
      v('a×b', 'krydsprodukt (vektor)', undefined, '\\vec{a}\\times\\vec{b}'),
      v('a', 'vektor a', undefined, '\\vec{a}'),
      v('b', 'vektor b', undefined, '\\vec{b}'),
    ],
    assumptions: ['Resultatet er vinkelret på både a og b; brug højrehåndsreglen til retning.'],
    keywords: ['krydsprodukt', 'kartesisk', 'determinant', 'i j k'],
    sources: [s('lektion-02', 9), s('lektion-09', 6)],
    relatedFormulaIds: ['cross-product-magnitude', 'cross-product-2d', 'torque-cross-product'],
  }),
  vectorFormula({
    id: 'work-dot-product',
    name: 'Arbejde som skalarprodukt',
    topic: 'Anvendelse',
    equation: 'W = F · r = Fx rx + Fy ry + Fz rz',
    latex: 'W = \\vec{F}\\cdot\\vec{r} = F_x r_x + F_y r_y + F_z r_z',
    variables: [
      v('W', 'arbejde', 'J', 'W'),
      v('F', 'kraft', 'N', '\\vec{F}'),
      v('r', 'forskydning', 'm', '\\vec{r}'),
    ],
    assumptions: ['Gælder for vilkårlige retninger; svarer til W = F d cos θ når |r| = d.'],
    keywords: ['arbejde', 'prikprodukt', 'kraft', 'forskydning'],
    sources: [s('lektion-05', 9), s('lektion-05', 11)],
    relatedFormulaIds: ['dot-product-components', 'work-constant-force', 'vector-projection'],
  }),
  vectorFormula({
    id: 'torque-cross-product',
    name: 'Kraftmoment som krydsprodukt',
    topic: 'Anvendelse',
    equation: 'tau = r x F,  |tau| = r F sin(theta)',
    latex: '\\vec{\\tau} = \\vec{r}\\times\\vec{F}, \\qquad |\\vec{\\tau}| = r\\,F\\,\\sin\\theta',
    variables: [
      v('τ', 'kraftmoment', 'N m', '\\vec{\\tau}'),
      v('r', 'positionsvektor til angrebspunkt', 'm', '\\vec{r}'),
      v('F', 'kraft', 'N', '\\vec{F}'),
      v('θ', 'vinkel mellem r og F', 'rad', '\\theta'),
    ],
    assumptions: ['θ er vinklen mellem r og F; retning med højrehåndsreglen.'],
    keywords: ['moment', 'kraftmoment', 'krydsprodukt', 'drejning'],
    sources: [s('lektion-09', 8), s('lektion-08', 15)],
    relatedFormulaIds: ['cross-product-magnitude', 'torque', 'cross-product-cartesian'],
  }),
  vectorFormula({
    id: 'power-dot-product',
    name: 'Effekt som skalarprodukt',
    topic: 'Anvendelse',
    equation: 'P = F · v',
    latex: 'P = \\vec{F}\\cdot\\vec{v}',
    variables: [
      v('P', 'effekt', 'W', 'P'),
      v('F', 'kraft', 'N', '\\vec{F}'),
      v('v', 'hastighed', 'm/s', '\\vec{v}'),
    ],
    assumptions: ['Kraft og hastighed skal være vektorer i samme rum.'],
    keywords: ['effekt', 'prikprodukt', 'kraft', 'hastighed'],
    sources: [s('lektion-05', 23)],
    relatedFormulaIds: ['work-dot-product', 'power'],
  }),
];
