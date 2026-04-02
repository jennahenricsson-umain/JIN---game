export function createOnboarding(particlesEl, xMin, xMax) {
    const gestureSequence    = ['Open_Palm', 'Thumb_Up', 'ILoveYou'];
    const handednessSequence = ['Left', 'Right', 'Left'];
    const gestureLabels      = ['Open Palm', 'Thumbs Up', 'I Love You'];
    const targetY = window.innerHeight / 2;
    let step         = 0;
    let targetSprites = [];

    function getTargetX(stepIndex) {
        const centre = (xMin + xMax) / 2;
        const margin = (xMax - xMin) / 3;
        return centre - margin + stepIndex * margin;
    }

    function spawnAllTargets() {
        [0, 1, 2].forEach(i => {
            const el = document.createElement('img');
            el.src = `public/assets/${gestureSequence[i]}_JIN.png`;
            el.className = 'peace-target';
            el.style.left = getTargetX(i) + 'px';
            el.style.top = targetY + 'px';
            particlesEl.appendChild(el);
            targetSprites.push(el);
        });
    }

    function reset() {
        step = 0;
        targetSprites.forEach(s => s.remove());
        targetSprites = [];
    }

    function spawn() {
        spawnAllTargets();
    }

    // Called every frame.
    // Returns { done, step, targethandedness, label, progress }
    function tick(gesture, gesture2, confidence, confidence2, handedness, handedness2, hx1, hy1, hx2, hy2) { 
        targetSprites.forEach((sprite, i) => {
            if (i < step)       sprite.className = 'peace-target peace-target--done';
            else if (i === step) sprite.className = 'peace-target peace-target--active';
            else                sprite.className = 'peace-target peace-target--faded';
        });

                if (step >= gestureSequence.length) return { done: true, step, targethandedness: '', label: '', progress: '' };

        const hand1Match = gesture  === gestureSequence[step] && confidence  >= 0.6 && handedness  !== handednessSequence[step];
        const hand2Match = gesture2 === gestureSequence[step] && confidence2 >= 0.6 && handedness2 !== handednessSequence[step];
        const dist = hand1Match ? Math.hypot(hx1 - getTargetX(step), hy1 - targetY)
                   : hand2Match ? Math.hypot(hx2 - getTargetX(step), hy2 - targetY) : Infinity;
        if ((hand1Match || hand2Match) && dist < 100) {
                step++;
        }

        const progress = gestureSequence.map((_, i) => i < step ? '●' : '○').join(' ');
        const label = step < gestureSequence.length ? gestureLabels[step] : '';
        return { done: step >= gestureSequence.length, step, targethandedness: handednessSequence[step] || '', label, progress };
    }

    return { tick, reset, spawn };
}
