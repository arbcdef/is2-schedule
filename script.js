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
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = data.find(t => !t.is_done && t.tgl_deadline >= todayStr);

    if (upcoming) {
        const diff = new Date(upcoming.tgl_deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        area.innerHTML = `
            <div class="countdown-card fade-in shadow-xl">
                <div>
                    <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Coming Up</p>
                    <h2 class="text-xl font-bold tracking-tight">${upcoming.content}</h2>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-black">${days <= 0 ? "TODAY" : days + "D"}</p>
                </div>
            </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed(data) {
    const list = document.getElementById('listData');
    list.innerHTML = data.map(item => `
        <div class="ios-card p-5 flex justify-between items-center transition-all priority-${item.priority} ${item.is_done ? 'task-done' : ''}">
            <div class="flex items-center gap-4">
                <input type="checkbox" ${item.is_done ? 'checked' : ''} onclick="toggleDone(${item.id}, ${item.is_done})" class="w-5 h-5 cursor-pointer accent-blue-500 rounded-full">
                <div>
                    <span class="text-[9px] font-black opacity-30 uppercase">${item.category} • ${item.tgl_deadline}</span>
                    <p class="font-bold text-base mt-0.5 leading-tight">${item.content}</p>
                    ${item.task_link ? `<a href="${item.task_link}" target="_blank" class="text-[10px] text-blue-500 font-bold mt-1 block">LINK RESOURCE</a>` : ''}
                </div>
            </div>
            <button onclick="openDeleteModal(${item.id})" class="opacity-20 hover:opacity-100 text-lg px-2">✕</button>
        </div>
    `).join('');
}

// Fixed Validation
async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const prio = document.getElementById('priority').value; 
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value.trim(); 
    const link = document.getElementById('taskLink').value; 
    
    if(!teks) return alert("Task details are required.");
    if(!tgl) return alert("Deadline date is required.");

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Syncing...";
    btn.disabled = true;

    const { error } = await supabaseClient.from('schedule').insert([{ 
        category: cat, content: teks, tgl_deadline: tgl, priority: prio, is_done: false, task_link: link 
    }]);

    if(!error) { 
        document.getElementById('isiData').value = ''; 
        document.getElementById('tglDeadline').value = '';
        muatData(); 
    }
    btn.innerText = "Sync to Cloud";
    btn.disabled = false;
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    container.innerHTML = '';
    for (let i = 0; i < firstDay; i++) container.innerHTML += `<div class="opacity-0"></div>`;
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const tasksOnDate = allTasks.filter(t => t.tgl_deadline === dateStr && !t.is_done);
        
        let priorityClass = "";
        if (tasksOnDate.length > 0) {
            if (tasksOnDate.some(t => t.priority === 'high')) priorityClass = "cal-high";
            else if (tasksOnDate.some(t => t.priority === 'medium')) priorityClass = "cal-medium";
            else priorityClass = "cal-low";
        }

        const isToday = dateStr === todayStr ? 'today-glow' : '';
        container.innerHTML += `<div class="day-cell ${isToday} ${priorityClass}">${d}</div>`;
    }
}

async function toggleDone(id, status) {
    await supabaseClient.from('schedule').update({ is_done: !status }).eq('id', id);
    muatData();
}

function openDeleteModal(id) { deleteTargetId = id; document.getElementById('deleteModal').classList.replace('hidden', 'flex'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.replace('flex', 'hidden'); }
document.getElementById('confirmDeleteBtn').onclick = async () => {
    await supabaseClient.from('schedule').delete().eq('id', deleteTargetId);
    closeDeleteModal();
    muatData();
};

setInterval(updateClock, 1000);
updateClock();
muatData();
