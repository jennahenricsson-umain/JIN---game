export function renderGameOver(overlay, gesture, score, finalScore) {
    overlay.innerHTML = `
        <p class="scene-text scene-text--game-over">Game Over</p>
        <p class="scene-text scene-text--game-score">Score: ${finalScore}</p>
        <p class="scene-text scene-text--game-over-hint">(Thumbs Up to play again)</p>
    `;
    return gesture === 'Thumb_Up' && score >= 0.7;
}
