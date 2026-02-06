:root {
  --bg-page: #f2f2f7;
  --text-main: #1c1c1e;
  --card-bg: rgba(255, 255, 255, 0.9);
  --border-color: rgba(0, 0, 0, 0.05);
  --island-bg: #1c1c1e;
  --island-text: #ffffff;
}

[data-theme="dark"] {
  --bg-page: #000000;
  --text-main: #ffffff;
  --card-bg: rgba(28, 28, 30, 0.8);
  --border-color: rgba(255, 255, 255, 0.08);
  --island-bg: #ffffff !important;
  --island-text: #000000 !important;
}

body {
  background: var(--bg-page);
  color: var(--text-main);
  font-family: sans-serif;
  transition: 0.4s ease;
  overflow-x: hidden;
}

/* MODAL / POP-UP */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
}
.modal-card {
  background: var(--card-bg);
  width: 100%;
  max-width: 320px;
  padding: 35px;
  border-radius: 40px;
  border: 1px solid var(--border-color);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
}
.option-btn {
  width: 100%;
  padding: 18px;
  border-radius: 20px;
  background: rgba(128, 128, 128, 0.1);
  font-weight: 800;
  text-align: center;
  transition: 0.2s;
  font-size: 13px;
}
.option-btn:hover {
  background: var(--text-main);
  color: var(--bg-page);
  transform: scale(1.02);
}

/* CUSTOM COMPONENTS */
.ios-select-btn {
  background: rgba(128, 128, 128, 0.1);
  padding: 14px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-main);
  transition: 0.2s;
}
.ios-select-btn:active {
  transform: scale(0.95);
  background: rgba(128, 128, 128, 0.2);
}

.delete-btn {
  background: #ff3b30;
  color: white;
  padding: 10px 18px;
  border-radius: 15px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  shadow: 0 10px 20px rgba(255, 59, 48, 0.2);
  transition: 0.3s;
}
.delete-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}

/* UI CARDS */
.ios-card {
  background: var(--card-bg);
  backdrop-filter: blur(40px);
  border-radius: 35px;
  padding: 30px;
  border: 1px solid var(--border-color);
}
.ios-input {
  background: rgba(128, 128, 128, 0.1);
  border-radius: 20px;
  padding: 16px;
  width: 100%;
  color: var(--text-main);
  border: none;
  font-weight: 600;
  outline: none;
}
.ios-primary-btn {
  background: var(--text-main);
  color: var(--bg-page);
  width: 100%;
  padding: 22px;
  border-radius: 22px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: 0.3s;
}
.ios-primary-btn:active {
  transform: scale(0.98);
}

/* CALENDAR */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-weight: 900;
  background: rgba(128, 128, 128, 0.05);
  cursor: pointer;
  transition: 0.2s;
  font-size: 14px;
}
.cal-high {
  background: #ff3b30 !important;
  color: white !important;
}
.cal-medium {
  background: #ff9500 !important;
  color: white !important;
}
.cal-low {
  background: #8e8e93 !important;
  color: white !important;
}
.today-glow {
  outline: 2px solid var(--text-main);
  outline-offset: 2px;
}

.countdown-card {
  background: var(--island-bg) !important;
  color: var(--island-text) !important;
  padding: 40px 50px;
  border-radius: 45px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.countdown-card * {
  color: var(--island-text) !important;
}

.fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
