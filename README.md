# Rumah Merah — Kenali Ahli

Laman web untuk mengenali ahli Rumah Merah mengikut 4 kategori: **Pra, Fungsi, Tahap 1, Tahap 2**.

- **Gambar** → disimpan dalam repo GitHub (folder `images/`).
- **Nama & kategori** → diuruskan melalui laman `/admin` di laman web sendiri (upload CSV, tambah satu-satu, atau padam) — tak perlu buka Firebase Console setiap kali.
- **Domain custom** → `merah.syazr.com`

---

## 1. Struktur fail

```
rumah-sukan/
├── index.html          <- auto alih ke /merahteam/ (root domain)
├── merahteam/
│   ├── index.html        <- laman utama (untuk semua orang lihat)
│   └── app.js
├── admin.html           <- auto alih ke /admin/ (untuk sesiapa bookmark URL lama)
├── admin/
│   ├── index.html        <- urus DATA MURID & GURU/PPM (perlu log masuk)
│   ├── admin.css
│   └── admin.js
├── acara/
│   ├── index.html        <- laman awam: senarai acara & peserta
│   └── acara.js
├── guru/
│   ├── index.html        <- laman awam: senarai guru & PPM
│   └── guru.js
├── urus/
│   ├── index.html        <- cipta acara, tambah peserta, reset kehadiran (TANPA log masuk)
│   ├── urus.css
│   └── urus.js
├── style.css
├── firebase-config.js  <- sudah diisi dengan konfigurasi projek "sukanmerah"
├── template.csv         <- contoh templat untuk diisi & upload
├── manifest.json         <- PWA (install jadi app)
├── service-worker.js     <- PWA (network-first, fallback cache bila offline)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── CNAME                 <- domain custom (merah.syazr.com)
├── images/
│   ├── pra/
│   ├── fungsi/
│   ├── tahap1/
│   ├── tahap2/
│   ├── guru/
│   └── ppm/
└── README.md
```

Selepas dihoskan:
- `merah.syazr.com` — auto alih terus ke `/merahteam`
- `merah.syazr.com/merahteam` — laman utama, semua orang lihat & tanda kehadiran
- `merah.syazr.com/acara` — paparan awam acara & peserta
- `merah.syazr.com/guru` — paparan awam guru & PPM
- `merah.syazr.com/urus` — cipta/urus acara & reset kehadiran (**tiada log masuk**)
- `merah.syazr.com/admin` — urus data murid & guru/PPM (nama/gambar) — **perlu log masuk**

---

## 2. Konsep asas (senang punya)

Firebase Firestore ialah "senarai" data dalam talian. Bayangkan macam
Excel simple:

- **Collection** = nama jadual, dalam kes kita: `murid`
- **Document** = satu baris dalam jadual itu = satu murid
- Setiap document ada 3 medan: `nama`, `kategori`, `gambar`

Anda **tidak perlu** faham/sentuh Firestore Console langsung selepas
setup awal. Semua tambah/padam murid dibuat di `/admin`.

---

## 3. Setup sekali sahaja: Firestore Rules

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → pilih projek **sukanmerah**.
2. **Build → Firestore Database → Create database** (kalau belum ada) → Start in **production mode** → pilih lokasi (cth. `asia-southeast1`).
3. Pergi tab **Rules**, gantikan dengan:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /murid/{docId} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.token.email in ["merah@gmail.com"];
       }
       match /guru/{docId} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.token.email in ["merah@gmail.com"];
       }
       match /acara/{docId} {
         allow read: if true;
         allow write: if request.resource.data.namaAcara is string
                       && request.resource.data.pesertaIds is list
                       && request.resource.data.pesertaIds.size() <= 20;
         allow delete: if true;
       }
       match /kehadiran/{docId} {
         allow read: if true;
         allow write: if request.resource.data.keys().hasOnly(['hadir', 'waktu'])
                       && request.resource.data.hadir is bool;
         allow delete: if true;
       }
     }
   }
   ```

   Maksudnya: **sesiapa boleh lihat** senarai murid & senarai acara di
   laman utama. **Hanya `merah@gmail.com`** yang log masuk boleh
   tambah/padam **murid** (nama & gambar) melalui `/admin`. Tapi
   **`acara`** dan **`kehadiran`** sengaja dibiarkan terbuka tanpa log
   masuk — sesiapa dengan pautan boleh cipta acara, tambah/buang
   peserta, dan reset kehadiran melalui `/urus`, supaya guru lain boleh
   bantu semasa hari sukan tanpa perlu akaun admin. Ini bermakna
   sesiapa (termasuk murid, jika mereka jumpa pautan) turut boleh buat
   perkara sama — kalau ini jadi isu kemudian, boleh minta saya tambah
   sekatan PIN atau log masuk ringkas untuk `/urus`.

   Kalau nak tambah lebih dari satu admin, senaraikan beberapa emel:
   `request.auth.token.email in ["merah@gmail.com", "guru2@gmail.com"]`

---

## 4. Setup sekali sahaja: Cara log masuk untuk /admin

Ada 2 pilihan — boleh guna salah satu atau kedua-duanya sekali.

### Pilihan A: Log masuk dengan Google (disyorkan — lebih senang)

1. Firebase Console → **Build → Authentication → Get started** (jika belum).
2. Tab **Sign-in method** → klik **Google** → **Enable** → pilih emel
   sokongan (support email, biasanya emel anda sendiri) → **Save**.
3. Buka `admin/admin.js` dalam repo, cari bahagian ini berhampiran
   bahagian atas fail:

   ```js
   const ALLOWED_ADMIN_EMAILS = [
     // "guru@gmail.com",
   ];
   ```

   Nyahkomen dan isi dengan emel Google anda (dan emel guru lain yang
   dibenarkan), contoh:

   ```js
   const ALLOWED_ADMIN_EMAILS = [
     "guru@gmail.com",
   ];
   ```

   Ini untuk mesej ralat yang jelas sahaja. Sekatan **sebenar** mesti
   ditetapkan dalam Firestore Rules — lihat langkah 3, tukar rule
   `write` kepada:

   ```
   allow write: if request.auth != null
     && request.auth.token.email in ["guru@gmail.com"];
   ```

   Tampal syarat ini pada `match /murid/{docId}` sahaja — `acara` dan
   `kehadiran` sengaja kekal terbuka (lihat bahagian 3) supaya
   `/urus` boleh digunakan tanpa log masuk.

   (Senaraikan emel yang sama di kedua-dua tempat — `admin.js` dan
   Firestore Rules.)

### Pilihan B: Emel & kata laluan (Firebase Authentication)

1. Tab **Sign-in method** → aktifkan **Email/Password**.
2. Tab **Users** → **Add user** → masukkan emel & kata laluan pilihan
   anda.

`firebase-config.js` sudah diisi dengan konfigurasi projek "sukanmerah"
anda — tak perlu ubah apa-apa di situ.

---

## 5. Host di GitHub Pages

1. Buat repo baru di GitHub, muat naik **semua** fail dalam folder ini
   (termasuk folder `admin/` dan fail `CNAME`).
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)` → Save.
3. Buat masa ini laman boleh diakses di
   `https://<username-anda>.github.io/<nama-repo>/` — teruskan ke
   langkah domain custom di bawah untuk guna `merah.syazr.com`.

---

## 6. Setup domain custom: merah.syazr.com

**A) Di GitHub (repo settings)**
1. **Settings → Pages → Custom domain** → taip `merah.syazr.com` → Save.
   (Fail `CNAME` yang sudah disertakan dalam repo ini akan buat GitHub
   isikan medan ini secara automatik sebenarnya — tapi sahkan ia
   dipaparkan betul dalam tetapan.)
2. Jangan tandakan "Enforce HTTPS" dahulu — tunggu DNS selesai (langkah B).

**B) Di pembekal domain syazr.com (DNS)**
Tambah satu rekod **CNAME**:

| Jenis | Nama/Host | Nilai/Arahkan ke |
|-------|-----------|-------------------|
| CNAME | `merah`   | `<username-anda>.github.io` |

(Guna panel DNS di tempat domain `syazr.com` didaftarkan — cth.
Cloudflare, Namecheap, dsb. Nama host cuma `merah`, bukan
`merah.syazr.com` penuh, sebab subdomain induk `syazr.com` sudah
tersirat.)

**C) Tunggu & sahkan**
- DNS boleh ambil masa 10 minit hingga beberapa jam untuk merebak.
- Bila sudah aktif, kembali ke **Settings → Pages** di GitHub, tanda
  ✅ **Enforce HTTPS** supaya laman guna `https://` secara automatik.
- Selepas ini, laman utama = `https://merah.syazr.com`
  dan laman admin = `https://merah.syazr.com/admin`

**Penting:** Firebase tidak perlu tahu tentang domain custom ini untuk
Firestore/Authentication berfungsi — ia cuma perlu jika nanti guna
Firebase Hosting (bukan kes kita, sebab kita host di GitHub Pages).

---

## 7. Guna /admin untuk tambah murid

Buka `merah.syazr.com/admin`, log masuk dengan emel/kata laluan dari
langkah 4. Ada 3 cara tambah data:

### A) Upload ramai sekali gus (CSV)
```
nama,kategori,gambar
Ali,Pra,ali.jpg
Siti,Tahap 1,siti.png
Aiman,Fungsi,
```
Ada butang **⬇ Muat turun templat CSV** di halaman admin (fail
`template.csv` turut disertakan dalam repo ini) — isi dalam
Excel/Google Sheets, simpan sebagai CSV, upload semula.

### B) Tambah seorang sahaja
Borang ringkas — nama, pilih kategori, nama fail gambar (pilihan).

### C) Padam murid
Bahagian "Senarai semasa" — butang **Padam** di sebelah setiap nama.

### D) Tambah Guru & PPM
Bahagian **"4. Guru & PPM"** — borang ringkas sama macam murid: nama,
pilih peranan (Guru/PPM), nama fail gambar (pilihan). Letak gambar
dalam repo di `images/guru/` atau `images/ppm/`. Papar terus di laman
awam `merah.syazr.com/guru`.

`/admin` **khusus untuk data murid & staf** (nama & gambar) — memerlukan
log masuk sebab data ni lebih sensitif. Acara, peserta, dan kehadiran
diuruskan di `/urus` (lihat bahagian 8) yang **tidak** perlukan log
masuk, supaya guru lain boleh bantu tanpa akaun admin.

---

## 8. Guna /urus untuk acara, peserta & kehadiran

Buka `merah.syazr.com/urus` — **tiada log masuk diperlukan**, sesiapa
dengan pautan ini boleh guna terus.

### Cipta acara & pilih peserta
1. Taip nama acara (cth. `100 M Tahap 2`) dan klik **Simpan Acara**
   (boleh simpan dahulu tanpa peserta).
2. Untuk tambah peserta: klik **Edit** pada acara berkenaan dalam
   senarai bawah, guna kotak carian untuk cari nama murid, tanda
   checkbox murid yang menyertai (1 hingga 20 orang — ada gambar kecil
   & label kategori supaya senang kenal pasti murid yang serupa nama),
   klik **Kemaskini Acara**.
3. Klik **Padam** untuk buang acara.

Acara yang disimpan akan terus dipaparkan di laman awam
**`merah.syazr.com/acara`** — nama acara sebagai tajuk, diikuti gambar
& nama setiap peserta.

### Reset Kehadiran
Klik **"Reset Kehadiran Sekarang"** untuk kosongkan semua tanda hadir
serta-merta, tanpa tunggu 24 jam (lihat bahagian 9).

> ⚠️ Sebab laman ni terbuka tanpa log masuk, **sesiapa** dengan pautan
> `/urus` (termasuk murid, jika mereka jumpa pautan) boleh cipta/padam
> acara dan reset kehadiran. Ini keputusan sengaja untuk kemudahan
> semasa hari sukan — kalau jadi isu kemudian, boleh minta saya tambah
> PIN atau log masuk ringkas untuk laman ni.

---

## 9. Kehadiran (tap-to-mark)

Di laman utama, **tekan kad murid** untuk tandakan dia hadir hari ini —
kad akan tunjuk tanda ✓ hijau, dan label kategori bertukar jadi
"Hadir". Tekan sekali lagi untuk buang tanda tersebut.

- Tanda hadir **hilang automatik selepas 24 jam** dari masa ditekan
  (dikira semasa paparan — rekod lama tak perlu dipadam secara manual,
  cuma tak dipaparkan lagi selepas 24 jam).
- Boleh juga tekan **"Reset Kehadiran Sekarang"** di `/urus` untuk
  kosongkan semua tanda hadir serta-merta, tanpa tunggu 24 jam.
- Paparan kehadiran **kemas kini secara langsung** (real-time) — kalau
  dua peranti buka laman yang sama serentak, tanda hadir akan
  terpapar di kedua-duanya tanpa perlu reload.

---

## 10. Letak gambar murid

Gambar diletak terus dalam repo, dalam folder kategori yang betul:

```
images/pra/ali.jpg
images/tahap1/siti.png
```

Nama fail mesti **sama persis** dengan yang ditaip dalam lajur/medan
`gambar` semasa tambah data (huruf besar/kecil turut dikira).

---

## 11. Install jadi App (PWA)

Laman ini boleh "dipasang" macam app biasa (ada ikon sendiri, buka
tanpa bar alamat browser).

- **Android (Chrome):** buka `merah.syazr.com` → menu ⋮ → **"Add to
  Home screen"** / **"Install app"**.
- **iPhone (Safari):** buka laman → ikon **Share** (⬆) → **"Add to
  Home Screen"**.
- **Desktop (Chrome/Edge):** ikon "install" (⊕) akan muncul di hujung
  bar alamat.

Ikon app (`icons/icon-192.png`, `icons/icon-512.png`) ialah ikon
ringkas "RM" atas latar merah jenama — boleh ganti dengan logo Rumah
Merah sebenar bila-bila masa, asalkan nama fail & saiz (192×192,
512×512 piksel) kekal sama.

**Nota:** `manifest.json` & `service-worker.js` guna path mutlak
(`/manifest.json`, `/icons/...`) — ini berfungsi sebab laman dihoskan
di root domain custom (`merah.syazr.com`). Kalau suatu hari anda host
tanpa domain custom (cth. `username.github.io/nama-repo/`), path ini
perlu ditukar kepada laluan relatif — boleh minta saya betulkan bila
sampai masanya.

---

## 12. Uji di komputer sendiri (pilihan)

```bash
cd rumah-sukan
python3 -m http.server 8000
```

Buka `http://localhost:8000` (laman utama) dan
`http://localhost:8000/admin/` (panel admin) di pelayar.
