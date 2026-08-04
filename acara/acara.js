// acara.js
// Papar setiap acara (collection "acara") berserta peserta (rujukan ID
// kepada collection "murid"), dengan gambar & nama setiap peserta.

const CATEGORY_LABELS = {
  pra: "Pra",
  fungsi: "Fungsi",
  tahap1: "Tahap 1",
  tahap2: "Tahap 2",
};

const eventsWrap = document.getElementById("eventsWrap");

function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function badgeHtml(s) {
  const kategori = s.kategori || "pra";
  const imgSrc = `../images/${kategori}/${s.gambar || ""}`;
  return `
    <article class="badge" data-cat="${kategori}">
      <div class="hole"></div>
      <div class="photo-wrap">
        <img src="${imgSrc}" alt="Gambar ${s.nama}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'photo-fallback',textContent:'${initials(s.nama)}'}))">
      </div>
      <p class="badge-name">${s.nama || ""}</p>
      <p class="badge-cat">${CATEGORY_LABELS[kategori] || kategori}</p>
    </article>
  `;
}

async function loadEvents() {
  try {
    const db = firebase.firestore();
    let snap;
    try {
      snap = await db.collection("acara").orderBy("created", "desc").get();
    } catch (e) {
      // fallback jika medan "created" tiada pada sesetengah dokumen lama
      snap = await db.collection("acara").get();
    }

    if (snap.empty) {
      eventsWrap.innerHTML = `<div class="empty-state"><p>Belum ada acara ditambah.</p><p class="empty-sub">Tambah acara melalui panel admin.</p></div>`;
      return;
    }

    eventsWrap.innerHTML = "";
    for (const doc of snap.docs) {
      const d = doc.data();
      const pesertaIds = d.pesertaIds || [];

      const section = document.createElement("section");
      section.className = "event-block";
      const title = document.createElement("h2");
      title.className = "event-title";
      title.textContent = d.namaAcara || "(Tanpa nama)";
      section.appendChild(title);

      if (pesertaIds.length === 0) {
        const note = document.createElement("p");
        note.className = "event-empty-note";
        note.textContent = "Belum ada peserta ditetapkan untuk acara ini.";
        section.appendChild(note);
      } else {
        const results = await Promise.all(
          pesertaIds.map((id) => db.collection("murid").doc(id).get())
        );
        const students = results.filter((r) => r.exists).map((r) => r.data());

        const grid = document.createElement("div");
        grid.className = "grid";
        grid.innerHTML = students.map(badgeHtml).join("");
        section.appendChild(grid);
      }

      eventsWrap.appendChild(section);
    }
  } catch (err) {
    console.error("Gagal memuatkan acara:", err);
    eventsWrap.innerHTML = `<div class="empty-state"><p>Gagal memuatkan data acara.</p><p class="empty-sub">${err.message}</p></div>`;
  }
}

loadEvents();
