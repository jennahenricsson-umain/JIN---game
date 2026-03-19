let targetX = 0, targetY = 0;
let targetGesture = '';
let targetHandedness = '';
let targetImage = '';
let lastMatchTime = 0;
let gameStartTime = 0;
let targetSprite = null;
const timeLimit = 15; // seconds

export function resetGame() {
    lastMatchTime = 0;
    gameStartTime = Date.now();
}

export function enterGame(particles) {
    const startText = document.createElement('span');
    startText.className = 'scene-text scene-text--game-start';
    startText.textContent = 'START';
    startText.style.setProperty('--duration', '1000ms');
    startText.onanimationend = () => startText.remove();
    particles.appendChild(startText);
    resetGame();
    spawnTarget(particles);
}

export function spawnTarget(particles) {
    const margin = 120;
    targetX = margin + Math.random() * (window.innerWidth - 2 * margin);
    targetY = margin + Math.random() * (window.innerHeight - 2 * margin);
    targetGesture = ['Victory', 'Pointing_Up', 'ILoveYou', 'Thumb_Up', 'Closed_Fist'][Math.floor(Math.random() * 5)];
    targetHandedness = Math.random() < 0.5 ? 'Right' : 'Left';
    targetImage = `public/assets/${targetGesture}_JIN.png`;
    targetSprite = document.createElement('img');
    targetSprite.src = targetImage;
    targetSprite.className = 'peace-target';
    targetSprite.style.left = targetX + 'px';
    targetSprite.style.top = targetY + 'px';
    particles.appendChild(targetSprite);
}

export function renderGame(overlay, particles, gesture, gesture2, confidence, confidence2, currentScore, handX, handY, handX2, handY2, handedness, handedness2) {
    const elapsed = (Date.now() - gameStartTime) / 1000;
    const timeLeft = Math.max(0, (timeLimit - currentScore) - elapsed);

    if (timeLeft === 0 || (gesture === 'Thumb_Down' && confidence >= 0.7) || (gesture2 === 'Thumb_Down' && confidence2 >= 0.7)) {
        return { shouldEnd: true, newScore: currentScore };
    }

    overlay.innerHTML = `
        <p class="scene-text scene-text--game-score">Score: ${currentScore}</p>
        <p class="scene-text scene-text--game-time-countdown">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
        <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s and HAND: ${targetHandedness}</p>
    `;

    let newScore = currentScore;
    if ((gesture === targetGesture && confidence >= 0.7) || (gesture2 === targetGesture && confidence2 >= 0.7)) {
        const dist = Math.hypot(handX - targetX, handY - targetY);
        const dist2 = Math.hypot(handX2 - targetX, handY2 - targetY);
        if (((dist < 100 && handedness !== targetHandedness) || (dist2 < 100 && handedness2 === targetHandedness)) && Date.now() - lastMatchTime > 500) {
            targetSprite?.remove();
            newScore++;
            lastMatchTime = Date.now();
            gameStartTime = Date.now();
            const img = document.createElement('img');
            img.src = 'public/assets/star.png';
            img.className = 'star';
            img.style.left = targetX + 'px';
            img.style.top = targetY + 'px';
            img.style.setProperty('--duration', (500 + Math.random() * 1000) + 'ms');
            img.onanimationend = () => img.remove();
            particles.appendChild(img);
            spawnTarget(particles);
        }
    }

    return { shouldEnd: false, newScore };
}
