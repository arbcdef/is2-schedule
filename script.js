const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [],
  allPhotos = [],
  selectedKat = "Assignment",
  selectedPri = "Medium",
  pDate = new Date(),
  currentCalDate = new Date(),
  delId = null,
  dateTarget = "start";

// --- THEME INITIALIZATION ---
if (localStorage.getItem("theme")) {
  document.documentElement.setAttribute(
    "data-theme",
    localStorage.getItem("theme"),
  );
}

// --- NEW SYSTEM: CUSTOM UI NOTIFICATIONS (ANTI-SPAM FIXED) ---
function showNotify(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // FIX: Hapus isi container sebelum menambah yang baru agar tidak spam/menumpuk
  container.innerHTML = "";

  const toast = document.createElement("div");
  const isError = type === "error";

  toast.className = `glass-card flex items-center gap-3 p-4 mb-3 border-l-4 ${isError ? "border-red-500" : "border-green-500"} fade-in shadow-2xl min-w-[250px]`;
  toast.innerHTML = `
    <div class="w-2 h-2 rounded-full ${isError ? "bg-red-500" : "bg-green-500"} animate-pulse"></div>
    <div class="flex-1">
      <p class="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">${type}</p>
      <p class="text-[11px] font-bold leading-tight uppercase">${msg}</p>
    </div>
  `;

  container.appendChild(toast);

  // Durasi tampil sedikit dipercepat agar terasa lebih snappier
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

// Pengganti confirm() browser
function customConfirm(msg, callback) {
  const modal = document.getElementById("custom-confirm-modal");
  const msgText = document.getElementById("confirm-msg-text");
  const okBtn = document.getElementById("confirm-ok-btn");

  if (!modal) return;
  msgText.innerText = msg;
  modal.classList.remove("hidden");

  okBtn.onclick = () => {
    callback();
    modal.classList.add("hidden");
  };
}

function closeConfirm() {
  document.getElementById("custom-confirm-modal").classList.add("hidden");
}

// --- CORE NAVIGATION LOGIC ---
function switchPage(pageId, element) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.add("hidden");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove("hidden");

  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.remove("active");
  });
  element.classList.add("active");

  moveNavBubble(element);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "page-gallery") muatGallery();
}

function moveNavBubble(element) {
  const bubble = document.getElementById("nav-bubble-active");
  if (bubble && element) {
    bubble.style.width = `${element.offsetWidth}px`;
    bubble.style.left = `${element.offsetLeft}px`;
  }
}

window.addEventListener("resize", () => {
  const activeLink = document.querySelector(".nav a.active");
  if (activeLink) moveNavBubble(activeLink);
});

// --- DATA FETCHING (SCHEDULE) ---
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

// --- NEW UI HELPER: PREVIEW IMAGE ---
function previewImage(input) {
  const container = document.getElementById("file-preview-container");
  const img = document.getElementById("file-preview");
  const placeholder = document.getElementById("upload-placeholder");
  const nameDisplay = document.getElementById("file-name-display");

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
      container.classList.remove("hidden");
      if (placeholder) placeholder.classList.add("opacity-50");
      if (nameDisplay) nameDisplay.innerText = input.files[0].name;
      showNotify("Photo selected", "success");
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    if (container) container.classList.add("hidden");
    if (placeholder) placeholder.classList.remove("opacity-50");
    if (nameDisplay) nameDisplay.innerText = "Tap to select or drop photo";
  }
}

// --- GALLERY LOGIC (FIXED & OPTIMIZED) ---
async function uploadFoto() {
  const fileInput = document.getElementById("photo-input");
  const btn = document.getElementById("btn-upload-foto");
  const file = fileInput.files[0];

  if (!file) return showNotify("Please select a photo", "error");

  btn.innerText = "Uploading...";
  btn.disabled = true;

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  const fileName = `${Date.now()}-${cleanFileName}`;

  try {
    const { data: uploadData, error: uploadError } = await sb.storage
      .from("PHOTOS")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

    const { data: urlData } = sb.storage.from("PHOTOS").getPublicUrl(fileName);
    const photoUrl = urlData.publicUrl;

    const { error: dbError } = await sb
      .from("gallery")
      .insert([{ image_url: photoUrl, file_path: fileName }]);

    if (dbError) throw new Error(`Database: ${dbError.message}`);

    fileInput.value = "";
    const previewContainer = document.getElementById("file-preview-container");
    const nameDisplay = document.getElementById("file-name-display");
    const placeholder = document.getElementById("upload-placeholder");

    if (previewContainer) previewContainer.classList.add("hidden");
    if (nameDisplay) nameDisplay.innerText = "Tap to select or drop photo";
    if (placeholder) placeholder.classList.remove("opacity-50");

    showNotify("Moment saved successfully!");
    muatGallery();
  } catch (err) {
    console.error("Full Error Object:", err);
    showNotify(err.message, "error");
  } finally {
    btn.innerText = "Upload";
    btn.disabled = false;
  }
}

async function muatGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  try {
    const { data, error } = await sb
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data) {
      grid.innerHTML = data
        .map(
          (img) => `
                <div class="glass-card p-2 aspect-square overflow-hidden group border border-white/5 relative">
                    <img src="${img.image_url}" 
                         class="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500" 
                         alt="Gallery Photo">
                    <button onclick="hapusFoto(${img.id}, '${img.file_path}')" 
                            class="absolute top-3 right-3 bg-red-500/80 text-white text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        DELETE
                    </button>
                </div>
            `,
        )
        .join("");
    }
  } catch (err) {
    console.error("Gallery Error:", err);
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

function renderAll() {
  renderFeed();
  renderCalendar();
  renderCountdown();
}

// --- RENDERING FUNCTIONS INTACT ---
function renderCountdown() {
  const area = document.getElementById("next-deadline-area");
  if (!area) return;

  const upcoming = allTasks
    .filter((t) => !t.is_done)
    .sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];

  if (upcoming) {
    const today = new Date().setHours(0, 0, 0, 0);
    const deadline = new Date(upcoming.tgl_deadline).setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    const priColor =
      upcoming.priority === "High"
        ? "#ff3b30"
        : upcoming.priority === "Medium"
          ? "#ff9500"
          : "#8e8e93";

    let dayText =
      diffDays === 0
        ? "DUE TODAY"
        : diffDays < 0
          ? `${Math.abs(diffDays)} OVERDUE`
          : `${diffDays} DAYS LEFT`;

    const isMultiDay = upcoming.tgl_start !== upcoming.tgl_deadline;
    const periodText = isMultiDay
      ? `${upcoming.tgl_start} — ${upcoming.tgl_deadline}`
      : upcoming.tgl_deadline;

    area.innerHTML = `
      <div class="dynamic-island fade-in" style="border-left: 6px solid ${priColor};">
          <div class="flex-1 truncate mr-4 text-left">
              <p class="island-meta text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">
                <span style="color: ${priColor}">${upcoming.category}</span> • ${periodText}
              </p>
              <h2 class="text-sm font-black uppercase leading-tight truncate">${upcoming.content}</h2>
          </div>
          <div class="text-right">
            <span class="text-lg font-black tracking-tighter uppercase">${dayText}</span>
          </div>
      </div>`;
  } else {
    area.innerHTML = `<div class="glass-card text-center opacity-20 text-[9px] font-black uppercase tracking-widest" style="box-shadow: none !important;">No Active Mission</div>`;
  }
}

function renderFeed() {
  const cont = document.getElementById("listData");
  if (!cont) return;

  cont.innerHTML = allTasks.length
    ? allTasks
        .map((t) => {
          const hasLink = t.task_link && t.task_link.startsWith("http");
          const shortDate = `${t.tgl_start.split("-").slice(1).join("/")} - ${t.tgl_deadline.split("-").slice(1).join("/")}`;

          return `
          <div class="glass-card flex justify-between items-center mb-3 ${t.is_done ? "opacity-30" : ""}" 
               style="border-left: 6px solid ${t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93"}; box-shadow: none !important;">
            <div class="flex items-center truncate flex-1 ml-3"> 
                <div class="truncate text-left w-full">
                    <p class="task-meta">${t.category} • ${shortDate}</p>
                    <p class="task-title truncate text-base font-bold">${t.content}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 ml-2 shrink-0">
                ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2.5 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition tracking-tighter">OPEN</a>` : ""}
                <button onclick="askDel(${t.id})" class="text-[8px] font-black opacity-20 hover:opacity-100 transition">DEL</button>
            </div>
          </div>`;
        })
        .join("")
    : `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase">Hub Clear</div>`;
}

function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;

  const y = currentCalDate.getFullYear();
  const m = currentCalDate.getMonth();
  const todayStr = new Date().setHours(0, 0, 0, 0);
  const monthNames = [
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
      <button onclick="changeCalMonth(-1)" class="text-[9px] font-black opacity-30 hover:opacity-100 transition">PREV</button>
      <h3 class="text-[10px] font-black uppercase tracking-[0.3em]">${monthNames[m]} ${y}</h3>
      <button onclick="changeCalMonth(1)" class="text-[9px] font-black opacity-30 hover:opacity-100 transition">NEXT</button>
    </div>`;

  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

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
    else if (tasks.length === 1) {
      const pri = tasks[0].priority;
      pClass =
        pri === "High"
          ? "pri-high"
          : pri === "Medium"
            ? "pri-medium"
            : "pri-low";
    } else if (tasks.length === 2) pClass = "task-double";
    else if (tasks.length >= 3) pClass = "task-triple";

    const dayEl = document.createElement("div");
    dayEl.className = `day-cell ${pClass} ${checkDate === todayStr ? "cal-today" : ""}`;
    dayEl.innerText = d;
    dayEl.onclick = () =>
      tasks.length &&
      showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
    cont.appendChild(dayEl);
  }
}

function changeCalMonth(dir) {
  currentCalDate.setMonth(currentCalDate.getMonth() + dir);
  renderCalendar();
}

function showCalendarDetail(dateStr, tasks) {
  document.getElementById("detail-date-title").innerText = dateStr;
  document.getElementById("calendar-task-list").innerHTML = tasks
    .map(
      (t) => `
    <div class="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
        <span class="text-[7px] font-black uppercase ${t.priority === "High" ? "text-red-500" : t.priority === "Medium" ? "text-orange-500" : "text-gray-400"}">${t.priority}</span>
        <p class="text-xs font-bold mt-1">${t.content}</p>
    </div>`,
    )
    .join("");
  document.getElementById("calendar-detail-modal").classList.remove("hidden");
}

function closeCalendarDetail() {
  document.getElementById("calendar-detail-modal").classList.add("hidden");
}

async function simpanData() {
  const isi = document.getElementById("isiData").value,
    t1 = document.getElementById("tglMulai").value,
    t2 = document.getElementById("tglDeadline").value,
    link = document.getElementById("linkData").value;
  if (!isi || !t2) return showNotify("Data mission tidak lengkap", "error");

  const { error } = await sb.from("schedule").insert([
    {
      content: isi,
      tgl_start: t1 || t2,
      tgl_deadline: t2,
      category: selectedKat,
      priority: selectedPri,
      is_done: false,
      task_link: link,
    },
  ]);

  if (error) showNotify("Failed to save data", "error");
  else {
    showNotify("Mission data uploaded!");
    document.getElementById("isiData").value = "";
    document.getElementById("linkData").value = "";
    muatData();
  }
}

function toggleDatePicker(e, target) {
  e.stopPropagation();
  dateTarget = target;
  document.getElementById("custom-datepicker").classList.toggle("hidden");
  renderPicker();
}

function selectDate(d) {
  document.getElementById(
    dateTarget === "start" ? "tglMulai" : "tglDeadline",
  ).value = d;
  document.getElementById("custom-datepicker").classList.add("hidden");
  showNotify(`Target date: ${d}`);
}

function renderPicker() {
  const cont = document.getElementById("datepicker-days"),
    m = pDate.getMonth(),
    y = pDate.getFullYear();
  document.getElementById("currentMonthYear").innerText = pDate.toLocaleString(
    "en-US",
    { month: "short", year: "numeric" },
  );
  const first = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  cont.innerHTML = "";
  for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
  for (let d = 1; d <= days; d++) {
    const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cont.innerHTML += `<div class="p-2 hover:bg-white/10 rounded-full cursor-pointer text-[10px]" onclick="selectDate('${dStr}')">${d}</div>`;
  }
}

function openSelect(e, type) {
  e.stopPropagation();
  const m = document.getElementById("custom-modal"),
    opt = document.getElementById("modal-options");
  m.classList.remove("hidden");
  opt.innerHTML = "";
  const items =
    type === "kategori"
      ? ["Assignment", "Event", "Schedule"]
      : ["Low", "Medium", "High"];
  items.forEach((item) => {
    const b = document.createElement("button");
    b.className =
      "py-4 bg-white/5 rounded-xl font-black text-[9px] uppercase hover:bg-white/10 text-current";
    b.innerText = item;
    b.onclick = () => {
      if (type === "kategori") {
        selectedKat = item;
        document.getElementById("btn-kategori").innerText = item;
      } else {
        selectedPri = item;
        document.getElementById("btn-priority").innerText = item;
      }
      closeModal();
      showNotify(`${type} changed to ${item}`);
    };
    opt.appendChild(b);
  });
}

function closeModal() {
  document.getElementById("custom-modal").classList.add("hidden");
}

function askDel(id) {
  delId = id;
  customConfirm("Terminate this mission data?", async () => {
    await confirmDelete();
  });
}

function closeDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
}

async function confirmDelete() {
  const { error } = await sb.from("schedule").delete().eq("id", delId);
  if (error) showNotify("Failed to delete", "error");
  else {
    showNotify("Mission data terminated");
    muatData();
  }
}

function toggleTheme() {
  const h = document.documentElement,
    n = h.getAttribute("data-theme") === "dark" ? "light" : "dark";
  h.setAttribute("data-theme", n);
  localStorage.setItem("theme", n);
  const activeLink = document.querySelector(".nav a.active");
  if (activeLink) moveNavBubble(activeLink);
  renderCountdown();
  showNotify(`Mode set to ${n.toUpperCase()}`);
}

function changeMonth(dir) {
  pDate.setMonth(pDate.getMonth() + dir);
  renderPicker();
}

setInterval(() => {
  const clockEl = document.getElementById("clock");
  if (clockEl)
    clockEl.innerText = new Date().toLocaleTimeString("id-ID", {
      hour12: false,
    });
}, 1000);

window.addEventListener("load", () => {
  const activeLink = document.querySelector(".nav a.active");
  if (activeLink) moveNavBubble(activeLink);
  muatGallery();
});

muatData();
