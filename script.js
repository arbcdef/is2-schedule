const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
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
    statusDot.className =
      "w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
    statusText.innerText = "Active";
    renderAll();
  } catch (err) {
    statusDot.className = "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
    statusText.innerText = "Offline";
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
  const upcoming = allTasks
    .filter((t) => !t.is_done)
    .sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];
  if (upcoming) {
    const today = new Date().setHours(0, 0, 0, 0);
    const deadline = new Date(upcoming.tgl_deadline).setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    let dayText =
      diffDays === 0
        ? "DUE TODAY"
        : diffDays < 0
          ? `${Math.abs(diffDays)} OVERDUE`
          : `${diffDays} DAYS LEFT`;
    area.innerHTML = `
            <div class="dynamic-island fade-in">
                <div class="flex-1 truncate mr-4">
                    <p class="text-[8px] font-black opacity-50 uppercase tracking-widest mb-1">Upcoming Mission</p>
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
  cont.innerHTML = allTasks.length
    ? allTasks
        .map((t) => {
          const hasLink = t.task_link && t.task_link.startsWith("http");
          return `<div class="glass-card p-4 flex justify-between items-center mb-2" style="border-left: 4px solid ${t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93"}">
            <div class="truncate flex-1">
                <p class="text-[7px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
                <p class="font-bold truncate text-xs">${t.content}</p>
            </div>
            <div class="flex items-center gap-3 ml-2">
                ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition">OPEN</a>` : ""}
                <button onclick="askDel(${t.id})" class="text-[8px] font-black opacity-20 hover:opacity-100 transition">DEL</button>
            </div></div>`;
        })
        .join("")
    : `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase">Hub Clear</div>`;
}

function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  const now = new Date(),
    y = now.getFullYear(),
    m = now.getMonth();
  const todayStr = new Date().setHours(0, 0, 0, 0);
  cont.innerHTML = "";
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
    if (tasks.length === 1) {
      if (checkDate === todayStr)
        pClass = "task-today"; // Biru jika hari ini ada 1 tugas
      else
        pClass =
          tasks[0].priority === "High"
            ? "pri-high"
            : tasks[0].priority === "Medium"
              ? "pri-medium"
              : "pri-low";
    } else if (tasks.length === 2) {
      pClass = "task-double"; // Merah Gelap
    } else if (tasks.length >= 3) {
      pClass = "task-triple"; // Ungu
    }

    const dayEl = document.createElement("div");
    dayEl.className = `day-cell ${pClass} ${checkDate === todayStr ? "cal-today" : ""}`;
    dayEl.innerText = d;
    dayEl.onclick = () =>
      tasks.length &&
      showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
    cont.appendChild(dayEl);
  }
}

function showCalendarDetail(dateStr, tasks) {
  document.getElementById("detail-date-title").innerText = dateStr;
  document.getElementById("calendar-task-list").innerHTML = tasks
    .map(
      (t) => `
        <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
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
  if (!isi || !t2) return;
  await sb
    .from("schedule")
    .insert([
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
  document.getElementById("isiData").value = "";
  document.getElementById("linkData").value = "";
  muatData();
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

function openSelect(type) {
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
    };
    opt.appendChild(b);
  });
}

function closeModal() {
  document.getElementById("custom-modal").classList.add("hidden");
}
function askDel(id) {
  delId = id;
  document.getElementById("delete-modal").classList.remove("hidden");
}
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
}
async function confirmDelete() {
  await sb.from("schedule").delete().eq("id", delId);
  closeDeleteModal();
  muatData();
}

function toggleTheme() {
  const h = document.documentElement,
    n = h.getAttribute("data-theme") === "dark" ? "light" : "dark";
  h.setAttribute("data-theme", n);
  document.getElementById("theme-icon").innerText = n === "dark" ? "☀️" : "🌙";
}

function changeMonth(dir) {
  pDate.setMonth(pDate.getMonth() + dir);
  renderPicker();
}
setInterval(() => {
  document.getElementById("clock").innerText = new Date().toLocaleTimeString(
    "id-ID",
    { hour12: false },
  );
}, 1000);

muatData();
