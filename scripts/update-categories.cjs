const fs = require('fs');
const path = require('path');
const CATALOG = path.join(__dirname, '..', 'data', 'catalog.ts');

let src = fs.readFileSync(CATALOG, 'utf8');

// Type'i guncelle
src = src.replace(
  /export type ModelCategory = [^;]+;/,
  "export type ModelCategory = 'Araç' | 'Motorsiklet' | 'Silah' | 'Tank' | 'Figür' | 'Aksesuar';"
);

// CATEGORIES dizisini guncelle
src = src.replace(
  /export const CATEGORIES: ModelCategory\[\] = \[[^\]]+\];/s,
  "export const CATEGORIES: ModelCategory[] = [\n  'Araç',\n  'Motorsiklet',\n  'Silah',\n  'Tank',\n  'Figür',\n  'Aksesuar',\n];"
);

// Eski kategori isimlerini yenilere cevir
src = src.replace(/category: 'Karakter'/g, "category: 'Figür'");
src = src.replace(/category: 'Mimari'/g, "category: 'Araç'");
src = src.replace(/category: 'Doğa'/g, "category: 'Aksesuar'");

fs.writeFileSync(CATALOG, src, 'utf8');

const cats = [...src.matchAll(/category: '([^']+)'/g)].map(m => m[1]);
const unique = [...new Set(cats)];
console.log('Kategoriler guncellendi!');
console.log('Kullanilan kategoriler:', unique.join(', '));
console.log('Kategori dagilimi:');
unique.forEach(c => console.log(' ', c, ':', cats.filter(x => x === c).length, 'model'));
