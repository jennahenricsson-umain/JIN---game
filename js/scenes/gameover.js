import { subscribeToTopScores } from '../firebase.js';

let unsubscribe = null;
let rendered = false;

export function renderGameOver(overlay, gesture, gesture2, score, score2, finalScore) {
    if (!rendered) {
        rendered = true;
        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">Good Game!</p>
            <p class="scene-text scene-text--game-over-hint">(Wave to play again)</p>
            <p class="scene-text scene-text--game-score">Your score: ${finalScore}</p>
            <div class="scene-text scene-text--scoreboard" id="scoreboard">Loading scores...</div>
        `;

        unsubscribe = subscribeToTopScores((scores) => {
            const board = document.getElementById('scoreboard');
            if (board) {
                board.innerHTML = '<b>Top 5</b><br>' + scores.map((s, i) => `${i + 1}. ${s.score}`).join('<br>');
            }
        });
    }

    if (gesture === 'Open_Palm' && score >= 0.6 || gesture2 === 'Open_Palm' && score2 >= 0.6) {
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        rendered = false;
        overlay.innerHTML = '';
        return true;
    }
    return false;
}
