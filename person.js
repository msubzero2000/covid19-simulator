const condition = {
    HEALTHY: 'healthy',
    ORIGINALLY_SICK: 'originally sick',
    NEWLY_SICK: 'newly sick'
}

class Person extends Actor {
    constructor(config, socialDistanceFactor, stats) {
        super(config)
        this.stats = stats
        this.targets = new Array()
        this.currentTarget = -1
        this.pausedTimer = null
        this.active = true
        this.radius = 10
        this.socialDistanceFactor = 1
        let socialDistanceScore = 0

        switch (socialDistanceFactor) {
            case 0:
                socialDistanceScore = 0
                break
            case 1:
                socialDistanceScore = 0.5
                break
            case 2:
                socialDistanceScore = 0.75
                break
        }
        this.socialDistance = this.radius * 2 + 15 * socialDistanceScore
        this.condition = condition.HEALTHY
        this.activeTimer = null
    }

    createBody(x, y, angle, speed, group, engine) {
        this.body = Bodies.circle(x, y, this.radius,
            {
                collisionFilter: {
                    group: group
                },
                render: {
                    fillStyle: 'blue'
                }
            })
        this.engine = engine
        this.body.restitution = 0.2
        this.body.object = this
        return this.body
    }
    update() {
        if (!this.active) {
            return false
        }
        switch (this.condition) {
            case condition.HEALTHY:
                this.body.render.fillStyle = 'rgb(58, 136, 254)'
                break
            case condition.ORIGINALLY_SICK:
                this.body.render.fillStyle = 'rgb(255, 100, 100)'
                break
            case condition.NEWLY_SICK:
                this.body.render.fillStyle = 'rgb(238, 197, 23)'
                break
        }

        if (this.activeTimer == null) {
            this.activeTimer = this.engine.timing.timestamp
        } else {
            // Stucked avoidance, if we are active for longer than x second then kill it
            let elapsedTime = (this.engine.timing.timestamp - this.activeTimer) / 1000

            if (elapsedTime > this.config.maxTimeForPersonToBeActive) {
                this.active = false
                return false
            }
        }
        if (this.pausedTimer != null && this.pausedTimer > this.engine.timing.timestamp) {
            Body.setVelocity(this.body, {x: 0, y:0})
            return true
        }
        this.pausedTimer = null

        if (!this.hasTarget()) {
            if (this.nextTarget() == null) {
                return false
            }
        }
        if (this.hasTarget()) {
            let vec = Vector.normalise(this.vectorFrom(this.getCurrentTarget()))
            // vec = Vector.mult(vec, 2)
            vec = Vector.mult(vec, 0.0003)

            // Body.setVelocity(this.body, vec)
            Body.applyForce(this.body, {x: this.body.position.x, y: this.body.position.y},
                {x: vec.x, y: vec.y})
        }

        // Limit max velocity
        let maxVelocity = 3
        if (this.body.speed > maxVelocity) {
            let vel = Vector.normalise(this.body.velocity)
            vel = Vector.mult(vel, maxVelocity)
            Body.setVelocity(this.body, vel)
        }
        return true
    }
    hasTarget() {
        return this.targets.length > 0
    }
    setTargets(targets) {
        this.targets = targets
        this.currentTarget = 0
    }
    nextTarget() {
        if (this.currentTarget < this.targets.length - 1) {
            let curTarget = this.targets[this.currentTarget]
            this.pausedTimer = this.engine.timing.timestamp + curTarget.duration
            this.currentTarget += 1

            return this.targets[this.currentTarget]
        }
        // We are done
        this.active = false
    }
    getCurrentTarget() {
        if (this.currentTarget >= 0 && this.currentTarget < this.targets.length) {
            return this.targets[this.currentTarget]
        }
        return null
    }
    collideWith(obj) {
        super.collideWith(obj)
        if (obj == this.getCurrentTarget()) {
            this.nextTarget()
        }
    }
    startSick(newlyAcquired=true) {
        this.sickTimer = this.engine.timing.timestamp
        if (newlyAcquired) {
            this.stats.numSickPeopleAcquired += 1
            this.condition = condition.NEWLY_SICK
        } else {
            this.stats.numSickPeopleEntered += 1
            this.condition = condition.ORIGINALLY_SICK
        }
    }
    reset() {
        this.sickTimer = null
        this.condition = condition.HEALTHY
        this.currentTarget = -1
        this.pausedTimer = null
        this.active = true
        this.activeTimer = null
    }
    isImune() {
        // Imune when entering or exiting the store otherwise everyone will be sick
        // as they are passing each other at the door
        return (this.currentTarget == 0 || this.currentTarget == this.targets.length - 1)
    }
    closeTo(obj) {
        if (obj == this) {
            return
        }
        if (obj instanceof Person) {
            // Push each other away if too close
            let pushVec = Vector.neg(this.vectorFrom(obj))
            let length = Vector.magnitude(pushVec)

            if (length <= this.socialDistance) {
                let pushForce = Math.min(this.socialDistanceFactor / length, 0.001)
                let pushVecScaled = Vector.mult(Vector.normalise(pushVec), pushForce)
                Body.applyForce(this.body, {x: this.body.position.x, y: this.body.position.y},
                    {x: pushVecScaled.x, y: pushVecScaled.y})
            }

            if (this.isImune()) {
                return
            }
            if (length < this.config.infectedRadius && this.condition == condition.HEALTHY &&
                (obj.condition == condition.NEWLY_SICK || obj.condition == condition.ORIGINALLY_SICK) &&
                Math.random() > 1.0 - this.config.infectionProbabiltyOnContact) {
                this.startSick()
            }
        }
    }
}