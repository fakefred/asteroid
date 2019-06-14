from flask import Flask
from flask_cors import CORS
import threading
import cv2
import math

x = 0
y = 0
radius = 0

vc = cv2.VideoCapture(0)
vc.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
vc.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
# resolution may vary; some cameras support 720p, but not 360p
# ^ Laptop Webcam
# v External Cam

"""
vc = cv2.VideoCapture(2)    # change "2" accordingly
vc.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
vc.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
"""

if vc.isOpened():
    rval, frame = vc.read()
else:
    rval = False


def startCamera():
    global rval
    global frame
    while rval:
        rval, frame = vc.read()


def startGame():
    global rval
    global frame

    # main loop
    while rval:
        frame_cvt = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        circles = cv2.HoughCircles(
            frame_cvt, cv2.HOUGH_GRADIENT, 2, 100, None, 255, 100, 20, 40)

        if circles is not None:
            mostLikely = (circles[0][0], 0)
            # v demo: selecting most green circle
            """
            for entry in circles[0]:
                greenVal = frame[int(entry[1])][int(entry[0])][1]
                if greenVal > mostLikely[1]:    # green value of center px
                    mostLikely = (entry, greenVal)
            """
            circle = mostLikely[0]
            global x
            global radius
            x = mostLikely[0][0]
            radius = mostLikely[0][2]

            global y
            if circle[0] is not 0:
                y = circle[0]


threading._start_new_thread(startCamera, ())
threading._start_new_thread(startGame, ())


app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def returnY():
    return "{\"y\": %d}" % y


app.run(host="localhost", port=8080)
