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
            AlphaEngine.addLog("SALDO INSUFICIENTE PARA ESSA APOSTA", "loss");
            return;
        }

        AlphaEngine.startSurvivalTimer();
        AlphaEngine.updateBalance(-betValue);

        this.deck = this.createDeck();
        this.pHand = [this.deck.pop(), this.deck.pop()];
        this.dHand = [this.deck.pop(), this.deck.pop()];

        document.getElementById('bj-controls-bet').style.display = 'none';
        document.getElementById('bj-controls-play').style.display = 'block';

        this.render(false);
        AlphaEngine.addLog(`Aposta de ${betValue.toFixed(2)} confirmada. Boa sorte!`);
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

        document.getElementById('bj-score').textContent = this.getVal(this.pHand);
    },

    hit: function () {
        this.pHand.push(this.deck.pop());
        this.render(false);
        if (this.getVal(this.pHand) > 21) {
            this.end(false, "BURST! Você estourou.");
        }
    },

    stand: function () {
        while (this.getVal(this.dHand) < 17) {
            this.dHand.push(this.deck.pop());
        }
        this.render(true);
        const ps = this.getVal(this.pHand);
        const ds = this.getVal(this.dHand);

        if (ds > 21) this.end(true, "DEALER BURST! Você venceu.");
        else if (ps > ds) this.end(true, "YOU WIN! Mão superior.");
        else if (ps === ds) this.end(null, "DRAW! Empate.");
        else this.end(false, "DEALER WINS! Mais sorte na próxima.");
    },

    end: function (win, msg) {
        const betValue = parseFloat(document.getElementById('bj-bet-input').value);
        if (win === true) {
            AlphaEngine.updateBalance(betValue * 2);
            AlphaEngine.addLog(`${msg}: +${(betValue * 2).toFixed(2)}`, "win");
        } else if (win === null) {
            AlphaEngine.updateBalance(betValue);
            AlphaEngine.addLog(msg);
        } else {
            AlphaEngine.addLog(`${msg}: -${betValue.toFixed(2)}`, "loss");
        }

        document.getElementById('bj-controls-bet').style.display = 'block';
        document.getElementById('bj-controls-play').style.display = 'none';
        AlphaEngine.updateUI();
    }
};

window.bj = bj;
