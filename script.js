const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [], selectedKat = "Assignment", selectedPri = "Medium", delId = null;
let pDate = new Date(), selFullDate = "";

async function muatData() {
    const { data, error } = await sb.from("schedule").select("*").order("tgl_deadline", { ascending: true });
    if (!error) {
        allTasks = data || [];
        document.getElementById("db-status-dot").style.backgroundColor = "#34c759";
        document.getElementById("db-status-text").innerText = "Active";
        renderAll();
    }
}

// LOGIK PICKER (FIXED)
function toggleDatePicker(e) {
    if (e) e.stopPropagation();
    const p = document.getElementById("custom-datepicker");
    p.classList.toggle("active");
    if (p.classList.contains("active")) renderPicker();
}

function renderPicker() {
    const cont = document.getElementById("datepicker-days"), lbl = document.getElementById("currentMonthYear");
    const m = pDate.getMonth(), y = pDate.getFullYear();
    lbl.innerText = pDate.toLocaleString("id-ID", { month: "long", year: "numeric" });
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isSel = dStr === selFullDate;
        cont.innerHTML += `<div class="picker-day ${isSel ? 'picker-selected' : ''}" onclick="selectDate('${dStr}')">${d}</div>`;
    }
}

function selectDate(d) {
    selFullDate = d;
    document.getElementById("tglDeadline").value = d;
    document.getElementById("custom-datepicker").classList.remove("active");
}

function changeMonth(v) {
    pDate.setMonth(pDate.getMonth() + v);
    renderPicker();
}

// RENDER LIST (FIXED GEPENG)
function renderFeed() {
    document.getElementById("listData").innerHTML = allTasks.map(t => `
        <div class="ios-card list-item ${t.is_done ? 'opacity-40' : ''}" 
             style="border-left: 8px solid ${t.priority.toUpperCase() === 'HIGH' ? '#ff3b30' : t.priority.toUpperCase() === 'MEDIUM' ? '#ff9500' : '#8e8e93'}">
            <div class="flex items-center gap-4 min-w-0 flex-1">
                <input type="checkbox" ${t.is_done ? "checked" : ""} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-5 h-5 shrink-0">
                <div class="min-w-0">
                    <p class="text-[9px] font-black opacity-30 uppercase truncate">${t.category} • ${t.tgl_deadline}</p>
                    <p class="font-bold text-base tracking-tight truncate">${t.content}</p>
                </div>
            </div>
            <button onclick="askDel(${t.id})" class="delete-btn">DELETE</button>
        </div>`).join("");
}

// LAIN-LAIN
function renderAll() { renderCountdown(); renderFeed(); renderCalendar(); }

function askDel(id) { delId = id; document.getElementById("delete-modal").classList.remove("hidden"); }
function closeDeleteModal() { document.getElementById("delete-modal").classList.add("hidden"); }
async function confirmDelete() {
    if (!delId) return;
    await sb.from("schedule").delete().eq("id", delId);
    closeDeleteModal();
    muatData();
}

function openSelect(type) {
    const m = document.getElementById("custom-modal"), opt = document.getElementById("modal-options");
    m.classList.remove("hidden");
    opt.innerHTML = "";
    const list = type === "kategori" ? ["Assignment", "Event"] : ["Low", "Medium", "High"];
    list.forEach(item => {
        const b = document.createElement("button");
        b.className = "py-4 bg-zinc-500/10 rounded-2xl font-bold text-sm active:bg-blue-500 active:text-white";
        b.innerText = item;
        b.onclick = () => {
            if (type === "kategori") { 
                selectedKat = item; document.getElementById("btn-kategori").innerText = item; 
            } else { 
                selectedPri = item; document.getElementById("btn-priority").innerText = item; 
            }
            closeModal();
        };
        opt.appendChild(b);
    });
}
function closeModal() { document.getElementById("custom-modal").classList.add("hidden"); }

async function toggleDone(id, s) {
    await sb.from("schedule").update({ is_done: !s }).eq("id", id);
    muatData();
}

async function simpanData() {
    const isi = document.getElementById("isiData").value, tgl = document.getElementById("tglDeadline").value;
    if (!isi || !tgl) return alert("Lengkapi data!");
    await sb.from("schedule").insert([{ content: isi, tgl_deadline: tgl, category: selectedKat, priority: selectedPri, is_done: false }]);
    document.getElementById("isiData").value = "";
    document.getElementById("tglDeadline").value = "";
    muatData();
}

function renderCountdown() {
    const area = document.getElementById("next-deadline-area"), now = new Date();
    now.setHours(0, 0, 0, 0);
    const next = allTasks.find(t => !t.is_done && new Date(t.tgl_deadline) >= now);
    if (next) {
        const diff = Math.ceil((new Date(next.tgl_deadline) - now) / (1000 * 60 * 60 * 24));
        area.innerHTML = `<div class="ios-card bg-black dark:bg-white text-white dark:text-black flex justify-between items-center shadow-2xl mb-8">
            <div class="truncate mr-4"><p class="text-[10px] font-black uppercase opacity-40">Focus</p><h2 class="text-xl font-black truncate">${next.content}</h2></div>
            <div class="shrink-0 text-right"><p class="text-3xl font-black">${diff === 0 ? "NOW" : diff + "D"}</p></div>
        </div>`;
    } else { area.innerHTML = ""; }
}

function renderCalendar() {
    const cont = document.getElementById("calendar-container"), now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    document.getElementById("calendar-month-year").innerText = now.toLocaleString("id-ID", { month: "long", year: "numeric" });
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const tasks = allTasks.filter(t => t.tgl_deadline === dStr && !t.is_done);
        let pClass = tasks.some(t => t.priority.toUpperCase() === "HIGH") ? "cal-high" : tasks.some(t => t.priority.toUpperCase() === "MEDIUM") ? "cal-medium" : tasks.some(t => t.priority.toUpperCase() === "LOW") ? "cal-low" : "";
        cont.innerHTML += `<div class="day-cell ${pClass}">${d}</div>`;
    }
}

function toggleTheme() {
    const h = document.documentElement;
    const isD = h.getAttribute("data-theme") === "dark";
    h.setAttribute("data-theme", isD ? "light" : "dark");
    document.getElementById("theme-icon").innerText = isD ? "🌙" : "☀️";
}

setInterval(() => {
    document.getElementById("clock").innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
}, 1000);

// Klik luar untuk tutup kalender
window.onclick = function(e) {
    if (!e.target.matches('#tglDeadline') && !e.target.closest('#custom-datepicker')) {
        document.getElementById("custom-datepicker").classList.remove("active");
    }
}

muatData();
