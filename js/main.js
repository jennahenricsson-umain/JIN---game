import { initGestures, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { renderGame, resetGame, enterGame } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';
import { renderOnboarding, resetOnboarding} from './scenes/onboarding.js';

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
            resetOnboarding();
            
        }
    } else if (gameState === 'onboarding') {
        const result = renderOnboarding(overlay, particles, gesture, gestureScore, handX, handY);
        if (result.shouldEnd) {
            gameState = 'play';
            particles.innerHTML = '';
            score = 0;
            enterGame(particles);
        }
    } else if (gameState === 'play') {
        const result = renderGame(overlay, particles, gesture, gestureScore, score, handX, handY);
        score = result.newScore;
        if (result.shouldEnd) {
            gameState = 'over';
            particles.innerHTML = '';
            resetGame();
        }
    } else {
        if (renderGameOver(overlay, gesture, gestureScore, score)) {
            gameState = 'onboarding';
            resetOnboarding();
        }
    }

    requestAnimationFrame(render);
}

detect();
render();
