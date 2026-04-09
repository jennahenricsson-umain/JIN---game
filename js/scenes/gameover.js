const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, finalScore) {
    const latestIndex = [...scores].findIndex(s => s.score === finalScore);
    return `
        <div class="rectangle-wrapper orange">
            <div class="scoreboard__title">SCOREBOARD</div>
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

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, gesture2, confidence, confidence2, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;
        sessionScores.push({ score: finalScore });

        const displayScores = [...sessionScores].sort((a, b) => b.score - a.score).slice(0, 5);

        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">GOOD GAME</p>
            <p class="scene-text scene-text--game-over-hint"><img src="public/assets/open_palm_right_JIN.png" class="hint-icon"> Wave to play again with same settings &nbsp;|&nbsp; <img src="public/assets/thumbs_down_left_JIN.png" class="hint-icon"> Main menu</p>
            <div class="scene-text scene-text--scoreboard" id="scoreboard">${buildScoreboard(displayScores, finalScore)}</div>
            ${window._savedIconsHTML || ''}
            ${window._savedScoreHTML || ''}
        `;
    }

    if ((gesture === 'Open_Palm' && confidence >= 0.7)||(gesture2 === 'Open_Palm' && confidence2 >= 0.7)) {
        if (sessionScores.length >= 5) sessionScores = [];
        rendered = false;
        overlay.innerHTML = '';
        return 'play_again';
    } else if ((gesture === 'Thumb_Down' && confidence >= 0.7)||(gesture2 === 'Thumb_Down' && confidence2 >= 0.7)) {
        rendered = false;
        overlay.innerHTML = '';
        return 'menu';
    }
    return false;
}
