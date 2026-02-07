const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const sb = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [], selectedKat = "Assignment", selectedPri = "Medium", delId = null;

async function muatData() {
    const { data } = await sb.from("schedule").select("*").order("tgl_deadline", { ascending: true });
    allTasks = data || [];
    renderAll();
}

function renderAll() {
    const cont = document.getElementById("listData");
    cont.innerHTML = allTasks.map(t => `
        <div class="mission-item">
            <div class="flex-1">
                <p class="text-[8px] opacity-50 uppercase font-black">${t.category} • ${t.tgl_deadline}</p>
                <p class="font-bold text-sm">${t.content}</p>
            </div>
            <button onclick="askDel(${t.id})" class="text-[10px] font-black opacity-20 hover:opacity-100">DEL</button>
        </div>
    `).join("");
}

function openSelect(type) {
    const opt = document.getElementById("modal-options");
    opt.innerHTML = "";
    const items = type === "kategori" ? ["Assignment", "Event", "Schedule"] : ["Low", "Medium", "High"];
    items.forEach(item => {
        const b = document.createElement("button");
        b.className = "modal-option-btn mb-2";
        b.innerText = item;
        b.onclick = () => {
            if(type === "kategori") {
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
    document.getElementById("custom-modal").classList.add("active");
}

function closeModal() { document.getElementById("custom-modal").classList.remove("active"); }

function askDel(id) {
    delId = id;
    document.getElementById("delete-modal").classList.add("active");
}

function closeDeleteModal() { document.getElementById("delete-modal").classList.remove("active"); }

async function confirmDelete() {
    await sb.from("schedule").delete().eq("id", delId);
    closeDeleteModal();
    muatData();
}

async function simpanData() {
    const isi = document.getElementById("isiData").value;
    const t2 = document.getElementById("tglDeadline").value;
    if(!isi || !t2) return alert("Fill all fields!");
    
    await sb.from("schedule").insert([{
        content: isi,
        tgl_deadline: t2,
        category: selectedKat,
        priority: selectedPri,
        is_done: false
    }]);
    muatData();
}

function toggleTheme() {
    const h = document.documentElement;
    h.setAttribute("data-theme", h.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

muatData();
