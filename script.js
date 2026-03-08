/* --- CONFIG & INITIALIZATION --- */
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

const tlMap = { "Assignment": "Tugas", "Schedule": "Jadwal", "Event": "Event", "Low": "Rendah", "Medium": "Sedang", "High": "Tinggi" };
function tLoc(str) { return tlMap[str] || str; }

let allTasks = [],
  selectedKat = "Assignment",
  selectedPri = "Medium",
  pDate = new Date(),
  currentCalDate = new Date(),
  delId = null,
  dateTarget = "start",
  selectedDay = "Senin",
  selectedStartTime = "08:00",
  selectedEndTime = "10:00",
  timeTarget = "start",
  selectedSKS = "";

// Theme Init
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

/* --- ADMIN ACCESS CONTROL (PIN SYSTEM 2525) --- */
const MASTER_PIN = "2525";

function checkAdminSession() {
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const currentPage = document.querySelector(".page-section:not(.hidden)")?.id;

  const missionControl = document.getElementById("mission-control-container");
  const lecturerEntry = document.getElementById("lecturer-entry-container");
  const infoAdmin = document.getElementById("info-admin-container");
  const scheduleAdmin = document.getElementById("schedule-admin-container");

  const btnLogin = document.getElementById("btn-admin-gate");
  const btnLogout = document.getElementById("btn-logout");

  // Seleksi semua tombol hapus yang ada di DOM (kecuali hapusFoto di Gallery karena publik boleh hapus)
  const editButtons = document.querySelectorAll(
    "button[onclick*='askDel'], button[onclick*='hapusDosen'], button[onclick*='hapusInfo']",
  );

  // Reset visibility kontainer admin
  [missionControl, lecturerEntry, infoAdmin, scheduleAdmin].forEach((el) =>
    el?.classList.add("hidden"),
  );

  if (isAdmin) {
    if (currentPage === "page-hub") missionControl?.classList.remove("hidden");
    else if (currentPage === "page-contact")
      lecturerEntry?.classList.remove("hidden");
    else if (currentPage === "page-info")
      infoAdmin?.classList.remove("hidden");
    else if (currentPage === "page-schedule")
      scheduleAdmin?.classList.remove("hidden");

    btnLogin?.classList.add("hidden");
    btnLogout?.classList.remove("hidden");
    editButtons.forEach((btn) => btn.classList.remove("hidden"));
  } else {
    btnLogin?.classList.remove("hidden");
    btnLogout?.classList.add("hidden");
    editButtons.forEach((btn) => btn.classList.add("hidden"));
  }
}

function openAdminGate() {
  document.getElementById("auth-page").classList.remove("hidden");
  document.getElementById("admin-pin").focus();
}

function closeAdminGate() {
  document.getElementById("auth-page").classList.add("hidden");
  document.getElementById("admin-pin").value = "";
}

function handlePinLogin() {
  const pinInput = document.getElementById("admin-pin");
  if (pinInput.value === MASTER_PIN) {
    showNotify("Access Granted: Admin Mode");
    localStorage.setItem("is_admin", "true");
    closeAdminGate();
    refreshAllData();
  } else {
    showNotify("Invalid PIN: Access Denied", "error");
    pinInput.value = "";
    const card = document.querySelector("#auth-page .modal-card");
    card.classList.add("animate-shake");
    setTimeout(() => card.classList.remove("animate-shake"), 500);
  }
}

function handleLogout() {
  localStorage.removeItem("is_admin");
  showNotify("Session Terminated");
  refreshAllData();
}

function refreshAllData() {
  checkAdminSession();
  muatData();
  muatGallery();
  muatDosen();
  muatInfo();
  muatJadwal();
}

/* --- LECTURER LOGIC --- */
async function muatDosen() {
  const container = document.getElementById("lecturer-list");
  if (!container) return;

  try {
    const { data, error } = await sb
      .from("lecturers")
      .select("*")
      .order("nama_dosen", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.4em] col-span-full">No Lecturer Data</div>`;
      return;
    }

    const isAdmin = localStorage.getItem("is_admin") === "true";

    container.innerHTML = data
      .map(
        (d) => `
            <div class="glass-card p-6 border border-white/5 flex flex-col gap-2 relative group">
                <p class="text-xs font-black opacity-30 uppercase tracking-widest">${d.mata_kuliah}</p>
                <h3 class="text-lg font-bold uppercase tracking-tight">${d.nama_dosen}</h3>
                <div class="flex items-center justify-between mt-2">
                    <a href="https://wa.me/${d.whatsapp}" target="_blank" class="text-[10px] font-black text-green-500 hover:opacity-70 transition">
                        WHATSAPP: ${d.whatsapp}
                    </a>
                    ${isAdmin ? `<button onclick="hapusDosen('${d.id}')" class="text-[8px] font-black text-red-500 opacity-60 hover:opacity-100 transition">DELETE</button>` : ""}
                </div>
            </div>`,
      )
      .join("");

    checkAdminSession();
  } catch (err) {
    console.error("Dosen Error:", err);
  }
}

async function simpanDosen() {
  const nama = document.getElementById("namaDosen").value;
  const matkul = document.getElementById("matkulDosen").value;
  const wa = document.getElementById("waDosen").value;
  const btn = document.getElementById("btn-save-dosen");

  if (!nama || !matkul || !wa)
    return showNotify("Semua kolom dosen harus diisi", "error");

  try {
    btn.innerText = "SAVING...";
    btn.disabled = true;

    const { error } = await sb.from("lecturers").insert([
      {
        nama_dosen: nama,
        mata_kuliah: matkul,
        whatsapp: wa,
      },
    ]);

    if (error) throw error;

    showNotify("Lecturer data secured!");
    document.getElementById("namaDosen").value = "";
    document.getElementById("matkulDosen").value = "";
    document.getElementById("waDosen").value = "";
    muatDosen();
  } catch (err) {
    showNotify(err.message, "error");
  } finally {
    btn.innerText = "SAVE DATA";
    btn.disabled = false;
  }
}

async function hapusDosen(id) {
  if (!id || id === "undefined" || id === "[object Object]") {
    return showNotify("Error: Lecturer ID not found", "error");
  }

  customConfirm("Remove this lecturer from directory?", async () => {
    try {
      const { error } = await sb.from("lecturers").delete().eq("id", id);
      if (error) throw error;
      showNotify("Lecturer removed");
      muatDosen();
    } catch (err) {
      showNotify("Failed to delete", "error");
    }
  });
}

/* --- UI NOTIFICATIONS & MODALS --- */
function showNotify(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  container.innerHTML = "";
  const isError = type === "error";
  const toast = document.createElement("div");
  toast.className = `glass-card flex items-center gap-3 p-4 mb-3 border-l-4 ${isError ? "border-red-500" : "border-green-500"} fade-in shadow-2xl min-w-[250px]`;
  toast.innerHTML = `
        <div class="w-2 h-2 rounded-full ${isError ? "bg-red-500" : "bg-green-500"} animate-pulse"></div>
        <div class="flex-1 text-left">
            <p class="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">${type}</p>
            <p class="text-[11px] font-bold leading-tight uppercase">${msg}</p>
        </div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

function customConfirm(msg, callback) {
  const modal = document.getElementById("custom-confirm-modal");
  const msgText = document.getElementById("confirm-msg-text");
  const okBtn = document.getElementById("confirm-ok-btn");
  if (!modal) return;
  msgText.innerText = msg;
  modal.classList.remove("hidden");
  okBtn.onclick = () => {
    callback();
    closeConfirm();
  };
}

function closeConfirm() {
  document.getElementById("custom-confirm-modal")?.classList.add("hidden");
}

/* --- CORE NAVIGATION --- */
function moveNavBubble(element) {
  const bubble = document.getElementById("nav-bubble-active");
  const wrap = document.querySelector(".nav-wrap");
  if (bubble && element && wrap) {
    const rect = element.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    bubble.style.width = `${rect.width}px`;
    bubble.style.left = `${rect.left - wrapRect.left}px`;
  }
}

function switchPage(pageId, element) {
  document
    .querySelectorAll(".page-section")
    .forEach((p) => p.classList.add("hidden"));
  document.getElementById(pageId)?.classList.remove("hidden");
  document
    .querySelectorAll(".nav a")
    .forEach((l) => l.classList.remove("active"));
  element.classList.add("active");

  moveNavBubble(element);
  checkAdminSession();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "page-gallery") muatGallery();
  if (pageId === "page-contact") muatDosen();
  if (pageId === "page-info") muatInfo();
  if (pageId === "page-schedule") muatJadwal();
}

/* --- SUPABASE API CALLS --- */
async function muatData() {
  const statusDot = document.getElementById("db-status-dot");
  const statusText = document.getElementById("db-status-text");
  try {
    const { data, error } = await sb
      .from("schedule")
      .select("*")
      .order("tgl_deadline", { ascending: true });
    if (error) throw error;
    allTasks = data || [];
    if (statusDot)
      statusDot.className =
        "w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
    if (statusText) {
      statusText.innerText = "Active";
      statusText.classList.replace("opacity-30", "opacity-60");
    }
    renderAll();
  } catch (err) {
    if (statusDot)
      statusDot.className =
        "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]";
    if (statusText) {
      statusText.innerText = "Offline";
      statusText.style.color = "#ef4444";
    }
    renderAll();
  }
}

async function simpanData() {
  const isi = document.getElementById("isiData").value;
  const t1 = document.getElementById("tglMulai").value;
  const t2 = document.getElementById("tglDeadline").value;
  const link = document.getElementById("linkData").value;

  if (!isi || !t2) return showNotify("Data mission tidak lengkap", "error");

  const { error } = await sb.from("schedule").insert([
    {
      content: isi,
      tgl_start: t1 || t2,
      tgl_deadline: t2,
      category: selectedKat,
      priority: selectedPri,
      is_done: false,
      task_link: link || null,
    },
  ]);

  if (error) showNotify(`Failed: ${error.message}`, "error");
  else {
    showNotify("Mission data uploaded!");
    document.getElementById("isiData").value = "";
    document.getElementById("linkData").value = "";
    muatData();
  }
}

/* --- GALLERY LOGIC --- */
async function muatGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  try {
    const { data, error } = await sb
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    grid.innerHTML =
      data
        ?.map(
          (img) => `
            <div class="glass-card p-2 aspect-square overflow-hidden group border border-white/5 relative">
                <img src="${img.image_url}" class="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500" alt="Gallery Photo">
                <button onclick="hapusFoto('${img.id}', '${img.file_path}')" class="absolute top-3 right-3 bg-red-500/80 text-white text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">DELETE</button>
            </div>`,
        )
        .join("") || "";
    checkAdminSession();
  } catch (err) {
    console.error("Gallery Error:", err);
  }
}

async function compressImage(file, max_width = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let width = img.width;
        let height = img.height;
        
        if (width > max_width) {
          height = Math.round((height * max_width) / width);
          width = max_width;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now()
          }));
        }, "image/jpeg", 0.7); // 0.7 adalah kualitas kompresi (70%)
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

async function uploadFoto() {
  const fileInput = document.getElementById("photo-input");
  const btn = document.getElementById("btn-upload-foto");
  const file = fileInput.files[0];

  if (!file) return showNotify("Please select a photo", "error");
  btn.innerText = "Uploading...";
  btn.disabled = true;

  try {
    const compressedFile = await compressImage(file);
    
    // Gunakan ekstensi .jpg karena hasil kompresi di atas adalah JPEG
    const baseName = file.name.replace(/[^a-zA-Z0-9]/g, "_").split(".")[0];
    const fileName = `${Date.now()}-${baseName}.jpg`;
    
    const { error: upErr } = await sb.storage
      .from("PHOTOS")
      .upload(fileName, compressedFile);
    if (upErr) throw upErr;

    const { data: urlData } = sb.storage.from("PHOTOS").getPublicUrl(fileName);
    const { error: dbErr } = await sb
      .from("gallery")
      .insert([{ image_url: urlData.publicUrl, file_path: fileName }]);
    if (dbErr) throw dbErr;

    fileInput.value = "";
    document.getElementById("file-preview-container")?.classList.add("hidden");
    showNotify("Moment saved successfully!");
    muatGallery();
  } catch (err) {
    showNotify(err.message, "error");
  } finally {
    btn.innerText = "Upload";
    btn.disabled = false;
  }
}

async function hapusFoto(id, path) {
  customConfirm("Permanently delete this moment?", async () => {
    try {
      await sb.storage.from("PHOTOS").remove([path]);
      await sb.from("gallery").delete().eq("id", id);
      showNotify("Moment deleted", "success");
      muatGallery();
    } catch (err) {
      showNotify("Failed to delete", "error");
    }
  });
}

/* --- INFORMATION BOARD LOGIC --- */
async function muatInfo() {
  const container = document.getElementById("info-list");
  if (!container) return;

  try {
    const { data, error } = await sb
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.4em] col-span-full">No Announcements</div>`;
      return;
    }

    const isAdmin = localStorage.getItem("is_admin") === "true";

    container.innerHTML = data
      .map(
        (d) => `
            <div class="glass-card p-6 border border-white/5 flex flex-col gap-3 relative group">
                <div class="flex justify-between items-start gap-4">
                  <div>
                    <h3 class="text-lg font-bold uppercase tracking-tight text-blue-400">${d.title}</h3>
                    <p class="text-xs opacity-70 mt-2 whitespace-pre-wrap leading-relaxed">${d.description}</p>
                    ${d.file_url ? `<div class="mt-4"><a href="${d.file_url}" target="_blank" class="inline-flex items-center gap-2 px-4 py-3 bg-white/10 rounded-xl text-[9px] border border-white/5 font-black uppercase tracking-widest hover:bg-white/20 transition">📄 Buka Lampiran</a></div>` : ""}
                  </div>
                  ${isAdmin ? `<button onclick="hapusInfo('${d.id}', '${d.file_path || ''}')" class="text-[8px] font-black text-red-500 opacity-60 hover:opacity-100 transition shrink-0">DELETE</button>` : ""}
                </div>
                <div class="text-[8px] font-black opacity-30 uppercase tracking-widest mt-2 border-t border-white/5 pt-2">
                  Dipublikasi: ${new Date(d.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </div>
            </div>`,
      )
      .join("");

    checkAdminSession();
  } catch (err) {
    console.error("Info Error:", err);
  }
}

async function simpanInfo() {
  const title = document.getElementById("infoTitle").value;
  const desc = document.getElementById("infoDesc").value;
  const fileInput = document.getElementById("info-file");
  const btn = document.getElementById("btn-save-info");
  const file = fileInput.files[0];

  if (!title || !desc)
    return showNotify("Judul dan detail informasi harus diisi", "error");

  try {
    btn.innerText = "SAVING...";
    btn.disabled = true;

    let fileUrl = null;
    let filePath = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error: upErr } = await sb.storage
        .from("FILES")
        .upload(fileName, file);
      if (upErr) throw upErr;

      const { data: urlData } = sb.storage.from("FILES").getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
      filePath = fileName;
    }

    const { error } = await sb.from("announcements").insert([
      {
        title: title,
        description: desc,
        file_url: fileUrl,
        file_path: filePath
      },
    ]);

    if (error) throw error;

    showNotify("Information published!");
    document.getElementById("infoTitle").value = "";
    document.getElementById("infoDesc").value = "";
    if(fileInput) fileInput.value = "";
    const nameDisplay = document.getElementById("info-file-name");
    if(nameDisplay) nameDisplay.innerText = "Pilih File (Opsional)";
    muatInfo();
  } catch (err) {
    showNotify(err.message, "error");
  } finally {
    btn.innerText = "Publikasi Info";
    btn.disabled = false;
  }
}

async function hapusInfo(id, filePath) {
  if (!id || id === "undefined" || id === "[object Object]") {
    return showNotify("Error: Info ID not found", "error");
  }

  customConfirm("Remove this information?", async () => {
    try {
      if (filePath && filePath !== "undefined" && filePath !== "null") {
        await sb.storage.from("FILES").remove([filePath]);
      }
      
      const { error } = await sb.from("announcements").delete().eq("id", id);
      if (error) throw error;
      showNotify("Information removed");
      muatInfo();
    } catch (err) {
      showNotify("Failed to delete", "error");
    }
  });
}

/* --- JADWAL KULIAH LOGIC --- */
async function muatJadwal() {
  const grid = document.getElementById("schedule-main-grid");
  if (!grid) return;

  try {
    const { data, error } = await sb
      .from("class_schedules")
      .select("*")
      .order("time_start", { ascending: true });

    if (error) {
      if (error.code === "PGRST204") {
         console.warn("Table class_schedules not found. Please create it in Supabase.");
      }
      throw error;
    }

    renderSchedule(data || []);
  } catch (err) {
    console.error("Jadwal Error:", err);
  }
}

async function simpanJadwal() {
  const subject = document.getElementById("scheduleSubject").value;
  const lecturer = document.getElementById("scheduleLecturer").value;
  const room = document.getElementById("scheduleRoom").value;
  const btn = document.getElementById("btn-save-schedule");

  if (!subject || !selectedStartTime || !selectedEndTime || selectedDay === "Pilih Hari")
    return showNotify("Lengkapi data jadwal (Hari, Matkul, Waktu)", "error");

  try {
    btn.innerText = "SAVING...";
    btn.disabled = true;

    const { error } = await sb.from("class_schedules").insert([
      {
        day: selectedDay,
        subject: subject,
        lecturer: lecturer,
        time_start: selectedStartTime,
        time_end: selectedEndTime,
        room: room,
        sks: selectedSKS
      },
    ]);

    if (error) throw error;

    showNotify("Jadwal berhasil ditambahkan!");
    document.getElementById("scheduleSubject").value = "";
    document.getElementById("scheduleLecturer").value = "";
    document.getElementById("scheduleRoom").value = "";
    document.getElementById("btn-schedule-start").innerText = "Jam Mulai";
    document.getElementById("btn-schedule-end").innerText = "Jam Selesai";
    document.getElementById("btn-schedule-sks").innerText = "Pilih SKS";
    selectedStartTime = "";
    selectedEndTime = "";
    selectedSKS = "";
    muatJadwal();
  } catch (err) {
    showNotify(err.message, "error");
  } finally {
    btn.innerText = "Tambah Jadwal";
    btn.disabled = false;
  }
}

async function hapusJadwal(id) {
  customConfirm("Hapus jadwal kuliah ini?", async () => {
    try {
      const { error } = await sb.from("class_schedules").delete().eq("id", id);
      if (error) throw error;
      showNotify("Jadwal dihapus");
      muatJadwal();
    } catch (err) {
      showNotify("Gagal menghapus jadwal", "error");
    }
  });
}

function renderSchedule(data) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const startHour = 7;
  const pixelsPerHour = 80;

  // Reset columns
  days.forEach(day => {
    const col = document.getElementById(`col-${day}`);
    if (col) col.innerHTML = "";
  });

  data.forEach(item => {
    const col = document.getElementById(`col-${item.day}`);
    if (col && item.time_start && item.time_end) {
      // Calculate Position
      const [sh, sm] = item.time_start.split(":").map(Number);
      const [eh, em] = item.time_end.split(":").map(Number);
      
      const startMinutes = (sh - startHour) * 60 + sm;
      const endMinutes = (eh - startHour) * 60 + em;
      const duration = endMinutes - startMinutes;

      const topPos = (startMinutes / 60) * pixelsPerHour;
      const heightPos = (duration / 60) * pixelsPerHour;

      const card = document.createElement("div");
      card.className = `schedule-card ${isAdmin ? 'admin-mode' : ''}`;
      card.style.top = `${topPos}px`;
      card.style.height = `${heightPos}px`;
      
      card.innerHTML = `
        <div class="time-badge">${item.time_start} - ${item.time_end}</div>
        <h3 class="subject-name">${item.subject}</h3>
        
        <div class="info-row">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>${item.room || '-'} • ${item.sks || '?'} SKS</span>
        </div>
        
        <div class="info-row">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="truncate">${item.lecturer || '-'}</span>
        </div>

        ${isAdmin ? `
        <button onclick="hapusJadwal('${item.id}')" class="btn-del-schedule">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>` : ""}
      `;
      col.appendChild(card);
    }
  });
}

/* --- RENDERERS --- */
function renderAll() {
  renderFeed();
  renderCalendar();
  renderCountdown();
  checkAdminSession();
}

function renderCountdown() {
  const area = document.getElementById("next-deadline-area");
  if (!area) return;
  const upcoming = allTasks
    .filter((t) => !t.is_done)
    .sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];

  if (upcoming) {
    const today = new Date().setHours(0, 0, 0, 0);
    const tStart = new Date(upcoming.tgl_start).setHours(0, 0, 0, 0);
    const tEnd = new Date(upcoming.tgl_deadline).setHours(0, 0, 0, 0);
    
    const priColor =
      upcoming.priority === "High"
        ? "#ff3b30"
        : upcoming.priority === "Medium"
          ? "#ff9500"
          : "#8e8e93";

    let dayText = "";
    let subStatus = "";

    if (today < tStart) {
      const diff = Math.ceil((tStart - today) / (1000 * 60 * 60 * 24));
      dayText = `${diff} DAYS TO START`;
      subStatus = `Starts: ${upcoming.tgl_start}`;
    } else {
      const diff = Math.ceil((tEnd - today) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        dayText = `${diff} DAYS LEFT`;
        subStatus = `Deadline: ${upcoming.tgl_deadline}`;
      } else if (diff === 0) {
        dayText = "DUE TODAY";
        subStatus = `Deadline: ${upcoming.tgl_deadline}`;
      } else {
        dayText = `${Math.abs(diff)} OVERDUE`;
        subStatus = `Ended: ${upcoming.tgl_deadline}`;
      }
    }

    area.innerHTML = `
            <div class="dynamic-island fade-in" style="border-left: 6px solid ${priColor};">
                <div class="flex-1 truncate mr-4 text-left">
                    <p class="island-meta text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">
                        <span style="color: ${priColor}">${tLoc(upcoming.category)}</span> • ${subStatus}
                    </p>
                    <h2 class="text-sm font-black uppercase leading-tight truncate">${upcoming.content}</h2>
                </div>
                <div class="text-right"><span class="text-lg font-black tracking-tighter uppercase">${dayText}</span></div>
            </div>`;
  } else {
    area.innerHTML = `<div class="glass-card text-center opacity-20 text-[9px] font-black uppercase tracking-widest">No Active Mission</div>`;
  }
}

function renderFeed() {
  const cont = document.getElementById("listData");
  if (!cont) return;

  const isAdmin = localStorage.getItem("is_admin") === "true";

  cont.innerHTML = allTasks.length
    ? allTasks
        .map(
          (t) => `
        <div class="glass-card flex justify-between items-center mb-3 ${t.is_done ? "opacity-30" : ""}" 
             style="border-left: 6px solid ${t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93"}">
            <div class="flex items-center truncate flex-1 ml-3 text-left">
                <div class="truncate">
                    <p class="task-meta font-black uppercase text-[8px] opacity-40">${tLoc(t.category)} • ${t.tgl_deadline}</p>
                    <p class="task-title truncate text-sm font-bold uppercase">${t.content}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 ml-2 shrink-0">
                ${t.task_link?.startsWith("http") ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2.5 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">OPEN</a>` : ""}
                ${isAdmin ? `<button onclick="askDel('${t.id}')" class="text-[8px] font-black opacity-30 hover:opacity-100 transition">DEL</button>` : ""}
            </div>
        </div>`,
        )
        .join("")
    : `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.4em]">Hub Clear</div>`;
}

function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;
  const y = currentCalDate.getFullYear(),
    m = currentCalDate.getMonth();
  const todayStr = new Date().setHours(0, 0, 0, 0);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  cont.innerHTML = `
        <div class="col-span-7 flex justify-between items-center mb-6 px-2">
            <button onclick="changeCalMonth(-1)" class="text-[9px] font-black opacity-30">PREV</button>
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em]">${months[m]} ${y}</h3>
            <button onclick="changeCalMonth(1)" class="text-[9px] font-black opacity-30">NEXT</button>
        </div>`;

  const first = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
  for (let d = 1; d <= days; d++) {
    const checkDate = new Date(y, m, d).setHours(0, 0, 0, 0);
    const tasks = allTasks.filter(
      (t) =>
        checkDate >= new Date(t.tgl_start).setHours(0, 0, 0, 0) &&
        checkDate <= new Date(t.tgl_deadline).setHours(0, 0, 0, 0),
    );

    let pClass = "";
    if (checkDate === todayStr && tasks.length > 0) pClass = "task-today";
    else if (tasks.length === 1)
      pClass =
        tasks[0].priority === "High"
          ? "pri-high"
          : tasks[0].priority === "Medium"
            ? "pri-medium"
            : "pri-low";
    else if (tasks.length === 2) pClass = "task-double";
    else if (tasks.length === 3) pClass = "task-triple";
    else if (tasks.length >= 4) pClass = "task-quadruple";

    const dayEl = document.createElement("div");
    dayEl.className = `day-cell ${pClass} ${checkDate === todayStr ? "cal-today" : ""} relative`;
    
    const dSpan = document.createElement("span");
    dSpan.innerText = d;
    dayEl.appendChild(dSpan);

    if (tasks.length > 1) {
      const badge = document.createElement("div");
      badge.className = "absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full flex items-center justify-center text-[8px] font-black shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10 border border-white/20";
      badge.innerText = tasks.length;
      dayEl.appendChild(badge);
    }

    dayEl.onclick = () =>
      tasks.length &&
      showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
    cont.appendChild(dayEl);
  }
}

/* --- PICKERS & MODALS --- */
function renderPicker() {
  const cont = document.getElementById("datepicker-days"),
    m = pDate.getMonth(),
    y = pDate.getFullYear();
  const title = document.getElementById("currentMonthYear");
  if (title)
    title.innerText = pDate.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

  const first = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  if (!cont) return;
  cont.innerHTML = "";
  for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
  for (let d = 1; d <= days; d++) {
    const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cont.innerHTML += `<div class="p-2 hover:bg-white/10 rounded-full cursor-pointer text-[10px]" onclick="selectDate('${dStr}')">${d}</div>`;
  }
}

function selectDate(d) {
  document.getElementById(
    dateTarget === "start" ? "tglMulai" : "tglDeadline",
  ).value = d;
  document.getElementById("custom-datepicker").classList.add("hidden");
  showNotify(`Target date: ${d}`);
}

function openSelect(e, type) {
  e.stopPropagation();
  const m = document.getElementById("custom-modal"),
    opt = document.getElementById("modal-options");
  if (!m || !opt) return;
  if (type === "startTime" || type === "endTime") {
    timeTarget = type === "startTime" ? "start" : "end";
    openManualTimePicker();
    return;
  }

  m.classList.remove("hidden");
  opt.innerHTML = "";
  
  let items = [];
  if (type === "kategori") {
    items = [{ t: "Tugas", v: "Assignment" }, { t: "Event", v: "Event" }, { t: "Jadwal", v: "Schedule" }];
  } else if (type === "day") {
    items = [{ t: "Senin", v: "Senin" }, { t: "Selasa", v: "Selasa" }, { t: "Rabu", v: "Rabu" }, { t: "Kamis", v: "Kamis" }, { t: "Jumat", v: "Jumat" }, { t: "Sabtu", v: "Sabtu" }];
  } else if (type === "priority") {
    items = [{ t: "Rendah", v: "Low" }, { t: "Sedang", v: "Medium" }, { t: "Tinggi", v: "High" }];
  } else if (type === "sks") {
    items = [{ t: "1 SKS", v: "1" }, { t: "2 SKS", v: "2" }, { t: "3 SKS", v: "3" }, { t: "4 SKS", v: "4" }, { t: "6 SKS", v: "6" }];
  }

  items.forEach((item) => {
    const b = document.createElement("button");
    b.className =
      "py-4 bg-white/5 rounded-xl font-black text-[9px] uppercase hover:bg-white/10 shrink-0";
    b.innerText = item.t;
    b.onclick = () => {
      if (type === "kategori") {
        selectedKat = item.v;
        document.getElementById("btn-kategori").innerText = item.t;
      } else if (type === "day") {
        selectedDay = item.v;
        document.getElementById("btn-schedule-day").innerText = item.t;
      } else if (type === "startTime") {
        selectedStartTime = item.v;
        document.getElementById("btn-schedule-start").innerText = item.t;
      } else if (type === "endTime") {
        selectedEndTime = item.v;
        document.getElementById("btn-schedule-end").innerText = item.t;
      } else if (type === "sks") {
        selectedSKS = item.v;
        document.getElementById("btn-schedule-sks").innerText = item.t;
      } else {
        selectedPri = item.v;
        document.getElementById("btn-priority").innerText = item.t;
      }
      closeModal();
      showNotify(`${type} changed to ${item.t}`);
    };
    opt.appendChild(b);
  });
}

/* --- UTILITIES & EVENTS --- */
async function askDel(id) {
  if (!id || id === "undefined") return;
  delId = id;
  customConfirm("Terminate this mission data?", confirmDelete);
}

async function confirmDelete() {
  const { error } = await sb.from("schedule").delete().eq("id", delId);
  if (error) showNotify(`Failed: ${error.message}`, "error");
  else {
    showNotify("Mission data terminated");
    muatData();
  }
}

function toggleTheme() {
  const h = document.documentElement;
  const n = h.getAttribute("data-theme") === "dark" ? "light" : "dark";
  h.setAttribute("data-theme", n);
  localStorage.setItem("theme", n);
  setTimeout(() => {
    const active = document.querySelector(".nav a.active");
    if (active) moveNavBubble(active);
  }, 50);
  renderCountdown();
}

function changeMonth(dir) {
  pDate.setMonth(pDate.getMonth() + dir);
  renderPicker();
}
function changeCalMonth(dir) {
  currentCalDate.setMonth(currentCalDate.getMonth() + dir);
  renderCalendar();
}
function closeModal() {
  document.getElementById("custom-modal")?.classList.add("hidden");
}

/* --- MANUAL TIME PICKER LOGIC --- */
function openManualTimePicker() {
  const modal = document.getElementById("time-picker-modal");
  const title = document.getElementById("time-picker-title");
  
  title.innerText = timeTarget === "start" ? "Set Start Time" : "Set End Time";
  
  // Pre-fill with existing values
  const current = timeTarget === "start" ? selectedStartTime : selectedEndTime;
  if(current && current.includes(":")) {
    const [h, m] = current.split(":");
    document.getElementById("input-hour").value = h;
    document.getElementById("input-minute").value = m;
  }
  
  modal.classList.remove("hidden");
  document.getElementById("input-hour").focus();
}

function closeTimePicker() {
  document.getElementById("time-picker-modal").classList.add("hidden");
}

function confirmManualTime() {
  let h = document.getElementById("input-hour").value;
  let m = document.getElementById("input-minute").value;
  
  if(h === "" || m === "") return showNotify("Please enter hour and minute", "error");
  
  // Format padding
  h = String(h).padStart(2, '0');
  m = String(m).padStart(2, '0');
  
  if (parseInt(h) > 23 || parseInt(m) > 59) return showNotify("Invalid time format", "error");
  
  const timeStr = `${h}:${m}`;
  
  if (timeTarget === "start") {
    selectedStartTime = timeStr;
    document.getElementById("btn-schedule-start").innerText = timeStr;
  } else {
    selectedEndTime = timeStr;
    document.getElementById("btn-schedule-end").innerText = timeStr;
  }
  
  closeTimePicker();
  showNotify(`Time set to ${timeStr}`);
}

function toggleDatePicker(e, target) {
  e.stopPropagation();
  dateTarget = target;
  document.getElementById("custom-datepicker").classList.toggle("hidden");
  renderPicker();
}

function showCalendarDetail(dateStr, tasks) {
  document.getElementById("detail-date-title").innerText = dateStr;
  document.getElementById("calendar-task-list").innerHTML = tasks
    .map(
      (t) => `
        <div class="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
            <span class="text-[7px] font-black uppercase ${t.priority === "High" ? "text-red-500" : t.priority === "Medium" ? "text-orange-500" : "text-gray-400"}">${tLoc(t.priority)}</span>
            <p class="text-xs font-bold mt-1 uppercase">${t.content}</p>
        </div>`,
    )
    .join("");
  document.getElementById("calendar-detail-modal").classList.remove("hidden");
}

function closeCalendarDetail() {
  document.getElementById("calendar-detail-modal")?.classList.add("hidden");
}

function previewImage(input) {
  const container = document.getElementById("file-preview-container"),
    preview = document.getElementById("file-preview"),
    placeholder = document.getElementById("upload-placeholder");
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      container.classList.remove("hidden");
      placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Clock
setInterval(() => {
  const clock = document.getElementById("clock");
  if (clock)
    clock.innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
}, 1000);

window.addEventListener("resize", () => {
  const active = document.querySelector(".nav a.active");
  if (active) moveNavBubble(active);
});

// SUPABASE REALTIME (Live Updates)
function setupRealtime() {
  sb.channel('realtime-hub')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, payload => {
      muatData();
      const st = payload.eventType;
      if (st !== 'DELETE') showNotify("Sistem: Data jadwal diperbarui");
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, payload => {
      muatInfo();
      const st = payload.eventType;
      if (st !== 'DELETE') showNotify("Sistem: Papan informasi diperbarui");
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, payload => {
      muatGallery();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lecturers' }, payload => {
      muatDosen();
    })
    .subscribe();
}

// INITIAL LOAD
window.addEventListener("load", () => {
  const active = document.querySelector(".nav a.active");
  if (active) moveNavBubble(active);
  refreshAllData();
  setupRealtime();
});
