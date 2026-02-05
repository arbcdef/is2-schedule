const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [];
let deleteTargetId = null;

function toggleThemeManually() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isLight ? '🌙' : '☀️';
}

function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID');
}

async function muatData() {
    try {
        let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });
        if (error) throw error;
        allTasks = data;
        renderCalendar();
        renderFeed(data);
        renderCountdown(data);
    } catch (err) { console.error(err); }
}

function renderCountdown(data) {
    const area = document.getElementById('next-deadline-area');
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = data.find(t => !t.is_done && new Date(t.tgl_deadline) >= today);

    if (upcoming) {
        const diffDays = Math.ceil((new Date(upcoming.tgl_deadline) - today) / (1000 * 60 * 60 * 24));
        area.innerHTML = `
            <div class="countdown-card fade-in">
                <div>
                    <p class="text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">Next Milestone</p>
                    <h2 class="text-2xl font-bold uppercase">${upcoming.content}</h2>
                </div>
                <div class="text-right">
                    <p class="text-4xl font-black">${diffDays === 0 ? "TODAY" : diffDays + " DAYS"}</p>
                </div>
            </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed(data) {
    const list = document.getElementById('listData');
    list.innerHTML = data.map(item => `
        <div class="ios-card p-6 flex justify-between items-center priority-${item.priority} ${item.is_done ? 'opacity-30 grayscale' : ''}">
            <div class="flex items-center gap-5">
                <input type="checkbox" ${item.is_done ? 'checked' : ''} onclick="toggleDone(${item.id}, ${item.is_done})" class="w-6 h-6 accent-zinc-500">
                <div>
                    <span class="text-[10px] font-black opacity-30 uppercase">${item.category} • ${item.tgl_deadline}</span>
                    <p class="font-bold text-lg mt-1">${item.content}</p>
                </div>
            </div>
            <button onclick="openDeleteModal(${item.id})" class="opacity-20 hover:opacity-100 text-xl px-4">✕</button>
        </div>
    `).join('');
}

async function simpanData() {
    const teks = document.getElementById('isiData').value.trim();
    const tgl = document.getElementById('tglDeadline').value;
    if (!teks || !tgl) return alert("Fill Task & Date!");

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Syncing...";
    
    await supabaseClient.from('schedule').insert([{ 
        category: document.getElementById('kategori').value, 
        content: teks, 
        tgl_deadline: tgl, 
        priority: document.getElementById('priority').value, 
        is_done: false, 
        task_link: document.getElementById('taskLink').value 
    }]);

    document.getElementById('isiData').value = '';
    btn.innerText = "Update Hub";
    muatData();
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    const now = new Date();
    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    container.innerHTML = '';
    for (let i = 0; i < firstDay; i++) container.innerHTML += `<div class="opacity-0"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const tasksOnDate = allTasks.filter(t => t.tgl_deadline === dateStr && !t.is_done);
        let pClass = tasksOnDate.length > 0 ? "cal-high" : "";
        const isToday = (dateStr === new Date().toISOString().split('T')[0]) ? 'today-glow' : '';
        container.innerHTML += `<div class="day-cell ${isToday} ${pClass}">${d}</div>`;
    }
}

async function toggleDone(id, status) { await supabaseClient.from('schedule').update({ is_done: !status }).eq('id', id); muatData(); }
function openDeleteModal(id) { deleteTargetId = id; document.getElementById('deleteModal').classList.replace('hidden', 'flex'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.replace('flex', 'hidden'); }
document.getElementById('confirmDeleteBtn').onclick = async () => { await supabaseClient.from('schedule').delete().eq('id', deleteTargetId); closeDeleteModal(); muatData(); };

setInterval(updateClock, 1000);
updateClock();
muatData();
