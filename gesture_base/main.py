import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp

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

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Cannot open webcam")
    exit()

print("Webcam opened. Press ESC to quit.")
frame_timestamp_ms = 0

while cap.isOpened():
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
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Gesture Recognition", frame)
    if cv2.waitKey(5) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

