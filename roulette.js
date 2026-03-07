/**
 * ROULETTE ROYALE - Lógica para o jogo de Roleta
 * Gerencia a roleta de estilo europeu com 37 números
 */

const roulette = {
    selectedBet: null,      // Tipo de aposta atual selecionado na mesa
    isSpinning: false,      // Trava para evitar giros múltiplos simultâneos
    rotation: 0,            // Rotação acumulada para a animação da roleta
    // Sequência real de números da roleta europeia
    wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    // Lista de números que pertencem à cor vermelha
    reds: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],

    init() {
        this.createWheelLabels();
        this.createBettingGrid();
        console.log("Premium Roulette Engine V3.5 Ativa");
    },

    /**
     * Gera todos os números visuais ao redor da roleta dinamicamente
     */
    createWheelLabels() {
        const wheel = document.getElementById('roulette-wheel');
        this.wheelNumbers.forEach((num, i) => {
            const label = document.createElement('div');
            label.className = `roulette-number-label ${num === 0 ? 'green' : (this.reds.includes(num) ? 'red' : 'black')}`;
            // Cada número ocupa uma fatia de aproximadamente 9,72 graus
            label.style.transform = `rotate(${(i * (360 / 37))}deg)`;
            label.innerHTML = `<span>${num}</span>`;
            wheel.appendChild(label);
        });
    },

    /**
     * Gera a grade de apostas principal (1-36 + Colunas)
     */
    createBettingGrid() {
        const grid = document.getElementById('rl-main-grid');
        
        // Colunas representam números na ordem de uma mesa europeia padrão
        for (let col = 1; col <= 12; col++) {
            [3, 2, 1].forEach(rowFunc => {
                const num = (col - 1) * 3 + rowFunc;
                const cell = document.createElement('div');
                cell.className = `grid-cell ${this.reds.includes(num) ? 'red' : 'black'}`;
                cell.textContent = num;
                cell.onclick = () => this.selectBet(num.toString());
                grid.appendChild(cell);
            });
        }

        // Adiciona as zonas de aposta de coluna (pagamento 2:1)
        [1, 2, 3].forEach(row => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell neutral';
            cell.style.background = 'var(--glass)';
            cell.style.border = '1px solid var(--glass-border)';
            cell.textContent = '2:1';
            cell.onclick = () => this.selectBet(`COL${row}`);
            grid.appendChild(cell);
        });
    },

    /**
     * Define o tipo de aposta selecionado na mesa para a rodada atual
     * @param {string} type - Tipo de aposta (Ex: "RED", "EVEN", "12", "COL1"...)
     */
    selectBet(type) {
        if (this.isSpinning) return;
        this.selectedBet = type;

        // Feedback visual na interface
        document.querySelectorAll('.grid-cell, .outside-bet, .racetrack-section').forEach(c => c.classList.remove('selected'));
        const display = document.getElementById('current-bet-display');
        display.textContent = `Aposta selecionada: ${type} (PRÊMIO: ${this.getMult(type)}x)`;
        
        AlphaEngine.addLog(`Tipo de aposta selecionado: ${type}`);
    },

    /**
     * Retorna o fator de multiplicação de prêmio para cada tipo de aposta
     */
    getMult(type) {
        if (!isNaN(type)) return 35; // Aposta em número exato
        if (['RED', 'BLACK', 'EVEN', 'ODD', 'LOW', 'HIGH'].includes(type)) return 2;
        if (['1ST12', '2ND12', '3ND12', 'COL1', 'COL2', 'COL3'].includes(type)) return 3;
        if (['VIZINHOS', 'ORFAOS', 'TERCEIROS'].includes(type)) return 5;
        return 2;
    },

    /**
     * Realiza o sorteio e animação de giro da roleta e da bola
     */
    spin: function () {
        if (this.isSpinning) return;
        if (!this.selectedBet) {
            AlphaEngine.addLog("SELECIONE O TIPO DE APOSTA NA MESA", "loss");
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
        const ball = document.getElementById('roulette-ball');
        const resElem = document.getElementById('wheel-result');

        // Sorteio do número final
        const resultNum = this.wheelNumbers[Math.floor(Math.random() * 37)];
        const resultIndex = this.wheelNumbers.indexOf(resultNum);
        
        // Define as rotações para criar uma animação fluida (múltiplas voltas completas)
        const wheelFullSpins = 5;
        const ballFullSpins = 8;
        
        // A roleta e a bola giram em sincronia calculada
        const wheelTargetRotation = this.rotation + (360 * wheelFullSpins);
        this.rotation = wheelTargetRotation;
        wheel.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)';
        wheel.style.transform = `rotate(${this.rotation}deg)`;

        const numArc = 360 / 37;
        const ballTargetRotation = -(360 * ballFullSpins) - (resultIndex * numArc);
        
        ball.style.transition = 'none';
        ball.style.transform = 'rotate(0deg) translateY(-200px)';
        ball.offsetHeight; // Forçar o reflow do elemento no navegador
        
        ball.style.transition = 'transform 5s cubic-bezier(0.1, 0, 0.2, 1)';
        ball.style.transform = `rotate(${ballTargetRotation}deg) translateY(-160px)`;

        resElem.textContent = "?";

        // Devolve o controle ao jogador após a animação de parada
        setTimeout(() => {
            resElem.textContent = resultNum;
            this.evaluate(resultNum, betValue);
            this.isSpinning = false;
        }, 5100);
    },

    /**
     * Avalia o número sorteado contra a aposta do jogador e paga o prêmio
     */
    evaluate: function (num, bet) {
        let win = false;
        const color = num === 0 ? 'GREEN' : (this.reds.includes(num) ? 'RED' : 'BLACK');

        // Lógica de validação da condição de vitória baseada no tipo selecionado
        if (!isNaN(this.selectedBet)) {
            if (num === parseInt(this.selectedBet)) win = true;
        } else {
            switch(this.selectedBet) {
                case 'RED': if(color === 'RED') win = true; break;
                case 'BLACK': if(color === 'BLACK') win = true; break;
                case 'EVEN': if(num !== 0 && num % 2 === 0) win = true; break;
                case 'ODD': if(num % 2 !== 0) win = true; break;
                case 'LOW': if(num >= 1 && num <= 18) win = true; break;
                case 'HIGH': if(num >= 19 && num <= 36) win = true; break;
                case '1ST12': if(num >= 1 && num <= 12) win = true; break;
                case '2ND12': if(num >= 13 && num <= 24) win = true; break;
                case '3ND12': if(num >= 25 && num <= 36) win = true; break;
                case 'COL1': if(num !== 0 && num % 3 === 0) win = true; break;
                case 'COL2': if(num !== 0 && num % 3 === 2) win = true; break;
                case 'COL3': if(num !== 0 && num % 3 === 1) win = true; break;
                // Áreas estratégicas (Racetrack)
                case 'VIZINHOS': if([0, 32, 15, 19, 4, 21, 2, 25, 26, 3, 35, 12, 28, 7, 29, 18, 22].includes(num)) win = true; break;
                case 'ORFAOS': if([1, 20, 14, 31, 9, 17, 34, 6].includes(num)) win = true; break;
                case 'TERCEIROS': if([27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33].includes(num)) win = true; break;
            }
        }

        const mult = this.getMult(this.selectedBet);
        if (win) {
            const prize = bet * mult;
            AlphaEngine.updateBalance(prize);
            AlphaEngine.showResult("VENCEDOR!", prize, true);
            AlphaEngine.addLog(`Resultado: ${num} (${color}). Ganhou R$ ${prize.toFixed(2)}`, "win");
        } else {
            AlphaEngine.showResult("DERROTA", bet, false);
            AlphaEngine.addLog(`Resultado: ${num} (${color}). Perdeu R$ ${bet.toFixed(2)}`, "loss");
        }

        // Exibe o último número sorteado na seção do log
        const stats = document.getElementById('last-number');
        if (stats) {
            stats.textContent = `ÚLTIMO: ${num}`;
            stats.style.display = 'block';
        }

        AlphaEngine.updateUI();
    }
};

document.addEventListener('DOMContentLoaded', () => roulette.init());
window.roulette = roulette;
