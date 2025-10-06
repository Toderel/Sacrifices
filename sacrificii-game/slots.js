// Slot machine logic



const symbols = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
let credits = parseInt(localStorage.getItem('credits') || '10');
let fingers = parseInt(localStorage.getItem('fingers') || '10');
let freeSpins = 0;
if (localStorage.getItem('freeSpins') !== null) {
    freeSpins = parseInt(localStorage.getItem('freeSpins'));
} else {
    localStorage.setItem('freeSpins', '0');
}
let lastWin = 0;
let doubleChain = 0;
let doubleHistory = [];
let bet = 1;


function animateSlots(gridArr, callback) {
    const slotsDiv = document.getElementById('slots');
    slotsDiv.innerHTML = '';
    gridArr.forEach((row, rIdx) => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        row.forEach((symbol, i) => {
            const slot = document.createElement('span');
            slot.className = 'slot-symbol';
            slot.innerText = symbol;
            slot.style.opacity = '0';
            slot.style.transform = 'scale(0.5)';
            rowDiv.appendChild(slot);
            setTimeout(() => {
                slot.style.transition = 'all 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
                slot.style.opacity = '1';
                slot.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    slot.style.transform = 'scale(1)';
                }, 200);
                if (rIdx === gridArr.length - 1 && i === row.length - 1 && callback) callback();
            }, 120 * (rIdx * row.length + i));
        });
        slotsDiv.appendChild(rowDiv);
    });
}



function spinSlots() {
    bet = Math.max(1, parseInt(document.getElementById('bet').value) || 1);
    const special = document.getElementById('specialBet').value;
    // Rotirile gratuite sunt acordate doar dacă pactul diavolului a fost acceptat (freeSpins > 0)
    freeSpins = parseInt(localStorage.getItem('freeSpins') || '0');
    let isFreeSpin = false;
    if (freeSpins > 0) {
        freeSpins--;
        localStorage.setItem('freeSpins', freeSpins);
        showLog(`Rotire gratuită! Mai ai ${freeSpins} rotiri gratuite.`);
        isFreeSpin = true;
    } else {
        if (credits < bet) {
            showLog("Nu ai suficiente credite pentru această miză!");
            return;
        }
        credits -= bet;
        localStorage.setItem('credits', credits);
    }
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('doubleBtn').style.display = 'none';
    // 3 linii x 5 simboluri
    const grid = [];
    for (let r = 0; r < 3; r++) {
        const row = [];
        for (let c = 0; c < 5; c++) {
            row.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        grid.push(row);
    }
    animateSlots(grid, () => {
        let win = false;
        let winAmount = 0;
        // verifică linii orizontale pentru 5 la fel (jackpot) sau 3 la fel (mic win)
        grid.forEach(row => {
            const counts = {};
            row.forEach(s => counts[s] = (counts[s] || 0) + 1);
            for (const s in counts) {
                if (counts[s] === 5) {
                    winAmount += bet * 10;
                } else if (counts[s] === 3) {
                    winAmount += bet * 3;
                }
            }
        });
        let specialMsg = '';
        if (special === 'copii') specialMsg = winAmount > 0 ? '<br><b>Ți-ai salvat copiii!</b>' : '<br><b>Ai pierdut copiii!</b>';
        if (special === 'masina') {
            if (winAmount > 0) {
                const suma = Math.floor(Math.random() * 9000) + 1000;
                specialMsg = `<br><b>Ți-ai salvat mașina și ai câștigat ${suma} lei!</b>`;
            } else {
                specialMsg = '<br><b>Ai pierdut mașina!</b>';
            }
        }
        if (special === 'casa') specialMsg = winAmount > 0 ? '<br><b>Ți-ai salvat casa!</b>' : '<br><b>Ai pierdut casa!</b>';
        if (winAmount > 0) {
            credits += winAmount;
            localStorage.setItem('credits', credits);
            lastWin = winAmount;
            win = true;
            if (isFreeSpin) {
                showLog(`Ai câștigat ${winAmount} credite din rotire gratuită!${specialMsg}`);
            } else {
                showLog(`Ai câștigat ${winAmount} credite!${specialMsg}`);
            }
        } else {
            lastWin = 0;
            showLog(`Ai pierdut! Mai ai ${credits} credite.${specialMsg}`);
        }
        updateCredits();
        document.getElementById('spinBtn').disabled = false;
        if (win) {
            document.getElementById('doubleBtn').style.display = 'inline-block';
        }
    });
}




function showDoubleOptions() {
    document.getElementById('double-options').style.display = 'flex';
    document.getElementById('doubleBtn').style.display = 'none';
    document.getElementById('spinBtn').disabled = true;
    doubleChain = 1;
    doubleHistory = [];
    updateHistory();
}





function doubleColor(color) {
    if (lastWin > 0) {
        // 0 = negru, 1 = roșu
        const result = Math.floor(Math.random() * 2) ? 'red' : 'black';
        let cardHtml = '';
        if (result === 'red') {
            cardHtml = '<span style="font-size:40px;color:#c00;">♥️</span>';
        } else {
            cardHtml = '<span style="font-size:40px;color:#222;">♠️</span>';
        }
        if (color === result) {
            doubleChain++;
            lastWin *= 2;
            credits += lastWin;
            doubleHistory.push(`Runda ${doubleChain}: Succes (${color.toUpperCase()} / ${result.toUpperCase()}) +${lastWin} credite`);
            showLog(`Ai ales ${color.toUpperCase()} și a ieșit ${result.toUpperCase()}! Dublaj reușit: +${lastWin} credite!<br>${cardHtml}<br><button onclick='showDoubleOptions()' style='margin-top:12px;font-size:18px;padding:8px 24px;border-radius:8px;background:#0fa;color:#fff;'>Continuă dublajul</button> <button onclick='endDoubleChain()' style='margin-top:12px;font-size:18px;padding:8px 24px;border-radius:8px;background:#444;color:#fff;'>Oprește dublajul</button>`);
            updateCredits();
            document.getElementById('double-options').style.display = 'none';
            updateHistory();
        } else {
            doubleHistory.push(`Runda ${doubleChain}: Eșec (${color.toUpperCase()} / ${result.toUpperCase()}) -${bet} credite`);
            showLog(`Ai ales ${color.toUpperCase()} dar a ieșit ${result.toUpperCase()}! Dublaj eșuat: -${bet} credite!<br>${cardHtml}`);
            updateCredits();
            document.getElementById('double-options').style.display = 'none';
            document.getElementById('spinBtn').disabled = false;
            lastWin = 0;
            doubleChain = 0;
            updateHistory();
        }
    }
}


function endDoubleChain() {
    document.getElementById('spinBtn').disabled = false;
    lastWin = 0;
    doubleChain = 0;
    showLog(`Dublajul s-a oprit. Poți juca din nou.`);
    updateHistory();
}

function updateHistory() {
    const historyDiv = document.getElementById('history');
    if (doubleHistory.length === 0) {
        historyDiv.innerHTML = '<em>Nu există istoric de dublaje.</em>';
    } else {
        historyDiv.innerHTML = '<strong>Istoric dublaje:</strong><br>' + doubleHistory.map(h => `<div>${h}</div>`).join('');
    }
}

function updateCredits() {
            document.getElementById('credits').innerText = `Credite: ${credits}`;
            localStorage.setItem('credits', credits);
            // Actualizează și info-corner dacă există
            if (document.getElementById('credit-count')) {
                document.getElementById('credit-count').textContent = parseInt(localStorage.getItem('credits') || credits);
            }
            if (document.getElementById('finger-count')) {
                document.getElementById('finger-count').textContent = parseInt(localStorage.getItem('fingers') || fingers);
                document.getElementById('finger-emojis').textContent = '☝️'.repeat(parseInt(localStorage.getItem('fingers') || fingers));
            }
}


function showLog(msg) {
    document.getElementById('log').innerHTML = msg;
}



function updateLei() {
    const betInput = document.getElementById('bet');
    const leiDiv = document.getElementById('leiValue');
    let val = Math.max(1, parseInt(betInput.value) || 1);
    leiDiv.innerText = `Valoare pariu: ${val * 10} lei`;
}

window.onload = () => {
    localStorage.setItem('credits', credits);
    localStorage.setItem('fingers', fingers);
    updateCredits();
    animateSlots([
        ["🎰", "🎰", "🎰", "🎰", "🎰"],
        ["🎰", "🎰", "🎰", "🎰", "🎰"],
        ["🎰", "🎰", "🎰", "🎰", "🎰"]
    ]);
    showLog('Alege miza și apasă pe SPIN pentru a juca!');
    updateLei();
    document.getElementById('bet').addEventListener('input', updateLei);
};
