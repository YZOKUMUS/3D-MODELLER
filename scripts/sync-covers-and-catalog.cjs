'use strict';
/**
 * 1) assets/incoming/ içindeki JPG'leri sırayla assets/covers/cover-NNN.jpg olarak taşır.
 * 2) assets/covers/cover-*.jpg dosyalarına göre data/catalog.ts üretir (Metro require sabitleri).
 * Üst klasördeki mükerrer JPG'lere artık ihtiyaç yok.
 */
const fs = require('fs');
const path = require('path');

const modelMarketRoot = path.join(__dirname, '..');
const coversDir = path.join(modelMarketRoot, 'assets', 'covers');
const incomingDir = path.join(modelMarketRoot, 'assets', 'incoming');
const catalogOut = path.join(modelMarketRoot, 'data', 'catalog.ts');

function listCoverFiles() {
  if (!fs.existsSync(coversDir)) return [];
  return fs
    .readdirSync(coversDir)
    .filter((f) => /^cover-\d+\.jpg$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });
}

function maxCoverIndex(files) {
  let max = 0;
  for (const f of files) {
    const m = f.match(/^cover-(\d+)\.jpg$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

fs.mkdirSync(coversDir, { recursive: true });
fs.mkdirSync(incomingDir, { recursive: true });

let coverFiles = listCoverFiles();
let nextIdx = maxCoverIndex(coverFiles);

const incomingFiles = fs
  .readdirSync(incomingDir, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.jpe?g$/i.test(d.name))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }));

for (const name of incomingFiles) {
  nextIdx += 1;
  const n = String(nextIdx).padStart(3, '0');
  const dest = path.join(coversDir, `cover-${n}.jpg`);
  fs.renameSync(path.join(incomingDir, name), dest);
  console.log('incoming →', `cover-${n}.jpg`, '(', name, ')');
}

coverFiles = listCoverFiles();

if (coverFiles.length === 0) {
  console.error('assets/covers içinde cover-001.jpg formatında dosya yok.');
  process.exit(1);
}

const forceCatalog = process.argv.includes('--rewrite-catalog');
if (incomingFiles.length === 0 && !forceCatalog) {
  console.log(
    'incoming klasörü boş → catalog.ts değiştirilmedi (mevcut başlıklar korunur).',
    'Tüm kapaklardan katalogu sıfırdan yazmak: npm run sync-covers -- --rewrite-catalog'
  );
  process.exit(0);
}

const ACCENTS = [
  '#5B8DEF',
  '#C084FC',
  '#34D399',
  '#FBBF24',
  '#2DD4BF',
  '#94A3B8',
  '#f472b6',
  '#a78bfa',
];
const CATS = ['Karakter', 'Mimari', 'Araç', 'Aksesuar', 'Doğa'];

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const items = coverFiles.map((filename, i) => {
  const id = String(i + 1);
  const m = filename.match(/^cover-(\d+)\.jpg$/i);
  const num = m ? m[1] : String(i + 1).padStart(3, '0');
  const title = esc(`Model ${num}`);
  const cat = CATS[i % CATS.length];
  const accent = ACCENTS[i % ACCENTS.length];
  const price = 199 + (i % 14) * 65;
  const rating = Math.min(4.9, 4.1 + (i % 9) * 0.1).toFixed(1);
  return `  {
    id: '${id}',
    title: '${title}',
    tagline: 'Kapak: ${esc(filename)} · Metni catalog.ts içinde düzenleyin',
    price: ${price},
    formats: ['GLB', 'OBJ', 'FBX'],
    category: '${cat}',
    description:
      'Bu kayıt assets/covers/${esc(filename)} dosyasına bağlı. Başlık ve fiyatı buradan güncelleyebilirsiniz.',
    coverImage: require('../assets/covers/${filename}'),
    accent: '${accent}',
    polyCount: '—',
    rating: ${rating},
  }`;
});

const header = `import type { ImageSourcePropType } from 'react-native';

export type ModelCategory = 'Karakter' | 'Mimari' | 'Araç' | 'Aksesuar' | 'Doğa';

export type CatalogModel = {
  id: string;
  title: string;
  tagline: string;
  price: number;
  formats: string[];
  category: ModelCategory;
  description: string;
  coverImage: ImageSourcePropType;
  accent: string;
  polyCount: string;
  rating: number;
};

export const CATEGORIES: ModelCategory[] = [
  'Karakter',
  'Mimari',
  'Araç',
  'Aksesuar',
  'Doğa',
];

export const CATALOG: CatalogModel[] = [
`;

const footer = `
];

export function getModelById(id: string): CatalogModel | undefined {
  return CATALOG.find((m) => m.id === id);
}
`;

fs.writeFileSync(catalogOut, header + items.join(',\n') + footer, 'utf8');
console.log('Tamam:', coverFiles.length, 'kapak → data/catalog.ts');
