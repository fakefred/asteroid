# python demo for calibrating thresholds, or just for fiddling with
import cv2

# uses local webcam (set to other ints for external devices)
vc = cv2.VideoCapture(0)
vc.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
vc.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)


# creates window for demo; remove in producion
cv2.namedWindow("hough")

if vc.isOpened():  # try to get the first frame
    rval, frame = vc.read()  # read frame
else:
    rval = False

# main loop
while rval:
    rval, frame = vc.read()
    # convert to grayscale
    frame_cvt = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # detects circles
    """
        parameters used below:
            frame_cvt (matrix): the captured frame converted to grayscale
            cv2.HOUGH_GRADIENT (int): cv2 built-in value
            2 (number): scale image down 2x; 
                decrease for more efficiency
            100 (int): minimum distance between detected circles; 
                increase for less false positives, vice versa
            None: 'circle' output object from C++ opencv. Useless here.
            255: Canny edge detector (cv2.Canny()) threshold upper bound
                lower bound is half the value
            40: Hough Transform threshold
                increase for less false positives, vice versa
            40: Min Radius of circle
            100: Max Radius of circle
    """

    circles = cv2.HoughCircles(
        frame_cvt, cv2.HOUGH_GRADIENT, 4, 100, None, 255, 200, 20, 60)

    if circles is None:
        circles = [[[0, 0, 0]]]

    # if circles is not None:
    #     # select first circle
    #     # TODO: use V->H filtering with HSV
    #     """
    #         Notes:
    #             On a HSV color model, H represents Hue on a color wheel,
    #             which enables us to detect the 'color category' of the circles.

    #             However, regarding H itself brings us the problem that
    #             dark areas (or light ones) are identically classified as
    #             sharply colored areas. That is, dark red is, with this criterion,
    #             exactly the same as rgb(255, 0, 0).

    #             Therefore, we have to introduce the V (Value), which represents
    #             the 'lightness' of the area. With the help of V, we can strip out
    #             any points too light or too dark from the image, and only focus on
    #             the most apparent circles that appear on the foreground.
    #     """
    #     circle = circles[0][0]

    # for demo
    for circle in circles[0]:

        cv2.circle(frame_cvt, (circle[0], circle[1]),
                   circle[2], (0, 255, 0), 5)
        print(frame[int(circle[0]/2)][int(circle[1]/2)])
        cv2.imshow("hough", frame_cvt)
        cv2.waitKey(20)
