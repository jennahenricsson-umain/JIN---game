import { initGestures, enableMultiplayer, disableMultiplayer, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { createGame } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';
import { createOnboarding } from './scenes/onboarding.js';
import { startSession, updateSession, endSession, saveGame, trackMetric } from './firebase.js';

// ─── DOM ──────────────────────────────────────────────────────────────────────

const video        = document.getElementById('video');
const canvas       = document.getElementById('landmarks');
const ctx          = canvas.getContext('2d');
const overlay      = document.getElementById('overlay');
const particles    = document.getElementById('particles');
const overlayP1    = document.getElementById('overlay-p1');
const particlesP1  = document.getElementById('particles-p1');
const overlayP2    = document.getElementById('overlay-p2');
const particlesP2  = document.getElementById('particles-p2');
const sharedOverlay = document.getElementById('shared-overlay');
const app          = document.getElementById('app');

// ─── State ────────────────────────────────────────────────────────────────────

let gameState = 'menu';   // 'menu' | 'loading' | 'onboarding' | 'play' | 'over'
let gameMode  = 'single'; // 'single' | 'multi'

// Shared timer — owned here, extended by onScore callbacks from game instances
const timeLimit = 15;
let gameStartTime = 0;
function extendTimer() { gameStartTime = Date.now(); }
function getTimeLeft(combinedScore) {
    return Math.max(0, (timeLimit - combinedScore) - (Date.now() - gameStartTime) / 1000);
}

// Game / onboarding instances — created fresh each round
let p1Game = null, p2Game = null;
let p1Onboarding = null, p2Onboarding = null;

// Scores
let score1 = 0, score2 = 0;
let finalScore1 = 0, finalScore2 = 0;

// Analytics
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

// ─── Multiplayer helpers ──────────────────────────────────────────────────────

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
    } else {
        particlesP1.innerHTML = '';
        particlesP2.innerHTML = '';
        p1Onboarding = createOnboarding(particlesP1, margin, hw - margin);
        p2Onboarding = createOnboarding(particlesP2, hw + margin, window.innerWidth - margin);
        p1Onboarding.reset();
        p2Onboarding.reset();
    }

    gameState = 'onboarding';
    trackMetric('onboarding_started', { mode: gameMode, timestamp: Date.now() });
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
    } else if (gameMode === 'multi') {
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

function enterGameOver() {
    // Always revert to full-screen for the scoreboard
    app.classList.remove('multiplayer');
    overlayP1.innerHTML  = '';
    overlayP2.innerHTML  = '';
    particlesP1.innerHTML = '';
    particlesP2.innerHTML = '';
    sharedOverlay.innerHTML = '';
    particles.innerHTML  = '';

    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    gamesPlayed++;
    totalScore += score1 + score2;

    const metrics = {
        gestureAttempts,
        successfulMatches,
        accuracy: gestureAttempts > 0
            ? (successfulMatches / gestureAttempts * 100).toFixed(1) : 0
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
    if (gameState !== 'over') overlay.innerHTML = '';

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
            startMultiplayer(); // async — manages gameState internally
        }

    // ── Loading ───────────────────────────────────────────────────────────────
    } else if (gameState === 'loading') {
        overlay.innerHTML = '<p class="scene-text scene-text--onboarding">Loading multiplayer…</p>';

    // ── Onboarding ────────────────────────────────────────────────────────────
    } else if (gameState === 'onboarding') {
        if (gameMode === 'single') {
            const { done, targethandedness } = p1Onboarding.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            overlay.innerHTML = `
                <p class="scene-text scene-text--game-gesture">Gesture: ${g1} (${(c1 * 100).toFixed(0)}%)</p>
                <p class="scene-text scene-text--onboarding">Learn to play<br>${targethandedness}</p>
            `;
            if (done) enterPlay();
        } else if (gameMode === 'multi') {
            const r1 = p1Onboarding.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            const r2 = p2Onboarding.tick(g3, g4, c3, c4, h3, h4, hx3, hy3, hx4, hy4);

            overlayP1.innerHTML = r1.done
                ? `<p class="scene-text scene-text--onboarding">Waiting for P2…</p>`
                : `<p class="scene-text scene-text--game-gesture">Gesture: ${g1} (${(c1 * 100).toFixed(0)}%)</p>
                   <p class="scene-text scene-text--onboarding">Learn to play<br>${r1.targethandedness}</p>`;

            overlayP2.innerHTML = r2.done
                ? `<p class="scene-text scene-text--onboarding">Waiting for P1…</p>`
                : `<p class="scene-text scene-text--game-gesture">Gesture: ${g3} (${(c3 * 100).toFixed(0)}%)</p>
                   <p class="scene-text scene-text--onboarding">Learn to play<br>${r2.targethandedness}</p>`;

            if (r1.done && r2.done) {
                overlayP1.innerHTML = '';
                overlayP2.innerHTML = '';
                enterPlay();
            }
        }

    // ── Play ──────────────────────────────────────────────────────────────────
    } else if (gameState === 'play') {
        if (g1 === 'Victory' && c1 >= 0.7) gestureAttempts++; // Detta känns som en jättekonstig metric??

        if (gameMode === 'single') {
            const { score, targethandedness } = p1Game.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            if (score > score1) { successfulMatches++; trackMetric('target_matched', { player: 1, score, accuracy: c1 }); }
            score1 = score;

            const timeLeft = getTimeLeft(score1);
            overlay.innerHTML = `
                <p class="scene-text scene-text--game-score">Score: ${score1}</p>
                <p class="scene-text scene-text--game-time-countdown">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
                <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
                <p class="scene-text scene-text--onboarding">${targethandedness}</p>

            `;

            if (timeLeft === 0 || (g1 === 'Thumb_Down' && c1 >= 0.7) || (g2 === 'Thumb_Down' && c2 >= 0.7)) {
                p1Game.reset();
                enterGameOver();
            }
        } else {
            const r1 = p1Game.tick(g1, g2, c1, c2, h1, h2, hx1, hy1, hx2, hy2);
            const r2 = p2Game.tick(g3, g4, c3, c4, h3, h4, hx3, hy3, hx4, hy4);
            if (r1.score > score1) { successfulMatches++; trackMetric('target_matched', { player: 1, score: r1.score, accuracy: c1 }); }
            if (r2.score > score2) { trackMetric('target_matched', { player: 2, score: r2.score, accuracy: c2 }); }
            score1 = r1.score;
            score2 = r2.score;

            const timeLeft = getTimeLeft(score1 + score2);
            overlayP1.innerHTML = `<p class="scene-text scene-text--game-score">Score: ${score1}</p>
            <p class="scene-text scene-text--onboarding">${r1.targethandedness}</p>`;
            overlayP2.innerHTML = `<p class="scene-text scene-text--game-score">Score: ${score2}</p>
            <p class="scene-text scene-text--onboarding">${r2.targethandedness}</p>`;
            sharedOverlay.innerHTML = `
                <p class="scene-text scene-text--game-time-countdown">${timeLeft <= 5 ? timeLeft.toFixed(0) : ''}</p>
                <p class="scene-text scene-text--game-timer">Time: ${timeLeft.toFixed(1)}s</p>
            `;

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

        if (result === 'onboarding') {
            // Play again — keep the same gameMode
            if (gameMode === 'multi') app.classList.add('multiplayer');
            enterOnboarding();
        } else if (result === 'menu') {
            // Back to main menu — clean up multiplayer if needed
            if (gameMode === 'multi') disableMultiplayer();
            gameMode = 'single';
            gameState = 'menu';
        }
    }

    requestAnimationFrame(render);
}

detect();
render();
