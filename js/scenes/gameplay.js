let targetX = 0, targetY = 0;
let lastMatchTime = 0;
let stars = [];
let starId = 0;

export function spawnTarget() {
    const margin = 120;
    targetX = margin + Math.random() * (window.innerWidth - 2 * margin);
    targetY = margin + Math.random() * (window.innerHeight - 2 * margin);
}

export function renderGame(overlay, gesture, score, gameStartTime, currentScore, handX, handY) {
    const elapsed = (Date.now() - gameStartTime) / 1000;
    const timeLeft = Math.max(0, (10 - currentScore) - elapsed);

    if (timeLeft === 0 || (gesture === 'Thumb_Down' && score >= 0.7)) {
        return { shouldEnd: true, newScore: currentScore };
    }

    overlay.innerHTML = `
        <img src="public/assets/victory_JIN.png" class="peace-target" style="left: ${targetX}px; top: ${targetY}px;" alt="">
        <p class="scene-text scene-text--game-gesture">Gesture: ${gesture} (${(score * 100).toFixed(0)}%)</p>
        <p class="scene-text scene-text--game-score">Score: ${currentScore}</p>
        <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
    `;

    stars.forEach(star => {
        const img = document.createElement('img');
        img.src = 'public/assets/star.png';
        img.className = 'star';
        img.style.left = star.x + 'px';
        img.style.top = star.y + 'px';
        img.style.setProperty('--duration', star.duration + 'ms');
        img.onanimationend = () => stars = stars.filter(s => s.id !== star.id);
        overlay.appendChild(img);
    });

    let newScore = currentScore;
    if (gesture === 'Victory' && score >= 0.7) {
        const dist = Math.hypot(handX - targetX, handY - targetY);
        if (dist < 100 && Date.now() - lastMatchTime > 500) {
            newScore++;
            lastMatchTime = Date.now();
            stars.push({ id: ++starId, x: targetX, y: targetY, duration: 500 + Math.random() * 1000 });
            spawnTarget();
        }
    }

    return { shouldEnd: false, newScore };
}
