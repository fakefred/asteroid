// Additional module:
// PARAMS is a copy of PARAMS_EXT in ./params.js
PARAMS = PARAMS_EXT

const TargetCanvas = document.getElementById('targets')
const PlayerCanvas = document.getElementById('player')

const distanceField = document.getElementById('distance')
const fuelField = document.getElementById('fuel')

let distance = 0,
    fuel = 100

// initial config
const windowWidth = window.innerWidth
const windowHeight = window.innerHeight
TargetCanvas.width = windowWidth * 0.99
PlayerCanvas.width = Math.ceil(PARAMS.playerX + PARAMS.playerRadius)
TargetCanvas.height = PlayerCanvas.height = windowHeight * 0.98

const targetCtx = TargetCanvas.getContext('2d')
const playerCtx = PlayerCanvas.getContext('2d')
function clearTargetCanvas() {
    targetCtx.clearRect(0, 0, TargetCanvas.width, TargetCanvas.height)
}
function clearPlayerCanvas() {
    playerCtx.clearRect(0, 0, PlayerCanvas.width, PlayerCanvas.height)
}
// draw border
targetCtx.strokeRect(0, 0, TargetCanvas.width, TargetCanvas.height)

function drawCircleInTargetCanvas(x, y, radius, color) {
    // in game scope
    // playerX is auto shifted
    targetCtx.fillStyle = color
    targetCtx.beginPath()
    targetCtx.arc(PARAMS.playerX + x, y, radius, 0, 2 * Math.PI)
    targetCtx.fill()
}

function drawCircleInPlayerCanvas(x, y, radius, color) {
    // in game scope
    // playerX is auto shifted
    playerCtx.fillStyle = color
    playerCtx.beginPath()
    playerCtx.arc(PARAMS.playerX + x, y, radius, 0, 2 * Math.PI)
    playerCtx.fill()
}

// obstacles and stuff the player is to dodge/touch
let incoming = []
/*  array of objects
    params of each object:
    - x: changes after each frame update
    - y: does not change
    - speed: pixels per update
    - radius: radius of the circle
    - color: color of the circle
    - type: what happens after player contacts flying object
*/

function randomIntFrom(low, high) {
    return Math.floor(low + Math.random() * (high - low))
}

function randomItemFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function refreshFuel() {
    fuelField.innerText = parseInt(fuel)
}

function refreshTargetFrame() {
    clearTargetCanvas()
    incoming.forEach((obj, index) => {
        if (obj) {
            drawCircleInTargetCanvas(obj.x, obj.y, obj.radius, obj.color)
            obj.x -= obj.speed
            if (obj.x < -PARAMS.playerX) {
                // no longer show the circle
                incoming[index] = false
            }
            const rx = obj.x
            let ry = 0
            if (dispY) {
                ry = obj.y - dispY
            } else {
                ry = obj.y - PARAMS.dispHDisplayBaseline
            }
            if (
                Math.abs(rx) <= obj.radius &&
                Math.pow(rx, 2) + Math.pow(ry, 2) < Math.pow(obj.radius, 2)
            ) {
                // hit something
                if (obj.type === 'dead') {
                    endGame()
                } else if (obj.type === 'fuel') {
                    fuel += obj.radius
                    if (fuel >= 100) fuel = 100
                    refreshFuel()
                    incoming[index] = false
                }
            }
        } else {
            if (index === 0) {
                incoming.shift()
            }
        }
    })
    distance += PARAMS.distancePerFrame
    distanceField.innerText = parseInt(distance)
    fuel -= PARAMS.fuelConsumptionPerFrame
    if (fuel <= 0) {
        endGame()
    }
    refreshFuel()
}

let dispY = 0
let reference = 0

function calibrate() {
    axios.get(`http://localhost:${PARAMS.localPort}`).then(res => {
        reference = res.data.y
        console.log(reference)
    })
}

function refreshPlayerFrame() {
    axios.get(`http://localhost:${PARAMS.localPort}`).then(res => {
        // flipping the camera could interfere
        const y = res.data.y
        dispY = PARAMS.playerHDisplayBaseline - (reference - y)
        clearPlayerCanvas()
        drawCircleInPlayerCanvas(
            0,
            dispY,
            PARAMS.playerRadius,
            PARAMS.playerColor
        )
    })
}

let iterationsSinceLastAcceleration = 0
let iterationsSinceLastProliferation = 0
function selectiveProliferation() {
    if (
        iterationsSinceLastProliferation >
            PARAMS.minimumProliferationInterval /
                PARAMS.proliferationLoopInterval &&
        Math.random() >= PARAMS.proliferationThreshold
    ) {
        const type =
            Math.random() > PARAMS.fuelInsteadOfDeadThreshold ? 'fuel' : 'dead'
        const radius =
            type === 'dead' ? randomIntFrom(20, 50) : randomIntFrom(20, 40)
        incoming.push({
            x: PARAMS.fromX,
            y: randomIntFrom(radius, TargetCanvas.height - radius),
            speed: PARAMS.initialSpeed,
            radius,
            color: PARAMS.targetColor[type],
            type
        })
        iterationsSinceLastProliferation = 0
    } else {
        iterationsSinceLastProliferation++
    }

    iterationsSinceLastAcceleration++
    if (iterationsSinceLastAcceleration === PARAMS.accelerationInterval) {
        iterationsSinceLastAcceleration = 0
        PARAMS.proliferationThreshold -= 0.01
    }
}

let frameInterval = undefined
let proliferationInterval = undefined
let playerInterval = undefined
function startGame() {
    TargetCanvas.hidden = false
    PlayerCanvas.hidden = false
    distance = 0
    fuel = 100
    PARAMS = PARAMS_EXT
    incoming = []
    calibrate()
    frameInterval = setInterval(refreshTargetFrame, PARAMS.refreshInterval)
    proliferationInterval = setInterval(
        selectiveProliferation,
        PARAMS.proliferationLoopInterval
    )
    playerInterval = setInterval(refreshPlayerFrame, PARAMS.refreshInterval)
}

function endGame() {
    clearInterval(frameInterval)
    clearInterval(proliferationInterval)
    clearInterval(playerInterval)
    clearTargetCanvas()
    clearPlayerCanvas()
}
 