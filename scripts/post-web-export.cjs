'use strict';
/**
 * GitHub Pages: Jekyll yok; SPA icin dist/index.html -> dist/404.html
 * PWA / tarayici onbellegi: tum HTML'lere no-cache meta + kok manifest.json
 * (start_url her build'de ?build=... degisir; ana ekran kisayolu guncellemesi kolaylasir)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const indexHtml = path.join(dist, 'index.html');
const nojekyll = path.join(dist, '.nojekyll');

function readAppConfig() {
  const raw = fs.readFileSync(path.join(root, 'app.json'), 'utf8');
  return JSON.parse(raw);
}

/** /3D-MODELLER/ -> /3D-MODELLER */
function normalizeBaseUrl(base) {
  if (!base || typeof base !== 'string') return '';
  let s = base.trim();
  if (!s.startsWith('/')) s = `/${s}`;
  return s.replace(/\/+$/, '') || '';
}

function walkHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkHtmlFiles(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function injectHead(html, manifestUrl) {
  const marker = '<!--pwe-->';
  if (html.includes(marker)) return html;
  const inject = `${marker}<meta http-equiv="Cache-Control" content="max-age=0, must-revalidate, no-cache"/><meta http-equiv="Pragma" content="no-cache"/><link rel="manifest" href="${manifestUrl}"/>`;
  return html.replace(/<head>/i, (m) => `${m}${inject}`);
}

function writeManifest(distDir, { basePath, buildId, expo }) {
  const web = expo.web || {};
  const name = web.name || expo.name || 'App';
  const shortName = web.shortName || name;
  const theme = web.themeColor || '#000000';
  const bg = web.backgroundColor || '#ffffff';
  const display = web.display || 'standalone';
  const manifest = {
    name,
    short_name: shortName,
    lang: web.lang || 'tr',
    start_url: `${basePath}/?build=${encodeURIComponent(buildId)}`,
    scope: `${basePath}/`,
    display,
    orientation: web.orientation || 'portrait',
    background_color: bg,
    theme_color: theme,
    icons: [
      {
        src: `${basePath}/favicon.ico`,
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 0), 'utf8');
}

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(nojekyll, '');

if (!fs.existsSync(indexHtml)) {
  console.error('post-web-export: dist/index.html yok (once expo export calisti mi?)');
  process.exit(1);
}

const appConfig = readAppConfig();
const expo = appConfig.expo || {};
const basePath = normalizeBaseUrl(expo.experiments?.baseUrl);
if (!basePath) {
  console.error('post-web-export: app.json experiments.baseUrl tanimli degil');
  process.exit(1);
}

const buildId =
  process.env.GITHUB_RUN_NUMBER ||
  (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 12) : null) ||
  String(Date.now());

const manifestUrl = `${basePath}/manifest.json`;
writeManifest(dist, { basePath, buildId, expo });

let patched = 0;
for (const file of walkHtmlFiles(dist)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = injectHead(before, manifestUrl);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    patched += 1;
  }
}

fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
console.log(
  `post-web-export: .nojekyll, 404.html, manifest.json (build=${buildId}), ${patched} html yama`,
);
