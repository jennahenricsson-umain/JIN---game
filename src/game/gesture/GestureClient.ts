/**
 * Polls the Python gesture recognition server and emits events on the EventBus
 * so game scenes can react to gestures (e.g. Thumbs_Up, Thumbs_Down).
 */
import { EventBus } from '../EventBus';

export const GESTURE_SERVER_URL =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_GESTURE_SERVER?: string } }).env?.VITE_GESTURE_SERVER) ||
  'http://localhost:5001';

export interface GesturePayload {
  gesture: string;
  score: number;
}

export const GESTURE_EVENT = 'gesture-recognized';

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export function startGestureClient(serverUrl: string = GESTURE_SERVER_URL): void {
  if (isRunning) return;
  isRunning = true;
  const gestureUrl = `${serverUrl.replace(/\/$/, '')}/gesture`;

  const poll = async () => {
    try {
      const res = await fetch(gestureUrl);
      if (!res.ok) return;
      const data = await res.json() as GesturePayload;
      if (data.gesture && data.gesture !== 'None' && data.score > 0) {
        EventBus.emit(GESTURE_EVENT, data);
      }
    } catch {
      // Server not running or CORS; ignore
    }
  };

  poll();
  pollIntervalId = setInterval(poll, 100);
}

export function stopGestureClient(): void {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  isRunning = false;
}

export function isGestureClientRunning(): boolean {
  return isRunning;
}
