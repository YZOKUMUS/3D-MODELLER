'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); } catch (_) { sharp = null; }

const PORT = 3333;
const ROOT = path.join(__dirname, '..');
const COVERS = path.join(ROOT, 'assets', 'covers');
const CATALOG = path.join(ROOT, 'data', 'catalog.ts');

fs.mkdirSync(COVERS, { recursive: true });

/** `data/catalog.ts` icindeki `CATEGORIES` — tek kaynak; yeni kategori buraya eklenir. */
function parseCategoriesFromCatalog() {
  try {
    const src = fs.readFileSync(CATALOG, 'utf8');
    const m = src.match(/export const CATEGORIES:\s*ModelCategory\[\]\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (!m) return [];
    const out = [];
    for (const line of m[1].split('\n')) {
      const x = line.match(/^\s*'((?:\\'|[^'])*)'\s*,?\s*$/);
      if (x) out.push(x[1].replace(/\\'/g, "'"));
    }
    return out;
  } catch {
    return [];
  }
}

function getAllowedCategorySet() {
  const list = parseCategoriesFromCatalog();
  if (list.length) return new Set(list);
  return new Set(['Araç', 'Motorsiklet', 'Silah', 'Tank', 'Figür', 'Aksesuar']);
}

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
  const lastIdx = src.lastIndexOf('\n];');
  if (lastIdx === -1) {
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
  src = src.slice(0, lastIdx) + '\n' + block + '];' + src.slice(lastIdx + 3);
  fs.writeFileSync(CATALOG, src, 'utf8');
  return true;
}

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function listModels() {
  const lines = fs.readFileSync(CATALOG, 'utf8').split('\n');
  const models = [];
  for (let i = 0; i < lines.length; i++) {
    const idM = lines[i].match(/^\s*id:\s*'(\d+)'\s*,?\s*$/);
    if (!idM) continue;
    const id = idM[1];
    let start = i;
    while (start > 0 && !/^\s*\{\s*$/.test(lines[start])) start--;
    let end = i;
    while (end < lines.length && !/^\s*\},?\s*$/.test(lines[end])) end++;
    const block = lines.slice(start, end + 1).join('\n');
    const titleM = block.match(/title:\s*'((?:\\'|[^'])*)'/);
    const priceM = block.match(/price:\s*(\d+)/);
    const catM = block.match(/category:\s*'([^']+)'/);
    const coverM = block.match(/coverImage:\s*require\('\.\.\/(assets\/covers\/[^']+)'\)/);
    let description = '';
    const desc1 = block.match(/description:\s*'((?:\\'|[^'])*)'/);
    if (desc1) {
      description = desc1[1].replace(/\\'/g, "'");
    } else {
      const desc2 = block.match(/description:\s*\r?\n\s*'((?:\\'|[^'])*)'/);
      if (desc2) description = desc2[1].replace(/\\'/g, "'");
    }
    if (!titleM || !priceM || !catM || !coverM) continue;
    models.push({
      id,
      title: titleM[1].replace(/\\'/g, "'"),
      price: parseInt(priceM[1], 10),
      category: catM[1],
      description,
      cover: coverM[1],
    });
  }
  return models.reverse();
}

function updateModel(id, fields) {
  let src = fs.readFileSync(CATALOG, 'utf8');
  const lines = src.split('\n');

  const idLine = lines.findIndex(l => l.match(new RegExp(`^\\s*id:\\s*'${id}'\\s*,?\\s*$`)));
  if (idLine === -1) return false;

  let start = idLine;
  while (start > 0 && !lines[start].match(/^\s*\{/)) start--;
  let end = idLine;
  while (end < lines.length - 1 && !lines[end].match(/^\s*\},?/)) end++;

  for (let i = start; i <= end; i++) {
    if (fields.title != null) {
      lines[i] = lines[i].replace(/^(\s*title:\s*)'[^']*'/, `$1'${esc(fields.title)}'`);
      lines[i] = lines[i].replace(/^(\s*tagline:\s*)'[^']*'/, `$1'${esc(fields.title)}'`);
    }
    if (fields.price != null) {
      lines[i] = lines[i].replace(/^(\s*price:\s*)\d+/, `$1${parseInt(fields.price, 10)}`);
    }
    if (fields.description != null) {
      lines[i] = lines[i].replace(/^(\s*description:\s*)'[^']*'/, `$1'${esc(fields.description)}'`);
      if (lines[i].match(/^\s*description:\s*$/)) {
        if (i + 1 <= end && lines[i + 1].match(/^\s*'/)) {
          lines[i + 1] = lines[i + 1].replace(/^\s*'[^']*'/, `      '${esc(fields.description)}'`);
        }
      }
    }
    if (fields.category != null) {
      lines[i] = lines[i].replace(/^(\s*category:\s*)'[^']*'/, `$1'${esc(fields.category)}'`);
    }
  }

  fs.writeFileSync(CATALOG, lines.join('\n'), 'utf8');
  return true;
}

function removeFromCatalog(id) {
  let src = fs.readFileSync(CATALOG, 'utf8');
  const lines = src.split('\n');

  const idLine = lines.findIndex(l => l.match(new RegExp(`^\\s*id:\\s*'${id}'\\s*,?\\s*$`)));
  if (idLine === -1) return { ok: false, coverFile: null };

  let start = idLine;
  while (start > 0 && !lines[start].match(/^\s*\{/)) start--;

  let end = idLine;
  while (end < lines.length - 1 && !lines[end].match(/^\s*\},?/)) end++;

  const block = lines.slice(start, end + 1).join('\n');
  const coverMatch = block.match(/require\('\.\.\/assets\/covers\/([^']+)'\)/);
  const coverFile = coverMatch ? coverMatch[1] : null;

  lines.splice(start, end - start + 1);
  fs.writeFileSync(CATALOG, lines.join('\n'), 'utf8');

  if (coverFile) {
    const coverPath = path.join(COVERS, coverFile);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }

  return { ok: true, coverFile };
}

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
.file-area input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.file-area .icon{font-size:36px;color:#94a3b8}
.file-area p{margin-top:8px;font-size:14px;color:#64748b}
.preview{margin-top:12px;border-radius:12px;max-height:150px;max-width:200px;object-fit:cover;display:none}
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
      <p>Tikla ve bilgisayarindan JPG sec</p>
      <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required id="fileIn">
    </div>
    <img class="preview" id="prev">

    <label>Model Ismi</label>
    <input type="text" name="title" required placeholder="Ornek: Uzay Gemisi v2">

    <label>Fiyat (TL)</label>
    <input type="number" name="price" required min="1" step="1" placeholder="299">

    <label>Kategori</label>
    <p style="font-size:12px;color:#64748b;margin:4px 0 8px;line-height:1.4">Liste <code style="background:#f1f5f9;padding:2px 6px;border-radius:6px">data/catalog.ts</code> icindeki <code style="background:#f1f5f9;padding:2px 6px;border-radius:6px">CATEGORIES</code> dizisinden gelir. Yeni kategori icin orada tanimlayip admin sayfasini yenileyin.</p>
    <select name="category" required id="add-category">
      <option value="">Yukleniyor...</option>
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

    <button type="button" id="btn" onclick="doSubmit()">Modeli Ekle</button>
  </form>
  <div id="msg"></div>
  <p class="count" id="cnt"></p>
  <a href="/manage" style="display:block;text-align:center;margin-top:16px;color:#dc2626;font-weight:700;font-size:14px;text-decoration:none;padding:10px;background:#fef2f2;border-radius:12px;transition:background .2s" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">Modelleri Yonet / Sil</a>
</div>
<script>
const fileIn=document.getElementById('fileIn'),prev=document.getElementById('prev'),drop=document.getElementById('drop');
fileIn.addEventListener('change',()=>{
  if(fileIn.files[0]){
    prev.src=URL.createObjectURL(fileIn.files[0]);
    prev.style.display='block';
    drop.querySelector('p').textContent=fileIn.files[0].name;
  }
});
document.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='none';});
document.addEventListener('drop',e=>e.preventDefault());
async function doSubmit(){
  const form=document.getElementById('f');
  const m=document.getElementById('msg');
  if(!fileIn.files[0]){m.className='msg err';m.textContent='Resim secmediniz! Kutuya tiklayip bir JPG secin.';return;}
  if(!form.title.value.trim()){m.className='msg err';m.textContent='Model ismi bos! Bir isim yazin.';return;}
  if(!form.price.value){m.className='msg err';m.textContent='Fiyat bos! Bir fiyat girin.';return;}
  if(!form.category.value){m.className='msg err';m.textContent='Kategori secmediniz! Listeden bir kategori secin.';return;}
  const btn=document.getElementById('btn');
  btn.disabled=true;btn.textContent='Ekleniyor...';
  m.className='';m.textContent='';
  const fd=new FormData(form);
  const fmts=[];
  document.querySelectorAll('input[name=fmt]:checked').forEach(c=>fmts.push(c.value));
  fd.set('formats',fmts.join(','));
  try{
    const r=await fetch('/api/add',{method:'POST',body:fd});
    const j=await r.json();
    const m=document.getElementById('msg');
    if(j.ok){m.className='msg ok';m.textContent='Eklendi: '+j.title+' ('+j.coverFile+')';
      form.reset();prev.style.display='none';drop.querySelector('p').textContent='Tikla ve bilgisayarindan JPG sec';
      document.getElementById('cnt').textContent='Toplam: '+j.total+' model';
    }else{m.className='msg err';m.textContent='Hata: '+j.error;}
  }catch(ex){m.className='msg err';m.textContent=ex.message;}
  btn.disabled=false;btn.textContent='Modeli Ekle';
}
async function initAddCategories(){
  try{
    const r=await fetch('/api/categories');
    const j=await r.json();
    const sel=document.getElementById('add-category');
    sel.innerHTML='<option value="">Sec...</option>';
    const cats=j.categories||[];
    for(const c of cats){
      const o=document.createElement('option');
      o.value=c;o.textContent=c;
      sel.appendChild(o);
    }
    if(!cats.length){sel.innerHTML='<option value="">Kategori listesi okunamadi</option>';}
  }catch(e){
    document.getElementById('add-category').innerHTML='<option value="">Hata: kategoriler yuklenemedi</option>';
  }
}
initAddCategories();
fetch('/api/count').then(r=>r.json()).then(j=>{document.getElementById('cnt').textContent='Mevcut: '+j.total+' model';});
</script>
</body>
</html>`;

const MANAGE_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Model Market — Modelleri Yonet</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fef2f2;min-height:100vh;padding:24px}
.header{max-width:800px;margin:0 auto 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
h1{font-size:22px;font-weight:800;color:#7f1d1d}
.back{color:#064e3b;font-weight:700;text-decoration:none;font-size:14px;padding:8px 16px;background:#ecfdf5;border-radius:10px;transition:background .2s}
.back:hover{background:#d1fae5}
.search-row{max-width:800px;margin:0 auto 16px;display:flex;gap:10px}
.search-row input{flex:1;padding:12px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;outline:none;transition:border .2s}
.search-row input:focus{border-color:#dc2626}
.grid{max-width:800px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.item{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .15s}
.item:hover{transform:translateY(-2px)}
.item img{width:100%;height:140px;object-fit:cover;background:#f1f5f9}
.item-body{padding:12px 14px 14px}
.item-title{font-size:15px;font-weight:700;color:#18181b;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-id{font-size:12px;color:#94a3b8;margin-bottom:10px}
.btn-row{display:flex;gap:6px}
.edit-btn{flex:1;padding:10px;border:none;border-radius:10px;background:#e0f2fe;color:#0369a1;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s}
.edit-btn:hover{background:#bae6fd}
.del-btn{flex:1;padding:10px;border:none;border-radius:10px;background:#fee2e2;color:#dc2626;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s}
.del-btn:hover{background:#fecaca}
.del-btn:disabled,.edit-btn:disabled{opacity:.5;cursor:wait}
.empty{text-align:center;padding:48px 20px;color:#94a3b8;font-size:16px}
.total{max-width:800px;margin:16px auto 0;font-size:13px;color:#94a3b8}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99;display:none}
.modal{background:#fff;border-radius:20px;padding:28px;max-width:420px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,.15)}
.modal h2{font-size:18px;font-weight:800;margin-bottom:16px}
.modal label{display:block;font-weight:700;font-size:13px;color:#334155;margin-bottom:6px;margin-top:14px}
.modal input,.modal textarea{width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;font-family:inherit}
.modal input:focus,.modal textarea:focus{border-color:#0369a1}
.modal textarea{resize:vertical;min-height:80px}
.modal select{width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;background:#fff}
.modal select:focus{border-color:#0369a1}
.modal-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
.modal-btns button{padding:12px 24px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}
.btn-cancel{background:#f1f5f9;color:#334155}
.btn-cancel:hover{background:#e2e8f0}
.btn-save{background:#0369a1;color:#fff}
.btn-save:hover{background:#075985}
.btn-confirm{background:#dc2626;color:#fff}
.btn-confirm:hover{background:#b91c1c}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;display:none;z-index:100}
</style>
</head>
<body>
<div class="header">
  <h1>Modelleri Yonet</h1>
  <a href="/" class="back">+ Yeni Model Ekle</a>
</div>
<div class="search-row">
  <input type="text" id="q" placeholder="Model ara..." oninput="filterList()">
</div>
<div class="grid" id="grid"></div>
<p class="total" id="total"></p>

<div class="overlay" id="del-overlay">
  <div class="modal" style="text-align:center">
    <h2 style="color:#7f1d1d">Modeli Sil</h2>
    <p id="confirm-text" style="font-size:14px;color:#64748b;margin-bottom:20px"></p>
    <div class="modal-btns" style="justify-content:center">
      <button class="btn-cancel" onclick="closeDelete()">Vazgec</button>
      <button class="btn-confirm" id="confirm-del-btn" onclick="confirmDelete()">Evet, Sil</button>
    </div>
  </div>
</div>

<div class="overlay" id="edit-overlay">
  <div class="modal">
    <h2 style="color:#0369a1">Modeli Duzenle</h2>
    <label>Model Ismi</label>
    <input type="text" id="edit-title">
    <label>Fiyat (TL)</label>
    <input type="number" id="edit-price" min="1">
    <label>Kategori</label>
    <select id="edit-category"><option value="">Yukleniyor...</option></select>
    <label>Aciklama</label>
    <textarea id="edit-desc"></textarea>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="closeEdit()">Vazgec</button>
      <button class="btn-save" id="edit-save-btn" onclick="saveEdit()">Kaydet</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let allModels=[];
let categoryList=[];
let deleteId=null;
let editId=null;

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.style.display='block';
  setTimeout(()=>{t.style.display='none'},2500);
}

async function load(){
  const [rList,rCat]=await Promise.all([fetch('/api/list'),fetch('/api/categories')]);
  const j=await rList.json();
  const jc=await rCat.json();
  allModels=j.models;
  categoryList=jc.categories||[];
  filterList();
  document.getElementById('total').textContent='Toplam: '+allModels.length+' model';
}

function populateEditCategorySelect(current){
  const sel=document.getElementById('edit-category');
  const cur=current||'';
  const merged=[...new Set([...categoryList,cur].filter(Boolean))];
  sel.innerHTML='';
  for(const c of merged){
    const o=document.createElement('option');
    o.value=c;o.textContent=c;
    sel.appendChild(o);
  }
  sel.value=merged.includes(cur)?cur:(categoryList[0]||merged[0]||'');
}

function filterList(){
  const q=document.getElementById('q').value.toLowerCase().trim();
  const grid=document.getElementById('grid');
  const filtered=q?allModels.filter(m=>m.title.toLowerCase().includes(q)||m.id.includes(q)||(m.category&&m.category.toLowerCase().includes(q))):allModels;
  if(filtered.length===0){
    grid.innerHTML='<div class="empty">'+(!q?'Henuz model yok.':'Sonuc bulunamadi.')+'</div>';
    return;
  }
  grid.innerHTML=filtered.map(m=>\`
    <div class="item" id="item-\${m.id}">
      <img src="/cover/\${m.cover.split('/').pop()}" alt="\${m.title}" onerror="this.style.background='#e2e8f0'">
      <div class="item-body">
        <div class="item-title">\${m.title}</div>
        <div class="item-id">ID: \${m.id} · \${m.category || '?'} · \${m.price} TL</div>
        <div class="btn-row">
          <button class="edit-btn" onclick="openEdit('\${m.id}')">Duzenle</button>
          <button class="del-btn" onclick="askDelete('\${m.id}','\${m.title.replace(/'/g,"\\\\'")}')">Sil</button>
        </div>
      </div>
    </div>
  \`).join('');
}

function openEdit(id){
  const m=allModels.find(x=>x.id===id);
  if(!m)return;
  editId=id;
  document.getElementById('edit-title').value=m.title;
  document.getElementById('edit-price').value=m.price;
  document.getElementById('edit-desc').value=m.description||'';
  populateEditCategorySelect(m.category);
  document.getElementById('edit-overlay').style.display='flex';
}

function closeEdit(){
  editId=null;
  document.getElementById('edit-overlay').style.display='none';
}

async function saveEdit(){
  if(!editId)return;
  const btn=document.getElementById('edit-save-btn');
  btn.disabled=true;btn.textContent='Kaydediliyor...';
  const title=document.getElementById('edit-title').value.trim();
  const price=parseInt(document.getElementById('edit-price').value,10);
  const category=document.getElementById('edit-category').value;
  const description=document.getElementById('edit-desc').value.trim();
  try{
    const r=await fetch('/api/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,title,price,category,description})});
    const j=await r.json();
    if(j.ok){
      const m=allModels.find(x=>x.id===editId);
      if(m){m.title=title;m.price=price;m.category=category;m.description=description;}
      filterList();
      showToast('Kaydedildi!');
    }else{alert('Hata: '+j.error);}
  }catch(e){alert(e.message);}
  btn.disabled=false;btn.textContent='Kaydet';
  closeEdit();
}

function askDelete(id,title){
  deleteId=id;
  document.getElementById('confirm-text').textContent='"'+title+'" (ID: '+id+') modeli silinecek. Bu islem geri alinamaz!';
  document.getElementById('del-overlay').style.display='flex';
}

function closeDelete(){
  deleteId=null;
  document.getElementById('del-overlay').style.display='none';
}

async function confirmDelete(){
  if(!deleteId)return;
  const btn=document.getElementById('confirm-del-btn');
  btn.disabled=true;btn.textContent='Siliniyor...';
  try{
    const r=await fetch('/api/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:deleteId})});
    const j=await r.json();
    if(j.ok){
      allModels=allModels.filter(m=>m.id!==deleteId);
      filterList();
      document.getElementById('total').textContent='Toplam: '+allModels.length+' model';
      showToast('Silindi!');
    }else{alert('Hata: '+j.error);}
  }catch(e){alert(e.message);}
  btn.disabled=false;btn.textContent='Evet, Sil';
  closeDelete();
}

load();
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

/** Eski admin kayitlari (ASCII) */
const CATEGORY_MAP = { Arac: 'Araç', Figur: 'Figür' };

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

  if (req.url === '/api/list' && req.method === 'GET') {
    const models = listModels();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ models }));
  }

  if (req.url === '/api/categories' && req.method === 'GET') {
    const categories = parseCategoriesFromCatalog();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ categories }));
  }

  if (req.url === '/api/update' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    return req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const id = String(body.id || '').trim();
        if (!id) return res.end(JSON.stringify({ ok: false, error: 'ID gerekli' }));
        const allowed = getAllowedCategorySet();
        if (body.category != null && body.category !== '' && !allowed.has(String(body.category))) {
          return res.end(JSON.stringify({ ok: false, error: 'Gecersiz kategori (catalog.ts CATEGORIES)' }));
        }
        const ok = updateModel(id, body);
        if (!ok) return res.end(JSON.stringify({ ok: false, error: 'Model bulunamadi' }));
        console.log('Guncellendi: id=' + id, body.title || '', body.price || '', body.description ? '(aciklama)' : '');
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
  }

  if (req.url === '/api/delete' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    return req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const id = String(body.id || '').trim();
        if (!id) return res.end(JSON.stringify({ ok: false, error: 'ID gerekli' }));
        const result = removeFromCatalog(id);
        if (!result.ok) return res.end(JSON.stringify({ ok: false, error: 'Model bulunamadi' }));
        const src = fs.readFileSync(CATALOG, 'utf8');
        const total = (src.match(/id:\s*'/g) || []).length;
        console.log('Silindi: id=' + id, result.coverFile ? '(' + result.coverFile + ')' : '', '- kalan', total);
        res.end(JSON.stringify({ ok: true, total }));
      } catch (e) {
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
  }

  if (req.url === '/manage' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(MANAGE_HTML);
  }

  if (req.url === '/api/add' && req.method === 'POST') {
    return parseMultipart(req, async (err, fields, fileData, fileName) => {
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
      if (!getAllowedCategorySet().has(category)) {
        return res.end(JSON.stringify({ ok: false, error: 'Gecersiz kategori (catalog.ts CATEGORIES)' }));
      }

      const idx = nextCoverIndex();
      const coverFile = 'cover-' + String(idx).padStart(3, '0') + '.jpg';
      if (sharp) {
        try {
          fileData = await sharp(fileData).resize(400, null, { withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        } catch (_) {}
      }
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

  if (req.url.startsWith('/cover/') && req.method === 'GET') {
    const file = path.basename(req.url.slice(7));
    const fp = path.join(COVERS, file);
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      return res.end(fs.readFileSync(fp));
    }
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
