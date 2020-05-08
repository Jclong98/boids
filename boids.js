let canvas = document.getElementById("boidsCanvas")
let ctx = canvas.getContext("2d")
canvas.style.background = "#1f1f1f"

function fitToContainer(canvas) {
    // Make it visually fill the positioned parent
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
}

fitToContainer(canvas)

window.addEventListener("resize", () => {
    fitToContainer(canvas)
})

function rotateAround(p1, p2, angle) {

    var offset_x = p1[0] - p2[0]
    var offset_y = p1[1] - p2[1]

    angle -= Math.PI / 2

    var x = p1[0] + (offset_x * Math.cos(-1 * angle)) - (offset_y * Math.sin(angle))
    var y = p1[1] + (offset_x * Math.sin(angle)) + (offset_y * Math.cos(-1 * angle))

    return [x, y]
}

class Boid {
    constructor(
        x, y, maxSpeed = 2, color = "royalblue",
        separationMultiplier = 1,
        cohesionMultiplier = 1,
        alignmentMultiplier = 1,
    ) {

        this.maxSpeed = maxSpeed
        this.color = color
        
        this.visionRadius = 50
        this.maxForce = 0.05
        this.mouseSteeringForce = 0.01

        this.separationMultiplier = separationMultiplier
        this.cohesionMultiplier = cohesionMultiplier
        this.alignmentMultiplier = alignmentMultiplier

        // random position inside 
        this.position = {
            x: canvas.width * Math.random(),
            y: canvas.height * Math.random(),
        }

        // random velocity from -1 to 1
        this.velocity = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
        }

        // controls the speed at which boids move
        this.acceleration = { x: 0, y: 0 }
    }

    update() {
        this.move()
        this.draw()
        // this.drawDebug()
    }

    move() {
        this.edgeBump()

        let alignment = this.align()
        let cohesion = this.cohesion()
        let separation = this.separate()
        let mouseMove = this.moveTowardsMouse()

        // adding in alignment force
        this.acceleration.x += alignment.x * this.alignmentMultiplier
        this.acceleration.y += alignment.y * this.alignmentMultiplier

        // adding in cohesion force
        this.acceleration.x += cohesion.x * this.cohesionMultiplier
        this.acceleration.y += cohesion.y * this.cohesionMultiplier

        // adding in separation force
        this.acceleration.x += separation.x * this.separationMultiplier
        this.acceleration.y += separation.y * this.separationMultiplier

        // adding in mouse move force
        this.acceleration.x += mouseMove.x
        this.acceleration.y += mouseMove.y


        // updating position based on velocity
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // update velocity based on acceleration
        this.velocity.x += this.acceleration.x
        this.velocity.y += this.acceleration.y


        // limiting the velocity
        this.velocity.x = Math.min(Math.max(this.velocity.x, -this.maxSpeed), this.maxSpeed)
        this.velocity.y = Math.min(Math.max(this.velocity.y, -this.maxSpeed), this.maxSpeed)

        this.acceleration.x *= 0
        this.acceleration.y *= 0
    }

    /** align this boid to the average acceleration of the nearby boids */
    align() {
        let steeringForce = { x: 0, y: 0 }
        let totalOther = 0

        for (let b of boids) {
            // get distance to other boid
            let d = Math.sqrt((b.position.x - this.position.x) ** 2 + (b.position.y - this.position.y) ** 2)

            // if the other boid is within a certain distance, 
            // add on it's velocity to the average
            if (b != this && d <= this.visionRadius) {
                steeringForce.x += b.velocity.x
                steeringForce.y += b.velocity.y

                totalOther++
            }
        }

        if (totalOther > 0) {
            // getting the average velocity
            steeringForce.x /= totalOther
            steeringForce.y /= totalOther

            // actually turning the boid towards its desired location
            steeringForce.x -= this.velocity.x
            steeringForce.y -= this.velocity.y

            // limiting the steering force
            steeringForce.x = Math.min(Math.max(steeringForce.x, -this.maxForce), this.maxForce)
            steeringForce.y = Math.min(Math.max(steeringForce.y, -this.maxForce), this.maxForce)
        }

        // this.acceleration = steeringForce
        return steeringForce
    }

    /** steer towards the average position of other nearby boids */
    cohesion() {
        let steeringForce = { x: 0, y: 0 }
        let totalOther = 0

        for (let b of boids) {
            // get distance to other boid
            let d = Math.sqrt((b.position.x - this.position.x) ** 2 + (b.position.y - this.position.y) ** 2)

            // if the other boid is within a certain distance, 
            // add on it's velocity to the average
            if (b != this && d <= this.visionRadius) {
                steeringForce.x += b.position.x
                steeringForce.y += b.position.y

                totalOther++
            }
        }

        if (totalOther > 0) {
            // getting the average velocity
            steeringForce.x /= totalOther
            steeringForce.y /= totalOther

            // actually turning the boid towards its desired location
            steeringForce.x -= this.position.x
            steeringForce.y -= this.position.y

            // limiting the steering force
            steeringForce.x = Math.min(Math.max(steeringForce.x, -this.maxForce), this.maxForce)
            steeringForce.y = Math.min(Math.max(steeringForce.y, -this.maxForce), this.maxForce)
        }

        return steeringForce
    }

    moveTowardsMouse() {
        let steeringForce = { x: 0, y: 0 }

        if (!mouse.x) return steeringForce
        if (!mouse.y) return steeringForce

        steeringForce.x += mouse.x
        steeringForce.y += mouse.y

        // actually turning the boid towards its desired location
        steeringForce.x -= this.position.x
        steeringForce.y -= this.position.y

        // limiting the steering force
        steeringForce.x = Math.min(Math.max(steeringForce.x, -this.mouseSteeringForce), this.mouseSteeringForce)
        steeringForce.y = Math.min(Math.max(steeringForce.y, -this.mouseSteeringForce), this.mouseSteeringForce)

        return steeringForce
    }

    /** steer the boid away from other boids */
    separate() {
        let steeringForce = { x: 0, y: 0 }
        let totalOther = 0

        for (let b of boids) {
            // get distance to other boid
            let d = Math.sqrt((b.position.x - this.position.x) ** 2 + (b.position.y - this.position.y) ** 2)

            // if the other boid is within a certain distance, 
            // add on it's velocity to the average
            if (b != this && d <= this.visionRadius) {
                // getting the difference between this position and b.position
                let difference = { x: this.position.x - b.position.x, y: this.position.y - b.position.y }

                // the farther away the other boid is, the less impact it has
                difference.x /= d
                difference.y /= d

                steeringForce.x += difference.x
                steeringForce.y += difference.y

                totalOther++
            }
        }

        if (totalOther > 0) {
            // getting the average velocity
            steeringForce.x /= totalOther
            steeringForce.y /= totalOther

            // setting the magnitude of the steering force to the max speed
            // let mag = Math.sqrt(steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y)
            // steeringForce.x = steeringForce.x * this.maxSpeed / mag
            // steeringForce.y = steeringForce.y * this.maxSpeed / mag

            // limiting the steering force
            steeringForce.x = Math.min(Math.max(steeringForce.x, -this.maxForce), this.maxForce)
            steeringForce.y = Math.min(Math.max(steeringForce.y, -this.maxForce), this.maxForce)
        }

        return steeringForce
    }

    /** figure out what to do if the boid 
      * touches the edge of the canvas */
    edgeBump() {
        if (this.position.x > canvas.width)
            this.position.x = 0
        else if (this.position.x < 0)
            this.position.x = canvas.width

        if (this.position.y < 0)
            this.position.y = canvas.height
        else if (this.position.y > canvas.height)
            this.position.y = 0
    }

    /** draw the boid and it's shadow */
    draw() {
        let points = [
            [this.position.x, this.position.y - 20],
            [this.position.x + 10, this.position.y + 7],
            [this.position.x - 10, this.position.y + 7],
            [this.position.x, this.position.y - 20],
        ]

        ctx.beginPath();

        // filling shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        for (let p of points) {
            let angle = Math.atan2(this.velocity.y, this.velocity.x)
            let [x, y] = rotateAround([this.position.x, this.position.y], p, angle)
            ctx.lineTo(x, y + 5)
        }
        ctx.fill()

        // filling actual color
        ctx.beginPath()

        ctx.fillStyle = this.color
        for (let p of points) {
            let angle = Math.atan2(this.velocity.y, this.velocity.x)
            let [x, y] = rotateAround([this.position.x, this.position.y], p, angle)
            ctx.lineTo(x, y)
        }
        ctx.fill()
    }

    /** draw debug information around the boid */
    drawDebug() {
        // visionRadius
        ctx.strokeStyle = "gray"
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.visionRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // position
        ctx.fillText(
            `position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})`,
            this.position.x - 10, this.position.y - 10
        )

        // position
        ctx.fillText(
            `velocity: (${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)})`,
            this.position.x - 10, this.position.y - 20
        )

        let angle = Math.atan2(this.velocity.y, this.velocity.x)

        // angle
        ctx.fillText(
            `angle: ${angle}`,
            this.position.x - 10, this.position.y - 30
        )
    }
}

class Obstacle {
    constructor(x, y) {
        this.position = {
            x: x,
            y: y,
        }
        this.velocity = {
            x: 0,
            y: 0,
        }
        this.acceleration = {
            x: 0,
            y: 0,
        }
    }

    update() {
        // center point
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, 10, 0, Math.PI * 2, false)
        ctx.fillStyle = "tomato"
        ctx.fill()

        // ctx.fillText(`(${this.position.x}, ${this.position.y})`, this.position.x - 20, this.position.y - 20)
    }
}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return { x: x, y: y }
}

let mouse = {
    x: undefined,
    y: undefined
}

canvas.addEventListener("mousemove", e => {
    let pos = getMousePosition(canvas, e)
    mouse.x = pos.x
    mouse.y = pos.y
    console.log(mouse)
})

canvas.onmouseleave = () => {
    mouse = {
        x: undefined,
        y: undefined
    }
}

play = false

function togglePlay() {
    if (play)
        play = false
    else
        play = true
}

let boids = []
for (let i = 0; i < 100; i++) {
    let x = Math.random() * canvas.width
    let y = Math.random() * canvas.height
    let maxSpeed = 2
    let color = `rgba(
        255,
        ${Math.random() * 255 / 2},
        ${Math.random() * 255 / 2}
    )`

    boids.push(new Boid(
        x = x,
        y = y,
        maxSpeed = maxSpeed,
        color = color,
        separationMultiplier = 1
    ))
}

function animate() {
    requestAnimationFrame(animate)
    if (play) {
        // ctx.clearRect(0, 0, canvas.width, canvas.height)


        boids.forEach(b => {
            b.update()
        })
    }
}

animate()