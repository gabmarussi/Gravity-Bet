/**
 * BLACKJACK CORE - Lógica para o jogo Blackjack VIP
 * Gerencia baralhos, mãos e avaliações de pontuação
 */

const bj = {
    deck: [],       // Baralho completo (52 cartas)
    pHand: [],      // Mão do jogador
    dHand: [],      // Mão do dealer (casa)

    /**
     * Cria e embaralha um novo baralho
     * @returns {Array} Baralho de 52 cartas [{suit, val}]
     */
    createDeck: () => {
        const suits = ['♥', '♦', '♣', '♠'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let d = []; 
        for (let suit of suits) {
            for (let val of values) {
                d.push({ suit, val });
            }
        }
        return d.sort(() => Math.random() - 0.5);
    },

    /**
     * Calcula o valor da pontuação de uma mão
     * Considera o Ás como 11 ou 1, dependendo do que for mais favorável para não estourar (burst).
     */
    getVal: (hand) => {
        let score = 0, aces = 0;
        hand.forEach(c => {
            if (c.val === 'A') {
                aces++;
            } else {
                // Cartas J, Q, K valem 10, o restante vale o valor númerico.
                score += (['J', 'Q', 'K'].includes(c.val) ? 10 : parseInt(c.val));
            }
        });
        
        // Adiciona o valor dos Ases estrategicamente
        for (let i = 0; i < aces; i++) {
            score += (score + 11 <= 21 ? 11 : 1);
        }
        return score;
    },

    /**
     * Inicia a rodada coletando a aposta e distribuindo cartas
     */
    start: function () {
        const betValue = parseFloat(document.getElementById('bj-bet-input').value);
        if (betValue > AlphaEngine.balance || betValue <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            return;
        }

        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-betValue);
        AlphaEngine.playSound('chip');

        this.deck = this.createDeck();
        this.pHand = [this.deck.pop(), this.deck.pop()];
        this.dHand = [this.deck.pop(), this.deck.pop()];

        // Alterna entre UI de aposta e UI de jogo
        document.getElementById('bj-controls-bet').style.display = 'none';
        document.getElementById('bj-controls-play').style.display = 'flex';

        this.render(false);
        AlphaEngine.addLog(`Partida iniciada. Aposta: R$ ${betValue.toFixed(2)}`);
    },

    /**
     * Atualiza os elementos visuais das cartas e a pontuação na tela
     * @param {boolean} showDealer - Define se o dealer revela sua carta oculta
     */
    render: function (showDealer) {
        const pElem = document.getElementById('bj-player-hand');
        const dElem = document.getElementById('bj-dealer-hand');
        const dScoreWrapper = document.getElementById('bj-dealer-score-wrapper');
        const dScoreElem = document.getElementById('bj-dealer-score');

        // Renderiza a mão do jogador
        pElem.innerHTML = this.pHand.map(c => `
            <div class="card ${['♥', '♦'].includes(c.suit) ? 'red' : ''}" data-suit="${c.suit}">
                <span>${c.val}</span>
                <span style="align-self: flex-end">${c.val}</span>
            </div>
        `).join('');

        // Renderiza a mão do dealer (ocultando a primeira carta se necessário)
        dElem.innerHTML = this.dHand.map((c, i) => {
            if (i === 0 && !showDealer) {
                return `<div class="card hidden-card"></div>`;
            }
            return `
                <div class="card ${['♥', '♦'].includes(c.suit) ? 'red' : ''}" data-suit="${c.suit}">
                    <span>${c.val}</span>
                    <span style="align-self: flex-end">${c.val}</span>
                </div>
            `;
        }).join('');

        const pScore = this.getVal(this.pHand);
        document.getElementById('bj-score').textContent = pScore;

        if (showDealer) {
            dScoreWrapper.style.display = 'inline-block';
            dScoreElem.textContent = this.getVal(this.dHand);
        } else {
            dScoreWrapper.style.display = 'none';
        }

        // Parada automática se fizer Blackjack (21 nas duas primeiras cartas)
        if (pScore === 21 && this.pHand.length === 2 && !showDealer) {
            setTimeout(() => this.stand(), 500);
        }
    },

    /**
     * Jogador pede mais uma carta ao baralho
     */
    hit: function () {
        this.pHand.push(this.deck.pop());
        AlphaEngine.playSound('chip');
        this.render(false);
        if (this.getVal(this.pHand) > 21) {
            this.end(false, "BURST!");
        }
    },

    /**
     * Dealer revela suas cartas e joga até atingir o mínimo de 17 pontos
     */
    stand: function () {
        while (this.getVal(this.dHand) < 17) {
            this.dHand.push(this.deck.pop());
        }
        this.render(true);
        const ps = this.getVal(this.pHand);
        const ds = this.getVal(this.dHand);

        // Avaliação do vencedor
        if (ds > 21) this.end(true, "DEALER BURST!");
        else if (ps > ds) this.end(true, "VENCEDOR!");
        else if (ps === ds) this.end(null, "EMPATE");
        else this.end(false, "A CASA VENCE");
    },

    /**
     * Finaliza a rodada, calcula prêmio e reseta UI após atraso
     */
    end: function (win, msg) {
        // Desativa ações imediatamente para evitar bugs/exploits
        document.getElementById('bj-controls-play').style.pointerEvents = 'none';
        document.getElementById('bj-controls-play').style.opacity = '0.5';

        const betValue = parseFloat(document.getElementById('bj-bet-input').value);
        let winAmount = 0;

        if (win === true) {
            winAmount = betValue * 2;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult(msg, winAmount, true);
            AlphaEngine.addLog(`Vitória! Recebeu R$ ${winAmount.toFixed(2)}`, "win");
        } else if (win === null) {
            winAmount = betValue;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult("EMPATE", winAmount, true); // Devolve o valor
            AlphaEngine.addLog("Empate. Aposta devolvida.");
        } else {
            AlphaEngine.showResult(msg, betValue, false);
            AlphaEngine.addLog(`Derrota. Perdeu R$ ${betValue.toFixed(2)}`, "loss");
        }

        setTimeout(() => {
            document.getElementById('bj-controls-bet').style.display = 'flex';
            document.getElementById('bj-controls-play').style.display = 'none';
            document.getElementById('bj-controls-play').style.pointerEvents = 'auto'; // Reativa para a próxima
            document.getElementById('bj-controls-play').style.opacity = '1';
            AlphaEngine.updateUI();
            AlphaEngine.checkBankruptcy();
        }, 1500);
    }
};

window.bj = bj;
