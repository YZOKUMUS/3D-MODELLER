'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const ROOT = path.join(__dirname, '..');
const COVERS = path.join(ROOT, 'assets', 'covers');
const CATALOG = path.join(ROOT, 'data', 'catalog.ts');

fs.mkdirSync(COVERS, { recursive: true });

function nextCoverIndex() {
  const files = fs.readdirSync(COVERS).filter(f => /^cover-\d+\.jpg$/i.test(f));
  let max = 0;
  for (const f of files) {
    const m = f.match(/^cover-(\d+)\.jpg$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

function nextCatalogId() {
  const src = fs.readFileSync(CATALOG, 'utf8');
  const ids = [...src.matchAll(/id:\s*'(\d+)'/g)].map(m => parseInt(m[1], 10));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

const ACCENTS = ['#5B8DEF','#C084FC','#34D399','#FBBF24','#2DD4BF','#94A3B8','#f472b6','#a78bfa'];

function appendToCatalog(entry) {
  let src = fs.readFileSync(CATALOG, 'utf8');
  const marker = /\n\];/;
  if (!marker.test(src)) {
    console.error('catalog.ts icinde ]; bulunamadi');
    return false;
  }
  const block = `  {
    id: '${entry.id}',
    title: '${esc(entry.title)}',
    tagline: '${esc(entry.tagline)}',
    price: ${entry.price},
    formats: [${entry.formats.map(f => `'${f}'`).join(', ')}],
    category: '${entry.category}',
    description: '${esc(entry.description)}',
    coverImage: require('../assets/covers/${entry.coverFile}'),
    accent: '${entry.accent}',
    polyCount: '${entry.polyCount}',
    rating: ${entry.rating},
  },\n`;
  src = src.replace(marker, block + '\n];');
  fs.writeFileSync(CATALOG, src, 'utf8');
  return true;
}

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

const HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Model Market — Yeni Model Ekle</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f0fdf4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border-radius:20px;padding:32px;max-width:460px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.1)}
h1{font-size:22px;font-weight:800;color:#064e3b;margin-bottom:6px}
.sub{font-size:14px;color:#64748b;margin-bottom:24px}
label{display:block;font-weight:700;font-size:13px;color:#334155;margin-bottom:6px;margin-top:16px}
input[type=text],input[type=number],select{width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;outline:none;transition:border .2s}
input:focus,select:focus{border-color:#0d9488}
.file-area{border:2px dashed #d1d5db;border-radius:14px;padding:24px;text-align:center;cursor:pointer;transition:border .2s;position:relative;overflow:hidden}
.file-area:hover,.file-area.active{border-color:#0d9488;background:#f0fdf4}
.file-area input{position:absolute;inset:0;opacity:0;cursor:pointer}
.file-area .icon{font-size:36px;color:#94a3b8}
.file-area p{margin-top:8px;font-size:14px;color:#64748b}
.preview{margin-top:12px;border-radius:12px;max-height:200px;object-fit:cover;width:100%;display:none}
.formats{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.formats label{display:flex;align-items:center;gap:4px;font-weight:500;margin:0;cursor:pointer}
button[type=submit]{margin-top:24px;width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#064e3b,#0d9488);color:#fff;font-size:17px;font-weight:800;cursor:pointer;transition:opacity .2s}
button[type=submit]:hover{opacity:.9}
button[type=submit]:disabled{opacity:.5;cursor:wait}
.msg{margin-top:16px;padding:14px;border-radius:12px;font-size:14px;font-weight:600;display:none}
.msg.ok{background:#ecfdf5;color:#065f46;display:block}
.msg.err{background:#fef2f2;color:#991b1b;display:block}
.count{font-size:13px;color:#94a3b8;margin-top:4px}
</style>
</head>
<body>
<div class="card">
  <h1>Yeni Model Ekle</h1>
  <p class="sub">Resim sec, bilgileri gir, Ekle'ye bas. Gerisi otomatik.</p>
  <form id="f" enctype="multipart/form-data">
    <div class="file-area" id="drop">
      <div class="icon">&#128247;</div>
      <p>Resim sec veya surukle (JPG)</p>
      <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required id="fileIn">
    </div>
    <img class="preview" id="prev">

    <label>Model Ismi</label>
    <input type="text" name="title" required placeholder="Ornek: Uzay Gemisi v2">

    <label>Fiyat (TL)</label>
    <input type="number" name="price" required min="1" step="1" placeholder="299">

    <label>Kategori</label>
    <select name="category" required>
      <option value="">Sec...</option>
      <option value="Karakter">Karakter</option>
      <option value="Mimari">Mimari</option>
      <option value="Arac">Arac</option>
      <option value="Aksesuar">Aksesuar</option>
      <option value="Doga">Doga</option>
    </select>

    <label>Dosya Formatlari</label>
    <div class="formats">
      <label><input type="checkbox" name="fmt" value="GLB" checked> GLB</label>
      <label><input type="checkbox" name="fmt" value="OBJ" checked> OBJ</label>
      <label><input type="checkbox" name="fmt" value="FBX" checked> FBX</label>
      <label><input type="checkbox" name="fmt" value="STL"> STL</label>
      <label><input type="checkbox" name="fmt" value="STEP"> STEP</label>
    </div>

    <label>Aciklama (istege bagli)</label>
    <input type="text" name="desc" placeholder="Kisa aciklama...">

    <button type="submit" id="btn">Modeli Ekle</button>
  </form>
  <div id="msg"></div>
  <p class="count" id="cnt"></p>
</div>
<script>
const fileIn=document.getElementById('fileIn'),prev=document.getElementById('prev');
fileIn.addEventListener('change',()=>{
  if(fileIn.files[0]){
    prev.src=URL.createObjectURL(fileIn.files[0]);
    prev.style.display='block';
  }
});
document.getElementById('f').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=document.getElementById('btn');
  btn.disabled=true;btn.textContent='Ekleniyor...';
  const fd=new FormData(e.target);
  const fmts=[];
  document.querySelectorAll('input[name=fmt]:checked').forEach(c=>fmts.push(c.value));
  fd.set('formats',fmts.join(','));
  try{
    const r=await fetch('/api/add',{method:'POST',body:fd});
    const j=await r.json();
    const m=document.getElementById('msg');
    if(j.ok){m.className='msg ok';m.textContent='Eklendi: '+j.title+' ('+j.coverFile+')';
      e.target.reset();prev.style.display='none';
      document.getElementById('cnt').textContent='Toplam: '+j.total+' model';
    }else{m.className='msg err';m.textContent='Hata: '+j.error;}
  }catch(ex){const m=document.getElementById('msg');m.className='msg err';m.textContent=ex.message;}
  btn.disabled=false;btn.textContent='Modeli Ekle';
});
fetch('/api/count').then(r=>r.json()).then(j=>{document.getElementById('cnt').textContent='Mevcut: '+j.total+' model';});
</script>
</body>
</html>`;

function parseMultipart(req, cb) {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    const ct = req.headers['content-type'] || '';
    const boundaryMatch = ct.match(/boundary=(.+)/);
    if (!boundaryMatch) return cb(new Error('No boundary'));
    const boundary = '--' + boundaryMatch[1].trim();
    const parts = [];
    let start = buf.indexOf(boundary) + boundary.length;
    while (true) {
      const next = buf.indexOf(boundary, start + 1);
      if (next === -1) break;
      parts.push(buf.slice(start, next));
      start = next + boundary.length;
    }
    const fields = {};
    let fileData = null, fileName = null;
    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const header = part.slice(0, headerEnd).toString('utf8');
      const body = part.slice(headerEnd + 4, part.length - 2);
      const nameMatch = header.match(/name="([^"]+)"/);
      const fnMatch = header.match(/filename="([^"]+)"/);
      if (fnMatch) {
        fileData = body;
        fileName = fnMatch[1];
      } else if (nameMatch) {
        fields[nameMatch[1]] = body.toString('utf8').trim();
      }
    }
    cb(null, fields, fileData, fileName);
  });
}

const CATEGORY_MAP = { Arac: 'Araç', Doga: 'Doğa' };

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }

  if (req.url === '/api/count' && req.method === 'GET') {
    const src = fs.readFileSync(CATALOG, 'utf8');
    const count = (src.match(/id:\s*'/g) || []).length;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ total: count }));
  }

  if (req.url === '/api/add' && req.method === 'POST') {
    return parseMultipart(req, (err, fields, fileData, fileName) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (err || !fileData) return res.end(JSON.stringify({ ok: false, error: 'Dosya okunamadi' }));

      const title = (fields.title || '').trim();
      const price = parseInt(fields.price, 10);
      const rawCat = (fields.category || '').trim();
      const category = CATEGORY_MAP[rawCat] || rawCat;
      const formats = (fields.formats || 'GLB').split(',').filter(Boolean);
      const desc = (fields.desc || '').trim() || (title + ' modeli');

      if (!title || !price || !category) {
        return res.end(JSON.stringify({ ok: false, error: 'Isim, fiyat ve kategori zorunlu' }));
      }

      const idx = nextCoverIndex();
      const coverFile = 'cover-' + String(idx).padStart(3, '0') + '.jpg';
      fs.writeFileSync(path.join(COVERS, coverFile), fileData);

      const id = nextCatalogId();
      const accent = ACCENTS[(id - 1) % ACCENTS.length];
      const ok = appendToCatalog({
        id: String(id),
        title,
        tagline: title + ' · ' + formats.join(', '),
        price,
        formats,
        category,
        description: desc,
        coverFile,
        accent,
        polyCount: '\u2014',
        rating: (4.0 + Math.random() * 0.9).toFixed(1),
      });

      if (!ok) return res.end(JSON.stringify({ ok: false, error: 'catalog.ts guncellenemedi' }));

      const src = fs.readFileSync(CATALOG, 'utf8');
      const total = (src.match(/id:\s*'/g) || []).length;
      console.log('Eklendi:', title, '->', coverFile, '(toplam', total, ')');
      res.end(JSON.stringify({ ok: true, title, coverFile, total }));
    });
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Model Market — Admin Panel');
  console.log('  http://localhost:' + PORT);
  console.log('');
  console.log('  Resim sec, bilgileri gir, Ekle\'ye bas.');
  console.log('  Kapamak icin: Ctrl+C');
  console.log('');
});
