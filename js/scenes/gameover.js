import { saveScoreAndGetQR } from '../qrLogic.js';

const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, finalScore) {
    const latestIndex = [...scores].findIndex(s => s.score === finalScore);
    return `
        <div class="rectangle-wrapper orange">
            <div class="scoreboard__title">LEADERBOARD</div>
            ${scores.map((s, i) => `
                <div class="scoreboard__row ${i === latestIndex ? 'scoreboard__row--highlight' : ''}">
                    <span class="scoreboard__rank">${RANKS[i]}</span>
                    <span class="scoreboard__score">${s.score}</span>
                </div>
            `).join('')}
            <div class="scoreboard__playagain">WAVE TO PLAY AGAIN</div>
        </div>
    `;
}

function buildQRColumn(score, wrapperId) {
    return `
        <div class="qr-column">
            <div class="rectangle-wrapper violet qr-score-box">
                <div class="scoreboard__title">YOUR SCORE: ${score}</div>
            </div>
            <div class="rectangle-wrapper orange qr-panel">
                <div id="${wrapperId}" class="qr-img-wrap">Loading…</div>
                <div class="qr-label">SCAN TO JOIN THE LEADERBOARD</div>
            </div>
        </div>
    `;
}

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, gesture2, confidence, confidence2, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;
        sessionScores.push({ score: finalScore });

        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 5);
        const isMulti = finalScore2 !== null;

        overlay.innerHTML = `
            <div class="scene-text scene-text--scoreboard">
                <div class="gameover-panel">
                    ${isMulti ? buildQRColumn(finalScore, 'qr-img-wrap-p1') : ''}
                    ${buildScoreboard(displayScores, finalScore)}
                    ${isMulti ? buildQRColumn(finalScore2, 'qr-img-wrap-p2') : buildQRColumn(finalScore, 'qr-img-wrap-p1')}
                </div>
            </div>
            ${window._savedIconsHTML || ''}
            ${window._savedScoreHTML || ''}
        `;

        saveScoreAndGetQR(finalScore, 1).then(url => {
            const wrap = document.getElementById('qr-img-wrap-p1');
            if (wrap && url) wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
        });
        if (isMulti) {
            saveScoreAndGetQR(finalScore2, 2).then(url => {
                const wrap = document.getElementById('qr-img-wrap-p2');
                if (wrap && url) wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
            });
        }
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
