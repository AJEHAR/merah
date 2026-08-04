# Kenali Murid

Laman web mudah untuk mengenali murid mengikut 4 kategori: **Pra, Fungsi, Tahap 1, Tahap 2**.
Gambar disimpan terus dalam repo GitHub. Senarai nama & kategori disimpan di **Firebase Firestore**.

---

## 1. Struktur fail

```
rumah-sukan/
├── index.html
├── style.css
├── app.js
├── firebase-config.js      <- isi dengan konfigurasi Firebase anda
├── images/
│   ├── pra/                <- gambar murid kategori Pra
│   ├── fungsi/              <- gambar murid kategori Fungsi
│   ├── tahap1/               <- gambar murid kategori Tahap 1
│   └── tahap2/               <- gambar murid kategori Tahap 2
└── README.md
```

Letak gambar murid dalam folder kategori masing-masing. Nama fail bebas
(cth: `ali.jpg`, `siti_nurhaliza.png`) — nanti nama fail ini yang anda
masukkan dalam Firestore (langkah 3).

---

## 2. Setup Firebase (untuk simpan senarai nama)

1. Pergi ke [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → ikut *wizard* (boleh matikan Google Analytics, tak perlu).
2. Dalam projek, pergi ke **Build → Firestore Database → Create database**.
   - Pilih **Start in production mode**.
   - Pilih lokasi server (contohnya `asia-southeast1`).
3. Pergi ke **Firestore → Rules**, dan tukar kepada rules berikut supaya
   sesiapa boleh **baca** senarai murid, tetapi tiada sesiapa boleh
   menulis/ubah terus dari laman web (anda tambah data melalui Console sahaja):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /murid/{docId} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

4. Pergi ke **Project settings (ikon gear) → General → Your apps → Add app → Web (</>)**.
   Daftar nama app (cth: `kenali-murid`), tak perlu Firebase Hosting.
5. Firebase akan beri anda kod `firebaseConfig` seperti ini:

   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```

   Salin nilai-nilai ini ke dalam fail **`firebase-config.js`** (gantikan
   nilai `GANTI_...`).

---

## 3. Tambah data murid

Dalam Firebase Console → **Firestore Database → Start collection**.

- Collection ID: `murid`
- Untuk setiap murid, tambah satu **document** (boleh guna Auto-ID) dengan medan:

  | Medan      | Jenis  | Contoh nilai         |
  |------------|--------|-----------------------|
  | `nama`     | string | `Ali`                |
  | `kategori` | string | `pra` / `fungsi` / `tahap1` / `tahap2` |
  | `gambar`   | string | `ali.jpg` (nama fail gambar dalam folder `images/<kategori>/`) |

  Ulang untuk setiap murid. Ejaan `kategori` **mesti** sama persis dengan
  salah satu daripada 4 nilai di atas (huruf kecil, tiada ruang) supaya
  ia dipadankan dengan tab yang betul di laman web.

---

## 4. Host di GitHub Pages

1. Buat repo baru di GitHub (cth: `kenali-murid`), dan muat naik semua
   fail dalam folder `rumah-sukan/` (termasuk folder `images/` yang
   sudah ada gambar, dan `firebase-config.js` yang sudah diisi).
2. Pergi ke **Settings → Pages** dalam repo tersebut.
3. Pada **Source**, pilih branch `main` dan folder `/ (root)` → **Save**.
4. Tunggu 1-2 minit, laman web akan boleh diakses di:
   `https://<username-anda>.github.io/<nama-repo>/`

---

## 5. Nota keselamatan

- `firebaseConfig` (apiKey dsb.) **selamat untuk didedahkan secara awam**
  — ia bukan kata laluan, ia hanya pengenalan projek. Keselamatan
  sebenar dikawal oleh **Firestore Rules** (langkah 2.3), yang kita
  set sebagai baca-sahaja untuk umum.
- Oleh sebab `allow write: if false`, data hanya boleh ditambah/diubah
  melalui Firebase Console (bukan dari laman web awam) — ini elak
  sesiapa iseng menambah/memadam data murid.
- Jika kelak mahu tambah/kemaskini murid dengan lebih senang tanpa
  buka Console setiap kali, boleh minta saya bina laman **admin**
  berasingan yang dilindungi log masuk (Firebase Authentication).

---

## 6. Uji di komputer sendiri (pilihan)

Fail ini boleh terus dibuka dengan pelayar (double-click `index.html`),
tetapi sesetengah pelayar sekat permintaan Firebase bila dibuka terus
dari fail (`file://`). Lebih selamat jalankan pelayan tempatan:

```bash
cd rumah-sukan
python3 -m http.server 8000
```

Kemudian buka `http://localhost:8000` di pelayar.
