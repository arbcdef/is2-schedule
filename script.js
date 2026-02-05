// Ganti dengan kredensial Supabase kamu yang asli
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

async function muatData() {
    let { data, error } = await supabaseClient.from('schedule').select('*').order('id', { ascending: false });
    
    if (!error) {
        document.getElementById('counter').innerText = `${data.length} item`;
        const list = document.getElementById('listData');
        
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-slate-400 py-20'>Belum ada pengumuman.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="info-card flex justify-between items-start group">
                <div class="flex-grow">
                    <span class="text-[10px] font-bold px-3 py-1 bg-blue-100 text-blue-600 rounded-full uppercase tracking-tighter">${item.category}</span>
                    <p class="mt-4 text-slate-800 font-medium text-lg leading-relaxed">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="text-slate-300 hover:text-red-500 transition-colors p-2 text-2xl">✕</button>
            </div>
        `).join('');
    }
}

async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const teks = document.getElementById('isiData').value;
    if(!teks) return alert("Tuliskan sesuatu dulu!");

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerText = "Processing...";

    const { error } = await supabaseClient.from('schedule').insert([{ category: cat, content: teks }]);
    
    if(error) {
        alert("Error syncing data!");
    } else {
        document.getElementById('isiData').value = '';
        muatData();
    }
    
    btn.disabled = false;
    btn.innerText = "Sync to Cloud";
}

async function hapusData(id) {
    if(confirm("Hapus data ini untuk semua orang?")) {
        await supabaseClient.from('schedule').delete().eq('id', id);
        muatData();
    }
}

// Inisialisasi
setInterval(updateClock, 1000);
updateClock();
muatData();
// Sinkronisasi otomatis setiap 15 detik
setInterval(muatData, 15000);
