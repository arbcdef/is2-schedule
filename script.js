// Fungsi untuk membuka pop-up input
function openInputModal() {
    const modal = document.getElementById('inputModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.navigator.vibrate) window.navigator.vibrate(20); // Getar halus saat buka
}

// Fungsi untuk menutup pop-up input
function closeInputModal() {
    const modal = document.getElementById('inputModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Perbarui fungsi simpanData agar menutup modal setelah berhasil
async function simpanData() {
    const cat = document.getElementById('kategori').value;
    const prio = document.getElementById('priority').value; 
    const tgl = document.getElementById('tglDeadline').value;
    const teks = document.getElementById('isiData').value;
    const link = document.getElementById('taskLink').value; 
    
    if(!teks || !tgl) return alert("Please fill the details!");

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Processing...";
    btn.disabled = true;

    const { error } = await supabaseClient.from('schedule').insert([{ 
        category: cat, content: teks, tgl_deadline: tgl, priority: prio, is_done: false, task_link: link 
    }]);

    if(error) {
        alert(error.message);
    } else {
        // Reset form dan tutup modal
        document.getElementById('isiData').value = '';
        document.getElementById('taskLink').value = '';
        closeInputModal(); 
        muatData();
    }
    btn.innerText = "Update Hub";
    btn.disabled = false;
}
