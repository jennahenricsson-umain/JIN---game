import { initGestures, enableMultiplayer, disableMultiplayer, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { createGame } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';
import { createOnboarding } from './scenes/onboarding.js';
import { startSession, updateSession, endSession, saveGame, trackMetric } from './firebase.js';

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

let gameState = 'menu'; // 'menu'|'loading'|'onboarding'|'countdown'|'play'|'over'
let gameMode  = 'single';

let countdownStart    = 0;
let onboardingStart   = 0;

const timeLimit = 30;
let gameStartTime = 0;
function extendTimer() { gameStartTime = Date.now(); }
function getTimeLeft(combinedScore) {
    return Math.max(0, (timeLimit - combinedScore) - (Date.now() - gameStartTime) / 1000);
}

let p1Game = null, p2Game = null;
let p1Onboarding = null, p2Onboarding = null;

let score1 = 0, score2 = 0;
let finalScore1 = 0, finalScore2 = 0;

let gamesPlayed       = 0;
let totalScore        = 0;
let gestureAttempts   = 0;
let successfulMatches = 0;

// ─── Session ──────────────────────────────────────────────────────────────────

startSession();
window.addEventListener('beforeunload', () => endSession());

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

async function startMultiplayer() {
    gameState = 'loading';
    await enableMultiplayer();
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
    trackMetric('onboarding_started', { mode: gameMode, timestamp: Date.now() });
}

function enterCountdown() {
    overlay.innerHTML = '';
    particles.innerHTML = '';
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

    if (gameMode === 'single') {
        particles.innerHTML = '';
        overlay.innerHTML = '';
        overlay.innerHTML = `
            <p class="scene-text scene-text--game-timer"></p>
            <p class="scene-text scene-text--game-time-countdown"></p>
        `;
        p1Game = createGame(particles, overlay, extendTimer, margin, window.innerWidth - margin);
        p1Game.enter();
    } else if (gameMode === 'multi') {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        overlay.innerHTML = '';
        overlayP1.innerHTML = '';
        overlayP2.innerHTML = '';
        overlay.innerHTML = `
            <p class="scene-text scene-text--game-timer"></p>
            <p class="scene-text scene-text--game-time-countdown"></p>
        `;
        p1Game = createGame(particlesP1, overlayP1, extendTimer, margin, hw - margin);
        p2Game = createGame(particlesP2, overlayP2, extendTimer, hw + margin, window.innerWidth - margin);
        p1Game.enter();
        p2Game.enter();
    }

    gameState = 'play';
    trackMetric('game_started', { mode: gameMode, timestamp: Date.now() });
}

function enterGameOver() {
    app.classList.remove('multiplayer');

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

    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    gamesPlayed++;
    totalScore += score1 + score2;

    const metrics = {
        gestureAttempts,
        successfulMatches,
        accuracy: gestureAttempts > 0 ? (successfulMatches / gestureAttempts * 100).toFixed(1) : 0
    };

    saveGame(score1 + score2, duration, metrics);
    updateSession(gamesPlayed, totalScore);
    trackMetric('game_ended', { score1, score2, duration, mode: gameMode, ...metrics });

    finalScore1 = score1;
    finalScore2 = score2;
    gameState   = 'over';
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
    const gestures = [[g1, g2], [g3, g4]];
    const confidences = [[c1, c2], [c3, c4]];
    const handednesses = [[h1, h2], [h3, h4]];
    const handPositions = [[[hx1, hy1], [hx2, hy2]], [[hx3, hy3], [hx4, hy4]]];

    // ── Menu ──────────────────────────────────────────────────────────────────
    if (gameState === 'menu') {
        const selection = renderMenu(overlay, g1, g2, c1, c2, hx1, hx2);
        if (selection === 'single') {
            if (gameMode === 'multi') disableMultiplayer();
            gameMode = 'single';
            app.classList.remove('multiplayer');
            enterOnboarding();
        } else if (selection === 'multi') {
            startMultiplayer();
        }

    // ── Loading ───────────────────────────────────────────────────────────────
    } else if (gameState === 'loading') {
        setHTML(overlay, '<p class="scene-text scene-text--onboarding">LOADING MULTIPLAYER…</p>');

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
                overlay.innerHTML = `<p class="scene-text scene-text--onboarding-title">MATCH THE <span class="highlight-violet">GESTURE</span></p>`;
            }
            if (!introActive){
                const title = overlay.querySelector('.scene-text--onboarding-title');
                if (title) title.classList.add('onboarding-title--up');
            }

            if (done && !p1Onboarding._finishing) {
                p1Onboarding._finishing = true;
                const fill = overlay.querySelector('.progress-bar__fill');
                if (fill) fill.style.width = '100%';
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
                overlay.innerHTML = `<p class="scene-text scene-text--onboarding-title">MATCH THE <span class="highlight-violet">GESTURE</span></p>`;
            }
            if (!introActive){
                const title = overlay.querySelector('.scene-text--onboarding-title');
                if (title) title.classList.add('onboarding-title--up');
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
        const steps   = ['3', '2', '1', 'GO!'];

        if (step < steps.length && overlay.dataset.countdownStep !== String(step)) {
            overlay.dataset.countdownStep = step;
            const isGo = steps[step] === 'GO!';
            overlay.innerHTML = `
                ${!isGo ? `<p class="scene-text scene-text--countdown-label">Get ready to play</p>` : ''}
                <p class="scene-text scene-text--countdown">${steps[step]}</p>
            `;
            if (isGo) setTimeout(() => enterPlay(), 500);
        }

    // ── Play ──────────────────────────────────────────────────────────────────
    } else if (gameState === 'play') {
        if (g1 === 'Victory' && c1 >= 0.7) gestureAttempts++; // Detta känns som en jättekonstig metric??

        if (gameMode === 'single') {
            const { score } = p1Game.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            if (score > score1) {
                successfulMatches++;
                trackMetric('target_matched', { player: 1, score, accuracy: c1 });
            }
            score1 = score;

            const timeLeft = getTimeLeft(score1);
            const pct = (timeLeft / timeLimit) * 100;
            timebarEl.classList.add('active');
            timebarFill.style.height = pct + '%';
            timebarFill.style.background = pct > 40
                ? 'linear-gradient(0deg, #7b00ff, #b44fff)'
                : pct > 20
                    ? 'linear-gradient(0deg, #ff6600, #ffaa00)'
                    : 'linear-gradient(0deg, #ff0000, #ff4444)';

            if (timeLeft === 0 || (g1 === 'Thumb_Down' && c1 >= 0.7) || (g2 === 'Thumb_Down' && c2 >= 0.7)) {
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
            if (r1.score > score1) { successfulMatches++; trackMetric('target_matched', { player: 1, score: r1.score, accuracy: c1 }); }
            if (r2.score > score2) { successfulMatches++; trackMetric('target_matched', { player: 2, score: r2.score, accuracy: c2 }); }
            score1 = r1.score;
            score2 = r2.score;

            const timeLeft = getTimeLeft(score1 + score2);

            overlay.querySelector('.scene-text--game-timer').textContent = `Time: ${timeLeft.toFixed(1)}s`;
            if (timeLeft <= 5) {
                overlay.querySelector('.scene-text--game-time-countdown').textContent = timeLeft.toFixed(0);
            }

            const thumbDown = (g1 === 'Thumb_Down' && c1 >= 0.7) || (g2 === 'Thumb_Down' && c2 >= 0.7)
                           || (g3 === 'Thumb_Down' && c3 >= 0.7) || (g4 === 'Thumb_Down' && c4 >= 0.7);
            if (timeLeft === 0 || thumbDown) {
                p1Game.reset();
                p2Game.reset();
                enterGameOver();
            }
        }

    // ── Game over ─────────────────────────────────────────────────────────────
    } else if (gameState === 'over') {
        const scoreArg2 = gameMode === 'multi' ? finalScore2 : null;
        const result = renderGameOver(overlay, g1, g2, c1, c2, finalScore1, scoreArg2);

        if (result === 'play_again') {
            if (gameMode === 'multi') app.classList.add('multiplayer');
            enterOnboarding();
        } else if (result === 'menu') {
            if (gameMode === 'multi') disableMultiplayer();
            gameMode  = 'single';
            gameState = 'menu';
        }
    }

    requestAnimationFrame(render);
}

detect();
render();
