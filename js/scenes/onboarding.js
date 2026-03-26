export function createOnboarding(particlesEl, xMin, xMax) {
    const gestureSequence = ['Thumb_Up', 'ILoveYou', 'Open_Palm'];
    const gestureLabels   = ['Thumbs Up', 'I Love You', 'Open Palm'];
    const targetY = window.innerHeight / 2;
    let step         = 0;
    let targetX      = 0;
    let targetSprite = null;

    function getTargetX(stepIndex) {
        const centre = (xMin + xMax) / 2;
        const margin = (xMax - xMin) / 4;
        return centre - margin + stepIndex * margin;
    }

    function spawnTarget() {
        targetSprite?.remove();
        targetX = getTargetX(step);
        targetSprite           = document.createElement('img');
        targetSprite.src       = `public/assets/${gestureSequence[step]}_JIN.png`;
        targetSprite.className = 'peace-target';
        targetSprite.style.left = targetX + 'px';
        targetSprite.style.top  = targetY + 'px';
        particlesEl.appendChild(targetSprite);
    }

    function reset() {
        step = 0;
        targetSprite?.remove();
        targetSprite = null;
    }

    function spawn() {
        spawnTarget();
    }

    function tick(gesture, confidence, hx, hy) {
        if (step >= gestureSequence.length) return { done: true, step, label: '', progress: '' };
        if (gesture === 'Thumb_Down' && confidence >= 0.7) return { done: true, step, label: '', progress: '' };

        if (gesture === gestureSequence[step] && confidence >= 0.6) {
            const dist = Math.hypot(hx - targetX, hy - targetY);
            if (dist < 100) {
                const star = document.createElement('img');
                star.src       = 'public/assets/star.png';
                star.className = 'star';
                star.style.left = targetX + 'px';
                star.style.top  = targetY + 'px';
                star.style.setProperty('--duration', (500 + Math.random() * 1000) + 'ms');
                star.onanimationend = () => star.remove();
                particlesEl.appendChild(star);

                step++;
                if (step < gestureSequence.length) {
                    spawnTarget();
                } else {
                    targetSprite?.remove();
                    targetSprite = null;
                }
            }
        }

        const progress = gestureSequence.map((_, i) => i < step ? '●' : '○').join(' ');
        const label = step < gestureSequence.length ? gestureLabels[step] : '';
        return { done: step >= gestureSequence.length, step, label, progress };
    }

    return { tick, reset, spawn };
}
