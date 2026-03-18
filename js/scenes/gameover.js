const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, latestIndex) {
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

export function renderGameOver(overlay, gesture, score, finalScore) {
    if (!rendered) {
        rendered = true;
        sessionScores.push({ score: finalScore });

        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 5);
        const latestIndex = displayScores.findIndex(s => s === sessionScores[sessionScores.length - 1]);

        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">Good Game!</p>
            <p class="scene-text scene-text--game-over-hint">👍 Thumbs Up to play again</p>
            <p class="scene-text scene-text--game-score">Your score: ${finalScore}</p>
            <div class="scene-text scene-text--scoreboard" id="scoreboard">${buildScoreboard(displayScores, latestIndex)}</div>
        `;
    }

    if (gesture === 'Thumb_Up' && score >= 0.7) {
        if (sessionScores.length >= 5) sessionScores = [];
        rendered = false;
        overlay.innerHTML = '';
        return true;
    }
    return false;
}
