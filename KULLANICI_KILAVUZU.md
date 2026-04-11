# YZOKUMUS — Kullanıcı Kılavuzu

Bu belge **YZOKUMUS** 3B model vitrin uygulaması (Expo / React Native) ve **yerel admin paneli** için hazırlanmıştır.

---

## 1. Gereksinimler

| Araç | Açıklama |
|------|----------|
| **Node.js** | LTS sürümü önerilir (ör. 20.x veya 22.x). |
| **npm** | Node ile birlikte gelir. |
| **Telefon (isteğe bağlı)** | Android/iOS için [Expo Go](https://expo.dev/go) veya geliştirme build’i. |

Proje klasörü: `model-market` (içinde `package.json` ve `.git` bulunur).

---

## 2. Kurulum ve çalıştırma

Terminalde **bu proje klasörüne** (`model-market`, içinde `package.json` olan dizin) girin:

```powershell
cd model-market
npm install
```

### Geliştirme sunucusu

```powershell
npm start
```

Açılan menüden:

- **`w`** — Web tarayıcıda önizleme  
- **`a`** — Android emülatör veya USB ile bağlı cihaz  
- **`i`** — iOS simülatör (macOS)

Doğrudan komutlar:

```powershell
npm run web
npm run android
npm run ios
```

---

## 3. Uygulama ekranları (son kullanıcı)

### Ana sayfa (mağaza)

- **Arama:** Üstteki kutuya yazdıkça model adı ve kısa açıklama (tagline) içinde arama yapılır.
- **Sekmeler:**
  - **Senin İçin:** Tüm kategoriler; liste `catalog.ts` sırasının tersiyle gösterilir (kişisel öneri algoritması yoktur).
  - **Trend:** Tüm kategoriler; modeller `rating` değerine göre yüksekten düşüğe sıralanır (puanlar katalog verisindedir).
  - **Kategori sekmeleri:** Sadece katalogda **en az bir ürünü olan** kategoriler görünür; boş kategorilerin sekmesi çıkmaz.
- **Daha fazla göster:** İlk yüklemede sınırlı sayıda kart; butona basarak daha fazla model yüklenir.
- **Kart:** Kapak görseli, başlık, kategori, fiyat. **YENİ** rozeti, katalogdaki son eklenen id aralığına göre gösterilir.
- **Kalp (beğen):** Görselin altında; dokununca beğeni açılır/kapanır. Veri **cihazda** saklanır (AsyncStorage); hesap / sunucu yoktur.
- **Karta dokunma:** Model detay sayfasına gider.

### Model detayı

- **Görseller (kaydırmalı galeri):** Üstteki büyük alanda birden fazla fotoğraf tanımlıysa parmakla veya fareyle **sağa/sola kaydırarak** diğer açılara geçebilirsiniz (Bambu Handy’deki gibi). Sağ altta **1/3** biçiminde **hangi slaytta olduğunuz** yazar; yalnızca **tek** fotoğraf varsa bu sayaç gösterilmez.
- İlk slayt her zaman **kapak** görselidir; ek fotoğraflar ondan sonra gelir.
- Açıklama, fiyat, sepete ekle, sepete git.
- **Benzer modeller:** Aynı kategoriden örnekler.
- Üstte geri ve ana listeye dönüş kısayolları.

### Sepet ve profil

- Alt menüden **Sepet** ve **Profil** sekmelerine geçilir. Sepet satırları yine cihazda saklanır.

---

## 4. Admin paneli (içerik yönetimi)

Admin, **Node ile çalışan basit bir web sunucusudur**; `catalog.ts` ve kapak görsellerini doğrudan günceller. **Veritabanı yoktur** — her işlem doğrudan proje dosyalarına yazar. Bu yüzden admin’i çalıştıran bilgisayarda proje klasörünün yazılabilir olması gerekir.

### Başlatma

```powershell
cd model-market
npm run admin
```

Tarayıcıda adres: **http://localhost:3333**  
Ana sayfa: **yeni model ekleme** formu. Alttaki bağlantı: **Modelleri Yönet / Sil** → `http://localhost:3333/manage`

Sunucuyu durdurmak için terminalde **Ctrl+C**.

---

### 4.1 Yeni model ekleme (`/` — ana sayfa)

Bu ekranda vitrine **yeni bir ürün kaydı** oluşturursunuz. Kayıt sonunda:

- `data/catalog.ts` dosyasının sonuna yeni bir **model nesnesi** eklenir (yeni `id`, `title`, `price`, `category`, vb.).
- `assets/covers/` altına **yeni bir kapak JPG dosyası** yazılır (`cover-001.jpg`, `cover-002.jpg` … şeklinde sıradaki numara).

**Adım adım alanlar**

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| **Resim (kapak)** | Evet | Tıklayıp veya sürükleyip seçin. JPG, PNG veya WebP kabul edilir; sunucu mümkünse **400px genişliğe** indirgeyip **JPEG** olarak kaydeder (`sharp` kuruluysa). Bu görsel **liste kartında** ve detayda **ilk slayt** olarak kullanılır. |
| **Ek fotoğraflar** | Hayır | İsterseniz alttaki ikinci kutudan **birden fazla** dosya seçin (Ctrl ile çoklu seçim veya sürükle-bırak). Bunlar detay sayfasında kapaktan **sonra** yatay kaydırmayla gösterilir. Her biri `assets/covers/` altında yeni bir `cover-XXX.jpg` dosyası olur; `catalog.ts` içinde `galleryImages` dizisi olarak eklenir. |
| **Model ismi** | Evet | Uygulamada görünen başlık. Kaydedildikten sonra katalogda **tagline** satırı da otomatik olarak “isim · seçilen formatlar” biçiminde güncellenir. |
| **Fiyat (TL)** | Evet | Tam sayı (lira). Sepette ve listede bu değer gösterilir. |
| **Kategori** | Evet | Açılır liste, `catalog.ts` içindeki **`CATEGORIES`** dizisinden dolar. Listede yoksa önce dosyada yeni kategori tanımlayıp sayfayı yenileyin (aşağıdaki 4.4). |
| **Dosya formatları** | En az biri | GLB, OBJ, FBX, STL, STEP — hangi dosyaların satıldığını / sunulduğunu ifade eder; tagline ve model açıklaması metinlerinde kullanılır. |
| **Açıklama** | Hayır | Boş bırakılırsa otomatik metin: “*Model ismi* modeli” şeklinde yazılır. Uzun metin girmek isterseniz ileride `catalog.ts` içinden düzenleyebilirsiniz. |

**Modeli Ekle** düğmesine bastığınızda:

1. Form doğrulanır (resim, isim, fiyat, kategori eksikse hata mesajı çıkar).
2. Kategori, sunucuda izinli listede değilse kayıt reddedilir (liste `CATEGORIES` ile uyumlu olmalı).
3. Başarılı olursa yeşil onay mesajında kapak dosya adı, varsa **+N ek** ve toplam model sayısı gösterilir; form sıfırlanır.

**Not:** Aynı anda iki kişi admin kullanıyorsa dosya çakışması riski vardır; tek kullanıcı veya dikkatli kullanım önerilir.

---

### 4.2 Model düzenleme (`/manage` → Düzenle)

**Modelleri Yönet** sayfasında her kartta **Düzenle** düğmesi vardır. Tıklayınca bir **pencere (modal)** açılır. Kart üzerinde **+N fotoğraf** yazıyorsa o modelde detay galerisinde **N adet ek görsel** (kapak hariç) vardır.

**Değiştirebileceğiniz alanlar**

| Alan | Açıklama |
|------|----------|
| **Model ismi** | Katalogdaki `title` güncellenir; aynı blokta **tagline** satırı admin tarafından **yalnızca yeni başlık metnine** yazılır (önceki “isim · formatlar” metni kaybolabilir). Gerekirse `catalog.ts` içinde `tagline`’ı elle düzeltin. |
| **Fiyat (TL)** | `price` alanı; tam sayı olmalı. |
| **Kategori** | `category` alanı. Liste yine `CATEGORIES`’ten gelir. Modelde katalogda olup listede henüz olmayan nadir bir değer varsa, düzenle penceresinde o değer de seçenek olarak eklenir (kaydetmeden önce doğru kategoriyi seçebilirsiniz). |
| **Açıklama** | `description` alanı; çok satırlı yazabilirsiniz. |
| **Detay fotoğrafları** | Kapak **bu listede yoktur**; kapak yalnızca “yeni model ekle” sırasında veya `catalog.ts` içinde `coverImage` ile değiştirilir. Burada gördükleriniz `galleryImages` dizisindeki ek slaytlardır. **Sil:** Onaydan sonra o satır katalogdan çıkar; görsel dosyası **başka hiçbir modelde aynı dosya adıyla kullanılmıyorsa** diskten de silinir (aynı `cover-XXX.jpg` başka kayıtta da varsa dosya korunur). **Fotoğraf ekle:** Dosya seçip düğmeye basın; yeni `cover-XXX.jpg` üretilir ve galeri sonuna eklenir. |

**Kaydet** ile yalnızca **isim, fiyat, kategori, açıklama** diske yazılır. Galeri ekleme/silme **anında** ayrı isteklerle `catalog.ts` ve `assets/covers/` güncellenir; **Kaydet**’e basmanız gerekmez.

**Vazgeç** ile pencere kapanır; yazılmamış metin alanı değişiklikleri kaybolur (galeri zaten yaptıysanız o işlemler kalıcıdır).

Üstteki **arama kutusu** ile listeyi isim, ID veya **kategori adına** göre süzebilirsiniz.

---

### 4.3 Model silme (`/manage` → Sil)

**Sil** düğmesine basınca onay penceresi açılır: hangi ID ve ismin silineceği yazar.

- **Evet, Sil** derseniz:
  - `data/catalog.ts` içinden **o modelin tüm bloğu** kaldırılır.
  - O blokta geçen **tüm kapak ve galeri** görselleri (`coverImage` ve `galleryImages` içindeki `cover-XXX.jpg` dosyaları) diskten **silinir** (geri getirme yok).
- **Vazgeç** ile işlem iptal edilir.

**Dikkat:** Silme **geri alınamaz**. Yanlışlıkla silindiyse yedekten veya Git geçmişinden `catalog.ts` ve görseli geri yüklemeniz gerekir.

---

### 4.4 Kategori listesi nereden gelir?

Kategori açılır listesi **`data/catalog.ts` içindeki `export const CATEGORIES`** dizisinden otomatik okunur. Sayfayı yenilediğinizde güncel liste gelir.

**Yeni bir kategori türü eklemek için (üç yol):**

**A) Kısayol / toplu iş (önerilen)**  
Proje kökündeki **`Kategori-Ekle.bat`** dosyasına çift tıklayın; kategori adını yazıp Enter verin. `data/catalog.ts` içinde hem `ModelCategory` hem `CATEGORIES` güncellenir.  
Masaüstüne kısayol için: `Kategori-Ekle.bat` dosyasına sağ tıklayın → **Gönder** → **Masaüstü (kısayol oluştur)**.

Komut satırından aynı iş:

```powershell
cd model-market
npm run add-category -- "Kategori Adı"
```

**B) Elle**  
1. `data/catalog.ts` içinde **`ModelCategory`** tipine yeni metni ekleyin.  
2. **`CATEGORIES`** dizisine aynı metni, istediğiniz sekme sırasıyla ekleyin.

**C) Cursor / yapay zekâ ile**  
Sohbette “`catalog.ts` içine şu adlı kategoriyi ekle” derseniz, düzenleme burada yapılabilir (yine `ModelCategory` + `CATEGORIES`).

**Son adım (her yöntemde):** Admin sayfasını yenileyin; modellere bu `category` değerini atayın.

> Uygulamada üst sekmeler yalnızca **ürünü olan** kategorileri gösterir; ürün eklenince ilgili sekme belirir.

### 4.5 Elle `catalog.ts` ile galeri (isteğe bağlı)

Admin kullanmadan veya toplu düzenleme için `data/catalog.ts` içinde ilgili modele şunu ekleyebilirsiniz:

- **`galleryImages`:** `coverImage` satırından sonra, isteğe bağlı dizi. Her öğe `require('../assets/covers/dosya.jpg')` şeklinde olmalı; dosyalar `assets/covers/` klasöründe gerçekten bulunmalıdır.

Uygulama detay ekranı slaytları **`getDetailSlides`** ile oluşturur: önce kapak, sonra `galleryImages` sırasıyla.

### 4.6 Geliştirici notu (admin HTTP API)

Otomasyon veya özel araçlar için `scripts/admin.cjs` şu uçları sunar (localhost, admin çalışırken):

| Yöntem ve yol | Gövde | Açıklama |
|---------------|--------|----------|
| `POST /api/add` | `multipart/form-data`: `image` (zorunlu kapak), `gallery` (isteğe bağlı, çoklu), `title`, `price`, `category`, `formats`, `desc` | Yeni model + dosyalar |
| `POST /api/add-gallery` | `multipart/form-data`: `id` (model id), `gallery` (bir veya çoklu dosya) | Mevcut modele ek slayt |
| `POST /api/remove-gallery` | JSON: `{ "id": "12", "index": 0 }` | `index` = ek galerideki sıra (0 = ilk ek foto; kapak sayılmaz) |
| `GET /api/list` | — | Modeller; her birinde `gallery` (dosya adları dizisi) ve `galleryCount` |

### 4.7 PowerShell ve Git ipucu

Dosya yolu parantez içeriyorsa tırnak kullanın:

```powershell
git add "app/(tabs)/index.tsx"
```

---

## 5. Web dışa aktarma ve GitHub Pages (isteğe bağlı)

Statik web derlemesi ve `docs` klasörüne kopyalama için:

```powershell
npm run publish:docs
```

`app.json` içindeki `experiments.baseUrl` (ör. `/3D-MODELLER/`) GitHub Pages alt yolu ile uyumlu olmalıdır. **Adım adım kopyala-yapıştır komutları** proje kökündeki **`KOLAY-GITHUB-PAGES.txt`** dosyasındadır. İş akışı ayrıntıları için `.github/workflows/deploy-pages.yml` dosyasına da bakabilirsiniz.

---

## 6. Diğer komutlar

| Komut | Açıklama |
|--------|----------|
| `npm run sync-covers` | Kapak görselleri ve katalog senkron script’i (bakınız: `scripts/sync-covers-and-catalog.cjs`). |

---

## 7. Sık sorulanlar

**Beğeniler veya sepet başka telefonda görünür mü?**  
Hayır; veriler yalnızca o cihazda / tarayıcıda saklanır.

**“Senin İçin” bana özel mi?**  
Hayır; isimlendirme pazarlama amaçlıdır, sıra katalog dizilimine bağlıdır.

**Admin’i kapatmak için**  
Bölüm 4’te anlatıldığı gibi terminalde `Ctrl+C`.

---

## 8. Yardım ve kaynak kod

- Uygulama girişi: `app/_layout.tsx`, sekmeler: `app/(tabs)/`.
- Mağaza listesi: `app/(tabs)/index.tsx`.
- Katalog verisi: `data/catalog.ts`.
- Beğeni: `context/LikesContext.tsx`, `components/ModelLikeButton.tsx`.
- Admin sunucusu: `scripts/admin.cjs`.

Sorun yaşarsanız önce `npm install` ve `npx expo start --clear` deneyin; web için tarayıcı önbelleğini temizlemek de yardımcı olabilir.
