// firebase-config.js
// GANTI nilai di bawah dengan konfigurasi projek Firebase anda sendiri.
// Dapatkan nilai ini di: Firebase Console > Project settings > General
// > "Your apps" > SDK setup and configuration (pilih "Config").

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI_SENDER_ID",
  appId: "GANTI_APP_ID",
};

firebase.initializeApp(firebaseConfig);
