import { GestureRecognizer, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm';

let recognizer;
let video;
let detectedGesture = '';
let detectedGesture2 = '';
let gestureScore = 0;
let gestureScore2 = 0;
let handX = 0;
let handY = 0;
let handX2 = 0;
let handY2 = 0;
let allLandmarks = [];
let handedness = '';
let handedness2 = '';



export async function initGestures(videoElement) {
    video = videoElement;
    const resolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
    recognizer = await GestureRecognizer.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: 'public/gesture_recognizer.task', delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 2,
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
        const gestures2 = result.gestures[1];
        const landmarks2 = result.landmarks[1];
        const hand = result.handednesses[0];
        const hand2 = result.handednesses[1];
        
        if (gestures && gestures.length > 0) {
            detectedGesture = gestures[0].categoryName;
            gestureScore = gestures[0].score;
            handedness = hand[0].categoryName || '';
        }

        if (gestures2 && gestures2.length > 0) {
            detectedGesture2 = gestures2[0].categoryName;
            gestureScore2 = gestures2[0].score;
            handedness2 = hand2[0].categoryName || '';
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

            if (landmarks2 && landmarks2.length > 9) {
            handX2 = (1 - landmarks2[9].x) * videoW * scale - offsetX;
            handY2 = landmarks2[9].y * videoH * scale - offsetY;

            allLandmarks = [...landmarks, ...landmarks2];
            } else {
                allLandmarks = landmarks;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#8803fc';
            allLandmarks.forEach(lm => {
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
    return { gesture: detectedGesture, score: gestureScore, gesture2: detectedGesture2, score2: gestureScore2, handedness: handedness, handedness2: handedness2 };
}

export function getHandPosition() {
    return { x: handX, y: handY, x2: handX2, y2: handY2 };
}
