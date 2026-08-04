// app.js
// Membaca senarai murid daripada koleksi Firestore "murid" dan memaparkannya
// sebagai kad mengikut kategori (pra / fungsi / tahap1 / tahap2).
//
// Setiap dokumen dalam koleksi "murid" dijangka mempunyai medan:
//   nama      : string  -> nama panggilan murid
//   kategori  : string  -> "pra" | "fungsi" | "tahap1" | "tahap2"
//   gambar    : string  -> nama fail gambar di dalam folder images/<kategori>/

const CATEGORY_LABELS = {
  pra: "Pra",
  fungsi: "Fungsi",
  tahap1: "Tahap 1",
  tahap2: "Tahap 2",
};

let allStudents = [];
let activeCategory = "pra";

const gridEl = document.getElementById("grid");
const countEl = document.getElementById("countText");
const emptyEl = document.getElementById("emptyState");
const tabsEl = document.getElementById("tabs");

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function renderStudents(category) {
  const list = allStudents.filter((s) => s.kategori === category);

  countEl.textContent = `${CATEGORY_LABELS[category]} — ${list.length} murid`;
  gridEl.innerHTML = "";

  if (list.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const frag = document.createDocumentFragment();
  list.forEach((s) => {
    const card = document.createElement("article");
    card.className = "badge";
    card.dataset.cat = category;

    const imgSrc = `images/${category}/${s.gambar}`;

    card.innerHTML = `
      <div class="hole"></div>
      <div class="photo-wrap">
        <img src="${imgSrc}" alt="Gambar ${s.nama}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'photo-fallback',textContent:'${initials(s.nama)}'}))">
      </div>
      <p class="badge-name">${s.nama}</p>
      <p class="badge-cat">${CATEGORY_LABELS[category]}</p>
    `;
    frag.appendChild(card);
  });
  gridEl.appendChild(frag);
}

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

async function loadStudents() {
  try {
    const db = firebase.firestore();
    const snap = await db.collection("murid").get();
    allStudents = snap.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Gagal memuatkan data daripada Firebase:", err);
    countEl.textContent = "Gagal memuatkan data. Semak firebase-config.js dan sambungan internet.";
  }
  setActiveTab(activeCategory);
}

loadStudents();
