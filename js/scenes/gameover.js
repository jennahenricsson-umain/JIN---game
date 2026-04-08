import { saveScoreAndGetQR } from '../qrLogic.js';

const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, finalScore) {
    const latestIndex = [...scores].findIndex(s => s.score === finalScore);
    return `
        <div class="scoreboard">
            <div class="scoreboard__title">TOP SCORES</div>
            <div class="scoreboard__divider"></div>
            ${scores.map((s, i) => `
                <div class="scoreboard__row ${i === latestIndex ? 'scoreboard__row--highlight' : ''}">
                    <span class="scoreboard__rank">${RANKS[i]}</span>
                    <span class="scoreboard__dots"></span>
                    <span class="scoreboard__score">${s.score}</span>
                </div>
            `).join('')}
            <div class="scoreboard__divider"></div>
        </div>
    `;
}

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, gesture2, confidence, confidence2, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;
        sessionScores.push({ score: finalScore });

        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 5);

        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">Good Game!</p>
            <p class="scene-text scene-text--game-over-hint"><img src="public/assets/open_palm_JIN.png" class="hint-icon"> Wave to play again &nbsp;|&nbsp; <img src="public/assets/thumbs_down_JIN.png" class="hint-icon"> Main menu</p>
            <div class="gameover-panel">
                <div class="scene-text--scoreboard">${buildScoreboard(displayScores, finalScore)}</div>
                <div class="qr-prompt">
                    <p class="qr-prompt__label">Save your score</p>
                    <div class="qr-prompt__img-wrap" id="qr-img-wrap">Loading…</div>
                    <p class="qr-prompt__hint">Scan to submit your name</p>
                </div>
            </div>
            ${window._savedIconsHTML || ''}
            ${window._savedScoreHTML || ''}
        `;

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
