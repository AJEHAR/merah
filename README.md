# Rumah Merah — Kenali Ahli

Laman web untuk mengenali ahli Rumah Merah mengikut 4 kategori: **Pra, Fungsi, Tahap 1, Tahap 2**.

- **Gambar** → disimpan dalam repo GitHub (folder `images/`).
- **Nama & kategori** → disimpan di Firebase Firestore, tapi **anda tak perlu buka Firebase Console setiap kali** — semuanya diuruskan melalui laman `admin.html` (upload CSV, tambah satu-satu, atau padam).

---

## 1. Struktur fail

```
rumah-sukan/
├── index.html          <- laman utama (untuk semua orang lihat)
├── admin.html           <- laman urus data (untuk guru sahaja)
├── style.css
├── admin.css
├── app.js
├── admin.js
├── firebase-config.js  <- sudah diisi dengan konfigurasi projek "sukanmerah"
├── images/
│   ├── pra/
│   ├── fungsi/
│   ├── tahap1/
│   └── tahap2/
└── README.md
```

---

## 2. Konsep asas (senang punya)

Firebase Firestore ialah "senarai" data dalam talian. Bayangkan macam
Excel simple:

- **Collection** = nama jadual, dalam kes kita: `murid`
- **Document** = satu baris dalam jadual itu = satu murid
- Setiap document ada 3 medan: `nama`, `kategori`, `gambar`

Anda **tidak perlu** faham/sentuh Firestore Console langsung. Console
cuma digunakan **sekali sahaja** semasa setup (langkah 3 & 4 di bawah).
Selepas itu, semua tambah/padam murid dibuat di `admin.html`.

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

   Maksudnya: **sesiapa boleh lihat** senarai murid di `index.html`,
   tetapi **hanya orang yang log masuk** (guru) boleh tambah/padam data
   melalui `admin.html`.

---

## 4. Setup sekali sahaja: Akaun log masuk untuk admin.html

1. Dalam Firebase Console → **Build → Authentication → Get started**.
2. Tab **Sign-in method** → aktifkan **Email/Password**.
3. Tab **Users** → **Add user** → masukkan emel & kata laluan anda
   sendiri (ini akaun log masuk untuk `admin.html`, bukan untuk murid).

Selesai — `firebase-config.js` dalam projek ini sudah diisi dengan
konfigurasi projek "sukanmerah" anda, jadi tak perlu ubah apa-apa lagi
di situ.

---

## 5. Guna admin.html untuk tambah murid

Buka `admin.html` (link "Urus data" ada di footer `index.html`), log
masuk dengan emel/kata laluan dari langkah 4. Ada 3 cara tambah data:

### A) Upload ramai sekali gus (CSV)
Sediakan fail CSV / atau taip terus dalam kotak teks, format:

```
nama,kategori,gambar
Ali,Pra,ali.jpg
Siti,Tahap 1,siti.png
Aiman,Fungsi,
```

Ada butang **⬇ Muat turun templat CSV** di `admin.html` (dan fail
`template.csv` disertakan dalam repo ini) — buka dengan Excel/Google
Sheets, isi baris untuk setiap murid, simpan semula sebagai CSV, terus
upload.

- Lajur `kategori` boleh ditaip macam biasa — "Pra", "tahap 1", "TAHAP2"
  semua akan dikenali secara automatik.
- Lajur `gambar` (nama fail gambar) boleh dibiarkan kosong dan diisi
  kemudian — paparan akan tunjuk inisial nama sementara tiada gambar.
- Klik **Semak Senarai** untuk pratonton, semak baris yang bermasalah
  (ditanda merah), kemudian klik **Sahkan & Tambah Semua**.

### B) Tambah seorang sahaja
Guna borang ringkas — nama, pilih kategori, nama fail gambar (pilihan).

### C) Padam murid
Bahagian "Senarai semasa" memaparkan semua murid mengikut kategori,
dengan butang **Padam** di sebelah setiap nama.

---

## 6. Letak gambar murid

Gambar **tidak** melalui laman web — letak terus dalam repo GitHub,
dalam folder kategori yang betul:

```
images/pra/ali.jpg
images/tahap1/siti.png
```

Nama fail mesti **sama persis** dengan yang ditaip dalam lajur/medan
`gambar` semasa tambah data (huruf besar/kecil turut dikira).

---

## 7. Host di GitHub Pages

1. Buat repo baru di GitHub, muat naik semua fail dalam folder ini.
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)` → Save.
3. Laman akan boleh diakses di:
   `https://<username-anda>.github.io/<nama-repo>/`
4. Laman utama untuk semua orang: `.../index.html`
   Laman urus data untuk guru: `.../admin.html`

---

## 8. Uji di komputer sendiri (pilihan)

```bash
cd rumah-sukan
python3 -m http.server 8000
```

Buka `http://localhost:8000` di pelayar.
