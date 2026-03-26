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

export function renderGameOver(overlay, gesture, confidence, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;
        const combined = finalScore2 !== null ? finalScore + finalScore2 : finalScore;
        sessionScores.push({ score: combined });
        if (sessionScores.length > 5) sessionScores.shift();

        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 5);
        const scoreDisplay = finalScore2 !== null
            ? `P1: ${finalScore} &nbsp;&nbsp; P2: ${finalScore2}`
            : `Your score: ${finalScore}`;

        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">Good Game!</p>
            <p class="scene-text scene-text--game-over-hint"><img src="public/assets/open_palm_JIN.png" class="hint-icon"> Wave to play again &nbsp;|&nbsp; <img src="public/assets/thumbs_down_JIN.png" class="hint-icon"> Main menu</p>
        `;
    }

    if (gesture === 'Open_Palm' && confidence >= 0.7) {
        if (sessionScores.length >= 5) sessionScores = [];
        rendered = false;
        overlay.innerHTML = '';
        return 'onboarding';
    }
    if (gesture === 'Thumb_Down' && confidence >= 0.7) {
        rendered = false;
        overlay.innerHTML = '';
        return 'menu';
    }
    return false;
}
