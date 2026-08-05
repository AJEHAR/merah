// guru.js
// Membaca senarai staf daripada koleksi Firestore "guru" dan
// memaparkannya sebagai kad mengikut peranan (guru / ppm).
//
// Setiap dokumen dalam koleksi "guru" dijangka mempunyai medan:
//   nama     : string  -> nama panggilan
//   peranan  : string  -> "guru" | "ppm"
//   gambar   : string  -> nama fail gambar di dalam folder images/<peranan>/

const ROLE_LABELS = { guru: "Guru", ppm: "PPM" };

let allStaff = [];
let activeRole = "guru";
let searchQuery = "";

const gridEl = document.getElementById("grid");
const countEl = document.getElementById("countText");
const emptyEl = document.getElementById("emptyState");
const tabsEl = document.getElementById("tabs");
const searchBox = document.getElementById("searchBox");

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function renderStaff(role) {
  let list = allStaff.filter((s) => s.peranan === role);
  if (searchQuery) {
    list = list.filter((s) => (s.nama || "").toLowerCase().includes(searchQuery));
  }

  countEl.textContent = `${ROLE_LABELS[role]} — ${list.length} orang`;
  gridEl.innerHTML = "";

  if (list.length === 0) {
    emptyEl.hidden = false;
    emptyEl.querySelector("p").textContent = searchQuery
      ? `Tiada staf dijumpai untuk "${searchQuery}".`
      : "Belum ada staf dalam senarai ini.";
    return;
  }
  emptyEl.hidden = true;

  const frag = document.createDocumentFragment();
  list.forEach((s) => {
    const card = document.createElement("article");
    card.className = "badge";
    card.dataset.cat = role;

    const imgSrc = `../images/${role}/${s.gambar}`;

    card.innerHTML = `
      <div class="hole"></div>
      <div class="photo-wrap">
        <img src="${imgSrc}" alt="Gambar ${s.nama}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'photo-fallback',textContent:'${initials(s.nama)}'}))">
      </div>
      <p class="badge-name">${s.nama}</p>
      <p class="badge-cat">${ROLE_LABELS[role]}</p>
    `;
    frag.appendChild(card);
  });
  gridEl.appendChild(frag);
}

function setActiveTab(role) {
  activeRole = role;
  [...tabsEl.querySelectorAll(".tab")].forEach((btn) => {
    const isActive = btn.dataset.cat === role;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "true" : "false");
  });
  renderStaff(role);
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  setActiveTab(btn.dataset.cat);
});

searchBox.addEventListener("input", () => {
  searchQuery = searchBox.value.trim().toLowerCase();
  renderStaff(activeRole);
});

async function loadStaff() {
  try {
    const db = firebase.firestore();
    const snap = await db.collection("guru").get();
    allStaff = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Gagal memuatkan data staf:", err);
    countEl.textContent = "Gagal memuatkan data.";
  }
  setActiveTab(activeRole);
}

loadStaff();
