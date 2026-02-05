// ISI DENGAN KREDENSIAL SUPABASE KAMU
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "MASUKKAN_ANON_KEY_KAMU_DISINI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// State untuk menyimpan tanggal-tanggal event
let eventDates = [];

// 1. THEME TOGGLE LOGIC
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        icon.innerText = '☀️';
    } else {
        html.setAttribute('data-theme', 'light');
        icon.innerText = '🌙';
    }
}

// 2. JAM & WIDGET HARI INI
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

// 3. RENDER KALENDER AKADEMIK
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

    // Padding hari kosong
    for (let i = 0; i < firstDay; i++) {
        container.innerHTML += `<div></div>`;
    }

    // Hari dalam bulan
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = d === now.getDate() ? 'today' : '';
        const hasEvent = eventDates.includes(dateStr) ? '<div class="event-dot"></div>' : '';
        
        container.innerHTML += `
            <div class="day-cell ${isToday}">
                ${d}
                ${hasEvent}
            </div>
        `;
    }
}

// 4. DATABASE OPERATIONS
async function muatData() {
    let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });

    if (!error) {
        eventDates = data.map(item => item.tgl_deadline).filter(d => d); // Ambil list tanggal
        renderCalendar(); // Gambar ulang kalender

        const list = document.getElementById('listData');
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-zinc-400 py-10 italic'>No upcoming schedule.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-2xl flex justify-between items-center border border-zinc-200/20">
                <div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">${item.category} • ${item.tgl_deadline || 'No Date'}</span>
                    <p class="font-medium text-sm mt-1">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="opacity-30 hover:opacity-100 transition text-xs">✕</button>
            </div>
        `).join('');
    }
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    
    if(!teks || !tgl) return alert("Please fill description and date!");

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    
    // Pastikan nama kolom di Supabase kamu adalah: category, content, tgl_deadline
    await supabaseClient.from('schedule').insert([{ 
        category: cat, 
        content: teks, 
        tgl_deadline: tgl 
    }]);

    document.getElementById('isiData').value = '';
    btn.disabled = false;
    muatData();
}

async function hapusData(id) {
    if(confirm("Remove this entry?")) {
        await supabaseClient.from('schedule').delete().eq('id', id);
        muatData();
    }
}

// INIT
setInterval(updateClock, 1000);
updateClock();
muatData();
