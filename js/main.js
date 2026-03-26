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
const sharedOverlay = document.getElementById('shared-overlay');
const app           = document.getElementById('app');

// ─── State ────────────────────────────────────────────────────────────────────

let gameState = 'menu'; // 'menu'|'loading'|'onboarding'|'countdown'|'play'|'between'|'over'
let gameMode  = 'single';

let countdownStart    = 0;
let betweenStart      = 0;
let onboardingStart   = 0;
let roundNumber       = 0;
const BETWEEN_DURATION = 2500;

const timeLimit = 5;
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
        p1Onboarding = createOnboarding(particles, margin, window.innerWidth - margin);
        p1Onboarding.reset();
        p1Onboarding._spawned   = false;
        p1Onboarding._finishing = false;
    } else {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        p1Onboarding = createOnboarding(particlesP1, margin, hw - margin);
        p2Onboarding = createOnboarding(particlesP2, hw + margin, window.innerWidth - margin);
        p1Onboarding.reset();
        p2Onboarding.reset();
    }

    gameState = 'onboarding';
    onboardingStart = Date.now();
    trackMetric('onboarding_started', { mode: gameMode, timestamp: Date.now() });
}

function enterCountdown() {
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
        p1Game = createGame(particles, extendTimer, margin, window.innerWidth - margin);
        p1Game.enter();
    } else {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        p1Game = createGame(particlesP1, extendTimer, margin, hw - margin);
        p2Game = createGame(particlesP2, extendTimer, hw + margin, window.innerWidth - margin);
        p1Game.enter();
        p2Game.enter();
    }

    gameState = 'play';
    trackMetric('game_started', { mode: gameMode, timestamp: Date.now() });
}

function enterBetween() {
    betweenStart = Date.now();
    roundNumber++;
    gameState = 'between';
}

function enterGameOver() {
    app.classList.remove('multiplayer');
    overlayP1.innerHTML     = '';
    overlayP2.innerHTML     = '';
    particlesP1.innerHTML   = '';
    particlesP2.innerHTML   = '';
    sharedOverlay.innerHTML = '';
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
    const { gesture: g1, score: c1 } = getGesture(0);
    const { x: hx1, y: hy1 }         = getHandPosition(0);
    const { gesture: g2, score: c2 } = getGesture(1);
    const { x: hx2, y: hy2 }         = getHandPosition(1);

    // ── Menu ──────────────────────────────────────────────────────────────────
    if (gameState === 'menu') {
        const selection = renderMenu(overlay, g1, c1, hx1);
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
        setHTML(overlay, '<p class="scene-text scene-text--onboarding">Loading multiplayer…</p>');

    // ── Onboarding ────────────────────────────────────────────────────────────
    } else if (gameState === 'onboarding') {
        const elapsed     = Date.now() - onboardingStart;
        const introActive = elapsed < 3000;

        if (!introActive && !p1Onboarding._spawned) {
            p1Onboarding._spawned = true;
            p1Onboarding.spawn();
        }

        if (gameMode === 'single') {
            const { done, step } = introActive
                ? { done: false, step: 0 }
                : p1Onboarding.tick(g1, c1, hx1, hy1);

            const pct = (step / 3) * 100;

            if (introActive) {
                setHTML(overlay, `<p class="scene-text scene-text--onboarding-title">Match the shown gesture</p>`);
            } else {
                if (!overlay.querySelector('.progress-bar')) {
                    overlay.innerHTML = `
                        <p class="scene-text scene-text--onboarding-title onboarding-title--up">Match the shown gesture</p>
                        <div class="progress-bar"><div class="progress-bar__fill" style="width:0%"></div></div>
                    `;
                    requestAnimationFrame(() => {
                        const fill = overlay.querySelector('.progress-bar__fill');
                        if (fill) fill.style.width = pct + '%';
                    });
                } else {
                    const fill = overlay.querySelector('.progress-bar__fill');
                    if (fill && fill.style.width !== pct + '%') fill.style.width = pct + '%';
                }
            }
            if (done && !p1Onboarding._finishing) {
                p1Onboarding._finishing = true;
                const fill = overlay.querySelector('.progress-bar__fill');
                if (fill) fill.style.width = '100%';
                setTimeout(() => enterCountdown(), 600);
            }
        } else {
            const r1 = p1Onboarding.tick(g1, c1, hx1, hy1);
            const r2 = p2Onboarding.tick(g2, c2, hx2, hy2);

            setHTML(overlayP1, r1.done
                ? `<p class="scene-text scene-text--onboarding-title">Ready! Waiting for P2…</p>`
                : `<p class="scene-text scene-text--onboarding-title">Learn the gestures</p>
                   <p class="scene-text scene-text--onboarding-gesture">${r1.label}</p>
                   <p class="scene-text scene-text--onboarding-progress">${r1.progress}</p>`);

            setHTML(overlayP2, r2.done
                ? `<p class="scene-text scene-text--onboarding-title">Ready! Waiting for P1…</p>`
                : `<p class="scene-text scene-text--onboarding-title">Learn the gestures</p>
                   <p class="scene-text scene-text--onboarding-gesture">${r2.label}</p>
                   <p class="scene-text scene-text--onboarding-progress">${r2.progress}</p>`);

            if (r1.done && r2.done) {
                overlayP1.innerHTML = '';
                overlayP2.innerHTML = '';
                enterCountdown();
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
            if (isGo) setTimeout(() => enterPlay(), 1000);
        }

    // ── Between rounds ────────────────────────────────────────────────────────
    } else if (gameState === 'between') {
        const elapsed = Date.now() - betweenStart;
        setHTML(overlay, `
            <p class="scene-text scene-text--between-title">Round ${roundNumber} complete!</p>
            <p class="scene-text scene-text--between-score">Score: ${finalScore1}${finalScore2 ? ` | P2: ${finalScore2}` : ''}</p>
        `);
        if (elapsed >= BETWEEN_DURATION) enterOnboarding();

    // ── Play ──────────────────────────────────────────────────────────────────
    } else if (gameState === 'play') {
        if (g1 === 'Victory' && c1 >= 0.7) gestureAttempts++;

        if (gameMode === 'single') {
            const { score } = p1Game.tick(g1, c1, hx1, hy1);
            if (score > score1) { successfulMatches++; trackMetric('target_matched', { player: 1, score, accuracy: c1 }); }
            score1 = score;

            const timeLeft = getTimeLeft(score1);
            setHTML(overlay, `
                <p class="scene-text scene-text--game-score">Score: ${score1}</p>
                <p class="scene-text scene-text--game-time-countdown">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
                <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
            `);

            if (timeLeft === 0 || (g1 === 'Thumb_Down' && c1 >= 0.7)) {
                p1Game.reset();
                enterGameOver();
            }
        } else {
            const r1 = p1Game.tick(g1, c1, hx1, hy1);
            const r2 = p2Game.tick(g2, c2, hx2, hy2);
            if (r1.score > score1) { successfulMatches++; trackMetric('target_matched', { player: 1, score: r1.score, accuracy: c1 }); }
            if (r2.score > score2) { trackMetric('target_matched', { player: 2, score: r2.score, accuracy: c2 }); }
            score1 = r1.score;
            score2 = r2.score;

            const timeLeft = getTimeLeft(score1 + score2);
            setHTML(overlayP1, `<p class="scene-text scene-text--game-score">Score: ${score1}</p>`);
            setHTML(overlayP2, `<p class="scene-text scene-text--game-score">Score: ${score2}</p>`);
            setHTML(sharedOverlay, `
                <p class="scene-text scene-text--game-time-countdown">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
                <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
            `);

            const thumbDown = (g1 === 'Thumb_Down' && c1 >= 0.7) || (g2 === 'Thumb_Down' && c2 >= 0.7);
            if (timeLeft === 0 || thumbDown) {
                p1Game.reset();
                p2Game.reset();
                enterGameOver();
            }
        }

    // ── Game over ─────────────────────────────────────────────────────────────
    } else if (gameState === 'over') {
        const scoreArg2 = gameMode === 'multi' ? finalScore2 : null;
        const result = renderGameOver(overlay, g1, c1, finalScore1, scoreArg2);

        if (result === 'onboarding') {
            if (gameMode === 'multi') app.classList.add('multiplayer');
            enterBetween();
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
