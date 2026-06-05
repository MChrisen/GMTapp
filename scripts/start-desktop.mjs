#!/usr/bin/env node
/**
 * npm start — starter desktop uden Start GMT.app
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hasDist = existsSync(path.join(root, 'dist', 'index.html'));
const electronPkg = path.join(root, 'node_modules', 'electron');
const electronBin = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron.cmd' : 'electron',
);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, NPM_CONFIG_UPDATE_NOTIFIER: 'false' },
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  if (!existsSync(electronPkg)) {
    console.log('Installerer afhængigheder…');
    if (existsSync(path.join(root, 'package-lock.json'))) {
      await run('npm', hasDist ? ['ci', '--omit=dev', '--no-fund', '--no-audit'] : ['ci', '--no-fund', '--no-audit']);
    } else {
      await run('npm', ['install', '--no-fund', '--no-audit']);
    }
  }
  if (!hasDist) {
    console.log('Bygger appen…');
    await run('npm', ['run', 'build']);
  }
  const child = spawn(electronBin, ['.'], { cwd: root, stdio: 'inherit' });
  child.on('close', (code) => process.exit(code ?? 0));
} catch (err) {
  console.error(err);
  console.error(`Log: ${path.join(root, '.gmt-launch.log')}`);
  process.exit(1);
}
