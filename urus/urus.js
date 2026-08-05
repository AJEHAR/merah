// urus.js
// Laman kawalan terbuka: cipta acara, tambah/buang peserta, dan reset
// kehadiran. Tiada log masuk diperlukan — sengaja dibuka untuk sesiapa
// yang ada pautan supaya guru lain boleh bantu semasa hari sukan.

const CATEGORY_LABELS = {
  pra: "Pra",
  fungsi: "Fungsi",
  tahap1: "Tahap 1",
  tahap2: "Tahap 2",
};

const db = firebase.firestore();

// ---------------- DOM refs ----------------
const acaraForm = document.getElementById("acaraForm");
const acaraNamaInput = document.getElementById("acaraNama");
const pesertaSearch = document.getElementById("pesertaSearch");
const pesertaCountHint = document.getElementById("pesertaCountHint");
const pesertaListEl = document.getElementById("pesertaList");
const saveAcaraBtn = document.getElementById("saveAcaraBtn");
const cancelEditAcaraBtn = document.getElementById("cancelEditAcaraBtn");
const acaraResult = document.getElementById("acaraResult");
const acaraListWrap = document.getElementById("acaraListWrap");

const hadirCountText = document.getElementById("hadirCountText");
const resetAttendanceBtn = document.getElementById("resetAttendanceBtn");
const resetAttendanceResult = document.getElementById("resetAttendanceResult");

// ---------------- Peserta picker ----------------
const MAX_PESERTA = 20;
let allMuridForPicker = [];
let selectedPesertaIds = new Set();
let editingAcaraId = null;

async function loadMuridForPicker() {
  const snap = await db.collection("murid").get();
  allMuridForPicker = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderPesertaList();
}

function renderPesertaList() {
  const q = pesertaSearch.value.trim().toLowerCase();
  const filtered = allMuridForPicker.filter((m) =>
    (m.nama || "").toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    pesertaListEl.innerHTML = `<p class="hint" style="padding:10px;">Tiada murid ditemui.</p>`;
  } else {
    pesertaListEl.innerHTML = filtered
      .map((m) => {
        const checked = selectedPesertaIds.has(m.id) ? "checked" : "";
        const imgSrc = `../images/${m.kategori}/${m.gambar || ""}`;
        return `
          <label class="peserta-row">
            <input type="checkbox" data-id="${m.id}" ${checked}>
            <span class="peserta-avatar"><img src="${imgSrc}" alt="" onerror="this.style.visibility='hidden'"></span>
            <span class="peserta-name">${m.nama}</span>
            <span class="row-cat ${m.kategori}">${CATEGORY_LABELS[m.kategori] || m.kategori}</span>
          </label>`;
      })
      .join("");
  }
  pesertaCountHint.textContent = `${selectedPesertaIds.size} / ${MAX_PESERTA} dipilih`;
}

pesertaSearch.addEventListener("input", renderPesertaList);

pesertaListEl.addEventListener("change", (e) => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  const id = cb.dataset.id;
  if (cb.checked) {
    if (selectedPesertaIds.size >= MAX_PESERTA) {
      cb.checked = false;
      alert(`Maksimum ${MAX_PESERTA} peserta bagi setiap acara.`);
      return;
    }
    selectedPesertaIds.add(id);
  } else {
    selectedPesertaIds.delete(id);
  }
  pesertaCountHint.textContent = `${selectedPesertaIds.size} / ${MAX_PESERTA} dipilih`;
});

function resetAcaraForm() {
  editingAcaraId = null;
  acaraNamaInput.value = "";
  selectedPesertaIds = new Set();
  pesertaSearch.value = "";
  renderPesertaList();
  cancelEditAcaraBtn.hidden = true;
  saveAcaraBtn.textContent = "Simpan Acara";
}

cancelEditAcaraBtn.addEventListener("click", resetAcaraForm);

acaraForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const namaAcara = acaraNamaInput.value.trim();
  if (!namaAcara) return;

  saveAcaraBtn.disabled = true;
  const data = {
    namaAcara,
    pesertaIds: Array.from(selectedPesertaIds),
    updated: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    if (editingAcaraId) {
      await db.collection("acara").doc(editingAcaraId).update(data);
    } else {
      data.created = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("acara").add(data);
    }
    acaraResult.hidden = false;
    acaraResult.textContent = "Acara berjaya disimpan.";
    resetAcaraForm();
    loadAcaraList();
  } catch (err) {
    acaraResult.hidden = false;
    acaraResult.textContent = "Ralat: " + err.message;
  } finally {
    saveAcaraBtn.disabled = false;
  }
});

async function loadAcaraList() {
  acaraListWrap.innerHTML = `<p class="hint">Memuatkan...</p>`;
  try {
    const snap = await db.collection("acara").orderBy("created", "desc").get();
    if (snap.empty) {
      acaraListWrap.innerHTML = `<p class="hint">Belum ada acara.</p>`;
      return;
    }
    acaraListWrap.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      const row = document.createElement("div");
      row.className = "acara-row";
      row.innerHTML = `
        <div><strong>${d.namaAcara}</strong><span class="hint">${(d.pesertaIds || []).length} peserta</span></div>
        <div>
          <button type="button" class="btn-ghost btn-edit-acara" data-id="${doc.id}">Edit</button>
          <button type="button" class="btn-del btn-del-acara" data-id="${doc.id}">Padam</button>
        </div>
      `;
      acaraListWrap.appendChild(row);
    });
  } catch (err) {
    acaraListWrap.innerHTML = `<p class="hint">Ralat: ${err.message}</p>`;
  }
}

acaraListWrap.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-edit-acara");
  const delBtn = e.target.closest(".btn-del-acara");

  if (editBtn) {
    const id = editBtn.dataset.id;
    const doc = await db.collection("acara").doc(id).get();
    const d = doc.data();
    editingAcaraId = id;
    acaraNamaInput.value = d.namaAcara || "";
    selectedPesertaIds = new Set(d.pesertaIds || []);
    renderPesertaList();
    cancelEditAcaraBtn.hidden = false;
    saveAcaraBtn.textContent = "Kemaskini Acara";
    acaraForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (delBtn) {
    if (!confirm("Padam acara ini?")) return;
    await db.collection("acara").doc(delBtn.dataset.id).delete();
    loadAcaraList();
  }
});

// ---------------- Kehadiran ----------------
async function loadAttendanceCount() {
  try {
    const snap = await db.collection("kehadiran").get();
    hadirCountText.textContent = `${snap.size} murid ditanda hadir sekarang.`;
  } catch (err) {
    hadirCountText.textContent = "Gagal semak status kehadiran.";
  }
}

resetAttendanceBtn.addEventListener("click", async () => {
  if (!confirm("Reset semua tanda kehadiran? Tindakan ini tidak boleh diundur.")) return;
  resetAttendanceBtn.disabled = true;
  resetAttendanceResult.hidden = true;
  try {
    const snap = await db.collection("kehadiran").get();
    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    resetAttendanceResult.hidden = false;
    resetAttendanceResult.textContent = `Kehadiran direset (${snap.size} rekod dipadam).`;
    loadAttendanceCount();
  } catch (err) {
    resetAttendanceResult.hidden = false;
    resetAttendanceResult.textContent = "Ralat: " + err.message;
  } finally {
    resetAttendanceBtn.disabled = false;
  }
});

// ---------------- Init ----------------
loadMuridForPicker();
loadAcaraList();
loadAttendanceCount();
