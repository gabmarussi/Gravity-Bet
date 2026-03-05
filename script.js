document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let balance = parseFloat(localStorage.getItem('gravity_balance')) || 1000.00;
    const balanceDisplay = document.getElementById('balance-amount');
    const betInput = document.getElementById('bet-amount');
    const logContainer = document.getElementById('event-console');

    // Initialize UI
    updateUI();

    // Betting Options
    const options = {
        EVEN: (n) => n !== 0 && n % 2 === 0,
        ODD: (n) => n % 2 !== 0,
        RED: (n) => [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n),
        BLACK: (n) => [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(n)
    };

    window.placeBet = (type) => {
        const betValue = parseFloat(betInput.value);

        // Validation
        if (isNaN(betValue) || betValue <= 0) {
            addLog("Por favor, insira um valor de aposta válido.", "error");
            return;
        }

        if (betValue > balance) {
            addLog("Saldo insuficiente para esta aposta.", "error");
            return;
        }

        // Process Bet
        balance -= betValue;
        updateUI();

        // Visual Feedback (Flash)
        document.body.style.transition = 'background 0.1s';
        document.body.style.backgroundColor = 'rgba(124, 77, 255, 0.2)';
        
        setTimeout(() => {
            document.body.style.backgroundColor = '';
            
            // RNG (0-36)
            const resultNum = Math.floor(Math.random() * 37);
            const isWin = options[type](resultNum);
            
            if (isWin) {
                const winAmount = betValue * 2;
                balance += winAmount;
                addLog(`O número foi ${resultNum}. VOCÊ GANHOU ${winAmount.toFixed(2)} moedas! ✨`, "win");
            } else {
                addLog(`O número foi ${resultNum}. Você perdeu ${betValue.toFixed(2)} moedas. 💀`, "loss");
            }

            updateUI();
            saveState();
        }, 300);
    };

    function updateUI() {
        balanceDisplay.textContent = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        localStorage.setItem('gravity_balance', balance);
        
        // Animated counter effect could go here
    }

    function addLog(message, type = "") {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type ? 'log-' + type : ''}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span style="opacity: 0.5">[${timestamp}]</span> ${message}`;
        
        logContainer.prepend(entry);
    }

    function saveState() {
        localStorage.setItem('gravity_balance', balance);
    }
});
