const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "MASUKKAN_ANON_KEY_KAMU_DISINI";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let eventDates = [];

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    icon.innerText = isLight ? '☀️' : '🌙';
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

    for (let i = 0; i < firstDay; i++) {
        container.innerHTML += `<div class="opacity-0"></div>`;
    }

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

async function muatData() {
    let { data, error } = await supabaseClient.from('schedule').select('*').order('tgl_deadline', { ascending: true });

    if (!error) {
        eventDates = data.map(item => item.tgl_deadline).filter(d => d);
        renderCalendar();

        const list = document.getElementById('listData');
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-zinc-400 py-10 italic text-sm'>No data entries found.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="bg-zinc-100/50 dark:bg-zinc-900/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-200/10 hover:border-zinc-500/30 transition-all duration-300">
                <div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">${item.category} • ${item.tgl_deadline || 'Indefinite'}</span>
                    <p class="font-bold text-base mt-1 tracking-tight">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="opacity-20 hover:opacity-100 transition text-sm px-2">✕</button>
            </div>
        `).join('');
    }
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    
    if(!teks || !tgl) return alert("Please specify the date and description.");

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerText = "Syncing...";
    
    await supabaseClient.from('schedule').insert([{ 
        category: cat, 
        content: teks, 
        tgl_deadline: tgl 
    }]);

    document.getElementById('isiData').value = '';
    btn.disabled = false;
    btn.innerText = "Update Hub";
    muatData();
}

async function hapusData(id) {
    if(confirm("Confirm deletion?")) {
        await supabaseClient.from('schedule').delete().eq('id', id);
        muatData();
    }
}

setInterval(updateClock, 1000);
updateClock();
muatData();
setInterval(muatData, 20000);
