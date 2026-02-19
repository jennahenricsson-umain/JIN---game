from flask import Flask, Response
from flask_cors import CORS
import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp

app = Flask(__name__)
CORS(app)

model_path = "gesture_recognizer.task"
latest_result = None

def result_callback(result, output_image, timestamp_ms):
    global latest_result
    latest_result = result

base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.GestureRecognizerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=result_callback)

recognizer = vision.GestureRecognizer.create_from_options(options)

def generate_frames():
    cap = cv2.VideoCapture(0)
    frame_timestamp_ms = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_timestamp_ms += 33
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        recognizer.recognize_async(mp_image, frame_timestamp_ms)
        
        if latest_result and latest_result.gestures:
            for gesture in latest_result.gestures:
                for category in gesture:
                    cv2.putText(frame, f"{category.category_name}: {category.score:.2f}", 
                               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 10)
        
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video')
def video():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
