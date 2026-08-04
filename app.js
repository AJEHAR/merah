// app.js
// Membaca senarai murid daripada koleksi Firestore "murid" dan memaparkannya
// sebagai kad mengikut kategori (pra / fungsi / tahap1 / tahap2).
//
// Setiap dokumen dalam koleksi "murid" dijangka mempunyai medan:
//   nama      : string  -> nama panggilan murid
//   kategori  : string  -> "pra" | "fungsi" | "tahap1" | "tahap2"
//   gambar    : string  -> nama fail gambar di dalam folder images/<kategori>/
//
// Kehadiran (tap-to-mark): klik/tekan kad murid untuk tanda hadir.
// Disimpan dalam collection "kehadiran" (doc ID = ID murid), medan:
//   hadir : boolean
//   waktu : Firestore server timestamp
// Tanda hadir dianggap luput selepas 24 jam (dikira semasa paparan,
// bukan dipadam serta-merta) — atau terus dipadam oleh admin melalui
// butang "Reset Kehadiran" di /admin.

const CATEGORY_LABELS = {
  pra: "Pra",
  fungsi: "Fungsi",
  tahap1: "Tahap 1",
  tahap2: "Tahap 2",
};

const HADIR_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

let allStudents = [];
let activeCategory = "pra";
let attendanceMap = {}; // { [muridId]: millis }

const gridEl = document.getElementById("grid");
const countEl = document.getElementById("countText");
const emptyEl = document.getElementById("emptyState");
const tabsEl = document.getElementById("tabs");

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function isHadir(id) {
  const t = attendanceMap[id];
  if (!t) return false;
  return Date.now() - t < HADIR_TTL_MS;
}

function renderStudents(category) {
  const list = allStudents.filter((s) => s.kategori === category);
  const hadirCount = list.filter((s) => isHadir(s.id)).length;

  countEl.textContent = `${CATEGORY_LABELS[category]} — ${list.length} murid · ${hadirCount} hadir`;
  gridEl.innerHTML = "";

  if (list.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const frag = document.createDocumentFragment();
  list.forEach((s) => {
    const hadir = isHadir(s.id);
    const card = document.createElement("article");
    card.className = "badge" + (hadir ? " hadir" : "");
    card.dataset.cat = category;
    card.dataset.id = s.id;

    const imgSrc = `images/${category}/${s.gambar}`;

    card.innerHTML = `
      <div class="hole"></div>
      <div class="photo-wrap">
        ${hadir ? '<span class="hadir-check" aria-hidden="true">✓</span>' : ""}
        <img src="${imgSrc}" alt="Gambar ${s.nama}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'photo-fallback',textContent:'${initials(s.nama)}'}))">
      </div>
      <p class="badge-name">${s.nama}</p>
      <p class="badge-cat">${hadir ? "Hadir" : CATEGORY_LABELS[category]}</p>
    `;
    frag.appendChild(card);
  });
  gridEl.appendChild(frag);
}

async function toggleHadir(id) {
  const db = firebase.firestore();
  const ref = db.collection("kehadiran").doc(id);
  try {
    if (isHadir(id)) {
      await ref.delete();
    } else {
      await ref.set({
        hadir: true,
        waktu: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Gagal kemaskini kehadiran:", err);
  }
}

gridEl.addEventListener("click", (e) => {
  const card = e.target.closest(".badge");
  if (!card) return;
  toggleHadir(card.dataset.id);
});

function setActiveTab(category) {
  activeCategory = category;
  [...tabsEl.querySelectorAll(".tab")].forEach((btn) => {
    const isActive = btn.dataset.cat === category;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "true" : "false");
  });
  renderStudents(category);
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  setActiveTab(btn.dataset.cat);
});

function startAttendanceListener(db) {
  db.collection("kehadiran").onSnapshot(
    (snap) => {
      const next = {};
      snap.forEach((doc) => {
        const d = doc.data();
        const t = d.waktu && d.waktu.toMillis ? d.waktu.toMillis() : Date.now();
        next[doc.id] = t;
      });
      attendanceMap = next;
      renderStudents(activeCategory);
    },
    (err) => console.error("Gagal memantau kehadiran:", err)
  );
}

async function loadStudents() {
  try {
    const db = firebase.firestore();
    const snap = await db.collection("murid").get();
    allStudents = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    startAttendanceListener(db);
  } catch (err) {
    console.error("Gagal memuatkan data daripada Firebase:", err);
    countEl.textContent = "Gagal memuatkan data. Semak firebase-config.js dan sambungan internet.";
  }
  setActiveTab(activeCategory);
}

loadStudents();
