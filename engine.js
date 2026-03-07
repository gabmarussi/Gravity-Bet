/**
 * ALPHA ENGINE - Núcleo Compartilhado para a Alpha Bet Suite
 * Gerencia saldo, temporizador de sobrevivência e atualizações globais da UI.
 */

const AlphaEngine = {
    // Carrega o saldo ou define o valor inicial de R$ 5000,00
    balance: parseFloat(localStorage.getItem('alpha_balance')) || 5000.00,
    // Tempo total jogado em segundos
    survivalTime: parseInt(localStorage.getItem('alpha_survival_time')) || 0,
    timerInterval: null,
    gameStarted: localStorage.getItem('alpha_game_started') === 'true',

    init() {
        this.updateUI();
        if (this.gameStarted) {
            this.startSurvivalTimer();
        }
        this.setupNavigation();
        this.createResultPopup();
    },

    /**
     * Atualiza todos os elementos visuais de saldo e tempo na página.
     * Também salva o progresso atual no LocalStorage do navegador.
     */
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
            // O multiplicador aumenta a cada 10 minutos (600 segundos) de jogo
            const mult = 1 + (this.survivalTime / 600);
            multDisplay.textContent = mult.toFixed(2) + 'x';
        }

        // O salvamento no LocalStorage continua aqui
        localStorage.setItem('alpha_balance', this.balance);
        localStorage.setItem('alpha_survival_time', this.survivalTime);
    },

    /**
     * Verifica estado de falência (saldo <= 0)
     * Deve ser chamado ao final de cada rodada
     */
    checkBankruptcy() {
        if (this.balance <= 0) {
            const modal = document.getElementById('game-over-modal');
            if (modal && !modal.classList.contains('active')) {
                // Pequeno delay para permitir que o usuário veja o resultado final
                setTimeout(() => this.gameOver(), 1500);
            }
        }
    },

    /**
     * Converte segundos para formato HH:MM:SS
     */
    formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    /**
     * Inicia o contador de tempo de sobrevivência
     */
    startSurvivalTimer() {
        if (this.timerInterval) return;
        this.gameStarted = true;
        localStorage.setItem('alpha_game_started', 'true');

        this.timerInterval = setInterval(() => {
            this.survivalTime++;
            this.updateUI();
        }, 1000);
    },

    /**
     * Modifica o saldo do jogador
     * @param {number} amount - Valor a ser adicionado ou subtraído
     */
    updateBalance(amount) {
        this.balance += amount;
        this.updateUI();
        return this.balance;
    },

    /**
     * Adiciona uma entrada no log de atividades do jogo
     */
    addLog(msg, type = "") {
        const log = document.getElementById('alpha-log');
        if (!log) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type === 'win' ? 'text-success' : (type === 'loss' ? 'text-danger' : 'text-gray-500')}`;

        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `
            <span style="color: rgba(255,255,255,0.2)">[${time}]</span>
            <span>${msg}</span>
            <span style="font-weight: 700">${type.toUpperCase()}</span>
        `;

        log.prepend(entry);
    },

    /**
     * Cria o elemento de popup de resultado que aparece no centro da tela
     */
    createResultPopup() {
        if (document.getElementById('global-result-popup')) return;
        const div = document.createElement('div');
        div.id = 'global-result-popup';
        div.className = 'result-popup';
        div.innerHTML = `
            <div class="result-card" id="result-card">
                <h2 id="result-title">VITÓRIA!</h2>
                <p id="result-amount">+R$ 0.00</p>
            </div>
        `;
        document.body.appendChild(div);
    },

    /**
     * Exibe o popup de resultado de uma rodada
     */
    showResult(title, amount, isWin = true) {
        const popup = document.getElementById('global-result-popup');
        const card = document.getElementById('result-card');
        const titleElem = document.getElementById('result-title');
        const amountElem = document.getElementById('result-amount');

        card.className = `result-card ${isWin ? 'result-win' : 'result-loss'}`;
        titleElem.textContent = title;
        amountElem.textContent = (isWin ? '+' : '') + amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        popup.classList.add('show');
        this.playSound(isWin ? 880 : 220);

        setTimeout(() => {
            popup.classList.remove('show');
        }, 2000);
    },

    /**
     * Gera um som simples usando a API de Áudio do navegador (sem arquivos externos)
     * @param {number} freq - Frequência do som em Hz
     */
    playSound(freq) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* Navegador pode bloquear áudio sem interação prévia */ }
    },

    /**
     * Finaliza o jogo quando o saldo acaba
     */
    gameOver() {
        clearInterval(this.timerInterval);
        this.gameStarted = false;
        localStorage.setItem('alpha_game_started', 'false');

        const modal = document.getElementById('game-over-modal');
        if (modal) {
            modal.classList.add('active');
            const finalTime = document.getElementById('final-time');
            if (finalTime) finalTime.textContent = this.formatTime(this.survivalTime);
        }
    },

    /**
     * Reinicia todos os dados do jogador
     */
    resetGame() {
        this.balance = 5000.00;
        this.survivalTime = 0;
        this.gameStarted = false;
        localStorage.setItem('alpha_balance', 5000);
        localStorage.setItem('alpha_survival_time', 0);
        localStorage.setItem('alpha_game_started', 'false');
        window.location.href = 'index.html';
    },

    /**
     * Sincroniza a classe ativa do menu de navegação
     */
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

document.addEventListener('DOMContentLoaded', () => AlphaEngine.init());
window.AlphaEngine = AlphaEngine;
