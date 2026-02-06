const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [], 
    selectedKat = "Assignment", 
    selectedPri = "Medium", 
    delId = null;
let pDate = new Date(), 
    selFullDate = "";

// Koneksi Data
async function muatData() {
    try {
        const { data, error } = await sb
            .from("schedule")
            .select("*")
            .order("tgl_deadline", { ascending: true });
        
        if (error) throw error;
        
        allTasks = data || [];
        document.getElementById("db-status-dot").className = "status-dot w-2 h-2 rounded-full bg-green-500";
        document.getElementById("db-status-text").innerText = "Active";
        renderAll();
    } catch (e) {
        console.error("Connection error:", e.message);
        document.getElementById("db-status-text").innerText = "Offline";
    }
}

// Logic Datepicker
function toggleDatePicker(e) {
    if (e) e.stopPropagation();
    const p = document.getElementById("custom-datepicker");
    const isHidden = p.classList.contains("hidden");
    
    if (isHidden) {
        p.classList.remove("hidden");
        setTimeout(() => p.classList.add("active"), 10);
        renderPicker();
    } else {
        closePicker();
    }
}

function closePicker() {
    const p = document.getElementById("custom-datepicker");
    p.classList.remove("active");
    setTimeout(() => p.classList.add("hidden"), 300);
}

// Global click handler untuk menutup popover & modal
document.addEventListener('click', (e) => {
    const p = document.getElementById("custom-datepicker");
    const input = document.getElementById("tglDeadline");
    if (p && !p.contains(e.target) && e.target !== input) {
        closePicker();
    }
});

function renderPicker() {
    const cont = document.getElementById("datepicker-days"),
          lbl = document.getElementById("currentMonthYear");
    const m = pDate.getMonth(), y = pDate.getFullYear();
    
    lbl.innerText = pDate.toLocaleString("id-ID", { month: "long", year: "numeric" });
    
    const first = new Date(y, m, 1).getDay(),
          days = new Date(y, m + 1, 0).getDate();
    
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isSelected = dStr === selFullDate;
        cont.innerHTML += `<div class="picker-day ${isSelected ? 'picker-selected' : ''}" 
            onclick="event.stopPropagation(); selectDate('${dStr}')">${d}</div>`;
    }
}

function selectDate(d) {
    selFullDate = d;
    document.getElementById("tglDeadline").value = d;
    closePicker();
}

function changeMonth(v) {
    pDate.setMonth(pDate.getMonth() + v);
    renderPicker();
}

// Render UI Components
function renderAll() {
    renderCountdown();
    renderFeed();
    renderCalendar();
}

function renderCountdown() {
    const area = document.getElementById("next-deadline-area"),
          now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const next = allTasks.find(t => !t.is_done && new Date(t.tgl_deadline) >= now);
    
    if (next) {
        const diff = Math.ceil((new Date(next.tgl_deadline) - now) / (1000 * 60 * 60 * 24));
        area.innerHTML = `<div class="countdown-card fade-in flex justify-between items-center shadow-2xl">
            <div class="overflow-hidden mr-4">
                <p class="text-[10px] font-black uppercase opacity-40">Upcoming Focus</p>
                <h2 class="text-xl md:text-2xl font-black mt-1 tracking-tighter truncate">${next.content}</h2>
            </div>
            <div class="text-right min-w-[60px]">
                <p class="text-3xl md:text-4xl font-black tracking-tighter">${diff === 0 ? "NOW" : diff + "D"}</p>
            </div>
        </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed() {
    document.getElementById("listData").innerHTML = allTasks.map(t => `
        <div class="ios-card flex justify-between items-center ${t.is_done ? 'opacity-40' : ''}" 
             style="border-left: 8px solid ${t.priority.toUpperCase() === 'HIGH' ? '#ff3b30' : t.priority.toUpperCase() === 'MEDIUM' ? '#ff9500' : '#8e8e93'}">
            <div class="flex items-center gap-4 flex-1 overflow-hidden">
                <input type="checkbox" ${t.is_done ? "checked" : ""} 
                       onclick="toggleDone(${t.id}, ${t.is_done})" 
                       class="w-6 h-6 rounded-full accent-blue-500 cursor-pointer">
                <div class="overflow-hidden">
                    <p class="text-[9px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
                    <p class="font-bold text-base md:text-lg tracking-tight truncate pr-4">${t.content}</p>
                </div>
            </div>
            <button onclick="askDel(${t.id})" class="bg-red-500/10 text-red-500 px-3 py-2 rounded-xl text-[9px] font-black hover:bg-red-500 hover:text-white transition-all">DELETE</button>
        </div>`).join("");
}

function renderCalendar() {
    const cont = document.getElementById("calendar-container"),
          now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    
    const first = new Date(y, m, 1).getDay(),
          days = new Date(y, m + 1, 0).getDate();
    
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const tasks = allTasks.filter(t => t.tgl_deadline === dStr && !t.is_done);
        let pClass = tasks.some(t => t.priority.toUpperCase() === "HIGH") ? "cal-high" :
                     tasks.some(t => t.priority.toUpperCase() === "MEDIUM") ? "cal-medium" :
                     tasks.some(t => t.priority.toUpperCase() === "LOW") ? "cal-low" : "";
        cont.innerHTML += `<div class="day-cell ${pClass}">${d}</div>`;
    }
}

// Modal Logics
function openSelect(type) {
    const m = document.getElementById("custom-modal"),
          opt = document.getElementById("modal-options");
    m.classList.remove("hidden");
    opt.innerHTML = "";
    const list = type === "kategori" ? ["Assignment", "Event"] : ["Low", "Medium", "High"];
    list.forEach(item => {
        const b = document.createElement("button");
        b.className = "py-4 bg-zinc-500/10 rounded-2xl font-bold text-sm active:bg-blue-500 active:text-white transition-all";
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

function closeModal() { document.getElementById("custom-modal").classList.add("hidden"); }
function askDel(id) { delId = id; document.getElementById("delete-modal").classList.remove("hidden"); }
function closeDeleteModal() { document.getElementById("delete-modal").classList.add("hidden"); delId = null; }

async function confirmDelete() {
    if (!delId) return;
    await sb.from("schedule").delete().eq("id", delId);
    closeDeleteModal();
    muatData();
}

async function toggleDone(id, s) {
    await sb.from("schedule").update({ is_done: !s }).eq("id", id);
    muatData();
}

async function simpanData() {
    const isi = document.getElementById("isiData").value,
          tgl = document.getElementById("tglDeadline").value;
    if (!isi || !tgl) return alert("Lengkapi data!");
    
    await sb.from("schedule").insert([{
        content: isi,
        tgl_deadline: tgl,
        category: selectedKat,
        priority: selectedPri,
        is_done: false,
    }]);
    
    document.getElementById("isiData").value = "";
    document.getElementById("tglDeadline").value = "";
    muatData();
}

function toggleTheme() {
    const h = document.documentElement;
    const isD = h.getAttribute("data-theme") === "dark";
    h.setAttribute("data-theme", isD ? "light" : "dark");
    document.getElementById("theme-icon").innerText = isD ? "🌙" : "☀️";
}

setInterval(() => {
    const clock = document.getElementById("clock");
    if(clock) clock.innerText = new Date().toLocaleTimeString("id-ID", { hour12: false });
}, 1000);

muatData();
