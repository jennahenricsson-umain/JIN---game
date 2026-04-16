import { saveScoreAndGetQR } from '../qrLogic.js';

const RANKS = ['1ST', '2ND', '3RD'];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, finalScore) {
    const latestIndex = [...scores].findIndex(s => s.score === finalScore);
    return `
        <div class="rectangle-wrapper orange">
            <div class="scoreboard__title">LEADERBOARD</div>
            ${scores.map((s, i) => `
                <div class="scoreboard__row ${i === latestIndex ? 'scoreboard__row--highlight' : ''}">
                <div class="scoreboard__left">

                    <span class="scoreboard__rank">${RANKS[i]}</span>
                    <span class="scoreboard__playertag">${s.player || ''}</span>
                </div>
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

function buildMultiLayout(score1, score2) {
    const topScore = Math.max(score1, score2);
    return `
        <div class="gameover-panel--multi">
            <div class="rectangle-wrapper violet multi-player-box">
                <div class="scoreboard__title">Score 1</div>
                <div class="multi-score-value">${score1}</div>
            </div>
            <div class="rectangle-wrapper orange multi-player-box">
                <div class="scoreboard__title">BEST TODAY</div>
                <div class="multi-score-value">${topScore}</div>
            </div>
            <div class="rectangle-wrapper violet multi-player-box">
                <div class="scoreboard__title">Score 2</div>
                <div class="multi-score-value">${score2}</div>
            </div>
        </div>
    `;
}

export function resetGameOver() {
    rendered = false;
}

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, gesture2, confidence, confidence2, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;
        const isMulti = finalScore2 !== null;
        if (isMulti) {
            sessionScores.push({ score: finalScore, player: 'P1' }, { score: finalScore2, player: 'P2' });
        } else {
            sessionScores.push({ score: finalScore });
        }
        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 6);

        overlay.innerHTML = `
            <div class="scene-text scene-text--scoreboard">
                ${isMulti
                    ? buildMultiLayout(finalScore, finalScore2)
                    : `<div class="gameover-panel">
                        ${buildScoreboard(displayScores, finalScore)}
                        ${buildQRColumn(finalScore, 'qr-img-wrap-p1')}
                       </div>`
                }
            </div>
            ${window._savedIconsHTML || ''}
            ${window._savedScoreHTML || ''}
        `;

        if (!isMulti) {
            saveScoreAndGetQR(finalScore, 1).then(url => {
                const wrap = document.getElementById('qr-img-wrap-p1');
                if (wrap && url) wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
            });
        }
    }

    if ((gesture === 'Open_Palm' && confidence >= 0.7) || (gesture2 === 'Open_Palm' && confidence2 >= 0.7)) {
        if (sessionScores.length >= 6) sessionScores = [];
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
