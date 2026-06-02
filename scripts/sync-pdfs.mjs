import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const destRoot = resolve(root, 'public/pdfs');

const sources = [
  { dir: 'Lektioner', label: 'lektioner' },
  { dir: 'Tidligere Eksamensæt', label: 'eksamensæt' },
];

let copied = 0;

for (const { dir, label } of sources) {
  const from = resolve(root, dir);
  const to = resolve(destRoot, dir);
  if (!existsSync(from)) {
    console.warn(`[sync-pdfs] springer over — mappen findes ikke: ${dir}`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (!name.toLowerCase().endsWith('.pdf')) continue;
    cpSync(resolve(from, name), resolve(to, name));
    copied += 1;
  }
  console.log(`[sync-pdfs] ${label}: ${readdirSync(to).filter((n) => n.endsWith('.pdf')).length} PDF-filer`);
}

if (copied === 0) {
  console.warn('[sync-pdfs] ingen PDF-filer kopieret — tjek at Lektioner/ og Tidligere Eksamensæt/ findes');
} else {
  console.log(`[sync-pdfs] OK ${copied} filer til public/pdfs/`);
}
