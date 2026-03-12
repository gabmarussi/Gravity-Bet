/**
 * ALPHA ENGINE - Núcleo Compartilhado para a Alpha Bet Suite
 * Gerencia saldo, temporizador de sobrevivência e atualizações globais da UI.
 */

const AlphaEngine = {
    // Chaves ofuscadas para dificultar a alteração manual via console
    _keys: {
        b: 'alpha_secure_b_v4',
        t: 'alpha_secure_t_v4',
        s: 'alpha_secure_s_v4',
        i: 'alpha_integrity_v4'
    },
    
    // Sal secreta para o Checksum (Mudar isso dificulta o hack)
    _salt: "A-L-P-H-A-S-E-C-U-R-E-2-0-2-6",

    balance: 5000.00,
    survivalTime: 0,
    timerInterval: null,
    gameStarted: false,

    init() {
        this.loadState();
        this.updateUI();
        if (this.gameStarted) {
            this.startSurvivalTimer();
        }
        this.setupNavigation();
        this.createResultPopup();
        this.setupMobileMenu();
    },

    /**
     * Carrega e valida o estado salvo para evitar trapaças
     */
    loadState() {
        const storedB = localStorage.getItem(this._keys.b);
        const storedT = localStorage.getItem(this._keys.t);
        const storedS = localStorage.getItem(this._keys.s);
        const storedI = localStorage.getItem(this._keys.i);

        if (storedB && storedT && storedS && storedI) {
            const parsedBalance = parseFloat(storedB);
            const parsedSurvivalTime = parseInt(storedT);
            const parsedGameStarted = storedS === 'true';

            // Verifica se o saldo foi alterado manualmente
            if (this.verifyIntegrity(parsedBalance, parsedSurvivalTime, storedI)) {
                this.balance = parsedBalance;
                this.survivalTime = parsedSurvivalTime;
                this.gameStarted = parsedGameStarted;
            } else {
                console.error("ALERTA: Alteração de dados detectada! Resetando estado por segurança.");
                this.addLog("DADOS CORROMPIDOS OU ALTERADOS", "loss");
                this.resetToDefaults();
            }
        } else {
            // Se não houver dados salvos ou estiverem incompletos, inicializa e salva
            this.resetToDefaults();
        }
    },

    resetToDefaults() {
        this.balance = 5000.00;
        this.survivalTime = 0;
        this.gameStarted = false;
        this.saveState();
    },

    /**
     * Gerencia a abertura e fechamento do menu mobile
     */
    toggleMenu() {
        const nav = document.querySelector('nav');
        if (nav) nav.classList.toggle('active');
    },

    setupMobileMenu() {
        // Fecha o menu ao clicar em um link
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                const nav = document.querySelector('nav');
                if (nav) nav.classList.remove('active');
            });
        });
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

        // Multiplicador
        if (multDisplay) {
            // O multiplicador aumenta a cada 10 minutos (600 segundos) de jogo
            const mult = 1 + (this.survivalTime / 600);
            multDisplay.textContent = mult.toFixed(2) + 'x';
        }

        this.saveState();
        // Sincroniza rodapé de progresso global se existir
        this.syncGlobalProgress();
    },

    /**
     * Salva o estado e gera uma assinatura de integridade
     */
    saveState() {
        localStorage.setItem(this._keys.b, this.balance);
        localStorage.setItem(this._keys.t, this.survivalTime);
        localStorage.setItem(this._keys.s, this.gameStarted);
        
        // Gera e salva a assinatura baseada no estado atual
        const integrityHash = this.generateSignature(this.balance, this.survivalTime);
        localStorage.setItem(this._keys.i, integrityHash);
    },

    /**
     * Gera uma assinatura simples (básica) para dificultar alteração via console
     */
    generateSignature(b, t) {
        // Algoritmo simples de hash caseiro para demonstração
        const str = `${b}_${t}_${this._salt}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    },

    verifyIntegrity(b, t, storedI) {
        return this.generateSignature(b, t) === storedI;
    },

    /**
     * Sincroniza os elementos de progresso global (rodapé)
     */
    syncGlobalProgress() {
        const timerHero = document.getElementById('survival-timer-hero');
        const multDisplay = document.getElementById('survival-mult');
        const multAlt = document.getElementById('survival-mult-alt');

        if (timerHero) timerHero.textContent = this.formatTime(this.survivalTime);
        
        const mult = 1 + (this.survivalTime / 600);
        if (multDisplay) multDisplay.textContent = mult.toFixed(2) + 'x';
        if (multAlt) multAlt.textContent = mult.toFixed(2) + 'x';
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
        this.playSound(isWin ? 'win' : 'loss');

        setTimeout(() => {
            popup.classList.remove('show');
        }, 2000);
    },

    /**
     * Motor de Som Avançado - Gera áudio processado via Web Audio API
     * @param {string} type - Tipo de som: 'win', 'loss', 'chip', 'spin'
     */
    playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            switch(type) {
                case 'win':
                    // Arpeggio de vitória (C5, E5, G5)
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(523.25, now);
                    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;

                case 'loss':
                    // Som descendente de derrota
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;

                case 'chip':
                    // Som curto de ficha/moeda
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;

                case 'spin':
                    // Som rítmico de giro
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                    gain.gain.setValueAtTime(0.02, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
            }
        } catch (e) { /* Silencia erros de áudio (bloqueio do navegador) */ }
    },

    /**
     * Finaliza o jogo quando o saldo acaba
     */
    gameOver() {
        clearInterval(this.timerInterval);
        this.gameStarted = false;
        this.saveState();

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
        this.resetToDefaults();
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
    },

    /**
     * Exibe um modal de confirmação customizado e elegante
     */
    showConfirmModal(title, text, onConfirm) {
        const modal = document.getElementById('custom-confirm-modal');
        if (!modal) return;

        modal.querySelector('.confirm-modal-title').textContent = title;
        modal.querySelector('.confirm-modal-text').textContent = text;
        
        const confirmBtn = modal.querySelector('.btn-confirm');
        const cancelBtn = modal.querySelector('.btn-cancel');

        modal.classList.add('active');

        // Remove listeners antigos para evitar chamadas múltiplas
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = () => {
            modal.classList.remove('active');
            onConfirm();
        };

        cancelBtn.onclick = () => modal.classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => AlphaEngine.init());
window.AlphaEngine = AlphaEngine;
