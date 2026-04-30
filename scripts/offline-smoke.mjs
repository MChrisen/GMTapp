import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const required = ['dist/index.html', 'dist/manifest.webmanifest', 'dist/sw.js'];

for (const path of required) {
  if (!existsSync(resolve(root, path))) {
    console.error(`[offline:smoke] Missing required artifact: ${path}`);
    process.exit(1);
  }
}

const indexHtml = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
if (!indexHtml.includes('assets/index-')) {
  console.error('[offline:smoke] index.html does not reference hashed bundle assets');
  process.exit(1);
}

const assets = readdirSync(resolve(root, 'dist/assets'));
const hasJs = assets.some((name) => name.endsWith('.js'));
const hasCss = assets.some((name) => name.endsWith('.css'));
if (!hasJs || !hasCss) {
  console.error('[offline:smoke] dist/assets missing js or css bundles');
  process.exit(1);
}

console.log(`[offline:smoke] OK assets=${assets.length}`);
