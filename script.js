// --- FUNGSI KALENDER (LOGIKA WARNA DISINKRONKAN) ---
function renderCalendar() {
  const cont = document.getElementById("calendar-container");
  if (!cont) return;

  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const todayDate = new Date().setHours(0, 0, 0, 0);

  cont.innerHTML = "";
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  // Penyesuaian agar hari Senin jadi urutan pertama
  let offset = first === 0 ? 6 : first - 1;
  for (let i = 0; i < offset; i++) {
    const emptyDiv = document.createElement("div");
    cont.appendChild(emptyDiv);
  }

  for (let d = 1; d <= days; d++) {
    const currDate = new Date(y, m, d);
    const checkDate = currDate.setHours(0, 0, 0, 0);

    // Mencari tugas yang jatuh pada tanggal ini (Start Date s/d Deadline)
    const tasks = allTasks.filter((t) => {
      const start = new Date(t.tgl_start).setHours(0, 0, 0, 0);
      const end = new Date(t.tgl_deadline).setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });

    let pClass = "";
    
    // LOGIKA WARNA: Diurutkan dari yang paling penting
    if (tasks.length > 0) {
      // Jika ada lebih dari 1 tugas, kita ambil yang prioritasnya paling tinggi untuk warna kotak
      const hasHigh = tasks.some(t => t.priority === "High");
      const hasMedium = tasks.some(t => t.priority === "Medium");

      if (hasHigh) pClass = "pri-high";
      else if (hasMedium) pClass = "pri-medium";
      else pClass = "pri-low";
    }

    // Jika hari ini, tambahkan class spesial (tanpa menghapus warna tugas)
    let todayClass = (checkDate === todayDate) ? "cal-today" : "";

    const dayEl = document.createElement("div");
    // Gabungkan class: day-cell + warna priority + marker hari ini
    dayEl.className = `day-cell ${pClass} ${todayClass}`;
    dayEl.innerText = d;

    // Klik untuk lihat detail tugas di tanggal tersebut
    dayEl.onclick = () => {
      if (tasks.length > 0) {
        showCalendarDetail(new Date(y, m, d).toDateString(), tasks);
      }
    };

    cont.appendChild(dayEl);
  }
}

// Tambahkan fungsi untuk menangani input tanggal secara manual jika browser macet
document.addEventListener("DOMContentLoaded", () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener("click", () => {
            if (typeof input.showPicker === "function") {
                input.showPicker(); // Memaksa kalender muncul pada browser modern
            }
        });
    });
});
