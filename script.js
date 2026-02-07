// --- FUNGSI KALENDER (SINKRON WARNA & STABILITAS DEPLOY) ---
function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayDate = new Date().setHours(0, 0, 0, 0);

  cont.innerHTML = "";
  
  // Mendapatkan hari pertama dan jumlah hari dalam bulan ini
  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();

  // Penyesuaian agar hari Senin jadi urutan pertama (Sen=0, Sel=1, ... Min=6)
  let offset = firstDay === 0 ? 6 : firstDay - 1;
  
  // Isi slot kosong sebelum tanggal 1
  for (let i = 0; i < offset; i++) {
    const emptyDiv = document.createElement("div");
    cont.appendChild(emptyDiv);
  }

  // Render setiap tanggal
  for (let d = 1; d <= totalDays; d++) {
    const currDate = new Date(y, m, d);
    const checkTime = currDate.setHours(0, 0, 0, 0);

    // Filter tugas yang aktif di tanggal ini (Berdasarkan Start Date dan Deadline)
    const tasksAtDate = allTasks.filter((t) => {
      if (!t.tgl_start || !t.tgl_deadline) return false;
      const start = new Date(t.tgl_start).setHours(0, 0, 0, 0);
      const end = new Date(t.tgl_deadline).setHours(0, 0, 0, 0);
      return checkTime >= start && checkTime <= end;
    });

    const dayEl = document.createElement("div");
    dayEl.className = "day-cell";
    dayEl.innerText = d;

    // LOGIKA WARNA: Menentukan class berdasarkan prioritas tertinggi yang ada
    if (tasksAtDate.length > 0) {
      const hasHigh = tasksAtDate.some(t => t.priority === "High");
      const hasMedium = tasksAtDate.some(t => t.priority === "Medium");

      if (hasHigh) {
        dayEl.classList.add("pri-high"); // Jadi Merah (UAS)
      } else if (hasMedium) {
        dayEl.classList.add("pri-medium"); // Jadi Oranye (WKWKW)
      } else {
        dayEl.classList.add("pri-low"); // Jadi Hijau
      }
    }

    // Tandai jika hari ini
    if (checkTime === todayDate) {
      dayEl.classList.add("cal-today");
    }

    // Fungsi klik detail
    dayEl.onclick = () => {
      if (tasksAtDate.length > 0) {
        // Pastikan fungsi showCalendarDetail sudah ada di kode JS kamu
        showCalendarDetail(currDate.toDateString(), tasksAtDate);
      }
    };

    cont.appendChild(dayEl);
  }
}

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
    // Jalankan render kalender pertama kali
    if (typeof muatData === "function") {
        muatData(); 
    }

    // Fix untuk input tanggal agar bisa diklik di area mana saja (Gambar 1)
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener("click", (e) => {
            if (typeof input.showPicker === "function") {
                try {
                    input.showPicker();
                } catch (err) {
                    console.log("Picker error atau tidak didukung");
                }
            }
        });
    });
});
