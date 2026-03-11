let onboardingState = 0;
let targetX = 0, targetY = window.innerHeight / 2 ;
let targetGesture = '';
let targetImage = '';
let margin = 400;

export function spawnFixedTarget(index) {
    targetX = window.innerWidth/2 + (index - 1) * margin;
    targetGesture = ['Open_Palm', 'Thumb_Up', 'ILoveYou'][index];
    targetImage = `public/assets/${targetGesture}_JIN.png`;
}

export function renderOnboarding(overlay, particles, gesture, confidence, handX, handY) {

    if (onboardingState === 3 || (gesture === 'Thumb_Down' && confidence >= 0.7)) {
        return { shouldEnd: true };
    }

    overlay.innerHTML = `
        <img src="${targetImage}" class="peace-target" style="left: ${targetX}px; top: ${targetY}px;" alt="">
        <p class="scene-text scene-text--game-gesture">Gesture: ${gesture} (${(confidence * 100).toFixed(0)}%)</p>
    `;

    if (gesture === targetGesture && confidence >= 0.6) {
        const dist = Math.hypot(handX - targetX, handY - targetY);
        if (dist < 100) {
            const img = document.createElement('img');
            img.src = 'public/assets/star.png';
            img.className = 'star';
            img.style.left = targetX + 'px';
            img.style.top = targetY + 'px';
            img.style.setProperty('--duration', (500 + Math.random() * 1000) + 'ms');
            img.onanimationend = () => img.remove();
            particles.appendChild(img);
            onboardingState++;
            spawnFixedTarget(onboardingState);
        }
    }

    return { shouldEnd: false };
}

