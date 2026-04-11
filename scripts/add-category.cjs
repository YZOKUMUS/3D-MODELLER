'use strict';
/**
 * Yeni ModelCategory + CATEGORIES girdisi ekler (data/catalog.ts).
 * Kullanım: node scripts/add-category.cjs "Kategori Adı"
 */
const fs = require('fs');
const path = require('path');

const CATALOG_TS = path.join(__dirname, '..', 'data', 'catalog.ts');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function main() {
  const raw = (process.argv[2] || '').trim();
  if (!raw) {
    fail(
      'Kullanım: node scripts/add-category.cjs "Kategori Adı"\n' +
        'Örnek: node scripts/add-category.cjs Müzik'
    );
  }
  if (raw.includes("'") || raw.includes('\\')) {
    fail('Kategori adında tek tırnak veya ters eğik çizgi kullanılamaz.');
  }
  if (raw.includes('|')) {
    fail('Kategori adında | kullanılamaz.');
  }

  let src = fs.readFileSync(CATALOG_TS, 'utf8').replace(/\r\n/g, '\n');

  const typeLine = src.match(/^export type ModelCategory = (.+);$/m);
  if (!typeLine) fail('catalog.ts: ModelCategory satırı bulunamadı.');

  const unionBody = typeLine[1].trim();
  if (unionBody.includes(`'${raw}'`)) {
    fail(`Bu kategori zaten tanımlı: ${raw}`);
  }

  src = src.replace(
    /^export type ModelCategory = (.+);$/m,
    `export type ModelCategory = ${unionBody} | '${raw}';`
  );

  const catMarker = 'export const CATEGORIES: ModelCategory[] = [\n';
  const catStart = src.indexOf(catMarker);
  if (catStart === -1) fail('catalog.ts: CATEGORIES dizisi bulunamadı.');
  const afterBracket = catStart + catMarker.length;
  const catalogDecl = '\nexport const CATALOG';
  const catalogPos = src.indexOf(catalogDecl, afterBracket);
  if (catalogPos === -1) fail('catalog.ts: CATALOG bildirimi bulunamadı.');
  const block = src.slice(afterBracket, catalogPos);
  if (block.includes(`'${raw}'`)) {
    fail(`CATEGORIES içinde zaten var: ${raw}`);
  }
  const relClose = block.lastIndexOf('\n];');
  if (relClose === -1) fail('catalog.ts: CATEGORIES kapanışı bulunamadı.');
  const insertAt = afterBracket + relClose;
  src = src.slice(0, insertAt) + `\n  '${raw}',` + src.slice(insertAt);

  fs.writeFileSync(CATALOG_TS, src, 'utf8');
  console.log('Tamam:', raw);
  console.log('- data/catalog.ts guncellendi (ModelCategory + CATEGORIES).');
  console.log('- Admini yenileyin (http://localhost:3333).');
  console.log('- Modellere bu kategoriyi atayin veya yeni model ekleyin.');
}

main();
