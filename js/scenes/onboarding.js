export function createOnboarding(particlesEl, xMin, xMax) {
    const gestureSequence    = ['Open_Palm', 'Thumb_Up', 'ILoveYou'];
    const handednessSequence = ['Left', 'Right', 'Left'];
    const gestureLabels      = ['Open Palm', 'Thumbs Up', 'I Love You'];
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

    // Called every frame.
    // Returns { done, step, targethandedness, label, progress }
    function tick(gesture, gesture2, confidence, confidence2, handedness, handedness2, hx1, hy1, hx2, hy2) {
        if (step >= gestureSequence.length) return { done: true, step, targethandedness: '', label: '', progress: '' };
        if ((gesture === 'Thumb_Down' && confidence >= 0.7)||(gesture2 === 'Thumb_Down' && confidence2 >= 0.7)) return { done: true, step, targethandedness: '', label: '', progress: '' };

        const hand1Match = gesture  === gestureSequence[step] && confidence  >= 0.6 && handedness  !== handednessSequence[step];
        const hand2Match = gesture2 === gestureSequence[step] && confidence2 >= 0.6 && handedness2 !== handednessSequence[step];
        const dist = hand1Match ? Math.hypot(hx1 - targetX, hy1 - targetY)
                   : hand2Match ? Math.hypot(hx2 - targetX, hy2 - targetY) : Infinity;
        if ((hand1Match || hand2Match) && dist < 100) {
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

        const progress = gestureSequence.map((_, i) => i < step ? '●' : '○').join(' ');
        const label = step < gestureSequence.length ? gestureLabels[step] : '';
        return { done: step >= gestureSequence.length, step, targethandedness: handednessSequence[step] || '', label, progress };
    }

    return { tick, reset, spawn };
}
