import { initGestures, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { renderGame, spawnTarget, resetGame } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';
import { startSession, updateSession, endSession, saveGame, trackMetric } from './firebase.js';
import { renderOnboarding, spawnFixedTarget } from './scenes/onboarding.js';

const video = document.getElementById('video');
const canvas = document.getElementById('landmarks');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const particles = document.getElementById('particles');

let gameState = 'menu';
let score = 0;
let gameStartTime = 0;
let gamesPlayed = 0;
let totalScore = 0;
let gestureAttempts = 0;
let successfulMatches = 0;

startSession();

window.addEventListener('beforeunload', () => {
    endSession();
});

await initGestures(video);

function syncCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
syncCanvas();
window.addEventListener('resize', syncCanvas);

function detect() {
    detectGesture(canvas, ctx);
    requestAnimationFrame(detect);
}

function render() {
    overlay.innerHTML = '';
    const { gesture, score: gestureScore } = getGesture();
    const { x: handX, y: handY } = getHandPosition();

    if (gameState === 'menu') {
        if (renderMenu(overlay, gesture, gestureScore)) {
            gameState = 'onboarding';
            spawnFixedTarget(0);
            trackMetric('onboarding_started', { timestamp: Date.now() });
        }
    } else if (gameState === 'onboarding') {
        const result = renderOnboarding(overlay, particles, gesture, gestureScore, handX, handY);
        if (result.shouldEnd) {
            gameState = 'play';
            particles.innerHTML = '';
            score = 0;
            gameStartTime = Date.now();
            gestureAttempts = 0;
            successfulMatches = 0;
            resetGame();
            spawnTarget();
            trackMetric('game_started', { timestamp: Date.now() });
        }
    } else if (gameState === 'play') {
        if (gesture === 'Victory' && gestureScore >= 0.7) {
            gestureAttempts++;
        }
        
        const result = renderGame(overlay, particles, gesture, gestureScore, score, handX, handY);
        
        if (result.newScore > score) {
            successfulMatches++;
            trackMetric('target_matched', { 
                score: result.newScore,
                handPosition: { x: handX, y: handY },
                accuracy: gestureScore
            });
        }
        
        score = result.newScore;
        if (result.shouldEnd) {
            gameState = 'over';
            const duration = Math.floor((Date.now() - gameStartTime) / 1000);
            gamesPlayed++;
            totalScore += score;
            
            const metrics = {
                gestureAttempts,
                successfulMatches,
                accuracy: gestureAttempts > 0 ? (successfulMatches / gestureAttempts * 100).toFixed(1) : 0
            };
            
            saveGame(score, duration, metrics);
            updateSession(gamesPlayed, totalScore);
            trackMetric('game_ended', { score, duration, ...metrics });
            particles.innerHTML = '';
            resetGame();
        }
    } else {
        if (renderGameOver(overlay, gesture, gestureScore, score)) {
            gameState = 'menu';
        }
    }

    requestAnimationFrame(render);
}

detect();
render();
