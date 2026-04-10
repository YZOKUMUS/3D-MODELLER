const fs = require('fs');
const path = require('path');
const CATALOG = path.join(__dirname, '..', 'data', 'catalog.ts');

let src = fs.readFileSync(CATALOG, 'utf8');

src = src.replace(
  "export type ModelCategory = 'Karakter' | 'Mimari' | 'Araç' | 'Aksesuar' | 'Doğa';",
  "export type ModelCategory = 'Karakter' | 'Mimari' | 'Araç' | 'Aksesuar' | 'Doğa' | 'Silah' | 'Figür' | 'Tank' | 'Motorsiklet';"
);

src = src.replace(
  "export const CATEGORIES: ModelCategory[] = [\n  'Karakter',\n  'Mimari',\n  'Araç',\n  'Aksesuar',\n  'Doğa',\n];",
  "export const CATEGORIES: ModelCategory[] = [\n  'Karakter',\n  'Mimari',\n  'Araç',\n  'Aksesuar',\n  'Doğa',\n  'Silah',\n  'Figür',\n  'Tank',\n  'Motorsiklet',\n];"
);

fs.writeFileSync(CATALOG, src, 'utf8');
console.log('Kategoriler eklendi!');

const m = src.match(/CATEGORIES[^[]*\[([^\]]+)\]/s);
if (m) console.log('Mevcut kategoriler:', m[1].trim());
