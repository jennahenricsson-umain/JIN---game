import { initGestures, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { renderGame, spawnTarget, resetGame } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';
import { saveScore } from './firebase.js';
import { renderOnboarding, spawnFixedTarget } from './scenes/onboarding.js';

const video = document.getElementById('video');
const canvas = document.getElementById('landmarks');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const particles = document.getElementById('particles');

let gameState = 'menu';
let score = 0;

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
        }
    } else if (gameState === 'onboarding') {
        const result = renderOnboarding(overlay, particles, gesture, gestureScore, handX, handY);
        if (result.shouldEnd) {
            gameState = 'play';
            particles.innerHTML = '';
            score = 0;
            resetGame();
            spawnTarget();
        }
    } else if (gameState === 'play') {
        const result = renderGame(overlay, particles, gesture, gestureScore, score, handX, handY);
        score = result.newScore;
        if (result.shouldEnd) {
            gameState = 'over';
            const duration = Math.floor((Date.now() - gameStartTime) / 1000);
            saveScore(score, duration);
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
