'use strict';
/**
 * dist/ ciktisini docs/ altina kopyalar (GitHub Pages: branch main, folder /docs).
 * Once: npm run export:web
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const docs = path.join(root, 'docs');

function rmRecursive(p) {
  if (!fs.existsSync(p)) return;
  for (const name of fs.readdirSync(p)) {
    const full = path.join(p, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) rmRecursive(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(p);
}

function cpRecursive(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      cpRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(dist) || !fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('Once calistir: npm run export:web');
  process.exit(1);
}

rmRecursive(docs);
cpRecursive(dist, docs);
console.log('Tamam: docs/ guncellendi. Sonra: git add docs && git commit -m "docs: web" && git push');
