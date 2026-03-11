import { GestureRecognizer, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm';

let recognizer;
let video;
let detectedGesture = '';
let gestureScore = 0;
let handX = 0;
let handY = 0;

export async function initGestures(videoElement) {
    video = videoElement;
    const resolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
    recognizer = await GestureRecognizer.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: 'public/gesture_recognizer.task', delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.4
    });
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
}

export function detectGesture(canvas, ctx) {
    if (video.readyState === 4) {
        const result = recognizer.recognizeForVideo(video, Date.now());
        const gestures = result.gestures[0];
        const landmarks = result.landmarks[0];

        if (gestures && gestures.length > 0) {
            detectedGesture = gestures[0].categoryName;
            gestureScore = gestures[0].score;
        }

        if (landmarks && landmarks.length > 9) {
            const videoW = video.videoWidth;
            const videoH = video.videoHeight;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const scale = Math.max(screenW / videoW, screenH / videoH);
            const offsetX = (videoW * scale - screenW) / 2;
            const offsetY = (videoH * scale - screenH) / 2;

            handX = (1 - landmarks[9].x) * videoW * scale - offsetX;
            handY = landmarks[9].y * videoH * scale - offsetY;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#8803fc';
            landmarks.forEach(lm => {
                const x = (1 - lm.x) * videoW * scale - offsetX;
                const y = lm.y * videoH * scale - offsetY;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }
}

export function getGesture() {
    return { gesture: detectedGesture, score: gestureScore };
}

export function getHandPosition() {
    return { x: handX, y: handY };
}
