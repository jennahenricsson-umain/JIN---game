export function createOnboarding(particlesEl, overlayEl, xMin, xMax) {
    const gestureSequence    = ['Open_Palm', 'Thumb_Up', 'ILoveYou'];
    const handednessSequence = ['Left', 'Right', 'Left'];
    const gestureLabels      = ['Open Palm', 'Thumbs Up', 'I Love You'];
    const targetY = window.innerHeight / 2;
    let step         = 0;
    let targetSprites = [];
    let done         = false;


    function getTargetX(stepIndex) {
        const centre = (xMin + xMax) / 2;
        const margin = (xMax - xMin) / 3;
        return centre - margin + stepIndex * margin;
    }

    function spawnAllTargets() {
        [0, 1, 2].forEach(i => {
            const el = document.createElement('img');
            el.src = `public/assets/${gestureSequence[i]}_${handednessSequence[i]}_JIN.png`;
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
        overlayEl.innerHTML = '';
        particlesEl.innerHTML = '';
    }

    function spawn() {
        spawnAllTargets();
    }

    // Called every frame.
    // Returns { done, step, targethandedness, label, progress }
    function tick(gesture, gesture2, confidence, confidence2, handedness, handedness2, hx1, hy1, hx2, hy2) { 
        targetSprites.forEach((sprite, i) => {
            if (i < step)       sprite.src = `public/assets/${gestureSequence[i]}_chrome_${handednessSequence[i]}_JIN.png`, sprite.className = 'peace-target peace-target--done';
            else if (i === step) sprite.className = 'peace-target peace-target--active';
            else                sprite.className = 'peace-target peace-target--faded';
        });

        const handColors = ['violet', 'orange', 'violet'];
        const handInstructions = ['LEFT HAND IS VIOLET', 'RIGHT HAND IS ORANGE', 'LEFT HAND IS jjjj'];

        if (!overlayEl.querySelector('.scene-text--onboarding-instruction')) {
            const instrEl = document.createElement('p');
            instrEl.className = 'scene-text scene-text--onboarding-instruction';
            overlayEl.appendChild(instrEl);
        }
        if (step < gestureSequence.length) {
            const instrEl = overlayEl.querySelector('.scene-text--onboarding-instruction');
            instrEl.innerHTML = `<span class="highlight-${handColors[step]}">${handInstructions[step]}</span>`;
        }

        const pct = (step / 3) * 100;
        // renders current gesture and its conficence, might be removed later
        if (!overlayEl.querySelector('.scene-text--game-gesture')) {
            const onboarding_gesture = document.createElement('p');
            onboarding_gesture.className = 'scene-text scene-text--game-gesture';
            onboarding_gesture.textContent = `GESTURE: ${gesture} (${(confidence * 100).toFixed(0)}%)`;
            overlayEl.appendChild(onboarding_gesture);
        } 
        

        if (!overlayEl.querySelector('.progress-bar')) {
            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.innerHTML = `<div class="progress-bar__fill" style="width:0%"></div>`;
            overlayEl.appendChild(bar);
            requestAnimationFrame(() => {
                const fill = overlayEl.querySelector('.progress-bar__fill');
                if (fill) fill.style.width = pct + '%';
            });
        } else {
            const fill = overlayEl.querySelector('.progress-bar__fill');
            if (fill && fill.style.width !== pct + '%') fill.style.width = pct + '%';
        }

        if (step >= gestureSequence.length) return { done: true, step };

        const hand1Match = gesture  === gestureSequence[step] && confidence  >= 0.6 && handedness  !== handednessSequence[step];
        const hand2Match = gesture2 === gestureSequence[step] && confidence2 >= 0.6 && handedness2 !== handednessSequence[step];
        const dist = hand1Match ? Math.hypot(hx1 - getTargetX(step), hy1 - targetY)
                   : hand2Match ? Math.hypot(hx2 - getTargetX(step), hy2 - targetY) : Infinity;
        if ((hand1Match || hand2Match) && dist < 100) {
                step++;
                done = step >= gestureSequence.length;
                if (done) {
                    particlesEl.innerHTML = '';
                    overlayEl.innerHTML = '';
                }
        }

        const progress = gestureSequence.map((_, i) => i < step ? '●' : '○').join(' ');
        const label = step < gestureSequence.length ? gestureLabels[step] : '';
        return { done, step };
    }

    return { tick, reset, spawn };
}
