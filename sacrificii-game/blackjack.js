// Clean Blackjack implementation with fleeing ad

// --- Ad popup (fleeing) ---
function showAd() {
    if (document.getElementById('ad-popup')) return;
    const ad = document.createElement('div');
    ad.id = 'ad-popup';
    ad.style.position = 'fixed';
    ad.style.left = '50%';
    ad.style.top = '50%';
    ad.style.transform = 'translate(-50%, -50%)';
    ad.style.background = '#fff';
    ad.style.color = '#c00';
    ad.style.border = '3px solid #c00';
    ad.style.borderRadius = '12px';
    ad.style.boxShadow = '0 0 24px rgba(150,0,0,0.6)';
    ad.style.padding = '18px 22px';
    ad.style.fontSize = '1em';
    ad.style.zIndex = '9999';
    ad.style.cursor = 'pointer';
    ad.innerHTML = `<div style='margin-bottom:12px;text-align:center;'>Gabriela este la 2 KM de tine!<br><b>Plătește 50 de credite ca sa te intalnesti cu ea!</b></div><div style='text-align:center;'><button id='ad-pay-btn' style='background:#c00;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;margin-right:8px;'>Plătește 50 credite</button><button id='ad-close-btn' style='background:#444;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;'>Închide</button></div>`;
    document.body.appendChild(ad);

    ad.addEventListener('mousemove', function () {
        // Move to a new random spot when cursor moves over it
        const w = ad.offsetWidth;
        const h = ad.offsetHeight;
        const x = Math.max(8, Math.random() * (window.innerWidth - w - 16));
        const y = Math.max(8, Math.random() * (window.innerHeight - h - 16));
        ad.style.left = x + 'px';
        ad.style.top = y + 'px';
        ad.style.transform = '';
    });

    document.getElementById('ad-pay-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        let credits = parseInt(localStorage.getItem('credits') || '0');
        if (credits >= 50) {
            credits -= 50;
            localStorage.setItem('credits', credits);
            if (document.getElementById('credit-count')) document.getElementById('credit-count').textContent = credits;
            ad.innerHTML = '<div style="text-align:center;color:#090;"><b>Gabriela te așteaptă! Ai plătit 50 credite.</b></div>';
            setTimeout(() => ad.remove(), 1400);
        } else {
            const err = document.createElement('div'); err.style.color = '#c00'; err.style.marginTop = '8px'; err.textContent = 'Nu ai suficiente credite!'; ad.appendChild(err);
        }
    });

    document.getElementById('ad-close-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        ad.remove();
    });
}

// --- Blackjack game state ---
let bjPlayer = [];
let bjDealer = [];
let bjDeck = [];
let bjGameActive = false;

// Ensure initial values exist in localStorage and return parsed numbers
function resetStateIfNeeded() {
    // Initialize values to 10 only if they are not already set
    if (!localStorage.getItem('credits')) localStorage.setItem('credits', '10');
    if (!localStorage.getItem('fingers')) localStorage.setItem('fingers', '10');
}

function bjNewDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
    const deck = [];
    for (const s of suits) for (const v of values) deck.push({ suit: s, value: v });
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function bjDeal() {
    const fingers = parseInt(localStorage.getItem('fingers') || '0');
    if (fingers <= 0) { bjShowLog('Nu mai ai degete!'); return; }
    bjDeck = bjNewDeck();
    bjPlayer = [bjDeck.pop(), bjDeck.pop()];
    bjDealer = [bjDeck.pop(), bjDeck.pop()];
    bjGameActive = true;
    bjUpdate();
    bjShowLog('Ai primit 2 cărți. Hit sau Stand?');
}

function bjHit() {
    if (!bjGameActive) return;
    bjPlayer.push(bjDeck.pop());
    bjUpdate();
    if (bjScore(bjPlayer) > 21) {
        bjGameActive = false;
        bjShowLog('Ai depășit 21! Ai pierdut.');
        handleBjLoss();
    }
}

function bjStand() {
    if (!bjGameActive) return;
    while (bjScore(bjDealer) < 17) bjDealer.push(bjDeck.pop());
    bjGameActive = false;
    bjUpdate();
    const playerScore = bjScore(bjPlayer);
    const dealerScore = bjScore(bjDealer);
    if (dealerScore > 21 || playerScore > dealerScore) {
        bjShowLog('Ai câștigat!');
    } else if (playerScore === dealerScore) {
        bjShowLog('Egalitate!');
    } else {
        bjShowLog('Dealerul a câștigat! Ți s-a tăiat un deget!');
        handleBjLoss();
    }
}

function handleBjLoss() {
    let fingers = parseInt(localStorage.getItem('fingers') || '0');
    fingers = Math.max(0, fingers - 1);
    localStorage.setItem('fingers', fingers);
    // update visual
    bjUpdate();
    if (typeof updateInfoCorner === 'function') {
        try { updateInfoCorner(); } catch (e) { /* ignore */ }
    }
}

function bjScore(hand) {
    let score = 0, aces = 0;
    for (const card of hand) {
        if (typeof card.value === 'number') score += card.value;
        else if (card.value === 'A') { score += 11; aces++; }
        else score += 10;
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

function bjHandHtml(hand) {
    if (!hand) return '';
    return hand.map(c => `<span style='font-size:28px;margin-right:6px;'>${c.value}${c.suit}</span>`).join(' ');
}

function bjUpdate() {
    // Fingers
    const fingers = parseInt(localStorage.getItem('fingers') || '0');
    const fingerEls = document.querySelectorAll('.finger');
    const bjFingersEl = document.getElementById('bj-fingers');
    if (bjFingersEl) {
        // render 10 slots
        let html = '';
        for (let i = 0; i < 10; i++) html += i < fingers ? `<span class="finger">☝️</span> ` : `<span class="finger">🩸</span> `;
        bjFingersEl.innerHTML = html;
    }

    // Table
    const tableEl = document.getElementById('bj-table');
    if (tableEl) {
        const dealerDisplay = bjGameActive ? `${bjDealer[0].value}${bjDealer[0].suit} ?` : `${bjScore(bjDealer)}`;
        tableEl.innerHTML = `<b>Jucător:</b> ${bjHandHtml(bjPlayer)} (${bjPlayer.length ? bjScore(bjPlayer) : 0})<br><b>Dealer:</b> ${bjGameActive ? bjHandHtml([bjDealer[0]]) + ' ?' : bjHandHtml(bjDealer) + ' ('+bjScore(bjDealer)+')'} `;
    }

    // Update small info-corner elements if present
    const fingerCountEl = document.getElementById('finger-count');
    const fingerEmojisEl = document.getElementById('finger-emojis');
    const creditCountEl = document.getElementById('credit-count');
    const credits = parseInt(localStorage.getItem('credits') || '0');
    if (fingerCountEl) fingerCountEl.textContent = fingers;
    if (fingerEmojisEl) fingerEmojisEl.textContent = '☝️'.repeat(fingers) + '🩸'.repeat(Math.max(0, 10 - fingers));
    if (creditCountEl) creditCountEl.textContent = credits;
}

function bjShowLog(msg) {
    const el = document.getElementById('bj-log');
    if (el) el.innerHTML = msg;
    // animate when finger lost
    if (msg && msg.includes('tăiat un deget')) {
        const fingers = document.querySelectorAll('.finger');
        for (let i = 0; i < fingers.length; i++) {
            fingers[i].style.transition = 'transform 0.35s, filter 0.35s';
        }
    }
}

// Ensure initial state on load
window.addEventListener('load', () => {
    // Initialize to 10 credits and 10 fingers only when not present
    if (!localStorage.getItem('credits')) localStorage.setItem('credits', '10');
    if (!localStorage.getItem('fingers')) localStorage.setItem('fingers', '10');
    // Do NOT grant free spins on load
    if (!localStorage.getItem('freeSpins')) localStorage.setItem('freeSpins', '0');
    resetStateIfNeeded();
    bjUpdate();
    // show ad once on load
    try { showAd(); } catch (e) { /* ignore */ }
});

