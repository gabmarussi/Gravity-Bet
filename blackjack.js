const bj = {
    deck: [], pHand: [], dHand: [],

    createDeck: () => {
        const s = ['♥', '♦', '♣', '♠'], v = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let d = []; for (let suit of s) for (let val of v) d.push({ suit, val });
        return d.sort(() => Math.random() - 0.5);
    },

    getVal: (hand) => {
        let score = 0, aces = 0;
        hand.forEach(c => {
            if (c.val === 'A') aces++;
            else score += (['J', 'Q', 'K'].includes(c.val) ? 10 : parseInt(c.val));
        });
        for (let i = 0; i < aces; i++) score += (score + 11 <= 21 ? 11 : 1);
        return score;
    },

    deal: function () {
        const betValue = parseFloat(document.getElementById('bj-bet-input').value);
        if (betValue > AlphaEngine.balance || betValue <= 0) {
            AlphaEngine.addLog("SALDO INSUFICIENTE", "loss");
            return;
        }

        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-betValue);

        this.deck = this.createDeck();
        this.pHand = [this.deck.pop(), this.deck.pop()];
        this.dHand = [this.deck.pop(), this.deck.pop()];

        document.getElementById('bj-controls-bet').style.display = 'none';
        document.getElementById('bj-controls-play').style.display = 'flex';

        this.render(false);
        AlphaEngine.addLog(`Partida iniciada. Aposta: R$ ${betValue.toFixed(2)}`);
    },

    render: function (showDealer) {
        const pElem = document.getElementById('bj-player-hand');
        const dElem = document.getElementById('bj-dealer-hand');

        pElem.innerHTML = this.pHand.map(c => `
            <div class="card ${['♥', '♦'].includes(c.suit) ? 'red' : ''}">
                ${c.val}${c.suit}
            </div>
        `).join('');

        dElem.innerHTML = this.dHand.map((c, i) => {
            if (i === 0 && !showDealer) {
                return `<div class="card hidden-card">?</div>`;
            }
            return `
                <div class="card ${['♥', '♦'].includes(c.suit) ? 'red' : ''}">
                    ${c.val}${c.suit}
                </div>
            `;
        }).join('');

        const score = this.getVal(this.pHand);
        document.getElementById('bj-score').textContent = score;

        if (score === 21 && this.pHand.length === 2 && !showDealer) {
            setTimeout(() => this.stand(), 500); // Auto stand on blackjack
        }
    },

    hit: function () {
        this.pHand.push(this.deck.pop());
        this.render(false);
        if (this.getVal(this.pHand) > 21) {
            this.end(false, "BURST!");
        }
    },

    stand: function () {
        while (this.getVal(this.dHand) < 17) {
            this.dHand.push(this.deck.pop());
        }
        this.render(true);
        const ps = this.getVal(this.pHand);
        const ds = this.getVal(this.dHand);

        if (ds > 21) this.end(true, "DEALER BURST!");
        else if (ps > ds) this.end(true, "WINNER!");
        else if (ps === ds) this.end(null, "DRAW");
        else this.end(false, "DEALER WINS");
    },

    end: function (win, msg) {
        const betValue = parseFloat(document.getElementById('bj-bet-input').value);
        let winAmount = 0;

        if (win === true) {
            winAmount = betValue * 2;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult("WINNER", winAmount, true);
            AlphaEngine.addLog(`Vitória! Recebeu R$ ${winAmount.toFixed(2)}`, "win");
        } else if (win === null) {
            winAmount = betValue;
            AlphaEngine.updateBalance(winAmount);
            AlphaEngine.showResult("DRAW", winAmount, true);
            AlphaEngine.addLog("Empate. Aposta devolvida.");
        } else {
            AlphaEngine.showResult("LOSS", betValue, false);
            AlphaEngine.addLog(`Derrota. Perdeu R$ ${betValue.toFixed(2)}`, "loss");
        }

        setTimeout(() => {
            document.getElementById('bj-controls-bet').style.display = 'flex';
            document.getElementById('bj-controls-play').style.display = 'none';
            AlphaEngine.updateUI();
        }, 1500);
    }
};

window.bj = bj;
