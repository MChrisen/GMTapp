export type PdfKind = 'lecture' | 'exam';

export type PdfSource = {
  id: string;
  kind: PdfKind;
  title: string;
  shortTitle: string;
  path: string;
  year?: number;
  lecture?: number;
  topic: string;
  notes?: string;
};

export const pdfSources: PdfSource[] = [
  {
    id: 'lektion-01',
    kind: 'lecture',
    title: 'Lektion 1 - Introduktion og kursusoverblik',
    shortTitle: 'L1',
    path: 'pdfs/Lektioner/Lektion_1_compressed .pdf',
    lecture: 1,
    topic: 'Intro, pensum, notation og grundbegreber',
    notes: 'Filen har et mellemrum før .pdf i filnavnet.',
  },
  {
    id: 'lektion-02',
    kind: 'lecture',
    title: 'Lektion 2 - Bevægelse i 2D og 3D',
    shortTitle: 'L2',
    path: 'pdfs/Lektioner/Lektion_2_compressed.pdf',
    lecture: 2,
    topic: 'Vektorer, hastighed, acceleration og projektilbevægelse',
  },
  {
    id: 'lektion-03',
    kind: 'lecture',
    title: 'Lektion 3 - Kraft og bevægelse',
    shortTitle: 'L3',
    path: 'pdfs/Lektioner/Lektion_3_compressed.pdf',
    lecture: 3,
    topic: 'Newtons love, kraftdiagrammer og cirkulær bevægelse',
  },
  {
    id: 'lektion-04',
    kind: 'lecture',
    title: 'Lektion 4 - Anvendelse af Newtons love',
    shortTitle: 'L4',
    path: 'pdfs/Lektioner/Lektion_4_compressed.pdf',
    lecture: 4,
    topic: 'Friktion, skråplan, snore, trisser og kontaktkræfter',
  },
  {
    id: 'lektion-05',
    kind: 'lecture',
    title: 'Lektion 5 - Arbejde, energi og effekt',
    shortTitle: 'L5',
    path: 'pdfs/Lektioner/Lektion_5_compressed.pdf',
    lecture: 5,
    topic: 'Arbejde, kinetisk energi, potentiel energi og effekt',
  },
  {
    id: 'lektion-06',
    kind: 'lecture',
    title: 'Lektion 6 - Energibevarelse',
    shortTitle: 'L6',
    path: 'pdfs/Lektioner/Lektion_6_compressed.pdf',
    lecture: 6,
    topic: 'Konservative kræfter, mekanisk energi og ikke-konservative bidrag',
  },
  {
    id: 'lektion-07',
    kind: 'lecture',
    title: 'Lektion 7 - Impuls, stød og massemidtpunkt',
    shortTitle: 'L7',
    path: 'pdfs/Lektioner/Lektion_7_compressed.pdf',
    lecture: 7,
    topic: 'Impuls, bevægelsesmængde, stød og center of mass',
  },
  {
    id: 'lektion-08',
    kind: 'lecture',
    title: 'Lektion 8 - Rotation',
    shortTitle: 'L8',
    path: 'pdfs/Lektioner/Lektion_8_compressed.pdf',
    lecture: 8,
    topic: 'Vinkelkinematik, inertimoment, drejningsmoment og rotationsenergi',
  },
  {
    id: 'lektion-09',
    kind: 'lecture',
    title: 'Lektion 9 - Impulsmoment og statik',
    shortTitle: 'L9',
    path: 'pdfs/Lektioner/Lektion_9_compressed.pdf',
    lecture: 9,
    topic: 'Angular momentum, ligevægt, statik og momentarme',
  },
  {
    id: 'lektion-10',
    kind: 'lecture',
    title: 'Lektion 10 - Varme og temperatur',
    shortTitle: 'L10',
    path: 'pdfs/Lektioner/Lektion_10_compressed.pdf',
    lecture: 10,
    topic: 'Temperatur, termisk ligevægt, varme, varmekapacitet og faseovergange',
  },
  {
    id: 'lektion-11',
    kind: 'lecture',
    title: 'Lektion 11 - Idealgas',
    shortTitle: 'L11',
    path: 'pdfs/Lektioner/Lektion_11_compressed.pdf',
    lecture: 11,
    topic: 'Idealgasloven, molekyler, tryk, temperatur og kinetisk teori',
  },
  {
    id: 'lektion-12',
    kind: 'lecture',
    title: 'Lektion 12 - Termodynamikkens 1. hovedsætning',
    shortTitle: 'L12',
    path: 'pdfs/Lektioner/Lektion_12_compressed.pdf',
    lecture: 12,
    topic: 'Indre energi, arbejde, varme, pV-diagrammer og processer',
  },
  {
    id: 'lektion-13',
    kind: 'lecture',
    title: 'Lektion 13 - Termodynamikkens 2. hovedsætning',
    shortTitle: 'L13',
    path: 'pdfs/Lektioner/Lektion_13_compressed.pdf',
    lecture: 13,
    topic: 'Reversibilitet, varmekraftmaskiner, Carnot, COP, entropi og nyttevirkning',
  },
  {
    id: 'exam-2023',
    kind: 'exam',
    title: 'GMT eksamen juni 2023 - løsninger',
    shortTitle: '2023',
    path: 'pdfs/Tidligere Eksamensæt/GMT_eksamen_juni-2023_løsninger.pdf',
    year: 2023,
    topic: 'Tidligere eksamenssæt med løsningsforsøg',
  },
  {
    id: 'exam-2024',
    kind: 'exam',
    title: 'GMT eksamen juni 2024 - løsninger',
    shortTitle: '2024',
    path: 'pdfs/Tidligere Eksamensæt/GMT-eksamen-juni-2024-løsninger.pdf',
    year: 2024,
    topic: 'Tidligere eksamenssæt med løsningsforsøg',
  },
  {
    id: 'exam-2025',
    kind: 'exam',
    title: 'GMT eksamen juni 2025 - løsninger',
    shortTitle: '2025',
    path: 'pdfs/Tidligere Eksamensæt/GMT_eksamen_juni-2025_løsninger.pdf',
    year: 2025,
    topic: 'Tidligere eksamenssæt med løsningsforsøg',
    notes: 'Indeholder en rettelsesnote i termodynamikdelen.',
  },
];

export const getPdfSource = (id: string) => pdfSources.find((source) => source.id === id);

export const pdfHref = (sourceId: string, page?: number) => {
  const source = getPdfSource(sourceId);
  if (!source) return '#';
  const hash = page ? `#page=${page}` : '';
  return `${encodeURI(source.path)}${hash}`;
};

/** Parse a relative PDF href from the app into source id + page (for in-app viewer). */
export const resolvePdfOpenTarget = (href: string): { sourceId: string; page: number } | null => {
  const pageMatch = href.match(/#page=(\d+)/i);
  const page = pageMatch ? Math.max(1, Number(pageMatch[1])) : 1;
  const pathPart = decodeURIComponent(href.split('#')[0]!.replace(/^\//, ''));
  const source = pdfSources.find(
    (entry) => pathPart === entry.path || pathPart.endsWith(entry.path) || encodeURI(entry.path) === pathPart,
  );
  if (!source) return null;
  return { sourceId: source.id, page };
};
