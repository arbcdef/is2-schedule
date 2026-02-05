const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [];
let deleteTargetId = null;

function applyAutoTheme() {
    const hour = new Date().getHours();
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    if (hour >= 18 || hour < 6) {
        html.setAttribute('data-theme', 'dark');
        if(themeIcon) themeIcon.innerText = '🌙';
    } else {
        html.setAttribute('data-theme', 'light');
        if(themeIcon) themeIcon.innerText = '☀️';
    }
}

function toggleThemeManually() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isLight ? '🌙' : '☀️';
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

async function muatData() {
    try {
        let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });
        if (error) throw error;
        allTasks = data;
        renderCalendar();
        renderFeed(data);
        renderCountdown(data);
    } catch (err) {
        console.error("Database Error:", err.message);
    }
}

function renderCountdown(data) {
    const area = document.getElementById('next-deadline-area');
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = data.find(t => !t.is_done && t.tgl_deadline >= todayStr);

    if (upcoming) {
        const diff = new Date(upcoming.tgl_deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        area.innerHTML = `
            <div class="countdown-card fade-in">
                <div>
                    <p class="text-[10px] font-black opacity-60 uppercase tracking-widest">Upcoming Milestone</p>
                    <h2 class="text-3xl font-bold tracking-tight">${upcoming.content}</h2>
                </div>
                <div class="text-right">
                    <p class="text-4xl font-black">${days <= 0 ? "Today" : days + " Days"}</p>
                </div>
            </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed(data) {
    const list = document.getElementById('listData');
    if(!list) return;
    list.innerHTML = data.map(item => `
        <div class="liquid-glass p-5 flex justify-between items-center transition-all priority-${item.priority || 'low'} ${item.is_done ? 'task-done' : ''}">
            <div class="flex items-center gap-4">
                <input type="checkbox" ${item.is_done ? 'checked' : ''} 
                    onclick="toggleDone(${item.id}, ${item.is_done})" 
                    class="w-5 h-5 cursor-pointer accent-zinc-800">
                <div>
                    <span class="text-[9px] font-black opacity-40 uppercase">${item.category} • ${item.tgl_deadline}</span>
                    <p class="font-bold text-base mt-0.5">${item.content}</p>
                    ${item.task_link ? `
                        <a href="${item.task_link}" target="_blank" class="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 font-bold">
                            🔗 RESOURCE LINK
                        </a>` : ''}
                </div>
            </div>
            <button onclick="openDeleteModal(${item.id})" class="opacity-20 hover:opacity-100 px-2 text-xl">✕</button>
        </div>
    `).join('');
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const prio = document.getElementById('priority').value; 
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    const link = document.getElementById('taskLink').value; 
    
    if(!teks || !tgl) return alert("Please fill task and date!");

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Syncing...";
    btn.disabled = true;

    const { error } = await supabaseClient.from('schedule').insert([{ 
        category: cat, content: teks, tgl_deadline: tgl, priority: prio, is_done: false, task_link: link 
    }]);

    if(error) alert("Error: " + error.message);
    else { 
        document.getElementById('isiData').value = '';
        document.getElementById('taskLink').value = '';
        muatData(); 
    }
    btn.innerText = "Update Hub";
    btn.disabled = false;
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    if (!container) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const year = now.getFullYear();
    const month = now.getMonth();
    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    container.innerHTML = '';
    for (let i = 0; i < firstDay; i++) container.innerHTML += `<div class="opacity-0"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasActiveTask = allTasks.some(t => t.tgl_deadline === dateStr && !t.is_done && t.tgl_deadline >= todayStr);
        const isToday = dateStr === todayStr ? 'today' : '';
        const eventClass = hasActiveTask ? 'has-event' : '';
        container.innerHTML += `<div class="day-cell ${isToday} ${eventClass}"><span>${d}</span></div>`;
    }
}

async function toggleDone(id, currentStatus) {
    await supabaseClient.from('schedule').update({ is_done: !currentStatus }).eq('id', id);
    muatData();
}

function openDeleteModal(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.replace('hidden', 'flex');
}
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.replace('flex', 'hidden');
}
document.getElementById('confirmDeleteBtn').onclick = async () => {
    await supabaseClient.from('schedule').delete().eq('id', deleteTargetId);
    closeDeleteModal();
    muatData();
};

applyAutoTheme();
setInterval(updateClock, 1000);
updateClock();
muatData();
