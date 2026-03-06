const roulette = {
    selectedType: null,
    isSpinning: false,
    rotation: 0,

    selectBet(type) {
        if (this.isSpinning) return;
        this.selectedType = type;

        // UI feedback
        document.querySelectorAll('.bet-cell').forEach(c => c.classList.remove('selected'));
        document.getElementById('bet-NUMBER').classList.remove('active');

        if (type !== 'NUMBER') {
            document.getElementById(`bet-${type}`).classList.add('selected');
        } else {
            document.getElementById('bet-NUMBER').classList.add('active');
        }

        AlphaEngine.addLog(`Tipo de aposta selecionado: ${type}`);
    },

    spin: function () {
        if (this.isSpinning) return;
        if (!this.selectedType) {
            AlphaEngine.addLog("SELECIONE O TIPO DE APOSTA PRIMEIRO", "loss");
            return;
        }

        const betValue = parseFloat(document.getElementById('rl-bet-input').value);
        if (betValue > AlphaEngine.balance || betValue <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            return;
        }

        this.isSpinning = true;
        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-betValue);

        const wheel = document.getElementById('roulette-wheel');
        const resElem = document.getElementById('wheel-result');

        // Random rotation (multiple full spins + random offset)
        const extraDegrees = Math.floor(Math.random() * 361);
        this.rotation += (360 * 5) + extraDegrees;
        wheel.style.transform = `rotate(${this.rotation}deg) scale(1.1)`;
        resElem.textContent = "?";

        setTimeout(() => {
            wheel.style.transform = `rotate(${this.rotation}deg) scale(1.0)`;
            const num = Math.floor(Math.random() * 37);
            resElem.textContent = num;

            // Show result
            this.evaluate(num, betValue);

            this.isSpinning = false;
        }, 4000);
    },

    evaluate: function (num, bet) {
        let win = false;
        const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const color = num === 0 ? 'GREEN' : (reds.includes(num) ? 'RED' : 'BLACK');

        if (this.selectedType === 'EVEN' && num !== 0 && num % 2 === 0) win = true;
        if (this.selectedType === 'ODD' && num % 2 !== 0) win = true;
        if (this.selectedType === 'RED' && color === 'RED') win = true;
        if (this.selectedType === 'BLACK' && color === 'BLACK') win = true;
        if (this.selectedType === 'NUMBER') {
            const chosenNum = parseInt(document.getElementById('rl-num-input').value);
            if (num === chosenNum) {
                const prize = bet * 35;
                AlphaEngine.updateBalance(prize);
                AlphaEngine.showResult("ROYAL STRIKE!", prize, true);
                AlphaEngine.addLog(`ACERTO EXATO NO ${num}! +R$ ${prize.toFixed(2)}`, "win");
                win = "JACKPOT";
            }
        }

        if (win === true) {
            const prize = bet * 2;
            AlphaEngine.updateBalance(prize);
            AlphaEngine.showResult("WINNER!", prize, true);
            AlphaEngine.addLog(`Resultado: ${num} (${color}). Ganhou R$ ${prize.toFixed(2)}`, "win");
        } else if (win === false) {
            AlphaEngine.showResult("LOSS", bet, false);
            AlphaEngine.addLog(`Resultado: ${num} (${color}). Perdeu R$ ${bet.toFixed(2)}`, "loss");
        }

        const stats = document.getElementById('last-number');
        stats.textContent = `ÚLTIMO: ${num}`;
        stats.style.display = 'block';

        AlphaEngine.updateUI();
    }
};

window.roulette = roulette;
