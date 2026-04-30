const NOISE_PATTERNS: RegExp[] = [
  /<\/?latexit[^>]*>/gi,
  /sha1_base64="[^"]+"/g,
  /AAA[A-Za-z0-9+/=]{40,}/g,
  /\b[A-Z0-9+/=]{60,}\b/g,
];

const TRIM_PATTERNS: RegExp[] = [
  /Thomas Tauris/gi,
  /AAU\s*F\d{4}/gi,
  /\bGMT\s*-\s*AAU\b/gi,
  /Question \d+/gi,
  /Answer saved/gi,
  /Marked out of [\d.,]+/gi,
  /Flag question/gi,
  /Select one:?/gi,
  /Clear my choice/gi,
  /Tid tilbage/gi,
  /Jump to\.\.\./gi,
  /Spring til\.\.\./gi,
  /Next page|Previous page/gi,
  /Contact ITS Support/gi,
  /Tel:\s*\+\d[\d\s]*/gi,
  /AAU Moodle/gi,
  /\(side \d+ af \d+\)/gi,
  /\(page \d+ of \d+\)/gi,
  /Dashboard\s*\/[^\n]+/gi,
];

export function cleanSnippet(text: string, maxLength = 240): string {
  let cleaned = text;
  for (const pattern of NOISE_PATTERNS) cleaned = cleaned.replace(pattern, ' ');
  for (const pattern of TRIM_PATTERNS) cleaned = cleaned.replace(pattern, ' ');
  cleaned = cleaned.replace(/Grundlæggendemekanikogtermodynamik/gi, 'Grundlæggende mekanik og termodynamik');
  cleaned = cleaned.replace(/([a-zæøå]{6,})(og)([a-zæøå]{6,})/gi, '$1 og $3');
  cleaned = cleaned.replace(/([a-zæøå])([A-ZÆØÅ])/g, '$1 $2');
  cleaned = cleaned.replace(/[•●·]+/g, ' · ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  const cut = cleaned.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 80 ? cut.slice(0, lastSpace) : cut}…`;
}

export function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1);
  if (!words.length) return text;
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.replace(re, '⟦$1⟧');
}
