import cv2
import mediapipe as mp
import pyautogui
import time

cam = cv2.VideoCapture(0)
hands = mp.solutions.hands.Hands()
face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)
screen_w, screen_h = pyautogui.size()

eye_tracking_mode = False

print("Press 't' to toggle between eye and finger tracking modes")

while True:    
    _, frame = cam.read()
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    hand_output = hands.process(rgb_frame)
    hand_landmarks = hand_output.multi_hand_landmarks
    frame_h, frame_w, _ = frame.shape

    if eye_tracking_mode:
        face_output = face_mesh.process(rgb_frame)
        landmark_points = face_output.multi_face_landmarks
        if landmark_points:
            landmarks = landmark_points[0].landmark
            left_eye = landmarks[159]  # Left eye
            right_eye = landmarks[386]  # Right eye
            left_eye_x = int(left_eye.x * frame_w)
            left_eye_y = int(left_eye.y * frame_h)
            right_eye_x = int(right_eye.x * frame_w)
            right_eye_y = int(right_eye.y * frame_h)
            cv2.circle(frame, (left_eye_x, left_eye_y), 3, (0, 255, 0))
            cv2.circle(frame, (right_eye_x, right_eye_y), 3, (0, 255, 0))

            gaze_x = (left_eye_x + right_eye_x) // 2
            gaze_y = (left_eye_y + right_eye_y) // 2

            screen_x = screen_w * gaze_x / frame_w
            screen_y = screen_h * gaze_y / frame_h
            pyautogui.moveTo(screen_x, screen_y)

    elif hand_landmarks:
        for hand_landmark in hand_landmarks:
            landmarks = hand_landmark.landmark
            for id, landmark in enumerate(landmarks):
                x = int(landmark.x * frame_w)
                y = int(landmark.y * frame_h)
                if id == 8:  # Tip of the index finger
                    cv2.circle(frame, (x, y), 3, (0, 255, 0))
                    screen_x = screen_w * landmark.x
                    screen_y = screen_h * landmark.y
                    pyautogui.moveTo(screen_x, screen_y)

                if id == 4:  # Tip of the thumb
                    thumb_x = x
                    thumb_y = y
                if id == 8:
                    index_x = x
                    index_y = y

            if 'thumb_x' in locals() and 'index_x' in locals():
                distance = ((thumb_x - index_x) ** 2 + (thumb_y - index_y) ** 2) ** 0.5
                if distance < 30:  # Threshold
                    pyautogui.click()
                    time.sleep(1)

    # Tongue detection
    face_output = face_mesh.process(rgb_frame)
    landmark_points = face_output.multi_face_landmarks
    if landmark_points:
        landmarks = landmark_points[0].landmark
        upper_lip = landmarks[13]  # Upper lip
        lower_lip = landmarks[14]  # Lower lip
        upper_lip_y = int(upper_lip.y * frame_h)
        lower_lip_y = int(lower_lip.y * frame_h)
        cv2.circle(frame, (int(upper_lip.x * frame_w), upper_lip_y), 3, (255, 0, 0))
        cv2.circle(frame, (int(lower_lip.x * frame_w), lower_lip_y), 3, (255, 0, 0))

        if (lower_lip_y - upper_lip_y) > 20:  # Threshold
            pyautogui.click()
            pyautogui.sleep(1)

    cv2.imshow('Handsfree', frame)

    if cv2.waitKey(1) & 0xFF == ord('t'):
        eye_tracking_mode = not eye_tracking_mode
        print("Eye tracking mode:", eye_tracking_mode)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

print("Exiting...")
cam.release()
cv2.destroyAllWindows()