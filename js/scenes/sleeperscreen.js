const RANKS = ['1st', '2nd', '3rd', '4th', '5th'];
let rendered = false;
let scores = [];

export function setSleeperScores(newScores) {
    scores = newScores;
    rendered = false;
}

function buildBoard() {
    const display = [...scores].slice(0, 5);
    while (display.length < 5) display.push({ name: '', score: 0 });
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
            <img class="conversionista-logo conversionista-logo--sleeper" src="assets/Conversionista/Conversionista-Red-noBG.svg" alt="Conversionista">
            <div class="scene-text scene-text--scoreboard">
                <div class="leaderboard-column sleeper-board">
                    <div class="rectangle-wrapper green">
                        <div class="scoreboard__board-title">Leaderboard</div>
                        ${buildBoard()}
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
