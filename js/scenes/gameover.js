import { saveScoreAndGetQR } from '../qrLogic.js';
import { getTopScores } from '../firebase.js';

const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let sessionScores = [];

async function refreshScoreboard(finalScore) {
    const scores = await getTopScores(5);
    // mark the current session's score
    let marked = false;
    scores.forEach(s => {
        if (!marked && s.score === finalScore) { s.current = true; marked = true; }
    });
    const el = document.getElementById('scoreboard-inner');
    if (el) el.innerHTML = buildScoreboard(scores);
}

function buildScoreboard(scores) {
    return `
        <div class="rectangle-wrapper orange">
            <div class="scoreboard__title">SCOREBOARD</div>
            ${scores.map(s => `
                <div class="scoreboard__row ${s.current ? 'scoreboard__row--highlight' : ''}">
                    <span class="scoreboard__rank">${s.username || 'Guest'}</span>
                    <span class="scoreboard__score">${s.score}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, gesture2, confidence, confidence2, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;

        overlay.innerHTML = `
            <div class="scene-text scene-text--scoreboard">
                <div class="gameover-panel">
                    <div id="scoreboard-inner">${buildScoreboard([])}</div>
                    <div class="rectangle-wrapper violet qr-panel">
                        <div id="qr-img-wrap" class="qr-img-wrap">Loading…</div>
                        <div class="scoreboard__playagain">SCAN TO JOIN LEADERBOARD</div>
                    </div>
                </div>
            </div>
            ${window._savedIconsHTML || ''}
            ${window._savedScoreHTML || ''}
        `;

        refreshScoreboard(finalScore);

        saveScoreAndGetQR(finalScore).then(url => {
            const wrap = document.getElementById('qr-img-wrap');
            if (wrap) wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
        });
    }

    if ((gesture === 'Open_Palm' && confidence >= 0.7) || (gesture2 === 'Open_Palm' && confidence2 >= 0.7)) {
        if (sessionScores.length >= 5) sessionScores = [];
        rendered = false;
        overlay.innerHTML = '';
        return 'play_again';
    } else if ((gesture === 'Thumb_Down' && confidence >= 0.7) || (gesture2 === 'Thumb_Down' && confidence2 >= 0.7)) {
        rendered = false;
        overlay.innerHTML = '';
        return 'menu';
    }
    return false;
}
