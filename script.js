const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [];
let deleteId = null;

async function muatData() {
    const { data } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });
    allTasks = data || [];
    renderCountdown();
    renderFeed();
    renderCalendar();
}

function renderCountdown() {
    const area = document.getElementById('next-deadline-area');
    const today = new Date().setHours(0,0,0,0);
    const next = allTasks.find(t => !t.is_done && new Date(t.tgl_deadline) >= today);

    if (next) {
        const diff = Math.ceil((new Date(next.tgl_deadline) - today) / (1000 * 60 * 60 * 24));
        area.innerHTML = `
            <div class="countdown-card fade-in">
                <div>
                    <p class="text-[10px] font-black opacity-50 uppercase tracking-widest">Coming Up</p>
                    <h2 class="text-xl font-bold truncate max-w-[200px] sm:max-w-md">${next.content}</h2>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-black">${diff === 0 ? "TODAY" : diff + "D"}</p>
                </div>
            </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed() {
    const list = document.getElementById('listData');
    list.innerHTML = allTasks.map(t => `
        <div class="ios-card p-5 flex justify-between items-center priority-${t.priority} ${t.is_done ? 'opacity-30' : ''}">
            <div class="flex items-center gap-4">
                <input type="checkbox" ${t.is_done ? 'checked' : ''} onclick="toggleDone(${t.id}, ${t.is_done})" class="w-5 h-5 accent-zinc-500">
                <div>
                    <p class="text-[10px] font-bold opacity-40 uppercase">${t.category} • ${t.tgl_deadline}</p>
                    <p class="font-bold">${t.content}</p>
                </div>
            </div>
            <button onclick="openDeleteModal(${t.id})" class="opacity-20 hover:opacity-100 text-xl px-2">✕</button>
        </div>
    `).join('');
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    const now = new Date();
    label.innerText = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    container.innerHTML = '';
    for(let i=0; i<start; i++) container.innerHTML += '<div></div>';
    for(let d=1; d<=days; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = dateStr === new Date().toISOString().split('T')[0] ? 'today-glow' : '';
        const hasTask = allTasks.some(t => t.tgl_deadline === dateStr && !t.is_done) ? 'ring-2 ring-zinc-400' : '';
        container.innerHTML += `<div class="day-cell ${isToday} ${hasTask}">${d}</div>`;
    }
}

async function simpanData() {
    const text = document.getElementById('isiData').value;
    const date = document.getElementById('tglDeadline').value;
    if(!text || !date) return alert("Isi dulu ajg");

    await supabaseClient.from('schedule').insert([{
        content: text, tgl_deadline: date, 
        category: document.getElementById('kategori').value,
        priority: document.getElementById('priority').value,
        is_done: false, task_link: document.getElementById('taskLink').value
    }]);
    
    document.getElementById('isiData').value = '';
    muatData();
}

async function toggleDone(id, status) {
    await supabaseClient.from('schedule').update({ is_done: !status }).eq('id', id);
    muatData();
}

function openDeleteModal(id) { deleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.add('hidden'); }
document.getElementById('confirmDeleteBtn').onclick = async () => {
    await supabaseClient.from('schedule').delete().eq('id', deleteId);
    closeDeleteModal();
    muatData();
};

function toggleThemeManually() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
}

setInterval(() => document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID'), 1000);
muatData();
