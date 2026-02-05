// --- KONFIGURASI SUPABASE ---
// URL dan KEY ini menghubungkan website dengan database yang kamu buat tadi
const SB_URL = "https://mycldrtubwstojeaumcg.supabase.co"; 
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Y2xkcnR1YndzdG9qZWF1bWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQwNTksImV4cCI6MjA4NTg1MDA1OX0.GHgglJHGQqDDRY-IcvhQeZyYZmR48J3arnby8IxZo9I";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// 1. FUNGSI JAM & KALENDER (WIDGET iOS)
function updateClock() {
    const now = new Date();
    // Menampilkan jam di header
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Menampilkan info di widget kalender merah
    document.getElementById('cal-month').innerText = now.toLocaleDateString('id-ID', { month: 'short' });
    document.getElementById('cal-date').innerText = now.getDate();
    document.getElementById('cal-day').innerText = now.toLocaleDateString('id-ID', { weekday: 'long' });
}

// 2. FUNGSI AMBIL DATA (READ)
async function muatData() {
    // Mengambil data dari tabel 'schedule' di Supabase
    let { data, error } = await supabaseClient
        .from('schedule')
        .select('*')
        .order('id', { ascending: false });

    if (!error) {
        const list = document.getElementById('listData');
        if (data.length === 0) {
            list.innerHTML = "<p class='text-center text-slate-400 py-20'>Belum ada informasi hari ini.</p>";
            return;
        }
        
        // Memasukkan data ke dalam HTML dengan gaya kartu Liquid Glass
        list.innerHTML = data.map(item => `
            <div class="bg-white/40 border border-white/50 p-5 rounded-[1.8rem] flex justify-between items-start group hover:bg-white/60 transition-all">
                <div>
                    <span class="text-[10px] font-bold px-3 py-1 bg-white/80 text-blue-600 rounded-full uppercase tracking-widest">${item.category}</span>
                    <p class="mt-3 text-slate-800 font-medium text-lg leading-relaxed">${item.content}</p>
                </div>
                <button onclick="hapusData(${item.id})" class="text-slate-300 hover:text-red-500 transition-colors p-2 text-xl">✕</button>
            </div>
        `).join('');
    }
}

// 3. FUNGSI SIMPAN DATA (CREATE)
async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const teks = document.getElementById('isiData').value;
    
    if(!teks) return alert("Ketik pesannya dulu ya!");

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerText = "⏳ Sinkronisasi...";

    // Memasukkan data baru ke tabel 'schedule'
    const { error } = await supabaseClient.from('schedule').insert([{ category: cat, content: teks }]);
    
    if(error) {
        alert("Gagal menyimpan ke database!");
    } else {
        document.getElementById('isiData').value = ''; // Kosongkan input
    }
    
    btn.disabled = false;
    btn.innerText = "Update Database";
    muatData(); // Perbarui tampilan
}

// 4. FUNGSI HAPUS DATA (DELETE)
async function hapusData(id) {
    if(confirm("Hapus informasi ini dari semua orang?")) {
        await supabaseClient.from('schedule').delete().eq('id', id);
        muatData(); // Perbarui tampilan setelah hapus
    }
}

// --- JALANKAN SAAT WEBSITE DIBUKA ---
setInterval(updateClock, 1000); // Update jam setiap detik
updateClock();
muatData(); // Ambil data saat pertama kali buka

// Cek data baru setiap 15 detik (Real-time polling)
setInterval(muatData, 15000);
