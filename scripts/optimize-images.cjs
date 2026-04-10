const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const COVERS = path.join(__dirname, '..', 'assets', 'covers');
const BACKUP = path.join(__dirname, '..', 'assets', 'covers-original');
const WIDTH = 400;
const QUALITY = 80;

async function run() {
  const files = fs.readdirSync(COVERS).filter(f => /\.jpg$/i.test(f));
  console.log(`${files.length} resim bulundu.`);

  if (!fs.existsSync(BACKUP)) {
    console.log('Orijinaller yedekleniyor: covers-original/');
    fs.mkdirSync(BACKUP, { recursive: true });
    for (const f of files) {
      fs.copyFileSync(path.join(COVERS, f), path.join(BACKUP, f));
    }
    console.log('Yedekleme tamamlandi.');
  }

  let done = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const f of files) {
    const src = path.join(COVERS, f);
    const inputBuf = fs.readFileSync(src);
    totalBefore += inputBuf.length;

    try {
      const outBuf = await sharp(inputBuf)
        .resize(WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();

      fs.writeFileSync(src, outBuf);
      totalAfter += outBuf.length;
    } catch (e) {
      console.error(`  HATA: ${f} - ${e.message}`);
      totalAfter += inputBuf.length;
    }

    done++;
    if (done % 50 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length} tamamlandi...`);
    }
  }

  console.log('\n--- SONUC ---');
  console.log(`Once:  ${Math.round(totalBefore / 1024 / 1024)} MB`);
  console.log(`Sonra: ${Math.round(totalAfter / 1024 / 1024)} MB`);
  console.log(`Kazanc: ${Math.round((1 - totalAfter / totalBefore) * 100)}% kucultme`);
}

run().catch(console.error);
