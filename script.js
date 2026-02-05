// Konfigurasi Supabase dengan Key yang baru kamu berikan
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let eventDates = [];

// 1. THEME TOGGLE (LIGHT/DARK)
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'dark' : 'light');
    icon.innerText = isLight ? '☀️' : '🌙';
    localStorage.setItem('is2-theme', isLight ? 'dark' : 'light');
}

// Cek tema terakhir yang dipilih user
if (localStorage.getItem('is2-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').innerText = '☀️';
}

// 2. JAM & TANGGAL (HELVEtICA STYLE)
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

// 3. RENDER KALENDER AKADEMIK
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendar-month-year');
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    label.innerText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    container.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        container.innerHTML += `<div class="opacity-0 day-cell"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = (d === now.getDate() && month === now.getMonth()) ? 'today' : '';
        const hasEvent = eventDates.includes(dateStr) ? '<div class="event-dot"></div>' : '';
        
        container.innerHTML += `
            <div class="day-cell ${isToday}">
                <span>${d}</span>
                ${hasEvent}
            </div>
        `;
    }
}

// 4. DATABASE OPERATIONS (AMBIL DATA)
async function muatData() {
    try {
        const statusLabel = document.querySelector('.status-label');
        const dotStatus = document.querySelector('.dot');
        
        let { data, error } = await supabaseClient
            .from('schedule')
            .select('*')
            .order('tgl_deadline', { ascending: true });

        if (error) throw error;

        // Jika berhasil koneksi
        if(statusLabel) statusLabel.innerText = "SYSTEM ACTIVE";
        if(dotStatus) dotStatus.style.background = "#22c55e";

        eventDates = data.map(item => item.tgl_deadline).filter(d => d);
        renderCalendar();

        const list = document.getElementById('listData');
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-zinc-400 py-10 italic text-sm'>No records found.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="bg-zinc-100/50 dark:bg-zinc-900/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-200/10 hover:border-zinc-500/30 transition-all duration-300">
                <div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">${item.category} • ${item.tgl_deadline || 'No Date'}</span>
                    <p class="font-bold text-base mt-1 tracking-tight">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="opacity-20 hover:opacity-100 transition text-sm px-2">✕</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Fetch error:", err);
        const statusLabel = document.querySelector('.status-label');
        const dotStatus = document.querySelector('.dot');
        if(statusLabel) statusLabel.innerText = "OFFLINE";
        if(dotStatus) dotStatus.style.background = "#ef4444";
    }
}

// 5. SIMPAN DATA KE SUPABASE
async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    
    if(!teks || !tgl) {
        alert("Wajib isi Tanggal dan Detail ya!");
        return;
    }

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerText = "Syncing...";
    
    const { error } = await supabaseClient.from('schedule').insert([{ 
        category: cat, 
        content: teks, 
        tgl_deadline: tgl 
    }]);

    if(error) {
        alert("Gagal simpan: " + error.message);
    } else {
        document.getElementById('isiData').value = '';
        document.getElementById('tglDeadline').value = '';
    }

    btn.disabled = false;
    btn.innerText = "Update Hub";
    muatData();
}

// 6. HAPUS DATA
async function hapusData(id) {
    if(confirm("Hapus data ini?")) {
        const { error } = await supabaseClient.from('schedule').delete().eq('id', id);
        if(error) alert("Gagal menghapus");
        muatData();
    }
}

// Jalankan saat pertama kali buka
setInterval(updateClock, 1000);
updateClock();
muatData();

// Cek data baru otomatis setiap 15 detik
setInterval(muatData, 15000);
