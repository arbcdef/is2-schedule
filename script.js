/* --- CONFIGURATION --- */
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [],
    selectedKat = "Assignment",
    selectedPri = "Medium",
    delId = null;

/* --- DATABASE CONNECTIVITY --- */
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

        // Set status to ACTIVE
        if (statusDot) statusDot.className = "w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
        if (statusText) {
            statusText.innerText = "Active";
            statusText.style.color = "";
            statusText.style.opacity = "0.5";
        }
        renderAll();
    } catch (err) {
        console.error("Connection failed:", err);
        if (statusDot) statusDot.className = "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
        if (statusText) statusText.innerText = "Offline";
    }
}

function renderAll() {
    renderFeed();
    renderCalendar();
    renderCountdown();
}

/* --- CALENDAR LOGIC (SINKRON WARNA) --- */
function renderCalendar() {
    const cont = document.getElementById("calendar-container");
    if (!cont) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const todayDate = new Date().setHours(0, 0, 0, 0);

    cont.innerHTML = "";
    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();

    // Senin = urutan pertama
    let offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) {
        cont.appendChild(document.createElement("div"));
    }

    for (let d = 1; d <= totalDays; d++) {
        const currDate = new Date(y, m, d);
        const checkTime = currDate.setHours(0, 0, 0, 0);

        const tasksAtDate = allTasks.filter((t) => {
            if (!t.tgl_start || !t.tgl_deadline) return false;
            const start = new Date(t.tgl_start).setHours(0, 0, 0, 0);
            const end = new Date(t.tgl_deadline).setHours(0, 0, 0, 0);
            return checkTime >= start && checkTime <= end;
        });

        const dayEl = document.createElement("div");
        dayEl.className = "day-cell";
        dayEl.innerText = d;

        // WARNA PRIORITAS
        if (tasksAtDate.length > 0) {
            const hasHigh = tasksAtDate.some(t => t.priority === "High");
            const hasMedium = tasksAtDate.some(t => t.priority === "Medium");

            if (hasHigh) dayEl.classList.add("pri-high"); // Merah
            else if (hasMedium) dayEl.classList.add("pri-medium"); // Oranye
            else dayEl.classList.add("pri-low"); // Hijau
        }

        if (checkTime === todayDate) dayEl.classList.add("cal-today");
        
        dayEl.onclick = () => {
            if (tasksAtDate.length > 0) showCalendarDetail(currDate.toDateString(), tasksAtDate);
        };
        cont.appendChild(dayEl);
    }
}

/* --- FEED & UI FUNCTIONS --- */
function renderFeed() {
    const cont = document.getElementById("listData");
    if (!cont) return;
    cont.innerHTML = allTasks.map((t) => {
        const hasLink = t.task_link && t.task_link.startsWith("http");
        const borderColor = t.priority === "High" ? "#ff3b30" : t.priority === "Medium" ? "#ff9500" : "#8e8e93";
        return `
            <div class="glass-card p-4 flex justify-between items-center mb-2 ${t.is_done ? "opacity-30" : ""}" style="border-left: 4px solid ${borderColor}">
                <div class="flex items-center gap-4 truncate flex-1">
                    <input type="checkbox" ${t.is_done ? "checked" : ""} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-4 h-4">
                    <div class="truncate">
                        <p class="text-[7px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
                        <p class="font-bold truncate text-xs">${t.content}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 ml-2">
                    ${hasLink ? `<a href="${t.task_link}" target="_blank" class="text-[8px] font-black px-2 py-1 bg-white/10 rounded-md">LINK</a>` : ""}
                    <button onclick="askDel(${t.id})" class="text-[8px] font-black opacity-10 hover:opacity-100">DEL</button>
                </div>
            </div>`;
    }).join("");
}

function renderCountdown() {
    const area = document.getElementById("next-deadline-area");
    if (!area) return;
    const upcoming = allTasks.filter(t => !t.is_done).sort((a, b) => new Date(a.tgl_deadline) - new Date(b.tgl_deadline))[0];
    if (upcoming) {
        const today = new Date(); today.setHours(0,0,0,0);
        const deadline = new Date(upcoming.tgl_deadline); deadline.setHours(0,0,0,0);
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        let dayText = diffDays === 0 ? "DUE TODAY" : diffDays < 0 ? `${Math.abs(diffDays)} OVERDUE` : `${diffDays} DAYS LEFT`;
        area.innerHTML = `<div class="dynamic-island"><div class="flex-1"><p class="text-[8px] opacity-50 font-black uppercase mb-1">Upcoming Mission</p><h2 class="text-lg font-black tracking-tight uppercase">${upcoming.content}</h2></div><div class="text-right"><span class="text-xl font-black">${dayText}</span></div></div>`;
    } else {
        area.innerHTML = `<div class="glass-card p-6 text-center opacity-20 text-[9px] font-black uppercase">All Missions Secured</div>`;
    }
}

/* --- ACTION FUNCTIONS --- */
async function simpanData() {
    const isi = document.getElementById("isiData").value,
          t1 = document.getElementById("tglMulai").value,
          t2 = document.getElementById("tglDeadline").value,
          link = document.getElementById("linkData").value;
    if (!isi || !t2) return;
    try {
        await sb.from("schedule").insert([{ content: isi, tgl_start: t1 || t2, tgl_deadline: t2, category: selectedKat, priority: selectedPri, is_done: false, task_link: link }]);
        muatData();
        ["isiData", "linkData", "tglMulai", "tglDeadline"].forEach(id => document.getElementById(id).value = "");
    } catch (err) { alert("Save failed."); }
}

function openSelect(type) {
    const m = document.getElementById("custom-modal"), opt = document.getElementById("modal-options");
    if (!m || !opt) return;
    m.classList.remove("hidden");
    opt.innerHTML = "";
    const items = type === "kategori" ? ["Assignment", "Event", "Schedule"] : ["Low", "Medium", "High"];
    items.forEach(item => {
        const b = document.createElement("button");
        b.className = "py-4 bg-white/5 rounded-xl font-black text-[9px] uppercase hover:bg-white/10";
        b.innerText = item;
        b.onclick = () => {
            if (type === "kategori") { selectedKat = item; document.getElementById("btn-kategori").innerText = item; }
            else { selectedPri = item; document.getElementById("btn-priority").innerText = item; }
            closeModal();
        };
        opt.appendChild(b);
    });
}

function closeModal() { document.getElementById("custom-modal")?.classList.add("hidden"); }
function askDel(id) { delId = id; document.getElementById("delete-modal")?.classList.remove("hidden"); }
function closeDelModal() { document.getElementById("delete-modal")?.classList.add("hidden"); }

async function confirmDelete() {
    await sb.from("schedule").delete().eq("id", delId);
    closeDelModal();
    muatData();
}

async function toggleDone(id, s) {
    await sb.from("schedule").update({ is_done: !s }).eq("id", id);
    muatData();
}

function showCalendarDetail(dateStr, tasks) {
    const modal = document.getElementById("calendar-detail-modal");
    const title = document.getElementById("detail-date-title");
    const list = document.getElementById("calendar-task-list");
    if (!modal) return;
    title.innerText = dateStr;
    list.innerHTML = tasks.map(t => `<div class="p-4 bg-white/5 rounded-2xl border border-white/5 mb-2"><span class="px-2 py-0.5 rounded text-[7px] font-black uppercase ${t.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}">${t.priority}</span><p class="text-xs font-bold mt-2">${t.content}</p></div>`).join("");
    modal.classList.remove("hidden");
}

function closeCalendarDetail() { document.getElementById("calendar-detail-modal")?.classList.add("hidden"); }

/* --- INIT --- */
document.addEventListener("DOMContentLoaded", () => {
    muatData();
    setInterval(() => {
        const clockEl = document.getElementById("clock");
        if (clockEl) clockEl.innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
    }, 1000);

    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener("click", () => {
            if (typeof input.showPicker === "function") input.showPicker();
        });
    });
});
