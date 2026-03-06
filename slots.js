const slots = {
    syms: ['💎', '🍒', '7️⃣', '🍋', '⭐', '🍀'],
    spin: function () {
        const betValue = parseFloat(document.getElementById('slots-bet-input').value);
        if (betValue > AlphaEngine.balance || betValue <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            return;
        }

        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-betValue);

        const reels = [
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3')
        ];

        reels.forEach(r => {
            r.classList.add('spinning');
            r.textContent = '?';
        });

        setTimeout(() => {
            const results = reels.map(r => {
                r.classList.remove('spinning');
                const s = this.syms[Math.floor(Math.random() * this.syms.length)];
                r.textContent = s;
                return s;
            });

            if (results[0] === results[1] && results[1] === results[2]) {
                const survivalMult = 1 + (AlphaEngine.survivalTime / 600);
                let prizeFactor = 10;
                if (results[0] === '7️⃣') prizeFactor = 50;
                if (results[0] === '💎') prizeFactor = 100;

                const winAmount = betValue * prizeFactor * survivalMult;
                AlphaEngine.updateBalance(winAmount);
                AlphaEngine.addLog(`JACKPOT! ${results[0]}x3: +${winAmount.toFixed(2)}`, "win");

                // Visual effect
                reels.forEach(r => r.style.borderColor = 'var(--gold-bright)');
                setTimeout(() => reels.forEach(r => r.style.borderColor = 'var(--gold)'), 2000);
            } else {
                AlphaEngine.addLog(`Tente novamente. Perdeu ${betValue.toFixed(2)}`, "loss");
            }
            AlphaEngine.updateUI();
        }, 1000);
    }
};

window.slots = slots;
