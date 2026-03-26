import { subscribeToTopScores } from '../firebase.js';

let unsubscribe = null;
let rendered    = false;

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(overlay, gesture, confidence, finalScore, finalScore2 = null) {
    if (!rendered) {
        rendered = true;

        const scoreDisplay = finalScore2 !== null
            ? `P1: ${finalScore} &nbsp;&nbsp; P2: ${finalScore2}`
            : `Your score: ${finalScore}`;

        overlay.innerHTML = `
            <p class="scene-text scene-text--game-over">Good Game!</p>
            <p class="scene-text scene-text--game-over-hint">(Wave to play again, Thumbs down to main menu)</p>
            <p class="scene-text scene-text--game-score">${scoreDisplay}</p>
            <div class="scene-text scene-text--scoreboard" id="scoreboard">Loading scores...</div>
        `;

        unsubscribe = subscribeToTopScores((scores) => {
            const board = document.getElementById('scoreboard');
            if (board) {
                board.innerHTML = '<b>Top 5</b><br>' + scores.map((s, i) => `${i + 1}. ${s.score}`).join('<br>');
            }
        });
    }

    if (gesture === 'Open_Palm' && confidence >= 0.7) {
        rendered = false;
        overlay.innerHTML = '';
        return 'onboarding';
    }
    else if (gesture === 'Thumb_Down' && confidence >= 0.7) {
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        rendered = false;
        overlay.innerHTML = '';
        return 'menu';
    }
    return false;
}
