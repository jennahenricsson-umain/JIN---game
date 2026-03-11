let targetX = 0, targetY = 0;
let targetGesture = '';
let targetImage = '';
let lastMatchTime = 0;
let gameStartTime = 0;
const timeLimit = 15; // seconds

export function resetGame() {
    lastMatchTime = 0;
    gameStartTime = Date.now();
}

export function spawnTarget() {
    const margin = 120;
    targetX = margin + Math.random() * (window.innerWidth - 2 * margin);
    targetY = margin + Math.random() * (window.innerHeight - 2 * margin);
    targetGesture = ['Victory', 'Thumb_Up', 'Pointing_Up', 'ILoveYou', 'Open_Palm', 'Closed_Fist'][Math.floor(Math.random() * 6)];
    targetImage = `public/assets/${targetGesture}_JIN.png`;
}

export function renderGame(overlay, particles, gesture, confidence, currentScore, handX, handY) {
    const elapsed = (Date.now() - gameStartTime) / 1000;
    const timeLeft = Math.max(0, (timeLimit - currentScore) - elapsed);

    if (timeLeft === 0 || (gesture === 'Thumb_Down' && confidence >= 0.7)) {
        return { shouldEnd: true, newScore: currentScore };
    }

    overlay.innerHTML = `
        <img src="${targetImage}" class="peace-target" style="left: ${targetX}px; top: ${targetY}px;" alt="">
        <p class="scene-text scene-text--game-gesture">Gesture: ${gesture} (${(confidence * 100).toFixed(0)}%)</p>
        <p class="scene-text scene-text--game-score">Score: ${currentScore}</p>
        <p class="scene-text scene-text--game-over">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
        <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
    `;

    let newScore = currentScore;
    if (gesture === targetGesture && confidence >= 0.7) {
        const dist = Math.hypot(handX - targetX, handY - targetY);
        if (dist < 100 && Date.now() - lastMatchTime > 500) {
            newScore++;
            lastMatchTime = Date.now();
            gameStartTime = Date.now(); // reset timer on score
            const img = document.createElement('img');
            img.src = 'public/assets/star.png';
            img.className = 'star';
            img.style.left = targetX + 'px';
            img.style.top = targetY + 'px';
            img.style.setProperty('--duration', (500 + Math.random() * 1000) + 'ms');
            img.onanimationend = () => img.remove();
            particles.appendChild(img);
            spawnTarget();
        }
    }

    return { shouldEnd: false, newScore };
}
