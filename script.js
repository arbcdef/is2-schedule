const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [],
  selectedKat = "Assignment",
  selectedPri = "Medium",
  pDate = new Date(),
  delId = null,
  dateTarget = "start";

// --- CORE DATA ---
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
      statusText.style.opacity = "0.5";
    }
    renderAll();
  } catch (err) {
    console.error("Database error:", err);
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

// --- RENDER COMPONENTS ---
function renderCountdown() {
  const area = document.getElementById("next-deadline-area");
  if (!area) return;

  const upcoming = allTasks
    .filter((t) => !t.is_done)
    .sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];

  if (upcoming) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(upcoming.tgl_deadline);
    deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    let dayText = diffDays === 0 ? "DUE TODAY" : diffDays < 0 ? `${Math.abs(diffDays)} OVERDUE` : `${diffDays} DAYS LEFT`;

    area.innerHTML = `
      <div class="dynamic-island fade-in">
        <div class="flex-1">
          <p class="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Upcoming Mission</p>
          <h2 class="uppercase">${upcoming.content}</h2>
        </div>
        <div class="text-right"> 
          <span class="text-lg font-black tracking-tighter uppercase whitespace-nowrap">${dayText}</span>
        </div>
      </div>`;
  } else {
    area.innerHTML = `<div class="glass-card p-6 text-center fade-in"><p class="text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">Hub Clear</p></div>`;
  }
}

function renderFeed() {
  const cont = document.getElementById("listData");
  if (!cont) return;

  cont.innerHTML = allTasks.length
    ? allTasks.map((t) => {
        const hasLink = t.task_link && t.task_link.startsWith("http");
        const color = t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93";
        return `
          <div class="mission-item ${t.is_done ? "opacity-30" : ""}" style="border-left: 5px solid ${color}">
            <div class="flex-1 truncate cursor-pointer" onclick="toggleDone(${t.id}, ${t.is_done})">
              <p class="text-[7px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
              <p class="font-bold truncate text-xs ${t.is_done ? 'line-through' : ''}">${t.content}</p>
            </div>
            <div class="flex items-center gap-3 ml-2">
              ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition">LINK</a>` : ""}
              <button onclick="askDel(${t.id})" class="text-[8px] font-black opacity-10 hover:opacity-100 transition">DEL</button>
            </div>
          </div>`;
      }).join("")
    : `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase tracking-widest">Hub Clear</div>`;
}

function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;

  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  cont.innerHTML = "";
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  
  for (let i = 0; i < (first === 0 ? 6 : first - 1); i++) cont.innerHTML += "<div></div>";
  
  for (let d = 1; d <= days; d++) {
    const checkDate = new Date(y, m, d).setHours(0, 0, 0, 0);
    const tasks = allTasks.filter(t => 
      checkDate >= new Date(t.tgl_start).setHours(0, 0, 0, 0) &&
      checkDate <= new Date(t.tgl_deadline).setHours(0, 0, 0, 0)
    );
    
    let pClass = "";
    const isToday = d === now.getDate() && m === now.getMonth() && y === now.getFullYear();

    if (isToday) pClass = "today";
    else if (tasks.length === 1) {
      const prio = tasks[0].priority.toLowerCase();
      pClass = prio; 
    } else if (tasks.length === 2) pClass = "double";
    else if (tasks.length >= 3) pClass = "triple";

    const dayEl = document.createElement("div");
    dayEl.className = `day-cell ${pClass}`;
    dayEl.innerText = d;
    dayEl.onclick = () => tasks.length && showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
    cont.appendChild(dayEl);
  }
}

// --- MODALS LOGIC (FIXED GEPENG & KLIK) ---
function openSelect(type) {
  const m = document.getElementById("custom-modal");
  const opt = document.getElementById("modal-options");
  if (!m || !opt) return;

  opt.innerHTML = "";
  const items = type === "kategori" ? ["Assignment", "Event", "Schedule"] : ["Low", "Medium", "High"];
  
  items.forEach((item) => {
    const b = document.createElement("button");
    // Gunakan class modal-option-btn yang sudah ada di CSS
    b.className = "modal-option-btn"; 
    b.innerText = item;
    b.onclick = (e) => {
      e.stopPropagation();
      if (type === "kategori") {
        selectedKat = item;
        document.getElementById("btn-kategori").innerText = item;
      } else {
        selectedPri = item;
        document.getElementById("btn-priority").innerText = item;
      }
      closeModal();
    };
    opt.appendChild(b);
  });

  m.classList.remove("hidden");
  // Force reflow untuk animasi
  void m.offsetWidth; 
  m.classList.add("active");
}

function closeModal() {
  const m = document.getElementById("custom-modal");
  if (m) {
    m.classList.remove("active");
    setTimeout(() => m.classList.add("hidden"), 300);
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
      </div>
      <p class="text-xs font-bold">${t.content}</p>
    </div>`).join("");
  
  modal.classList.remove("hidden");
  void modal.offsetWidth;
  modal.classList.add("active");
}

function closeCalendarDetail() {
  const modal = document.getElementById("calendar-detail-modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }
}

// --- DATABASE ACTIONS ---
async function simpanData() {
  const isi = document.getElementById("isiData").value;
  const t1 = document.getElementById("tglMulai").value;
  const t2 = document.getElementById("tglDeadline").value;
  const link = document.getElementById("linkData").value;
    
  if (!isi || !t2) return;
  
  try {
    const { error } = await sb.from("schedule").insert([{
      content: isi,
      tgl_start: t1 || t2,
      tgl_deadline: t2,
      category: selectedKat,
      priority: selectedPri,
      is_done: false,
      task_link: link,
    }]);
    
    if (error) throw error;

    // Reset inputs
    ["isiData", "linkData", "tglMulai", "tglDeadline"].forEach(id => document.getElementById(id).value = "");
    
    // Show success modal
    const sModal = document.getElementById("universal-modal");
    sModal.classList.remove("hidden");
    void sModal.offsetWidth;
    sModal.classList.add("active");

    muatData();
  } catch (err) {
    console.error(err);
    alert("Save failed.");
  }
}

function closeUniversalModal() {
  const m = document.getElementById("universal-modal");
  if (m) {
    m.classList.remove("active");
    setTimeout(() => m.classList.add("hidden"), 300);
  }
}

async function toggleDone(id, s) {
  await sb.from("schedule").update({ is_done: !s }).eq("id", id);
  muatData();
}

function askDel(id) {
  delId = id;
  const m = document.getElementById("delete-modal");
  m.classList.remove("hidden");
  void m.offsetWidth;
  m.classList.add("active");
}

function closeDeleteModal() {
  const m = document.getElementById("delete-modal");
  if (m) {
    m.classList.remove("active");
    setTimeout(() => m.classList.add("hidden"), 300);
  }
}

async function confirmDelete() {
  if (!delId) return;
  await sb.from("schedule").delete().eq("id", delId);
  closeDeleteModal();
  muatData();
}

// --- UTILS ---
function toggleDatePicker(e, target) {
  e.stopPropagation();
  dateTarget = target;
  const picker = document.getElementById("custom-datepicker");
  picker.classList.toggle("hidden");
  renderPicker();
}

function selectDate(d) {
  document.getElementById(dateTarget === "start" ? "tglMulai" : "tglDeadline").value = d;
  document.getElementById("custom-datepicker").classList.add("hidden");
}

function renderPicker() {
  const cont = document.getElementById("datepicker-days"),
    lbl = document.getElementById("currentMonthYear"),
    m = pDate.getMonth(), y = pDate.getFullYear();
    
  if (lbl) lbl.innerText = pDate.toLocaleString("en-US", { month: "short", year: "numeric" });
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
    
  if (cont) {
    cont.innerHTML = "";
    // Offset for Monday start (ISO style)
    let offset = first === 0 ? 6 : first - 1;
    for (let i = 0; i < offset; i++) cont.innerHTML += "<div></div>";
    
    for (let d = 1; d <= days; d++) {
      const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cont.innerHTML += `<div class="p-2 hover:bg-white/10 rounded-full cursor-pointer text-[10px]" onclick="selectDate('${dStr}')">${d}</div>`;
    }
  }
}

function toggleTheme() {
  const h = document.documentElement;
  const n = h.getAttribute("data-theme") === "dark" ? "light" : "dark";
  h.setAttribute("data-theme", n);
  const btn = document.querySelector("button[onclick='toggleTheme()'] span");
  if (btn) btn.innerText = n === "dark" ? "☀️" : "🌙";
}

function changeMonth(dir) {
  pDate.setMonth(pDate.getMonth() + dir);
  renderPicker();
}

// Global click listener to close datepicker when clicking outside
document.addEventListener('click', (e) => {
    const dp = document.getElementById("custom-datepicker");
    if (dp && !dp.contains(e.target)) dp.classList.add("hidden");
});

setInterval(() => {
  const el = document.getElementById("clock");
  if (el) el.innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
}, 1000);

// Start
muatData();
