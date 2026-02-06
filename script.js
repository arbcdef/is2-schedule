const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [];
let currentSelectType = "";
let selectedKategori = "Assignment";
let selectedPriority = "Medium";
let taskIdToDelete = null;

async function muatData() {
  try {
    const { data, error } = await supabaseClient
      .from("schedule")
      .select("*")
      .order("tgl_deadline", { ascending: true });
    if (error) throw error;
    allTasks = data || [];
    document.getElementById("db-status-dot")?.classList.add("online");
    document.getElementById("db-status-text").innerText = "System Active";
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

// LOGIKA SELECT MODAL
function openSelect(type) {
  currentSelectType = type;
  const modal = document.getElementById("custom-modal");
  const optionsDiv = document.getElementById("modal-options");
  modal.classList.remove("hidden");
  optionsDiv.innerHTML = "";
  const options =
    type === "kategori" ? ["Assignment", "Event"] : ["Low", "Medium", "High"];
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;
    btn.onclick = () => {
      if (type === "kategori") {
        selectedKategori = opt;
        document.getElementById("btn-kategori").innerText = opt;
      } else {
        selectedPriority = opt;
        document.getElementById("btn-priority").innerText = opt;
      }
      closeModal();
    };
    optionsDiv.appendChild(btn);
  });
}
function closeModal() {
  document.getElementById("custom-modal").classList.add("hidden");
}

// LOGIKA DELETE MODAL (BARU)
function triggerDelete(id) {
  taskIdToDelete = id;
  const modal = document.getElementById("delete-modal");
  modal.classList.remove("hidden");
  document.getElementById("confirm-delete-btn").onclick = confirmDelete;
}
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
  taskIdToDelete = null;
}
async function confirmDelete() {
  if (!taskIdToDelete) return;
  await supabaseClient.from("schedule").delete().eq("id", taskIdToDelete);
  closeDeleteModal();
  muatData();
}

function renderAll() {
  renderCountdown();
  renderFeed();
  renderCalendar();
}

function renderCountdown() {
  const area = document.getElementById("next-deadline-area");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = allTasks.find(
    (t) => !t.is_done && new Date(t.tgl_deadline).getTime() >= now.getTime(),
  );
  if (next) {
    const deadline = new Date(next.tgl_deadline);
    const diffDays = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    area.innerHTML = `<div class="countdown-card fade-in"><div><p class="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Upcoming Focus</p><h2 class="text-3xl font-black mt-2 tracking-tighter">${next.content}</h2></div><div class="text-right"><p class="text-5xl font-black tracking-tighter">${diffDays === 0 ? "TODAY" : diffDays + "D"}</p></div></div>`;
  } else {
    area.innerHTML = "";
  }
}

function renderFeed() {
  const list = document.getElementById("listData");
  list.innerHTML = allTasks
    .map(
      (t) => `
        <div class="ios-card p-6 flex justify-between items-center ${t.is_done ? "opacity-30" : ""} mb-4" 
             style="border-left: 10px solid ${t.priority.toLowerCase() === "high" ? "#ff3b30" : t.priority.toLowerCase() === "medium" ? "#ff9500" : "#8e8e93"}">
            <div class="flex items-center gap-6">
                <input type="checkbox" ${t.is_done ? "checked" : ""} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-6 h-6 cursor-pointer accent-white">
                <div>
                    <p class="text-[10px] font-black opacity-30 uppercase tracking-widest">${t.category} • ${t.tgl_deadline}</p>
                    <p class="font-bold text-lg tracking-tight">${t.content}</p>
                </div>
            </div>
            <button onclick="triggerDelete(${t.id})" class="delete-btn">Delete</button>
        </div>
    `,
    )
    .join("");
}

function renderCalendar() {
  const container = document.getElementById("calendar-container");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  document.getElementById("calendar-month-year").innerText = now.toLocaleString(
    "id-ID",
    { month: "long", year: "numeric" },
  );
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  container.innerHTML = "";
  for (let i = 0; i < firstDay; i++) container.innerHTML += "<div></div>";
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const tasks = allTasks.filter((t) => t.tgl_deadline === dStr && !t.is_done);
    let pClass = "";
    if (tasks.some((t) => t.priority.toLowerCase() === "high"))
      pClass = "cal-high";
    else if (tasks.some((t) => t.priority.toLowerCase() === "medium"))
      pClass = "cal-medium";
    else if (tasks.some((t) => t.priority.toLowerCase() === "low"))
      pClass = "cal-low";
    const isToday =
      dStr === new Date().toISOString().split("T")[0] ? "today-glow" : "";
    container.innerHTML += `<div class="day-cell ${pClass} ${isToday}" onclick="showAgenda('${dStr}', this)">${d}</div>`;
  }
}

async function simpanData() {
  const content = document.getElementById("isiData").value;
  const date = document.getElementById("tglDeadline").value;
  if (!content || !date) return;
  await supabaseClient
    .from("schedule")
    .insert([
      {
        content,
        tgl_deadline: date,
        category: selectedKategori,
        priority: selectedPriority,
        is_done: false,
      },
    ]);
  document.getElementById("isiData").value = "";
  muatData();
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.getElementById("theme-icon").innerText = isDark ? "🌙" : "☀️";
}

async function toggleDone(id, status) {
  await supabaseClient
    .from("schedule")
    .update({ is_done: !status })
    .eq("id", id);
  muatData();
}
setInterval(() => {
  document.getElementById("clock").innerText = new Date().toLocaleTimeString(
    "id-ID",
    { hour12: false },
  );
}, 1000);
muatData();
