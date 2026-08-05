// admin.js

const CATEGORY_LABELS = {
  pra: "Pra",
  fungsi: "Fungsi",
  tahap1: "Tahap 1",
  tahap2: "Tahap 2",
};

// Terima pelbagai cara penulisan kategori dan padankan ke kunci yang betul.
function normalizeCategory(raw) {
  if (!raw) return null;
  const s = raw.toString().trim().toLowerCase().replace(/\s+/g, "");
  if (s.includes("pra")) return "pra";
  if (s.includes("fungsi")) return "fungsi";
  if (s.includes("tahap1") || s === "1" || s === "t1") return "tahap1";
  if (s.includes("tahap2") || s === "2" || s === "t2") return "tahap2";
  return null;
}

function stripQuotes(s) {
  return s.trim().replace(/^"(.*)"$/, "$1").trim();
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows = [];
  lines.forEach((line, i) => {
    const parts = line.split(",").map(stripQuotes);
    // Langkau baris tajuk jika baris pertama ialah "nama,kategori,gambar"
    if (i === 0 && /^nama$/i.test(parts[0] || "")) return;

    const nama = parts[0] || "";
    const kategoriRaw = parts[1] || "";
    const gambar = parts[2] || "";
    const kategori = normalizeCategory(kategoriRaw);

    rows.push({
      nama,
      kategoriRaw,
      kategori,
      gambar,
      valid: Boolean(nama) && Boolean(kategori),
    });
  });
  return rows;
}

// SENARAI EMEL YANG DIBENARKAN log masuk sebagai admin.
// Ini hanya untuk paparan mesej yang lebih jelas — sekatan SEBENAR
// dikuatkuasakan oleh Firestore Rules (lihat README.md bahagian Google Sign-In).
const ALLOWED_ADMIN_EMAILS = [
  "merah@gmail.com",
];

// ---------------- Firebase refs ----------------
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM refs ----------------
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const whoami = document.getElementById("whoami");
const logoutBtn = document.getElementById("logoutBtn");

const csvFile = document.getElementById("csvFile");
const csvText = document.getElementById("csvText");
const parseCsvBtn = document.getElementById("parseCsvBtn");
const csvPreviewWrap = document.getElementById("csvPreviewWrap");
const csvPreviewTable = document.getElementById("csvPreviewTable");
const csvCount = document.getElementById("csvCount");
const confirmCsvBtn = document.getElementById("confirmCsvBtn");
const csvResult = document.getElementById("csvResult");

const singleForm = document.getElementById("singleForm");
const singleResult = document.getElementById("singleResult");

const filterCategory = document.getElementById("filterCategory");
const listBody = document.getElementById("listBody");

let parsedRows = [];

// ---------------- Auth ----------------
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  auth.signInWithEmailAndPassword(email, password).catch((err) => {
    loginError.textContent = "Log masuk gagal: " + err.message;
    loginError.hidden = false;
  });
});

const googleLoginBtn = document.getElementById("googleLoginBtn");
googleLoginBtn.addEventListener("click", () => {
  loginError.hidden = true;
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((err) => {
    loginError.textContent = "Log masuk Google gagal: " + err.message;
    loginError.hidden = false;
  });
});

logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged((user) => {
  if (user) {
    const isAllowed =
      ALLOWED_ADMIN_EMAILS.length === 0 || ALLOWED_ADMIN_EMAILS.includes(user.email);

    if (!isAllowed) {
      loginError.textContent = `Emel "${user.email}" tidak dibenarkan mengurus data ini.`;
      loginError.hidden = false;
      auth.signOut();
      return;
    }
    loginBox.hidden = true;
    adminPanel.hidden = false;
    whoami.textContent = `Log masuk sebagai: ${user.email}`;
    loadList();
    loadGuruList();
  } else {
    loginBox.hidden = false;
    adminPanel.hidden = true;
  }
});

// ---------------- CSV: file -> textarea ----------------
csvFile.addEventListener("change", () => {
  const file = csvFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    csvText.value = reader.result;
  };
  reader.readAsText(file);
});

// ---------------- CSV: parse & preview ----------------
parseCsvBtn.addEventListener("click", () => {
  parsedRows = parseCsv(csvText.value);
  renderPreview();
});

function renderPreview() {
  csvCount.textContent = parsedRows.length;
  csvPreviewWrap.hidden = parsedRows.length === 0;
  csvResult.hidden = true;

  const rowsHtml = parsedRows
    .map((r) => {
      const catHtml = r.kategori
        ? `<span class="row-cat ${r.kategori}">${CATEGORY_LABELS[r.kategori]}</span>`
        : `<span class="row-bad">Tidak dikenali: "${r.kategoriRaw}"</span>`;
      const rowClass = r.valid ? "" : "row-bad";
      return `<tr class="${rowClass}">
        <td>${r.nama || "<em>(kosong)</em>"}</td>
        <td>${catHtml}</td>
        <td>${r.gambar || "<em>(tiada)</em>"}</td>
      </tr>`;
    })
    .join("");

  csvPreviewTable.innerHTML = `
    <thead><tr><th>Nama</th><th>Kategori</th><th>Gambar</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  `;

  const invalidCount = parsedRows.filter((r) => !r.valid).length;
  confirmCsvBtn.disabled = parsedRows.length === 0 || invalidCount === parsedRows.length;
}

confirmCsvBtn.addEventListener("click", async () => {
  const validRows = parsedRows.filter((r) => r.valid);
  if (validRows.length === 0) return;

  confirmCsvBtn.disabled = true;
  confirmCsvBtn.textContent = "Menambah...";

  try {
    const batch = db.batch();
    validRows.forEach((r) => {
      const ref = db.collection("murid").doc();
      batch.set(ref, { nama: r.nama, kategori: r.kategori, gambar: r.gambar });
    });
    await batch.commit();

    csvResult.hidden = false;
    csvResult.textContent = `${validRows.length} murid berjaya ditambah.`;
    csvText.value = "";
    csvFile.value = "";
    parsedRows = [];
    csvPreviewWrap.hidden = true;
    loadList();
  } catch (err) {
    csvResult.hidden = false;
    csvResult.textContent = "Gagal menambah: " + err.message;
  } finally {
    confirmCsvBtn.disabled = false;
    confirmCsvBtn.textContent = "Sahkan & Tambah Semua";
  }
});

// ---------------- Single add ----------------
singleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("singleName").value.trim();
  const kategori = document.getElementById("singleCategory").value;
  const gambar = document.getElementById("singleImage").value.trim();

  if (!nama) return;

  try {
    await db.collection("murid").add({ nama, kategori, gambar });
    singleResult.hidden = false;
    singleResult.textContent = `"${nama}" berjaya ditambah ke kategori ${CATEGORY_LABELS[kategori]}.`;
    singleForm.reset();
    loadList();
  } catch (err) {
    singleResult.hidden = false;
    singleResult.textContent = "Gagal menambah: " + err.message;
  }
});

// ---------------- List + delete ----------------
async function loadList() {
  const cat = filterCategory.value;
  let query = db.collection("murid");
  if (cat !== "all") query = query.where("kategori", "==", cat);

  listBody.innerHTML = `<tr><td colspan="4">Memuatkan...</td></tr>`;
  try {
    const snap = await query.get();
    if (snap.empty) {
      listBody.innerHTML = `<tr><td colspan="4">Tiada data.</td></tr>`;
      return;
    }
    listBody.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.nama || ""}</td>
        <td><span class="row-cat ${d.kategori}">${CATEGORY_LABELS[d.kategori] || d.kategori}</span></td>
        <td>${d.gambar || "<em>(tiada)</em>"}</td>
        <td><button class="btn-del" data-id="${doc.id}">Padam</button></td>
      `;
      listBody.appendChild(tr);
    });
  } catch (err) {
    listBody.innerHTML = `<tr><td colspan="4">Ralat: ${err.message}</td></tr>`;
  }
}

filterCategory.addEventListener("change", loadList);

listBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-del");
  if (!btn) return;
  if (!confirm("Padam murid ini?")) return;
  await db.collection("murid").doc(btn.dataset.id).delete();
  loadList();
});

// ---------------- Guru & PPM ----------------
const ROLE_LABELS = { guru: "Guru", ppm: "PPM" };

const guruSingleForm = document.getElementById("guruSingleForm");
const guruSingleResult = document.getElementById("guruSingleResult");
const guruFilterRole = document.getElementById("guruFilterRole");
const guruListBody = document.getElementById("guruListBody");

guruSingleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("guruSingleName").value.trim();
  const peranan = document.getElementById("guruSingleRole").value;
  const gambar = document.getElementById("guruSingleImage").value.trim();
  if (!nama) return;

  try {
    await db.collection("guru").add({ nama, peranan, gambar });
    guruSingleResult.hidden = false;
    guruSingleResult.textContent = `"${nama}" berjaya ditambah sebagai ${ROLE_LABELS[peranan]}.`;
    guruSingleForm.reset();
    loadGuruList();
  } catch (err) {
    guruSingleResult.hidden = false;
    guruSingleResult.textContent = "Gagal menambah: " + err.message;
  }
});

async function loadGuruList() {
  const role = guruFilterRole.value;
  let query = db.collection("guru");
  if (role !== "all") query = query.where("peranan", "==", role);

  guruListBody.innerHTML = `<tr><td colspan="4">Memuatkan...</td></tr>`;
  try {
    const snap = await query.get();
    if (snap.empty) {
      guruListBody.innerHTML = `<tr><td colspan="4">Tiada data.</td></tr>`;
      return;
    }
    guruListBody.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.nama || ""}</td>
        <td><span class="row-cat ${d.peranan}" style="background:${d.peranan === "guru" ? "#B9862C" : "#8C6A22"}">${ROLE_LABELS[d.peranan] || d.peranan}</span></td>
        <td>${d.gambar || "<em>(tiada)</em>"}</td>
        <td><button class="btn-del btn-del-guru" data-id="${doc.id}">Padam</button></td>
      `;
      guruListBody.appendChild(tr);
    });
  } catch (err) {
    guruListBody.innerHTML = `<tr><td colspan="4">Ralat: ${err.message}</td></tr>`;
  }
}

guruFilterRole.addEventListener("change", loadGuruList);

guruListBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-del-guru");
  if (!btn) return;
  if (!confirm("Padam rekod ini?")) return;
  await db.collection("guru").doc(btn.dataset.id).delete();
  loadGuruList();
});

