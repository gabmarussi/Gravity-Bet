/**
 * MEGA SLOTS - Lógica para o jogo Mega Slots
 * Gerencia a mecânica de bobinas, multiplicadores e apostas automáticas
 */

const slots = {
    // Símbolos disponíveis nas bobinas
    syms: ['💎', '🍒', '7️⃣', '🍋', '⭐', '🍀'],
    isSpinning: false,
    autoBet: false,
    multiplier: 1,

    init() {
        console.log("Subsistema de Slots Ativo");
    },

    /**
     * Define o multiplicador global da aposta atual
     * @param {number} m - Novo fator multiplicador (Ex: 1x, 2x...)
     */
    setMult(m) {
        this.multiplier = m;
        AlphaEngine.addLog(`Multiplicador de aposta ajustado para ${m}x`);
        AlphaEngine.updateUI();
    },

    /**
     * Alterna o estado de aposta automática do jogo
     */
    toggleAuto() {
        this.autoBet = !this.autoBet;
        const btn = document.getElementById('auto-btn');
        const status = document.getElementById('auto-status');
        btn.textContent = `AUTO BET: ${this.autoBet ? 'ON' : 'OFF'}`;
        btn.className = this.autoBet ? 'btn-auto active' : 'btn-auto';
        status.style.display = this.autoBet ? 'block' : 'none';

        if (this.autoBet && !this.isSpinning) {
            this.spin();
        }
    },

    /**
     * Realiza o giro das bobinas com animação de strip vertical
     */
    spin: function () {
        if (this.isSpinning) return;

        const baseBet = parseFloat(document.getElementById('slots-bet-input').value);
        const totalBet = baseBet * this.multiplier;

        // Verifica saldo antes de permitir o giro
        if (totalBet > AlphaEngine.balance || totalBet <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            this.autoBet = false;
            this.toggleAuto();
            return;
        }

        this.isSpinning = true;
        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-totalBet);

        // Animação da alavanca (pull-down)
        const container = document.querySelector('.lever-container');
        container.classList.add('pulling');
        setTimeout(() => container.classList.remove('pulling'), 500);

        const reels = [
            { window: document.getElementById('slot-1-window'), strip: document.getElementById('slot-1-strip') },
            { window: document.getElementById('slot-2-window'), strip: document.getElementById('slot-2-strip') },
            { window: document.getElementById('slot-3-window'), strip: document.getElementById('slot-3-strip') }
        ];

        const results = [];
        reels.forEach((r, i) => {
            r.window.classList.add('spinning');
            r.window.classList.remove('win');
            
            // Cria uma trilha longa de símbolos aleatórios para simular o giro
            const stripSymbols = [];
            for(let j=0; j<20; j++) stripSymbols.push(this.syms[Math.floor(Math.random() * this.syms.length)]);
            
            // Define o símbolo vencedor da rodada
            const finalSymbol = this.syms[Math.floor(Math.random() * this.syms.length)];
            results.push(finalSymbol);
            stripSymbols.push(finalSymbol);

            // Reseta a posição do strip antes da nova animação
            r.strip.innerHTML = stripSymbols.map(s => `<div class="reel-symbol">${s}</div>`).join('');
            r.strip.style.transition = 'none';
            r.strip.style.transform = 'translateY(0)';
            r.strip.offsetHeight; // Forçar o reflow do elemento

            // Realiza a animação de rotação vertical das bobinas
            const symbolHeight = 160;
            const targetY = -(stripSymbols.length - 1) * symbolHeight;
            
            setTimeout(() => {
                r.strip.style.transition = `transform ${2 + i * 0.5}s cubic-bezier(0.45, 0.05, 0.55, 0.95)`;
                r.strip.style.transform = `translateY(${targetY}px)`;
            }, 50);
        });

        // Aguarda a conclusão das animações
        setTimeout(() => {
            reels.forEach(r => r.window.classList.remove('spinning'));
            this.evaluate(results, totalBet);
            this.isSpinning = false;

            // Continua girando se o modo automático estiver ativo
            if (this.autoBet) {
                setTimeout(() => this.spin(), 500);
            }
        }, 3500);
    },

    /**
     * Avalia o resultado da rodada e calcula os prêmios
     */
    evaluate: function (res, bet) {
        // Vitória se todos os 3 símbolos forem iguais
        if (res[0] === res[1] && res[1] === res[2]) {
            // Aplica multiplicador extra com base no tempo total jogado (Alpha Engine)
            const survivalMult = 1 + (AlphaEngine.survivalTime / 600);
            let prizeFactor = 10;
            if (res[0] === '7️⃣') prizeFactor = 50;
            if (res[0] === '💎') prizeFactor = 100;
            if (res[0] === '⭐') prizeFactor = 25;

            const winAmount = bet * prizeFactor * survivalMult;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult("JACKPOT!", winAmount, true);
            AlphaEngine.addLog(`MEGA WIN: ${res[0]}x3! Ganhou R$ ${winAmount.toFixed(2)}`, "win");

            // Efeito visual de vitória na bobina
            document.getElementById('slot-1-window').classList.add('win');
            document.getElementById('slot-2-window').classList.add('win');
            document.getElementById('slot-3-window').classList.add('win');
        } else {
            AlphaEngine.addLog(`Slot Spin: Perdeu R$ ${bet.toFixed(2)}`, "loss");
        }
        AlphaEngine.updateUI();
        AlphaEngine.checkBankruptcy();
    }
};

window.slots = slots;
