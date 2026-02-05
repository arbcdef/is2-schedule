const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let eventDates = [];

function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isLight ? '☀️' : '🌙';
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    container.innerHTML = '';
    for (let i = 0; i < firstDay; i++) container.innerHTML += `<div class="opacity-0 day-cell"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = (d === now.getDate() && month === now.getMonth()) ? 'today' : '';
        const hasEvent = eventDates.includes(dateStr) ? '<div class="event-dot"></div>' : '';
        container.innerHTML += `<div class="day-cell ${isToday}"><span>${d}</span>${hasEvent}</div>`;
    }
}

async function muatData() {
    try {
        let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });
        if (error) throw error;
        document.querySelector('.status-label').innerText = "SYSTEM ACTIVE";
        document.querySelector('.dot').style.background = "#22c55e";
        eventDates = data.map(item => item.tgl_deadline).filter(d => d);
        renderCalendar();
        const list = document.getElementById('listData');
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-zinc-400 py-10 italic text-sm'>No records found.</p>";
            return;
        }
        list.innerHTML = data.map(item => `
            <div class="bg-zinc-100/50 dark:bg-zinc-900/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-200/10">
                <div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">${item.category} • ${item.tgl_deadline}</span>
                    <p class="font-bold text-base mt-1 tracking-tight">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="opacity-20 hover:opacity-100 px-2">✕</button>
            </div>
        `).join('');
    } catch (err) {
        document.querySelector('.status-label').innerText = "OFFLINE";
        document.querySelector('.dot').style.background = "#ef4444";
    }
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    if(!teks || !tgl) return alert("Isi tanggal dan detail!");
    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Syncing...";
    const { error } = await supabaseClient.from('schedule').insert([{ category: cat, content: teks, tgl_deadline: tgl }]);
    if(error) alert("Gagal: " + error.message);
    else {
        document.getElementById('isiData').value = '';
        muatData();
    }
    btn.innerText = "Update Hub";
}

async function hapusData(id) {
    if(confirm("Hapus?")) {
        await supabaseClient.from('schedule').delete().eq('id', id);
        muatData();
    }
}

setInterval(updateClock, 1000);
updateClock();
muatData();
