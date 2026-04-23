import { GestureRecognizer, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm';

// Cached so enableMultiplayer() can reuse it without re-downloading the WASM
let resolver;

let recognizer1;  // Always active — used from startup through single-player and menu
let recognizer2;  // Created only when the player picks multiplayer

let video;
let multiplayerMode = false;

// Off-screen canvases fed to each recognizer in multiplayer — never in the DOM
let cropCanvas1, cropCtx1;
let cropCanvas2, cropCtx2;

// Per-player, per-hand state: [playerIndex][handIndex]
// playerIndex 0 = P1 (left screen), 1 = P2 (right screen)
// handIndex   0 = first detected hand, 1 = second detected hand
const detectedGesture = [['', ''], ['', '']];
const gestureScore    = [[0, 0],   [0, 0]];
const handX           = [[0, 0],   [0, 0]];
const handY           = [[0, 0],   [0, 0]];
const handedness      = [['', ''], ['', '']];  // 'Left' or 'Right'

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initGestures(videoElement) {
    video = videoElement;
    resolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );
    recognizer1 = await GestureRecognizer.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: 'gesture_recognizer.task', delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,  // two hands per player
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.4
    });
    cropCanvas1 = document.createElement('canvas');
    cropCtx1    = cropCanvas1.getContext('2d');
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
}

// Called once when the player picks multiplayer. Creates R2 and switches
// R1's input from the full video to its designated half-frame crop.
export async function enableMultiplayer() {
    if (recognizer2) return;
    recognizer2 = await GestureRecognizer.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: 'gesture_recognizer.task', delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,  // two hands per player
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.4
    });
    cropCanvas2 = document.createElement('canvas');
    cropCtx2    = cropCanvas2.getContext('2d');
    multiplayerMode = true;
}

// Called when the player returns to single-player from the menu.
// Destroys R2 and switches R1 back to full-video input.
export function disableMultiplayer() {
    if (recognizer2) { recognizer2.close(); recognizer2 = null; }
    multiplayerMode = false;
}

// ─── Detection ────────────────────────────────────────────────────────────────

export function detectGesture(canvas, ctx) {
    if (video.readyState !== 4) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!multiplayerMode) {
        // Single-player: run R1 on the full video — identical to original behaviour
        runRecognizer(recognizer1, video, 0, ctx);
    } else {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // P1 gets the RIGHT half of the raw video.
        // After the CSS mirror this maps to the LEFT half of the screen.
        cropCanvas1.width  = vw / 2;
        cropCanvas1.height = vh;
        cropCtx1.drawImage(video, vw / 2, 0, vw / 2, vh,  0, 0, vw / 2, vh);
        runRecognizer(recognizer1, cropCanvas1, 0, ctx);

        // P2 gets the LEFT half of the raw video → RIGHT half of the screen.
        cropCanvas2.width  = vw / 2;
        cropCanvas2.height = vh;
        cropCtx2.drawImage(video, 0, 0, vw / 2, vh,  0, 0, vw / 2, vh);
        runRecognizer(recognizer2, cropCanvas2, 1, ctx);

        // Visual divider between the two player areas
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth   = 2;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.restore();
    }
}

function runRecognizer(recognizer, input, playerIndex, ctx) {
    const result = recognizer.recognizeForVideo(input, Date.now());

    const vw      = video.videoWidth;
    const vh      = video.videoHeight;
    const sw      = window.innerWidth;
    const sh      = window.innerHeight;
    const scale   = Math.max(sw / vw, sh / vh);
    const offsetX = (vw * scale - sw) / 2;
    const offsetY = (vh * scale - sh) / 2;

    // Loop through both hand slots (handIndex 0 and 1)
    for (let handIndex = 0; handIndex < 2; handIndex++) {
        const gestures   = result.gestures[handIndex];
        const landmarks  = result.landmarks[handIndex];
        const handResult = result.handednesses[handIndex];

        if (gestures?.length > 0) {
            detectedGesture[playerIndex][handIndex] = gestures[0].categoryName;
            gestureScore[playerIndex][handIndex]    = gestures[0].score;
        } else {
            detectedGesture[playerIndex][handIndex] = '';
            gestureScore[playerIndex][handIndex]    = 0;
        }

        handedness[playerIndex][handIndex] = handResult?.[0]?.categoryName ?? '';

        if (landmarks?.length > 10) {
            handX[playerIndex][handIndex] = toScreenX(landmarks[9].x, playerIndex, vw, scale, offsetX);
            handY[playerIndex][handIndex] = landmarks[9].y * vh * scale - offsetY;

            // Draw a transparent rectangle around the hand to indicate detection
            ctx.fillStyle = handedness[playerIndex][handIndex] === 'Left' ?  'rgba(255, 101, 5, 0.6)': 'rgba(136, 0, 255, 0.5)';

            const inputWidth = multiplayerMode ? vw / 2 : vw;
            const xMin = Math.min(...landmarks.map(lm => lm.x));
            const xMax = Math.max(...landmarks.map(lm => lm.x));
            const yMin = Math.min(...landmarks.map(lm => lm.y));
            const yMax = Math.max(...landmarks.map(lm => lm.y));
            const xdis = (xMax - xMin) * inputWidth * scale;
            const ydis = (yMax - yMin) * vh * scale;
            const centerX = (xMin + xMax) / 2;
            const centerY = (yMin + yMax) / 2;
            const x = toScreenX(centerX, playerIndex, vw, scale, offsetX);
            const y = centerY * vh * scale - offsetY;
            ctx.fillRect(x - xdis/2, y - ydis/2, xdis, ydis);
        }
    }
}

// Maps a normalised landmark X to a screen pixel X.
// The formula differs depending on whether the recognizer saw the full video
// or one cropped half — see MULTIPLAYER_PLAN.md for the derivation.
function toScreenX(lmX, playerIndex, vw, scale, offsetX) {
    if (!multiplayerMode)   return (1 - lmX) * vw * scale - offsetX;
    if (playerIndex === 0)  return (0.5 - 0.5 * lmX) * vw * scale - offsetX;
    return (1 - 0.5 * lmX) * vw * scale - offsetX;
}

// ─── Getters ──────────────────────────────────────────────────────────────────

// Defaults (playerIndex=0, handIndex=0) keep all existing call sites unchanged.
// To access a player's second hand: getGesture(0, 1) / getHandPosition(0, 1)
export function getGesture(playerIndex = 0, handIndex = 0) {
    return {
        gesture:    detectedGesture[playerIndex][handIndex],
        score:      gestureScore[playerIndex][handIndex],
        handedness: handedness[playerIndex][handIndex]
    };
}

export function getHandPosition(playerIndex = 0, handIndex = 0) {
    return { x: handX[playerIndex][handIndex], y: handY[playerIndex][handIndex] };
}
