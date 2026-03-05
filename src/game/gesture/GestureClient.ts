import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { EventBus } from '../EventBus';

export interface GesturePayload {
  gesture: string;
  score: number;
  landmark: { x: number; y: number; z: number }[];
}

export const GESTURE_EVENT = 'gesture-recognized';
export const CAMERA_READY_EVENT = 'camera-stream-ready';

let gestureRecognizer: GestureRecognizer | null = null;
let isRunning = false;
let animFrameId: number | null = null;
let videoElement: HTMLVideoElement | null = null;
let lastVideoTime = -1;

export async function startGestureClient(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/gesture_recognizer.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    EventBus.emit(CAMERA_READY_EVENT, stream);

    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', '');
    await videoElement.play();

    predictLoop();
  } catch (err) {
    console.error('Gesture recognizer init error:', err);
    isRunning = false;
  }
}

function predictLoop(): void {
  if (!isRunning || !gestureRecognizer || !videoElement) return;

  const nowInMs = Date.now();
  if (videoElement.currentTime !== lastVideoTime) {
    lastVideoTime = videoElement.currentTime;
    const results = gestureRecognizer.recognizeForVideo(videoElement, nowInMs);

    if (results.gestures.length > 0 && results.landmarks.length > 0) {
      const cat = results.gestures[0][0];
      const lms = results.landmarks[0];
      const payload: GesturePayload = {
        gesture: cat.categoryName,
        score: Math.round(cat.score * 10000) / 10000,
        landmark: lms.map(lm => ({
          x: Math.round((1 - lm.x) * 1e7) / 1e7,
          y: Math.round(lm.y * 1e7) / 1e7,
          z: Math.round(lm.z * 1e7) / 1e7,
        })),
      };
      EventBus.emit(GESTURE_EVENT, payload);
    }
  }

  animFrameId = requestAnimationFrame(predictLoop);
}

export function stopGestureClient(): void {
  isRunning = false;

  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (videoElement) {
    const stream = videoElement.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    videoElement.srcObject = null;
    videoElement = null;
  }

  gestureRecognizer = null;
  lastVideoTime = -1;
}

export function isGestureClientRunning(): boolean {
  return isRunning;
}

export function getVideoSize(): { width: number; height: number } {
  return {
    width: videoElement?.videoWidth ?? window.innerWidth,
    height: videoElement?.videoHeight ?? window.innerHeight,
  };
}
