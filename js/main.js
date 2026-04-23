import { initGestures, enableMultiplayer, disableMultiplayer, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu, leftActive, rightActive } from './scenes/menu.js';
import { createGame } from './scenes/gameplay.js';
import { renderGameOver, resetGameOver } from './scenes/gameover.js';
import { createOnboarding } from './scenes/onboarding.js';
import { startGame, endGame, fetchLeaderboard } from './firebase.js';
import { renderSleeperScreen, setSleeperScores, resetSleeper } from './scenes/sleeperscreen.js';

// ─── DOM ──────────────────────────────────────────────────────────────────────

const video         = document.getElementById('video');
const canvas        = document.getElementById('landmarks');
const ctx           = canvas.getContext('2d');
const overlay       = document.getElementById('overlay');
const particles     = document.getElementById('particles');
const overlayP1     = document.getElementById('overlay-p1');
const particlesP1   = document.getElementById('particles-p1');
const overlayP2     = document.getElementById('overlay-p2');
const particlesP2   = document.getElementById('particles-p2');
const timebarEl     = document.getElementById('timebar');
const timebarFill   = document.getElementById('timebar-fill');
const app           = document.getElementById('app');

// ─── State ────────────────────────────────────────────────────────────────────

let gameState = 'menu'; // 'menu'|'loading'|'onboarding'|'countdown'|'play'|'over'|'sleeper'
let gameMode  = 'single';
let menuEnteredAt = Date.now();
let idleLoop = false;
let sleeperEnteredAt = 0;

let countdownStart    = 0;
let onboardingStart   = 0;

const timeLimit = 30;
let gameStartTime = 0;
function getTimeLeft() {
    return Math.max(0, timeLimit  - (Date.now() - gameStartTime) / 1000);
}

let p1Game = null, p2Game = null;
let p1Onboarding = null, p2Onboarding = null;

let score1 = 0, score2 = 0;
let finalScore1 = 0, finalScore2 = 0;



// ─── Session ──────────────────────────────────────────────────────────────────



await initGestures(video);

function syncCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
syncCanvas();
window.addEventListener('resize', syncCanvas);

function setHTML(el, html) {
    if (el.innerHTML !== html) el.innerHTML = html;
}

// ─── State transitions ────────────────────────────────────────────────────────

function enterSleeper() {
    resetSleeper();
    overlay.innerHTML = '';
    gameState = 'sleeper';
    sleeperEnteredAt = Date.now();
    idleLoop = true;
    fetchLeaderboard(5).then(scores => setSleeperScores(scores));
}

async function startMultiplayer() {
    gameState = 'loading';
    try {
        await enableMultiplayer();
    } catch (error) {
        gameState = 'menu';
        overlay.innerHTML = `<p class="scene-text">Could not start multiplayer. Try again.</p>`;
        return;
    } 
    gameMode = 'multi';
    app.classList.add('multiplayer');
    enterOnboarding();
}

function enterOnboarding() {
    const margin = 120;
    const hw     = window.innerWidth / 2;

    if (gameMode === 'single') {
        particles.innerHTML = '';
        overlay.innerHTML = '';
        p1Onboarding = createOnboarding(particles, overlay, margin, window.innerWidth - margin);
        p1Onboarding.reset();
        p1Onboarding._spawned   = false;
        p1Onboarding._finishing = false;
    } else {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        p1Onboarding = createOnboarding(particlesP1, overlayP1, margin, hw - margin);
        p2Onboarding = createOnboarding(particlesP2, overlayP2, hw + margin, window.innerWidth - margin);
        p1Onboarding.reset();
        p2Onboarding.reset();
        p1Onboarding._spawned   = false;
        p1Onboarding._finishing = false;
        p2Onboarding._spawned   = false;
        p2Onboarding._finishing = false;
    }

    overlay.innerHTML = '';
    gameState = 'onboarding';
    onboardingStart = Date.now();

}

function enterCountdown() {
    overlay.innerHTML = '';
    particles.innerHTML = '';
    particlesP1.innerHTML = '';
    particlesP2.innerHTML = ''; 
    overlay.dataset.countdownStep = '';
    countdownStart = Date.now();
    gameState = 'countdown';
}

function enterPlay() {
    const margin = 120;
    const hw     = window.innerWidth / 2;
    score1 = 0;
    score2 = 0;
    gameStartTime = Date.now();
    timebarEl.style.display = '';

    if (gameMode === 'single') {
        particles.innerHTML = '';
        overlay.innerHTML = '';
        overlay.innerHTML = `
            <p class="scene-text scene-text--game-timer"></p>
            <p class="scene-text scene-text--game-time-countdown"></p>
        `;
        p1Game = createGame(particles, overlay, margin, window.innerWidth - margin);
        p1Game.enter();
    } else if (gameMode === 'multi') {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        overlay.innerHTML = '';
        overlayP1.innerHTML = '';
        overlayP2.innerHTML = '';
        overlay.innerHTML = `
            <p class="scene-text scene-text--game-timer"></p>
        `;
        p1Game = createGame(particlesP1, overlayP1, margin, hw - margin);
        p2Game = createGame(particlesP2, overlayP2, hw + margin, window.innerWidth - margin);
        p1Game.enter();
        p2Game.enter();
    }

    startGame(gameMode === 'multi');
    gameState = 'play';
}

function enterGameOver() {
    app.classList.remove('multiplayer');
    timebarEl.classList.remove('active', 'multiplayer');
    timebarEl.style.display = 'none';

    const iconsEl = overlay.querySelector('.score-icons');
    const scoreNumEl = overlay.querySelector('.game-score');
    window._savedIconsHTML = iconsEl ? iconsEl.outerHTML : '';
    window._savedScoreHTML = scoreNumEl ? scoreNumEl.outerHTML : '';

    overlay.innerHTML = '';
    overlayP1.innerHTML     = '';
    overlayP2.innerHTML     = '';
    particlesP1.innerHTML   = '';
    particlesP2.innerHTML   = '';
    particles.innerHTML     = '';

    endGame(score1, gameMode === 'multi' ? score2 : null);

    finalScore1 = score1;
    finalScore2 = score2;
    gameState   = 'over';
    gameStartTime = Date.now();
}

// ─── Detection loop ───────────────────────────────────────────────────────────

function detect() {
    detectGesture(canvas, ctx);
    requestAnimationFrame(detect);
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function render() {
    const { gesture: g1, score: c1, handedness: h1 } = getGesture(0,0);
    const { x: hx1, y: hy1 }         = getHandPosition(0,0);
    const { gesture: g2, score: c2, handedness: h2 } = getGesture(0,1);
    const { x: hx2, y: hy2 }         = getHandPosition(0,1);
    const { gesture: g3, score: c3, handedness: h3 } = getGesture(1,0);
    const { x: hx3, y: hy3 }         = getHandPosition(1,0);
    const { gesture: g4, score: c4, handedness: h4 } = getGesture(1,1);
    const { x: hx4, y: hy4 }         = getHandPosition(1,1);
    // leave theese for now, might be a simpler way to implement later idk
    
    // ── Menu ──────────────────────────────────────────────────────────────────
    if (gameState === 'menu') {
    const selection = renderMenu(overlay, g1, g2, c1, c2, hx1, hx2);

        if (selection === 'single') {
            idleLoop = false;
            if (gameMode === 'multi') disableMultiplayer();
            gameMode = 'single';
            app.classList.remove('multiplayer');
            enterOnboarding();
        } else if (selection === 'multi') {
            idleLoop = false;
            startMultiplayer();
        }

        if (Date.now() - menuEnteredAt > (idleLoop ? 10000 : 15000) && !(rightActive || leftActive)) {
            enterSleeper();
        }

    // ── Loading ───────────────────────────────────────────────────────────────
    } else if (gameState === 'loading') {


    // ── Onboarding ────────────────────────────────────────────────────────────
    } else if (gameState === 'onboarding') {
        const elapsed     = Date.now() - onboardingStart;
        const introActive = elapsed < 3000;

        if (!introActive && !p1Onboarding._spawned) {
            p1Onboarding._spawned = true;
            p1Onboarding.spawn();
        }
        if (!introActive && gameMode === 'multi' && !p2Onboarding._spawned) {
            p2Onboarding._spawned = true;
            p2Onboarding.spawn();
        }

        if (gameMode === 'single') {
            const { done, step } = introActive
                ? { done: false, step: 0 }
                : p1Onboarding.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);

            if (!overlay.querySelector('.scene-text--onboarding-title')) {
                overlay.innerHTML = `<p class="scene-text scene-text--onboarding-title">SHOW <span class="highlight-orange">BOTH</span> HANDS</span></p>
                <p class="scene-text scene-text--back-instructions"><img src="assets/thumb_down_chrome_left_JIN.png" alt="Menu Image" style="height: 2em; vertical-align: middle; margin-right: 0.3em;">GO BACK</p>`;
            }
            if (!introActive){
                const title = overlay.querySelector('.scene-text--onboarding-title');
                if (title) title.classList.add('onboarding-title--up');
            }

            if (g1 === "Thumb_Down" && c1 >= 0.7 || g2 === "Thumb_Down" && c2 >= 0.7) {
                overlay.innerHTML = '';
                particles.innerHTML = '';
                gameMode = 'single';
                gameState = 'menu';
                menuEnteredAt = Date.now();
            }

            if (done && !p1Onboarding._finishing) {
                p1Onboarding._finishing = true;
                setTimeout(() => enterCountdown(), 600);
            }
        } else if (gameMode === 'multi') {
            const { done: p1done, step: p1step,} = introActive
                ? { done: false, step: 0}
                : p1Onboarding.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            const { done: p2done, step: p2step} = introActive
                ? { done: false, step: 0}
                : p2Onboarding.tick(g3, g4, c3, c4, h3, h4, hx3, hy3, hx4, hy4);

            if (!overlay.querySelector('.scene-text--onboarding-title')) {
                overlay.innerHTML = `<p class="scene-text scene-text--onboarding-title">SHOW <span class="highlight-orange">BOTH</span> HANDS</span></p>
                <p class="scene-text scene-text--back-instructions"><img src="assets/thumb_down_chrome_left_JIN.png" alt="Menu Image" style="height: 2em; vertical-align: middle; margin-right: 0.3em;">GO BACK</p>`;
            }
            if (!introActive){
                const title = overlay.querySelector('.scene-text--onboarding-title');
                if (title) title.classList.add('onboarding-title--up');
            }
            if (p1done && !p2done) {
                overlayP1.innerHTML = '';
                if (!overlayP2.querySelector('.scene-text--waiting')) {
                    overlayP2.innerHTML = '<p class="scene-text scene-text--waiting" style="left: 25%">WAITING FOR PLAYER 2...</p>';
                }
            }

            if (!p1done && p2done) {
                if (!overlayP2.querySelector('.scene-text--waiting')) {
                    overlayP2.innerHTML = '<p class="scene-text scene-text--waiting">WAITING FOR PLAYER 1...</p>';
                }
            }

            if (g1 === "Thumb_Down" && c1 >= 0.7 || g2 === "Thumb_Down" && c2 >= 0.7 || g3 === "Thumb_Down" && c3 >= 0.7 || g4 === "Thumb_Down" && c4 >= 0.7) {
                disableMultiplayer();
                overlayP1.innerHTML = '';
                overlayP2.innerHTML = '';
                particlesP1.innerHTML = '';
                particlesP2.innerHTML = '';
                gameMode = 'single';
                gameState = 'menu';
                menuEnteredAt = Date.now();
            }

            if (p1done && p2done) {
                overlayP1.innerHTML = '';
                overlayP2.innerHTML = '';
                overlay.innerHTML = '';
                setTimeout(() => enterCountdown(), 600);
            }
        }
        

    // ── Countdown ─────────────────────────────────────────────────────────────
    } else if (gameState === 'countdown') {
        const elapsed = Date.now() - countdownStart;
        const step    = Math.floor(elapsed / 1000);
        const steps   = ['3', '2', '1', 'START!'];

        if (step < steps.length && overlay.dataset.countdownStep !== String(step)) {
            overlay.dataset.countdownStep = step;
            const isGo = steps[step] === 'START!';
            overlay.innerHTML = `
                    ${!isGo ? `<p class="scene-text scene-text--countdown-label">GET READY</p>` : ''}
                    <p class="scene-text scene-text--countdown">${steps[step]}</p>`;
            if (isGo) setTimeout(() => enterPlay(), 600);
        }

    // ── Play ──────────────────────────────────────────────────────────────────
    } else if (gameState === 'play') {


        if (gameMode === 'single') {
            const { score } = p1Game.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            score1 = score;

            // Timebar
            const timeLeft = getTimeLeft();
            const pct = (timeLeft / timeLimit) * 100;
            timebarEl.classList.add('active');
            timebarFill.style.height = pct + '%';
            timebarFill.style.background = pct > 40
                ? '#8d29f1'
                : pct > 20
                    ? '#ff6600'
                    : ' #ff4444';

            if (timeLeft <= 5) {
                let currentSecond = Math.ceil(timeLeft);
                const el = overlay.querySelector('.scene-text--game-time-countdown');
                if (el.textContent !== String(currentSecond)) {
                    el.classList.remove('scene-text--game-time-countdown');
                    void el.offsetWidth;  // forces a reflow — the browser "sees" the removal
                    el.classList.add('scene-text--game-time-countdown');
                    el.textContent = currentSecond;
                }
            }

            if (timeLeft <= 0 ) {
                timebarEl.classList.remove('active');
                timebarFill.style.height = '100%';
                overlay.innerHTML   = '';
                particles.innerHTML = '';
                p1Game.reset();
                enterGameOver();
            }
        } else {
            const r1 = p1Game.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            const r2 = p2Game.tick(g3, g4, c3, c4, h3, h4, hx3, hy3, hx4, hy4);

            score1 = r1.score;
            score2 = r2.score;

            const timeLeft = getTimeLeft();

            // Timebar
            const pct = (timeLeft / timeLimit) * 100;
            timebarEl.classList.add('active');
            timebarEl.classList.add('multiplayer');
            timebarFill.style.height = pct + '%';
            timebarFill.style.background = pct > 40
                ? '#8d29f1'
                : pct > 20
                    ? '#ff6600'
                    : ' #ff4444';

            if (timeLeft <= 0 ) {
                timebarEl.classList.remove('active');
                timebarEl.classList.remove('multiplayer');
                timebarFill.style.height = '100%';
                p1Game.reset();
                p2Game.reset();
                enterGameOver();
            }
        }

    // ── Game over ─────────────────────────────────────────────────────────────
    } else if (gameState === 'over') {
        const scoreArg2 = gameMode === 'multi' ? finalScore2 : null;
        const result = renderGameOver(overlay, g1, g2, c1, c2, finalScore1, scoreArg2);
        const elapsed = Date.now() - gameStartTime;

        if (gameMode === 'multi') {
            if (elapsed > 20000) {
                resetGameOver();
                overlay.innerHTML = '';
                disableMultiplayer();
                gameMode = 'single';
                gameState = 'menu';
                menuEnteredAt = Date.now();
            }
        } else {
            const idle = elapsed > 60000;
            const bufferTime = elapsed < 7000;

            if (overlay.querySelector('.scoreboard__playagain')) {
                overlay.querySelector('.scoreboard__playagain').style.visibility = bufferTime ? 'hidden' : 'visible';
            }

            if (!bufferTime) {
                if (result === 'play_again' || idle) {
                    resetGameOver();
                    overlay.innerHTML = '';
                    gameMode = 'single';
                    gameState = 'menu';
                    menuEnteredAt = Date.now();
                }
            }
        }

    // ── Sleeper ───────────────────────────────────────────────────────────────
    } else if (gameState === 'sleeper') {
        renderSleeperScreen(overlay);
        // JAg bytte till 5 sekunder för annars har man inte en chans att välja mode i menyn. Kanske behöver tweekas mer senare.
        if (Date.now() - sleeperEnteredAt > 5000) {
            overlay.innerHTML = '';
            gameState = 'menu';
            menuEnteredAt = Date.now();
        }
    }

    requestAnimationFrame(render);
}

detect();
render();
