let onboardingState = 0;
let targetX = 0, targetY = window.innerHeight / 2 ;
let targetGesture = '';
let targetHandedness = '';
let targetImage = '';
let margin = 250;

export function spawnFixedTarget(index) {
    const gestures = ['Open_Palm', 'Thumb_Up', 'ILoveYou'];
    const handednesses = ['Right', 'Left', 'Right'];
    targetX = window.innerWidth/2 - margin + index * margin;
    targetHandedness = handednesses[index];
    targetGesture = gestures[index];
    targetImage = `public/assets/${targetGesture}_JIN.png`;

}

export function resetOnboarding() {
    onboardingState = 0;
    spawnFixedTarget(0);
}

export function renderOnboarding(overlay, particles, gesture, gesture2, confidence, confidence2, handX, handY, handX2, handY2, handedness, handedness2) {

    if (onboardingState === 3 || (gesture === 'Thumb_Down' && confidence >= 0.7) || (gesture2 === 'Thumb_Down' && confidence2 >= 0.7)) {
        return { shouldEnd: true };
    }

    overlay.innerHTML = `
        <img src="${targetImage}" class="peace-target" style="left: ${targetX}px; top: ${targetY}px;" alt="">
        <p class="scene-text scene-text--game-gesture">Gesture: ${gesture} (${(confidence * 100).toFixed(0)}%) Gesture: ${gesture2} (${(confidence2 * 100).toFixed(0)}%)</p>
        <p class="scene-text scene-text--onboarding">Learn to play<br>${3 - onboardingState} USE HAND: ${targetHandedness}</p>
    `;

    if ((gesture === targetGesture && confidence >= 0.6) || (gesture2 === targetGesture && confidence2 >= 0.6)) {
        const dist = Math.hypot(handX - targetX, handY - targetY);
        const dist2 = Math.hypot(handX2 - targetX, handY2 - targetY);
        if ((dist < 100 && handedness !== targetHandedness) || (dist2 < 100 && handedness2 !== targetHandedness)) {
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

