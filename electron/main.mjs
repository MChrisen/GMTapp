import { app, BrowserWindow, net, protocol, shell } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(moduleDir, '..');
const distDir = path.join(rootDir, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const APP_SCHEME = 'gmt';

const isPdfUrl = (url) => /\.pdf(?:[#?]|$)/i.test(url);

function resolveDistFile(requestUrl) {
  const { pathname } = new URL(requestUrl);
  let relative = decodeURIComponent(pathname);
  if (relative === '/' || relative === '') relative = '/index.html';
  const filePath = path.normalize(path.join(distDir, relative.replace(/^\//, '')));
  const rel = path.relative(distDir, filePath);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return filePath;
}

function openPdf(url) {
  const base = url.split('#')[0];
  const hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
  let filePath = null;

  if (base.startsWith(`${APP_SCHEME}://`)) {
    filePath = resolveDistFile(base);
  } else if (base.startsWith('file://')) {
    filePath = fileURLToPath(base);
  } else {
    filePath = path.normalize(path.join(distDir, base.replace(/^\//, '')));
  }

  const rel = filePath ? path.relative(distDir, filePath) : '..';
  if (!filePath || rel.startsWith('..') || path.isAbsolute(rel) || !existsSync(filePath)) {
    return Promise.resolve();
  }
  return shell.openExternal(`${pathToFileURL(filePath).href}${hash}`);
}

let mainWindow = null;

function registerAppProtocol() {
  protocol.handle(APP_SCHEME, (request) => {
    const filePath = resolveDistFile(request.url);
    if (!filePath || !existsSync(filePath)) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createWindow() {
  if (!existsSync(indexHtml)) {
    console.error('[gmt] dist/index.html mangler. Kør: npm run build');
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'GMT Eksamenhjælp',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('[gmt] did-fail-load', code, description, url);
  });

  void mainWindow.loadURL(`${APP_SCHEME}://app/index.html`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isPdfUrl(url)) {
      void openPdf(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_SCHEME}://`)) {
      event.preventDefault();
      return;
    }
    if (isPdfUrl(url)) {
      event.preventDefault();
      void openPdf(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    registerAppProtocol();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
