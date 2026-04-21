const RANKS = ['1ST', '2ND', '3RD'];
let rendered = false;
let scores = [];

export function setSleeperScores(newScores) {
    scores = newScores;
    rendered = false;
}

function buildBoard() {
    const display = [...scores];
    while (display.length < 3) display.push({ name: '', score: 0 });
    return display.map((s, i) => `
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
                <div class="leaderboard-column">
                    <div class="rectangle-wrapper orange">
                        <div class="scoreboard__board-title">LEADERBOARD</div>
                        ${buildBoard()}
                    </div>
                    <div class="rectangle-wrapper orange wave-box">
                        WAVE TO PLAY AGAIN
                    </div>
                </div>
            </div>
        `;
    }
}

export function resetSleeper() {
    rendered = false;
    scores = [];
}
