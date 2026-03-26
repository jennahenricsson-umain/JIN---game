// Creates a self-contained game instance.
//
//   particlesEl  — the div this instance appends targets and stars into
//   onScore      — callback fired on each successful match; main.js uses this
//                  to extend the shared timer
//   xMin / xMax  — horizontal spawn bounds in screen pixels; main.js passes
//                  either the full screen or one half depending on the mode
//
// The factory has no knowledge of game mode — it just runs within its bounds.
export function createGame(particlesEl, onScore, xMin, xMax) {
    const margin = 120;
    let targetX       = 0;
    let targetY       = 0;
    let targetGesture = '';
    let targetSprite  = null;
    let lastMatchTime = 0;
    let score         = 0;

    const gestures = ['Victory', 'Thumb_Up', 'Pointing_Up', 'ILoveYou', 'Closed_Fist'];
    let matchedGestures = [];

    function spawnTarget() {
        targetSprite?.remove();
        targetX       = xMin + Math.random() * (xMax - xMin);
        targetY       = margin + Math.random() * (window.innerHeight - 2 * margin);
        targetGesture = gestures[Math.floor(Math.random() * gestures.length)];

        targetSprite           = document.createElement('img');
        targetSprite.src       = `public/assets/${targetGesture}_JIN.png`;
        targetSprite.className = 'peace-target';
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
    // score. Does NOT write to any overlay — main.js handles rendering.
    function tick(gesture, confidence, hx, hy) {
        if (gesture === targetGesture && confidence >= 0.7) {
            const dist = Math.hypot(hx - targetX, hy - targetY);
            if (dist < 100 && Date.now() - lastMatchTime > 500) {
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

                spawnTarget();
            }
        }
        return { score, matchedGestures };
    }

    function reset() {
        targetSprite?.remove();
        targetSprite    = null;
        score           = 0;
        lastMatchTime   = 0;
        matchedGestures = [];
        particlesEl.innerHTML = '';
    }

    return { enter, tick, reset };
}
