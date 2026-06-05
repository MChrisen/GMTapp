#!/usr/bin/env node
/**
 * Fallback-start: `node scripts/start-desktop.mjs` eller `npm start`
 * (hvis Start GMT.app blokeres af macOS).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logPath = path.join(root, '.gmt-launch.log');

function log(line) {
  console.log(line);
}

async function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  const electronBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
  if (!existsSync(path.join(root, 'node_modules', 'electron'))) {
    log('Installerer afhængigheder…');
    await run('npm', ['install', '--no-fund', '--no-audit']);
  }
  if (!existsSync(path.join(root, 'dist', 'index.html'))) {
    log('Bygger appen…');
    await run('npm', ['run', 'build']);
  }
  const child = spawn(electronBin, ['.'], { cwd: root, stdio: 'inherit', env: process.env });
  child.on('error', (err) => {
    console.error(err);
    console.error(`Se også ${logPath}`);
    process.exit(1);
  });
  child.on('close', (code) => process.exit(code ?? 0));
} catch (err) {
  console.error(err);
  process.exit(1);
}
