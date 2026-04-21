'use strict';
/**
 * Bir kategoriyi data/catalog.ts içinden kaldırır:
 * - ModelCategory union'ından siler
 * - CATEGORIES dizisinden siler
 * - category: '<ad>' kullanan modelleri başka kategoriye taşır (varsayılan: 'Diğer')
 *
 * Kullanım:
 *   node scripts/remove-category.cjs "Aksesuar" "Diğer"
 *   node scripts/remove-category.cjs "Aksesuar"
 */
const fs = require('fs');
const path = require('path');

const CATALOG_TS = path.join(__dirname, '..', 'data', 'catalog.ts');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const target = (process.argv[2] || '').trim();
  const reassign = ((process.argv[3] || '') || 'Diğer').trim() || 'Diğer';

  if (!target) {
    fail(
      'Kullanım: node scripts/remove-category.cjs "Kategori" ["YeniKategori"]\n' +
        'Örnek: node scripts/remove-category.cjs Aksesuar Diğer'
    );
  }
  if (target === reassign) {
    fail('Silinecek kategori ile taşınacak kategori aynı olamaz.');
  }
  for (const s of [target, reassign]) {
    if (s.includes("'") || s.includes('\\')) {
      fail('Kategori adında tek tırnak veya ters eğik çizgi kullanılamaz.');
    }
    if (s.includes('|')) {
      fail('Kategori adında | kullanılamaz.');
    }
  }

  let src = fs.readFileSync(CATALOG_TS, 'utf8').replace(/\r\n/g, '\n');

  const typeLine = src.match(/^export type ModelCategory = (.+);$/m);
  if (!typeLine) fail('catalog.ts: ModelCategory satırı bulunamadı.');

  const unionBody = typeLine[1].trim();
  if (!unionBody.includes(`'${target}'`)) {
    fail(`ModelCategory içinde kategori yok: ${target}`);
  }
  if (!unionBody.includes(`'${reassign}'`)) {
    fail(`Tasima kategorisi ModelCategory içinde yok: ${reassign}`);
  }

  // 1) ModelCategory union'ından kaldır
  const pieces = unionBody
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p !== `'${target}'`);
  if (pieces.length === 0) {
    fail('ModelCategory boş olamaz.');
  }
  src = src.replace(
    /^export type ModelCategory = (.+);$/m,
    `export type ModelCategory = ${pieces.join(' | ')};`
  );

  // 2) CATEGORIES dizisinden kaldır (satır bazlı)
  const catMarker = 'export const CATEGORIES: ModelCategory[] = [\n';
  const catStart = src.indexOf(catMarker);
  if (catStart === -1) fail('catalog.ts: CATEGORIES dizisi bulunamadı.');
  const afterBracket = catStart + catMarker.length;
  const catalogDecl = '\nexport const CATALOG';
  const catalogPos = src.indexOf(catalogDecl, afterBracket);
  if (catalogPos === -1) fail('catalog.ts: CATALOG bildirimi bulunamadı.');
  const block = src.slice(afterBracket, catalogPos);
  const lines = block.split('\n');
  const beforeLen = lines.length;
  const removedLines = lines.filter((ln) => ln.includes(`'${target}'`)).length;
  const filtered = lines.filter((ln) => !ln.includes(`'${target}'`));
  if (removedLines === 0) {
    // CATEGORIES içinde olmayabilir ama yine de devam edelim (tipten kaldırdık)
  }
  src = src.slice(0, afterBracket) + filtered.join('\n') + src.slice(catalogPos);

  // 3) Model kayıtlarını taşı
  const re = new RegExp(`(\\bcategory:\\s*)'${escRe(target)}'(\\s*,)`, 'g');
  let movedCount = 0;
  src = src.replace(re, (_m, p1, p2) => {
    movedCount += 1;
    return `${p1}'${reassign}'${p2}`;
  });

  fs.writeFileSync(CATALOG_TS, src, 'utf8');
  console.log('Tamam:', target);
  console.log(`- ModelCategory icinden kaldirildi.`);
  console.log(`- CATEGORIES icinden kaldirildi (satir: ${removedLines}).`);
  console.log(`- Modeller tasindi: ${movedCount} adet (${target} -> ${reassign}).`);
}

main();

