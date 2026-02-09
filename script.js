const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [],
  selectedKat = "Assignment",
  selectedPri = "Medium",
  pDate = new Date(),
  currentCalDate = new Date(), // State bulan kalender
  delId = null,
  dateTarget = "start";

if (localStorage.getItem("theme")) {
  document.documentElement.setAttribute(
    "data-theme",
    localStorage.getItem("theme"),
  );
}

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

function renderAll() {
  renderFeed();
  renderCalendar();
  renderCountdown();
}

// --- PERBAIKAN LOGIKA DYNAMIC ISLAND ---
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

    // Logika Rentang Waktu: Jika start dan deadline berbeda, tampilkan rentangnya
    const isMultiDay = upcoming.tgl_start !== upcoming.tgl_deadline;
    const periodText = isMultiDay
      ? `${upcoming.tgl_start} — ${upcoming.tgl_deadline}`
      : upcoming.tgl_deadline;

    area.innerHTML = `
            <div class="dynamic-island fade-in">
                <div class="flex-1 truncate mr-4">
                    <p class="text-[8px] font-black opacity-50 uppercase tracking-widest mb-1">Period: ${periodText}</p>
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
          return `
          <div class="glass-card flex justify-between items-center mb-3 ${t.is_done ? "opacity-30" : ""}" 
               style="border-left: 6px solid ${t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93"}">
            <div class="flex items-center truncate flex-1 ml-4"> 
                <div class="truncate">
                    <p class="task-meta">${t.category} • ${t.tgl_start} to ${t.tgl_deadline}</p>
                    <p class="task-title truncate">${t.content}</p>
                </div>
            </div>
            <div class="flex items-center gap-4 ml-4">
                ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[9px] font-black px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition tracking-tighter">OPEN</a>` : ""}
                <button onclick="askDel(${t.id})" class="text-[9px] font-black opacity-20 hover:opacity-100 transition">DEL</button>
            </div>
          </div>`;
        })
        .join("")
    : `<div class="p-10 text-center opacity-10 text-[8px] font-black uppercase">Hub Clear</div>`;
}

function renderCalendar() {
  const cont = document.getElementById("calendar-container");
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
    </div>
  `;

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
      if (checkDate === todayStr) pClass = "task-today";
      else
        pClass =
          tasks[0].priority === "High"
            ? "pri-high"
            : tasks[0].priority === "Medium"
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
  await sb.from("schedule").insert([
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
  localStorage.setItem("theme", n);
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
