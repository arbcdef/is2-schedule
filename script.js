const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let allTasks = [];
let deleteTargetId = null;

// No. 3: Countdown Logic
function updateCountdown(deadline) {
    const target = new Date(deadline).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff < 0) return "Deadline Passed";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${d}d ${h}h remaining`;
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    container.innerHTML = '';
    for (let i = 0; i < firstDay; i++) container.innerHTML += `<div class="opacity-0"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // No. 4: Logika Abu-abu hanya jika BELUM LEWAT dan BELUM SELESAI
        const activeTask = allTasks.find(t => t.tgl_deadline === dateStr && !t.is_done && t.tgl_deadline >= todayStr);
        
        const isToday = dateStr === todayStr ? 'today' : '';
        const hasEvent = activeTask ? 'has-event' : '';
        
        container.innerHTML += `<div class="day-cell ${isToday} ${hasEvent}"><span>${d}</span></div>`;
    }
}

async function muatData() {
    try {
        let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });
        if (error) throw error;
        allTasks = data;

        document.querySelector('.status-label').innerText = "SYSTEM ACTIVE";
        document.querySelector('.dot').style.background = "#22c55e";

        renderCalendar();
        renderFeed(data);
        renderCountdown(data);
    } catch (err) {
        document.querySelector('.status-label').innerText = "OFFLINE";
    }
}

function renderCountdown(data) {
    const area = document.getElementById('next-deadline-area');
    const nowStr = new Date().toISOString().split('T')[0];
    const upcoming = data.find(t => !t.is_done && t.tgl_deadline >= nowStr);

    if (upcoming) {
        area.innerHTML = `
            <div class="countdown-card fade-in shadow-2xl">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest opacity-70">Next Urgent Task</p>
                    <h2 class="text-2xl font-bold">${upcoming.content}</h2>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-black">${updateCountdown(upcoming.tgl_deadline)}</p>
                    <p class="text-[10px] opacity-70 italic">Due: ${upcoming.tgl_deadline}</p>
                </div>
            </div>`;
    } else { area.innerHTML = ""; }
}

function renderFeed(data) {
    const list = document.getElementById('listData');
    list.innerHTML = data.map(item => `
        <div class="liquid-glass p-5 flex justify-between items-center transition-all priority-${item.priority || 'low'} ${item.is_done ? 'task-done' : ''}">
            <div class="flex items-center gap-4">
                <input type="checkbox" ${item.is_done ? 'checked' : ''} 
                    onclick="toggleDone('${item.id}', ${item.is_done})" 
                    class="w-5 h-5 accent-zinc-500">
                <div>
                    <span class="text-[9px] font-black uppercase text-zinc-400">${item.category} • ${item.tgl_deadline}</span>
                    <p class="font-bold text-base mt-0.5">${item.content}</p>
                </div>
            </div>
            <button onclick="openDeleteModal(${item.id})" class="opacity-20 hover:opacity-100 px-2 text-xl">✕</button>
        </div>
    `).join('');
}

async function toggleDone(id, currentStatus) {
    await supabaseClient.from('schedule').update({ is_done: !currentStatus }).eq('id', id);
    muatData();
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const prio = document.getElementById('priority').value;
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    
    if(!teks || !tgl) return alert("Fill all fields!");

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Syncing...";
    await supabaseClient.from('schedule').insert([{ 
        category: cat, content: teks, tgl_deadline: tgl, priority: prio, is_done: false 
    }]);
    
    document.getElementById('isiData').value = '';
    btn.innerText = "Update Hub";
    muatData();
}

// Logic Modal Hapus
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

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

setInterval(() => { updateClock(); muatData(); }, 1000);
updateClock();
muatData();
