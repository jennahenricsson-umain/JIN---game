"""
Gesture recognition server for the JIN game.
Runs webcam + MediaPipe in a background thread and exposes:
- GET /gesture  -> JSON { "gesture": string, "score": number } for the game to poll
- GET /video    -> MJPEG stream (optional preview)
"""
from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import threading
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp

app = Flask(__name__)
CORS(app)

model_path = "gesture_recognizer.task"
latest_result = None
latest_frame = None
_frame_lock = threading.Lock()

def result_callback(result, output_image, timestamp_ms):
    global latest_result
    latest_result = result

base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.GestureRecognizerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=result_callback)

recognizer = vision.GestureRecognizer.create_from_options(options)


def capture_and_recognize_loop():
    """Runs in background: capture webcam frames and run gesture recognition."""
    global latest_result, latest_frame
    cap = cv2.VideoCapture(0)
    frame_timestamp_ms = 0
    if not cap.isOpened():
        return
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_timestamp_ms += 33
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        recognizer.recognize_async(mp_image, frame_timestamp_ms)
        with _frame_lock:
            latest_frame = frame.copy() if frame is not None else None
    cap.release()


@app.route('/gesture')
def gesture():
    """JSON endpoint for the game: current gesture name and confidence score."""
    global latest_result
    out = {"gesture": "None", "score": 0.0}
    if latest_result and latest_result.gestures:
        for gesture_list in latest_result.gestures:
            for category in gesture_list:
                out["gesture"] = category.category_name
                out["score"] = round(float(category.score), 4)
                break
            break
    return jsonify(out)


def generate_frames():
    """Stream latest_frame as MJPEG (for optional preview)."""
    while True:
        with _frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else None
        if frame is not None:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        import time
        time.sleep(1 / 30)


@app.route('/video')
def video():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    t = threading.Thread(target=capture_and_recognize_loop, daemon=True)
    t.start()
    app.run(host='0.0.0.0', port=5001)
