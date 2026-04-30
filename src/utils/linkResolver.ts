import type { SourceRef } from '../data/types';
import { getPdfSource, pdfHref } from '../data/pdfManifest';
import { pdfCorpus } from '../data/pdfCorpus';

const corpusBySourceId = new Map(pdfCorpus.map((source) => [source.sourceId, source]));

const tokenize = (text: string): string[] =>
  Array.from(
    new Set(
      text
        .toLocaleLowerCase('da-DK')
        .split(/[^\p{L}\p{N}_]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
    ),
  );

const scorePageForTerms = (pageText: string, pageKeywords: string[], terms: string[]): number => {
  if (!terms.length) return 0;
  const text = pageText.toLocaleLowerCase('da-DK');
  const keywordSet = new Set(pageKeywords.map((keyword) => keyword.toLocaleLowerCase('da-DK')));
  return terms.reduce((sum, term) => {
    let score = 0;
    if (text.includes(term)) score += 1.5 + Math.min(1, term.length / 10);
    if (keywordSet.has(term)) score += 2;
    return sum + score;
  }, 0);
};

const resolveSourcePage = (ref: SourceRef): number => {
  const sourceMeta = getPdfSource(ref.sourceId);
  const corpus = corpusBySourceId.get(ref.sourceId);
  if (!sourceMeta || !corpus) return ref.page;
  if (sourceMeta.kind !== 'exam') return ref.page;
  if (!ref.label) return ref.page;

  const terms = tokenize(ref.label);
  if (!terms.length) return ref.page;

  const currentPageEntry = corpus.pages.find((page) => page.page === ref.page);
  const currentScore = currentPageEntry ? scorePageForTerms(currentPageEntry.text, currentPageEntry.keywords, terms) : -1;

  let bestPage = ref.page;
  let bestScore = currentScore;
  for (const page of corpus.pages) {
    const score = scorePageForTerms(page.text, page.keywords, terms);
    if (score > bestScore) {
      bestScore = score;
      bestPage = page.page;
    }
  }

  // Use auto-correct only when we have a clear better match.
  if (bestPage !== ref.page && bestScore >= Math.max(2.5, currentScore + 1.5)) {
    return bestPage;
  }
  return ref.page;
};

export const sourceLabel = (ref: SourceRef) => {
  const source = getPdfSource(ref.sourceId);
  const page = resolveSourcePage(ref);
  return `${source?.shortTitle ?? ref.sourceId} p.${page}${ref.label ? ` · ${ref.label}` : ''}`;
};

export const sourceUrl = (ref: SourceRef) => pdfHref(ref.sourceId, resolveSourcePage(ref));
