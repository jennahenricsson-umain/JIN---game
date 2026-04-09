// Creates a self-contained game instance.
//
//   particlesEl  — the div this instance appends targets and stars into
//   onScore      — callback fired on each successful match; main.js uses this
//                  to extend the shared timer
//   xMin / xMax  — horizontal spawn bounds in screen pixels; main.js passes
//                  either the full screen or one half depending on the mode
//
// The factory has no knowledge of game mode — it just runs within its bounds.
export function createGame(particlesEl, overlayEl, onScore, xMin, xMax) {
    const margin = 120;
    const confidenceThreshold = 0.6;
    let targetX       = 0;
    let targetY       = 0;
    let targetGesture = '';
    let targetSprite  = null;
    let targethandedness = '';
    let lastMatchTime = 0;
    let score         = 0;

    const gestures = ['Victory', 'Thumb_Up', 'Pointing_Up', 'ILoveYou', 'Closed_Fist'];
    let matchedGestures = [];

    function spawnTarget() {
        targetSprite?.remove();
        targetX       = xMin + Math.random() * (xMax - xMin);
        targetY       = margin + Math.random() * (window.innerHeight - 2 * margin);
        targetGesture = gestures[Math.floor(Math.random() * gestures.length)];
        targethandedness = Math.random() < 0.5 ? 'Left' : 'Right';

        targetSprite           = document.createElement('img');
        targetSprite.src       = `public/assets/${targetGesture}_${targethandedness}_JIN.png`;
        targetSprite.className = 'peace-target peace-target--active';
        targetSprite.style.left = targetX + 'px';
        targetSprite.style.top  = targetY + 'px';
        particlesEl.appendChild(targetSprite);
    }

    // Call once to show the START animation and spawn the first target
    function enter() {
        score           = 0;
        lastMatchTime   = 0;
        matchedGestures = [];
        spawnTarget();
    }

    // Called every frame. Checks for a gesture match and returns the current
    // score. Renders score text and which hand to use.
    function tick(gesture, gesture2, confidence, confidence2, handedness, handedness2, hx1, hy1, hx2, hy2) {
        const hand1Match = gesture  === targetGesture && confidence  >= confidenceThreshold && handedness  !== targethandedness;
        const hand2Match = gesture2 === targetGesture && confidence2 >= confidenceThreshold && handedness2 !== targethandedness;
        const dist = hand1Match ? Math.hypot(hx1 - targetX, hy1 - targetY)
                   : hand2Match ? Math.hypot(hx2 - targetX, hy2 - targetY) : Infinity;

        if ((hand1Match || hand2Match) && dist < 100 && Date.now() - lastMatchTime > 500) {
                targetSprite?.remove();
                score++;
                matchedGestures.push(targetGesture);
                lastMatchTime = Date.now();
                onScore();

                const star = document.createElement('img');
                star.src       = 'public/assets/star.png';
                star.className = 'star';
                star.style.left = targetX + 'px';
                star.style.top  = targetY + 'px';
                star.style.setProperty('--duration', (500 + Math.random() * 1000) + 'ms');
                star.onanimationend = () => star.remove();
                particlesEl.appendChild(star);

                if (!overlayEl.querySelector('.scene-text--game-score')) {
                    const scoreEl = document.createElement('p');
                    scoreEl.className = 'scene-text scene-text--game-score';
                    scoreEl.textContent = `Score: ${score}`;
                    overlayEl.appendChild(scoreEl);
                } else {
                    overlayEl.querySelector('.scene-text--game-score').textContent = `Score: ${score}`;
                }

                if (!overlayEl.querySelector('.score-icons')) {
                    const iconsEl = document.createElement('div');
                    iconsEl.className = 'score-icons';
                    overlayEl.appendChild(iconsEl);
                }

                const iconsEl = overlayEl.querySelector('.score-icons');
                if (iconsEl) {
                    const img = document.createElement('img');
                    img.src = `public/assets/${matchedGestures[matchedGestures.length - 1]}_${targethandedness}_JIN.png`;
                    img.className = 'score-icon';
                    iconsEl.appendChild(img);
                    // Remove oldest if overflowing
                    while (iconsEl.scrollWidth > iconsEl.clientWidth && iconsEl.children.length > 1) {
                        iconsEl.removeChild(iconsEl.firstChild);
                    }
                }

                spawnTarget();
        }
        
        return { score };
    }

    function reset() {
        targetSprite?.remove();
        targetSprite    = null;
        score           = 0;
        lastMatchTime   = 0;
        matchedGestures = [];
        particlesEl.innerHTML = '';
        overlayEl.innerHTML = '';
    }

    return { enter, tick, reset };
}
