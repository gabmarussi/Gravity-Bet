const roulette = {
    pBet: function (type) {
        const betValue = parseFloat(document.getElementById('rl-bet-input').value);
        if (betValue > AlphaEngine.balance || betValue <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            return;
        }

        AlphaEngine.startSurvivalTimer();

        const ball = document.getElementById('roulette-ball');
        ball.classList.add('spinning');
        ball.textContent = '?';

        setTimeout(() => {
            ball.classList.remove('spinning');
            const num = Math.floor(Math.random() * 37);
            ball.textContent = num;

            let win = false;
            const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

            if (type === 'EVEN' && num !== 0 && num % 2 === 0) win = true;
            if (type === 'ODD' && num % 2 !== 0) win = true;
            if (type === 'RED' && reds.includes(num)) win = true;
            if (type === 'BLACK' && num !== 0 && !reds.includes(num)) win = true;
            if (type === 'NUMBER') {
                const chosenNum = parseInt(document.getElementById('rl-num-input').value);
                if (num === chosenNum) {
                    AlphaEngine.updateBalance(betValue * 35);
                    win = "JACKPOT";
                }
            }

            if (win === true) {
                AlphaEngine.updateBalance(betValue);
                AlphaEngine.addLog(`ROULETTE ${num}: WIN! +${betValue.toFixed(2)}`, "win");
            } else if (win === "JACKPOT") {
                AlphaEngine.addLog(`ROYAL STRIKE ${num}: +${(betValue * 35).toFixed(2)}`, "win");
            } else {
                AlphaEngine.updateBalance(-betValue);
                AlphaEngine.addLog(`ROULETTE ${num}: LOSS. -${betValue.toFixed(2)}`, "loss");
            }

            AlphaEngine.updateUI();
        }, 800);
    }
};

window.roulette = roulette;
