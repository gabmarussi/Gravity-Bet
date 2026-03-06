/**
 * ALPHA ENGINE - Shared Core logic for Alpha Bet Suite
 * Handles balance, survival timer, and global UI updates.
 */

// State Management
const AlphaEngine = {
    balance: parseFloat(localStorage.getItem('alpha_balance')) || 5000.00,
    survivalTime: parseInt(localStorage.getItem('alpha_survival_time')) || 0,
    timerInterval: null,
    gameStarted: localStorage.getItem('alpha_game_started') === 'true',

    init() {
        this.updateUI();
        if (this.gameStarted) {
            this.startSurvivalTimer();
        }
        this.setupNavigation();
        console.log("Alpha Engine Initialized.");
    },

    updateUI() {
        const balanceDisplay = document.getElementById('balance-display');
        const timerDisplay = document.getElementById('survival-timer');
        const multDisplay = document.getElementById('survival-mult');

        if (balanceDisplay) {
            balanceDisplay.textContent = this.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }

        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.survivalTime);
        }

        if (multDisplay) {
            const mult = 1 + (this.survivalTime / 600);
            multDisplay.textContent = mult.toFixed(2) + 'x';
        }

        localStorage.setItem('alpha_balance', this.balance);
        localStorage.setItem('alpha_survival_time', this.survivalTime);

        if (this.balance <= 0) {
            this.gameOver();
        }
    },

    formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    startSurvivalTimer() {
        if (this.timerInterval) return;
        this.gameStarted = true;
        localStorage.setItem('alpha_game_started', 'true');

        this.timerInterval = setInterval(() => {
            this.survivalTime++;
            this.updateUI();
        }, 1000);
    },

    updateBalance(amount) {
        this.balance += amount;
        this.updateUI();
    },

    addLog(msg, type = "") {
        const log = document.getElementById('alpha-log');
        if (!log) return;
        const entry = document.createElement('div');
        entry.className = `log-entry ${type === 'win' ? 'text-green-400' : (type === 'loss' ? 'text-red-400' : 'text-gray-500')}`;
        entry.textContent = `> ${msg}`;
        log.prepend(entry);
    },

    gameOver() {
        clearInterval(this.timerInterval);
        this.gameStarted = false;
        localStorage.setItem('alpha_game_started', 'false');

        const modal = document.getElementById('game-over-modal');
        if (modal) {
            modal.style.display = 'flex';
            const finalTime = document.getElementById('final-time');
            if (finalTime) finalTime.textContent = this.formatTime(this.survivalTime);
        }
    },

    resetGame() {
        this.balance = 5000.00;
        this.survivalTime = 0;
        this.gameStarted = false;
        localStorage.setItem('alpha_balance', 5000);
        localStorage.setItem('alpha_survival_time', 0);
        localStorage.setItem('alpha_game_started', 'false');
        window.location.href = 'index.html';
    },

    setupNavigation() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
                link.classList.add('active-nav');
            }
        });
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => AlphaEngine.init());

window.AlphaEngine = AlphaEngine;
