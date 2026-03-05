import { initGestures, detectGesture, getGesture, getHandPosition } from './gestures.js';
import { renderMenu } from './scenes/menu.js';
import { renderGame, spawnTarget } from './scenes/gameplay.js';
import { renderGameOver } from './scenes/gameover.js';

const video = document.getElementById('video');
const canvas = document.getElementById('landmarks');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let gameState = 'menu';
let score = 0;
let gameStartTime = 0;

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
            gameState = 'play';
            gameStartTime = Date.now();
            score = 0;
            spawnTarget();
        }
    } else if (gameState === 'play') {
        const result = renderGame(overlay, gesture, gestureScore, gameStartTime, score, handX, handY);
        score = result.newScore;
        if (result.shouldEnd) {
            gameState = 'over';
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
