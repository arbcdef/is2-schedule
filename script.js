const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [],
  selectedKat = "Assignment",
  selectedPri = "Medium",
  pDate = new Date(),
  delId = null,
  dateTarget = "start";

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

    if (statusDot) statusDot.className = "w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
    if (statusText) {
      statusText.innerText = "Active";
      statusText.style.color = "";
      statusText.style.opacity = "0.5";
    }
    renderAll();
  } catch (err) {
    console.error("Database connection error:", err);
    if (statusDot) statusDot.className = "w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse";
    if (statusText) {
      statusText.innerText = "Offline";
      statusText.style.color = "#ef4444";
      statusText.style.opacity = "1";
    }
    renderAll();
  }
}

function renderAll() {
  renderFeed();
  renderCalendar();
  renderCountdown();
}

function renderCountdown() {
  const area = document.getElementById("next-deadline-area");
  if (!area) return;

  const upcoming = allTasks
    .filter((t) => !t.is_done)
    .sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];

  if (upcoming) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(upcoming.tgl_deadline); deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    let dayText = diffDays === 0 ? "DUE TODAY" : diffDays < 0 ? `${Math.abs(diffDays)} OVERDUE` : `${diffDays} DAYS LEFT`;

    area.innerHTML = `
      <div class="dynamic-island p-7 flex justify-between items-center fade-in border border-white/10">
          <div class="mr-4 flex-1">
              <p class="text-[8px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Upcoming Mission</p>
              <h2 class="text-lg font-black tracking-tight uppercase leading-tight">${upcoming.content}</h2>
          </div>
          <div class="text-right min-w-[120px]"><span class="text-xl font-black tracking-tighter uppercase">${dayText}</span></div>
      </div>`;
  } else {
    area.innerHTML = `<div class="glass-card p-6 border border-white/5 text-center fade-in"><p class="text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">All Missions Secured</p></div>`;
  }
}

function renderFeed() {
  const cont = document.getElementById("listData");
  if (!cont) return;
  cont.innerHTML = allTasks.map((t) => {
    const hasLink = t.task_link && t.task_link.startsWith("http");
    return `<div class="glass-card p-4 flex justify-between items-center mb-2 ${t.is_done ? "opacity-30" : ""}" style="border-left: 4px solid ${t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93"}">
      <div class="flex items-center gap-4 truncate flex-1">
          <input type="checkbox" ${t.is_done ? "checked" : ""} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-4 h-4 cursor-pointer">
          <div class="truncate">
              <p class="text-[7px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
              <p class="font-bold truncate text-xs">${t.content}</p>
          </div>
      </div>
      <div class="flex items-center gap-3 ml-2">
          ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition">LINK</a>` : ""}
          <button onclick="askDel(${t.id})" class="text-[8px] font-black opacity-10 hover:opacity-100 transition">DEL</button>
      </div></div>`;
  }).join("");
}

// --- FUNGSI KALENDER (LOGIKA WARNA DISINI) ---
function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;

  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const todayDate = new Date().setHours(0, 0, 0, 0);

  cont.innerHTML = "";
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  // Penyesuaian agar hari Senin jadi urutan pertama (Opsional, hapus jika mau mulai dari Minggu)
  let offset = first === 0 ? 6 : first - 1;
  for (let i = 0; i < offset; i++) cont.innerHTML += "<div></div>";

  for (let d = 1; d <= days; d++) {
    const checkDate = new Date(y, m, d).setHours(0, 0, 0, 0);
    const tasks = allTasks.filter((t) => 
      checkDate >= new Date(t.tgl_start).setHours(0, 0, 0, 0) &&
      checkDate <= new Date(t.tgl_deadline).setHours(0, 0, 0, 0)
    );

    let pClass = "";
    // Urutan Logika:
    if (checkDate === todayDate) {
      pClass = "today"; // Biru (Prioritas utama visual)
    } else if (tasks.length === 1) {
      pClass = tasks[0].priority.toLowerCase(); // low, medium, atau high
    } else if (tasks.length === 2) {
      pClass = "double"; // Merah Gelap
    } else if (tasks.length >= 3) {
      pClass = "triple"; // Ungu
    }

    const dayEl = document.createElement("div");
    dayEl.className = `day-cell ${pClass}`;
    dayEl.innerText = d;
    dayEl.onclick = () => tasks.length && showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
    cont.appendChild(dayEl);
  }
}

function showCalendarDetail(dateStr, tasks) {
  const modal = document.getElementById("calendar-detail-modal");
  const title = document.getElementById("detail-date-title");
  const list = document.getElementById("calendar-task-list");
  if (!modal) return;

  title.innerText = dateStr;
  list.innerHTML = tasks.map((t) => `
    <div class="p-4 bg-white/5 rounded-2xl border border-white/5 mb-2">
      <div class="flex justify-between items-start mb-2">
          <span class="px-2 py-0.5 rounded text-[7px] font-black uppercase ${t.priority === "High" ? "bg-red-500/20 text-red-500" : t.priority === "Medium" ? "bg-orange-500/20 text-orange-500" : "bg-gray-500/20 text-gray-400"}">${t.priority}</span>
      </div><p class="text-xs font-bold">${t.content}</p></div>`).join("");
  modal.classList.remove("hidden");
  modal.classList.add("active"); // Tambah class active untuk CSS baru
}

function closeCalendarDetail() {
  const modal = document.getElementById("calendar-detail-modal");
  modal.classList.add("hidden");
  modal.classList.remove("active");
}

async function simpanData() {
  const isi = document.getElementById("isiData").value,
    t1 = document.getElementById("tglMulai").value,
    t2 = document.getElementById("tglDeadline").value,
    link = document.getElementById("linkData").value;

  if (!isi || !t2) return;
  try {
    await sb.from("schedule").insert([{
        content: isi,
        tgl_start: t1 || t2,
        tgl_deadline: t2,
        category: selectedKat,
        priority: selectedPri,
        is_done: false,
        task_link: link,
    }]);
    muatData();
    ["isiData", "linkData", "tglMulai", "tglDeadline"].forEach(id => document.getElementById(id).value = "");
  } catch (err) { alert("Failed to save."); }
}

function openSelect(type) {
  const m = document.getElementById("custom-modal"), opt = document.getElementById("modal-options");
  if (m) { m.classList.remove("hidden"); m.classList.add("active"); }
  if (opt) {
    opt.innerHTML = "";
    const items = type === "kategori" ? ["Assignment", "Event", "Schedule"] : ["Low", "Medium", "High"];
    items.forEach((item) => {
      const b = document.createElement("button");
      b.className = "py-4 bg-white/5 rounded-xl font-black text-[9px] uppercase hover:bg-white/10 text-current";
      b.innerText = item;
      b.onclick = () => {
        if (type === "kategori") { selectedKat = item; document.getElementById("btn-kategori").innerText = item; }
        else { selectedPri = item; document.getElementById("btn-priority").innerText = item; }
        closeModal();
      };
      opt.appendChild(b);
    });
  }
}

function closeModal() {
  const m = document.getElementById("custom-modal");
  m.classList.add("hidden"); m.classList.remove("active");
}

function askDel(id) {
  delId = id;
  const m = document.getElementById("delete-modal");
  m.classList.remove("hidden"); m.classList.add("active");
}

async function confirmDelete() {
  await sb.from("schedule").delete().eq("id", delId);
  document.getElementById("delete-modal").classList.add("hidden");
  muatData();
}

async function toggleDone(id, s) {
  await sb.from("schedule").update({ is_done: !s }).eq("id", id);
  muatData();
}

function toggleTheme() {
  const h = document.documentElement, n = h.getAttribute("data-theme") === "dark" ? "light" : "dark";
  h.setAttribute("data-theme", n);
}

setInterval(() => {
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
}, 1000);

muatData();
