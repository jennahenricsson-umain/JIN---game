const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH'];
let rendered = false;
let scores = [];

export function setSleeperScores(newScores) {
    scores = newScores;
    rendered = false;
}

function buildBoard() {
    if (scores.length === 0) {
        return `<div class="scoreboard__title">LOADING…</div>`;
    }
    return scores.map((s, i) => `
        <div class="scoreboard__row">
            <div class="scoreboard__left">
                <span class="scoreboard__rank">${RANKS[i]}</span>
                <span class="scoreboard__playertag">${s.name}</span>
            </div>
            <span class="scoreboard__score">${s.score}</span>
        </div>
    `).join('');
}

export function renderSleeperScreen(overlay) {
    if (!rendered) {
        rendered = true;
        overlay.innerHTML = `
            <img src="public/assets/umain_logotype_black.png" class="sleeper-logo" alt="Umain">
            <div class="scene-text scene-text--scoreboard">
                <div class="rectangle-wrapper orange sleeper-board">
                    <div class="scoreboard__title">LEADERBOARD</div>
                    ${buildBoard()}
                </div>
            </div>
        `;
    }
}

export function resetSleeper() {
    rendered = false;
    scores = [];
}
