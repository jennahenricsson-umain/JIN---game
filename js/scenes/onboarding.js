// Creates a self-contained onboarding instance.
//
//   particlesEl — the div this instance appends target sprites and stars into
//   xMin / xMax — horizontal bounds in screen pixels; the three fixed targets
//                 are spread evenly across this range, matching the original
//                 spacing logic scaled to whatever area is provided
//
// The factory has no knowledge of game mode.
export function createOnboarding(particlesEl, xMin, xMax) {
    const gestureSequence = ['Open_Palm', 'Thumb_Up', 'ILoveYou'];
    const targetY = window.innerHeight / 2;
    let step         = 0;
    let targetX      = 0;
    let targetSprite = null;

    // Spread three targets across [xMin, xMax] with the same relative spacing
    // as the original (centre ± margin), scaled to fit the available width.
    function getTargetX(stepIndex) {
        const centre = (xMin + xMax) / 2;
        const margin = (xMax - xMin) / 4; // keeps targets comfortably within bounds
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
        spawnTarget();
    }

    // Called every frame.
    // Returns { done, step } — main.js uses step to render progress text
    // and shows a "waiting" message once done is true.
    function tick(gesture, confidence, hx, hy) {
        if (step >= gestureSequence.length) return { done: true, step };
        if (gesture === 'Thumb_Down' && confidence >= 0.7) return { done: true, step };

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

        return { done: step >= gestureSequence.length, step };
    }

    return { tick, reset };
}
