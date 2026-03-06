// --- ENGINE & STATE ---
let balance = parseFloat(localStorage.getItem('gravity_balance')) || 1000.00;
let lastBonusDate = localStorage.getItem('gravity_last_bonus') || "";

const updateUI = () => {
    document.getElementById('balance-amount').textContent = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    localStorage.setItem('gravity_balance', balance);
};

const addLog = (msg, type = "") => {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type ? 'log-' + type : ''}`;
    entry.textContent = `> ${msg}`;
    const console = document.getElementById('event-console');
    console.prepend(entry);
};

const showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    addLog(`Entrou em: ${screenId.toUpperCase()}`);
};

const collectDailyBonus = () => {
    const today = new Date().toDateString();
    if (lastBonusDate === today && balance > 0) {
        addLog("Bônus já coletado hoje. Volte amanhã!", "error");
        return;
    }
    const bonus = balance <= 0 ? 500 : 100;
    balance += bonus;
    lastBonusDate = today;
    localStorage.setItem('gravity_last_bonus', today);
    updateUI();
    addLog(`Você recebeu um bônus de ${bonus} créditos!`, "win");
};

// --- UTILITIES ---
const createDeck = () => {
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let s of suits) for (let v of values) deck.push({ s, v });
    return deck.sort(() => Math.random() - 0.5);
};

const getCardVal = (card, currentTotal = 0) => {
    if (['J', 'Q', 'K'].includes(card.v)) return 10;
    if (card.v === 'A') return (currentTotal + 11 > 21) ? 1 : 11;
    return parseInt(card.v);
};

// --- BLACKJACK LOGIC ---
const blackjack = {
    deck: [], playerHand: [], dealerHand: [],
    getScore: (hand) => {
        let score = 0;
        let aces = 0;
        hand.forEach(c => {
            if (c.v === 'A') aces++;
            else score += (['J', 'Q', 'K'].includes(c.v) ? 10 : parseInt(c.v));
        });
        for (let i = 0; i < aces; i++) score += (score + 11 <= 21 ? 11 : 1);
        return score;
    },
    render: (showDealer) => {
        const pArea = document.getElementById('bj-player-cards');
        const dArea = document.getElementById('bj-dealer-cards');
        pArea.innerHTML = this.playerHand.map(c => `<div class="card ${['♥', '♦'].includes(c.s) ? 'red' : ''}">${c.v}${c.s}</div>`).join('');
        dArea.innerHTML = this.dealerHand.map((c, i) =>
            (i === 0 && !showDealer) ? `<div class="card hidden-card">?</div>` : `<div class="card ${['♥', '♦'].includes(c.s) ? 'red' : ''}">${c.v}${c.s}</div>`
        ).join('');
        document.getElementById('bj-player-score').textContent = this.getScore(this.playerHand);
    },
    deal: function () {
        const bet = parseFloat(document.getElementById('bj-bet').value);
        if (bet > balance || bet <= 0) return addLog("Aposta inválida", "error");
        balance -= bet; updateUI();

        this.deck = createDeck();
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        this.render(false);
        document.getElementById('bj-pre-game').classList.add('hidden');
        document.getElementById('bj-in-game').classList.remove('hidden');
    },
    hit: function () {
        this.playerHand.push(this.deck.pop());
        this.render(false);
        if (this.getScore(this.playerHand) > 21) this.end(false, "Estourou!");
    },
    stand: function () {
        while (this.getScore(this.dealerHand) < 17) this.dealerHand.push(this.deck.pop());
        this.render(true);
        const pS = this.getScore(this.playerHand);
        const dS = this.getScore(this.dealerHand);
        if (dS > 21 || pS > dS) this.end(true, "Ganhou!");
        else if (pS === dS) this.end(null, "Empate");
        else this.end(false, "Dealer venceu");
    },
    end: function (win, msg) {
        const bet = parseFloat(document.getElementById('bj-bet').value);
        if (win) { balance += bet * 2; addLog(`${msg} +${bet * 2}`, "win"); }
        else if (win === null) { balance += bet; addLog(msg); }
        else addLog(`${msg} -${bet}`, "loss");

        updateUI();
        document.getElementById('bj-pre-game').classList.remove('hidden');
        document.getElementById('bj-in-game').classList.add('hidden');
    }
};

// --- SLOTS LOGIC ---
const slots = {
    syms: ['🍒', '🍋', '💎', '7️⃣', '🍊', '🍇'],
    spin: function () {
        const bet = parseFloat(document.getElementById('slots-bet').value);
        if (bet > balance || bet <= 0) return;
        balance -= bet; updateUI();

        const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
        reels.forEach(r => r.classList.add('spinning'));

        setTimeout(() => {
            const results = reels.map(r => {
                r.classList.remove('spinning');
                const val = this.syms[Math.floor(Math.random() * this.syms.length)];
                r.textContent = val;
                return val;
            });

            if (results[0] === results[1] && results[1] === results[2]) {
                let mult = 10;
                if (results[0] === '🍒') mult = 5;
                if (results[0] === '💎') mult = 20;
                if (results[0] === '7️⃣') mult = 50;
                balance += bet * mult;
                addLog(`JACKPOT! ${results[0]} +${bet * mult}`, "win");
            } else {
                addLog("Tente novamente!", "loss");
            }
            updateUI();
        }, 800);
    }
};

// --- ROULETTE (EXPANDED) ---
const roulette = {
    bet: function (type) {
        const bet = parseFloat(document.getElementById('roulette-bet').value);
        if (bet > balance || bet <= 0) return;

        const num = Math.floor(Math.random() * 37);
        const display = document.getElementById('roulette-result-display');
        display.textContent = num;

        let win = false;
        if (type === 'EVEN' && num !== 0 && num % 2 === 0) win = true;
        if (type === 'ODD' && num % 2 !== 0) win = true;
        if (type === 'RED' && [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num)) win = true;
        if (type === 'BLACK' && [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(num)) win = true;
        if (type === 'NUMBER' && num === parseInt(document.getElementById('roulette-num-val').value)) {
            balance += bet * 35; win = "JACKPOT";
        }

        if (win === true) { balance += bet; addLog(`Número ${num}. Ganhou!`, "win"); }
        else if (win === "JACKPOT") { addLog(`ACERTOU EM CHEIO! ${num} +${bet * 35}`, "win"); }
        else { balance -= bet; addLog(`Número ${num}. Perdeu.`, "loss"); }
        updateUI();
    }
};

// --- VIDEO POKER LOGIC ---
const poker = {
    deck: [], hand: [],
    deal: function () {
        const bet = parseFloat(document.getElementById('poker-bet').value);
        if (bet > balance || bet <= 0) return;
        balance -= bet; updateUI();

        this.deck = createDeck();
        this.hand = [this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop()];
        this.render();
        document.getElementById('poker-deal-btn').classList.add('hidden');
        document.getElementById('poker-draw-btn').classList.remove('hidden');
    },
    render: function () {
        const area = document.getElementById('poker-hand');
        area.innerHTML = this.hand.map((c, i) => `<div class="card ${['♥', '♦'].includes(c.s) ? 'red' : ''}" onclick="poker.toggle(${i})" id="poker-c-${i}">${c.v}${c.s}</div>`).join('');
    },
    toggle: function (i) {
        document.getElementById(`poker-c-${i}`).classList.toggle('selected');
    },
    draw: function () {
        const indices = [];
        for (let i = 0; i < 5; i++) {
            if (!document.getElementById(`poker-c-${i}`).classList.contains('selected')) {
                this.hand[i] = this.deck.pop();
            }
        }
        this.render();
        this.evaluate();
        document.getElementById('poker-deal-btn').classList.remove('hidden');
        document.getElementById('poker-draw-btn').classList.add('hidden');
    },
    evaluate: function () {
        // Logica simplificada para protótipo v2.0
        const counts = {};
        this.hand.forEach(c => counts[c.v] = (counts[c.v] || 0) + 1);
        const max = Math.max(...Object.values(counts));
        const bet = parseFloat(document.getElementById('poker-bet').value);

        if (max === 4) { balance += bet * 25; addLog("Quadra! +" + bet * 25, "win"); }
        else if (max === 3) { balance += bet * 3; addLog("Trinca! +" + bet * 3, "win"); }
        else if (max === 2) { balance += bet * 1; addLog("Um Par! Recebe aposta de volta", "win"); }
        else { addLog("Mão alta... perdeu.", "loss"); }
        updateUI();
    }
};

// Init
document.addEventListener('DOMContentLoaded', updateUI);
window.blackjack = blackjack; window.slots = slots; window.roulette = roulette; window.poker = poker;
