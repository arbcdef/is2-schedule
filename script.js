const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [], selectedKat = "Assignment", selectedPri = "Medium", delId = null;
let pDate = new Date(), selFullDate = "";

async function muatData() {
    const { data } = await sb.from("schedule").select("*").order("tgl_deadline", { ascending: true });
    allTasks = data || [];
    renderAll();
}

// DATE PICKER
function toggleDatePicker(e) {
    e.stopPropagation();
    document.getElementById("custom-datepicker").classList.toggle("hidden");
    renderPicker();
}

function renderPicker() {
    const cont = document.getElementById("datepicker-days"), lbl = document.getElementById("currentMonthYear");
    const m = pDate.getMonth(), y = pDate.getFullYear();
    lbl.innerText = pDate.toLocaleString("id-ID", { month: "short", year: "numeric" });
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        cont.innerHTML += `<div class="picker-day ${dStr === selFullDate ? 'picker-selected' : ''}" onclick="selectDate('${dStr}')">${d}</div>`;
    }
}

function selectDate(d) {
    selFullDate = d;
    document.getElementById("tglDeadline").value = d;
    document.getElementById("custom-datepicker").classList.add("hidden");
}

function changeMonth(v) { pDate.setMonth(pDate.getMonth() + v); renderPicker(); }

// RENDER UI
function renderAll() {
    // List Task
    document.getElementById("listData").innerHTML = allTasks.map(t => `
        <div class="ios-card task-item ${t.is_done ? 'opacity-40' : ''}" style="border-left: 6px solid ${t.priority.toUpperCase() === 'HIGH' ? '#ff3b30' : t.priority.toUpperCase() === 'MEDIUM' ? '#ff9500' : '#8e8e93'}">
            <input type="checkbox" ${t.is_done ? 'checked' : ''} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-5 h-5 shrink-0">
            <div class="task-info">
                <p class="text-[8px] font-black opacity-30 uppercase">${t.category} • ${t.tgl_deadline}</p>
                <p class="task-title">${t.content}</p>
            </div>
            <button onclick="askDel(${t.id})" class="delete-btn">DEL</button>
        </div>`).join("");

    // Calendar
    const cont = document.getElementById("calendar-container"), now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    cont.innerHTML = "";
    for (let i = 0; i < first; i++) cont.innerHTML += "<div></div>";
    for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const tks = allTasks.filter(t => t.tgl_deadline === dStr && !t.is_done);
        let p = tks.some(t => t.priority === "High") ? "cal-high" : tks.some(t => t.priority === "Medium") ? "cal-medium" : tks.length > 0 ? "cal-low" : "";
        cont.innerHTML += `<div class="day-cell ${p}">${d}</div>`;
    }
}

// ACTIONS
async function toggleDone(id, s) { await sb.from("schedule").update({ is_done: !s }).eq("id", id); muatData(); }
async function confirmDelete() { await sb.from("schedule").delete().eq("id", delId); closeDeleteModal(); muatData(); }
function askDel(id) { delId = id; document.getElementById("delete-modal").classList.remove("hidden"); }
function closeDeleteModal() { document.getElementById("delete-modal").classList.add("hidden"); }

function openSelect(type) {
    const m = document.getElementById("custom-modal"), opt = document.getElementById("modal-options");
    m.classList.remove("hidden");
    opt.innerHTML = "";
    const list = type === "kategori" ? ["Assignment", "Event"] : ["Low", "Medium", "High"];
    list.forEach(i => {
        const b = document.createElement("button");
        b.className = "py-4 bg-zinc-500/10 rounded-xl font-bold text-xs uppercase";
        b.innerText = i;
        b.onclick = () => {
            if (type === "kategori") { selectedKat = i; document.getElementById("btn-kategori").innerText = i; }
            else { selectedPri = i; document.getElementById("btn-priority").innerText = i; }
            closeModal();
        };
        opt.appendChild(b);
    });
}
function closeModal() { document.getElementById("custom-modal").classList.add("hidden"); }

async function simpanData() {
    const isi = document.getElementById("isiData").value, tgl = document.getElementById("tglDeadline").value;
    if (!isi || !tgl) return alert("Isi semua!");
    await sb.from("schedule").insert([{ content: isi, tgl_deadline: tgl, category: selectedKat, priority: selectedPri, is_done: false }]);
    document.getElementById("isiData").value = "";
    muatData();
}

function toggleTheme() {
    const h = document.documentElement;
    const isD = h.getAttribute("data-theme") === "dark";
    h.setAttribute("data-theme", isD ? "light" : "dark");
    document.getElementById("theme-icon").innerText = isD ? "🌙" : "☀️";
}

setInterval(() => { document.getElementById("clock").innerText = new Date().toLocaleTimeString(); }, 1000);
window.onclick = () => document.getElementById("custom-datepicker").classList.add("hidden");

muatData();
