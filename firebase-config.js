// firebase-config.js
// Konfigurasi projek Firebase "sukanmerah".
// Nota: apiKey di sini SELAMAT untuk didedahkan secara awam — ia bukan
// kata laluan, cuma pengenalan projek. Keselamatan sebenar dikawal oleh
// Firestore Rules + Firebase Authentication (lihat README.md).

const firebaseConfig = {
  apiKey: "AIzaSyAUTyl4CR4Z8cBaf1szX4cJRBbTEexVi60",
  authDomain: "sukanmerah.firebaseapp.com",
  projectId: "sukanmerah",
  storageBucket: "sukanmerah.firebasestorage.app",
  messagingSenderId: "321790084306",
  appId: "1:321790084306:web:a78a69984243e8cb35d90b",
  measurementId: "G-260NL5YKWY",
};

firebase.initializeApp(firebaseConfig);
