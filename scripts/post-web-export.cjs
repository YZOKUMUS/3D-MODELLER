'use strict';
/**
 * GitHub Pages: Jekyll yok; SPA icin bilinmeyen yollarda index.html gibi davranir.
 * Expo export sonrasi dist/index.html -> dist/404.html
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const indexHtml = path.join(dist, 'index.html');
const nojekyll = path.join(dist, '.nojekyll');

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(nojekyll, '');

if (!fs.existsSync(indexHtml)) {
  console.error('post-web-export: dist/index.html yok (once expo export calisti mi?)');
  process.exit(1);
}

fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
console.log('post-web-export: dist/.nojekyll + dist/404.html tamam');
