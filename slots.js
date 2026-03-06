const slots = {
    syms: ['💎', '🍒', '7️⃣', '🍋', '⭐', '🍀'],
    isSpinning: false,
    autoBet: false,
    multiplier: 1,

    init() {
        console.log("Slots Subsystem Active");
    },

    setMult(m) {
        this.multiplier = m;
        AlphaEngine.addLog(`Multiplicador de aposta ajustado para ${m}x`);
    },

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

    spin: function () {
        if (this.isSpinning) return;

        const baseBet = parseFloat(document.getElementById('slots-bet-input').value);
        const totalBet = baseBet * this.multiplier;

        if (totalBet > AlphaEngine.balance || totalBet <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            this.autoBet = false;
            this.toggleAuto();
            return;
        }

        this.isSpinning = true;
        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-totalBet);

        // Lever animation
        const arm = document.getElementById('lever-arm');
        arm.style.transform = 'rotateX(60deg)';
        setTimeout(() => arm.style.transform = 'rotateX(0deg)', 300);

        const reels = [
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3')
        ];

        reels.forEach(r => {
            r.classList.add('spinning');
            r.classList.remove('win');
        });

        setTimeout(() => {
            const results = reels.map(r => {
                r.classList.remove('spinning');
                const s = this.syms[Math.floor(Math.random() * this.syms.length)];
                r.textContent = s;
                return s;
            });

            this.evaluate(results, totalBet);
            this.isSpinning = false;

            if (this.autoBet) {
                setTimeout(() => this.spin(), 1000);
            }
        }, 800);
    },

    evaluate: function (res, bet) {
        if (res[0] === res[1] && res[1] === res[2]) {
            const survivalMult = 1 + (AlphaEngine.survivalTime / 600);
            let prizeFactor = 10;
            if (res[0] === '7️⃣') prizeFactor = 50;
            if (res[0] === '💎') prizeFactor = 100;
            if (res[0] === '⭐') prizeFactor = 25;

            const winAmount = bet * prizeFactor * survivalMult;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult("JACKPOT!", winAmount, true);
            AlphaEngine.addLog(`MEGA WIN: ${res[0]}x3! Ganhou R$ ${winAmount.toFixed(2)}`, "win");

            document.getElementById('slot-1').classList.add('win');
            document.getElementById('slot-2').classList.add('win');
            document.getElementById('slot-3').classList.add('win');
        } else {
            AlphaEngine.addLog(`Slot Spin: Perdeu R$ ${bet.toFixed(2)}`, "loss");
        }
        AlphaEngine.updateUI();
    }
};

window.slots = slots;
