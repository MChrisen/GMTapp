import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const destRoot = resolve(root, 'public/pdfs');

const sources = [
  { dir: 'Lektioner', label: 'lektioner' },
  { dir: 'Tidligere Eksamensæt', label: 'eksamensæt' },
];

let copied = 0;
let foundSourceDir = false;

const countPdfFiles = (dir) => {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      total += countPdfFiles(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) total += 1;
  }
  return total;
};

for (const { dir, label } of sources) {
  const from = resolve(root, dir);
  const to = resolve(destRoot, dir);
  if (!existsSync(from)) {
    console.log(`[sync-pdfs] kilde ikke fundet: ${dir} (beholder eksisterende filer i public/pdfs)`);
    continue;
  }
  foundSourceDir = true;
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (!name.toLowerCase().endsWith('.pdf')) continue;
    cpSync(resolve(from, name), resolve(to, name));
    copied += 1;
  }
  console.log(`[sync-pdfs] ${label}: ${readdirSync(to).filter((n) => n.toLowerCase().endsWith('.pdf')).length} PDF-filer`);
}

const available = countPdfFiles(destRoot);

if (available === 0) {
  throw new Error('[sync-pdfs] Ingen PDF-filer tilgængelige i public/pdfs. Release/build stoppet.');
}

if (!foundSourceDir) {
  console.log(`[sync-pdfs] bruger eksisterende PDF-sæt i public/pdfs (${available} filer)`);
} else if (copied === 0) {
  console.log(`[sync-pdfs] ingen nye filer kopieret, men public/pdfs indeholder ${available} filer`);
} else {
  console.log(`[sync-pdfs] OK ${copied} filer kopieret · ${available} PDF-filer tilgængelige i public/pdfs/`);
}
