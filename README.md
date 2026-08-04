# Rumah Merah — Kenali Ahli

Laman web untuk mengenali ahli Rumah Merah mengikut 4 kategori: **Pra, Fungsi, Tahap 1, Tahap 2**.

- **Gambar** → disimpan dalam repo GitHub (folder `images/`).
- **Nama & kategori** → diuruskan melalui laman `/admin` di laman web sendiri (upload CSV, tambah satu-satu, atau padam) — tak perlu buka Firebase Console setiap kali.
- **Domain custom** → `merah.syazr.com`

---

## 1. Struktur fail

```
rumah-sukan/
├── index.html          <- laman utama (untuk semua orang lihat)
├── admin.html           <- auto alih ke /admin/ (untuk sesiapa bookmark URL lama)
├── admin/
│   ├── index.html        <- laman urus data sebenar (guru sahaja)
│   ├── admin.css
│   └── admin.js
├── style.css
├── app.js
├── firebase-config.js  <- sudah diisi dengan konfigurasi projek "sukanmerah"
├── template.csv         <- contoh templat untuk diisi & upload
├── CNAME                 <- domain custom (merah.syazr.com)
├── images/
│   ├── pra/
│   ├── fungsi/
│   ├── tahap1/
│   └── tahap2/
└── README.md
```

Selepas dihoskan, laman admin boleh diakses di **`merah.syazr.com/admin`**
(dengan atau tanpa `/` di hujung — kedua-duanya berfungsi).

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
         allow write: if request.auth != null;
       }
     }
   }
   ```

   Maksudnya: **sesiapa boleh lihat** senarai murid di laman utama,
   tetapi **hanya orang yang log masuk** (guru) boleh tambah/padam data
   melalui `/admin`.

---

## 4. Setup sekali sahaja: Akaun log masuk untuk /admin

1. Firebase Console → **Build → Authentication → Get started**.
2. Tab **Sign-in method** → aktifkan **Email/Password**.
3. Tab **Users** → **Add user** → masukkan emel & kata laluan anda
   sendiri (akaun log masuk untuk `/admin`, bukan untuk murid).

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

---

## 8. Letak gambar murid

Gambar diletak terus dalam repo, dalam folder kategori yang betul:

```
images/pra/ali.jpg
images/tahap1/siti.png
```

Nama fail mesti **sama persis** dengan yang ditaip dalam lajur/medan
`gambar` semasa tambah data (huruf besar/kecil turut dikira).

---

## 9. Uji di komputer sendiri (pilihan)

```bash
cd rumah-sukan
python3 -m http.server 8000
```

Buka `http://localhost:8000` (laman utama) dan
`http://localhost:8000/admin/` (panel admin) di pelayar.
