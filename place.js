// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;
    Vector = Matter.Vector

class Place {
    constructor(canvas, config, stats) {
        this.stats = stats
        this.config = config
        this.active = true

        this.objects = new Array()
        this.renderBodies = new Array()

        this.engine = Engine.create();
        this.engine.timing.timeScale = 1.0
        this.engine.world.gravity.scale = 0;
        this.render = Render.create({
            canvas: canvas,
            engine: this.engine,
            options: {
                height: config.stageHeight,
                width: config.stageWidth,
                wireframes: false
            }
        });

        this.collidingGroup = Body.nextGroup(false)
        this.nonCollidingGroup = Body.nextGroup(true)

        this.objects = new Array()
        this.renderBodies = new Array()
        this.targets = new Array()
        this.targetIndexes = new Array()

        let wallSize = 20

        for (let target of config.targets) {
            this.addTarget(new Target(this.config, target.label, target.x, target.y, target.duration),
                true, this.collidingGroup, 'brown', target.sprite)
        }

        this.entranceTarget = this.addTarget(new Target(this.config, 'entrance', config.entrance.x, config.entrance.y),
            false, this.nonCollidingGroup, 'darkgreen', config.entrance.sprite)
        this.exitTarget = this.addTarget(new Target(this.config, 'exit', config.exit.x, config.exit.y),
            false, this.collidingGroup, 'darkgreen', config.exit.sprite)

        let wall1 = new Wall(this.config, 0, config.stageHeight - wallSize, config.stageWidth, config.stageHeight);
        let wall2 = new Wall(this.config, 0, 0, wallSize, config.stageHeight);
        let wall3 = new Wall(this.config, config.stageWidth - wallSize, 0, config.stageWidth, config.stageHeight);
        let wall4 = new Wall(this.config, 0, 0, config.stageWidth, wallSize);

        this.renderBodies.push(wall1.createBody(this.collidingGroup))
        this.renderBodies.push(wall2.createBody(this.collidingGroup))
        this.renderBodies.push(wall3.createBody(this.collidingGroup))
        this.renderBodies.push(wall4.createBody(this.collidingGroup))
        this.objects.push(wall1)
        this.objects.push(wall2)
        this.objects.push(wall3)
        this.objects.push(wall4)

        // add all of the bodies to the world
        World.add(this.engine.world, this.renderBodies);

        // run the engine
        Engine.run(this.engine);

        // run the renderer
        Render.run(this.render);
        let self = this;

        Matter.Events.on(this.engine, 'collisionStart', function (event) {
            self.onCollision(event)
        });
        Matter.Events.on(this.engine, 'beforeUpdate', function (event) {
            self.onUpdate()
        });
        Matter.Events.on(this.render, 'afterRender', function (event) {
            self.onAfterRender()
        });
    }

    numPerson() {
        let total = 0
        for (let obj of this.objects) {
            if (obj instanceof Person) {
                total += 1
            }
        }
        return total
    }
    addTarget(target, randomTarget, collidingGroup, colorStyle, sprite) {
        if (randomTarget) {
            this.targets.push(target)
            this.targetIndexes.push(this.targetIndexes.length)
        }
        this.renderBodies.push(target.createBody(collidingGroup, colorStyle, sprite))

        return target
    }

    addPerson(person) {
        let x = this.config.entrance.x + Math.round(Math.random() * 20) - 10;
        let y = this.config.entrance.y;

        let speed = Math.max(1, Math.random() * 3)
        let angle = Math.random() * Math.PI * 2.0

        person.setPlace(this)
        person.reset()
        this.objects.push(person)

        let newBody = person.createBody(x, y, angle, speed, this.collidingGroup, this.engine)
        this.renderBodies.push(newBody)

        World.add(this.engine.world, new Array(newBody))

        // Create target waypoints
        const shuffled = this.targets.sort(() => 0.5 - Math.random());
        let targets = shuffled.slice(0, this.config.numTargetsToVisit);

        // Go to exit
        targets.push(this.exitTarget)

        person.setTargets(targets)
    }

    onUpdate() {
        if (!this.active) {
            return
        }
        // Social distancing
        for (let obj1 of this.objects) {
            for (let obj2 of this.objects) {
                obj1.closeTo(obj2)
            }
        }

        let newRenderBodies = new Array()
        let newObjects = new Array()

        for (let obj of this.objects) {
            if (obj.update()) {
                newObjects.push(obj)
                newRenderBodies.push(obj.getBody())
            } else {
                obj.setPlace(null)
                Matter.Composite.remove(this.engine.world, obj.getBody())
            }
        }
        this.renderBodies = newRenderBodies
        this.objects = newObjects
    }

    onCollision(event) {
        for (let pair of event.pairs) {
            let bodyA = pair.bodyA.object
            let bodyB = pair.bodyB.object

            bodyA.collideWith(bodyB)
            bodyB.collideWith(bodyA)
        }
    }

    onAfterRender(event) {
        let context = this.render.context;

        let progress = (this.engine.timing.timestamp / 10) / this.config.simulationDuration

        let infectionRate = 0
        if (this.stats.numPeopleEntered > 0) {
            // Also show the rate of infection (newly infected / total healthy people entered the shop)
            infectionRate = Math.round(this.stats.numSickPeopleAcquired * 100 / (this.stats.numPeopleEntered - this.stats.numSickPeopleEntered))
        }

        context.font = "13px Arial"
        let fadeDuration = 2
        if (progress >= 100) {
            let fade = Math.min((progress - 100) / fadeDuration, 0.8)

            context.fillStyle = "rgba(0, 0, 0, " + fade + ")"
            context.fillRect(0, 0, this.config.stageWidth, this.config.stageHeight)

            if (progress >= 100 + fadeDuration) {
                context.font = "35px Arial"
                context.fillStyle = "rgb(220, 220, 220)"
                context.fillText("Completed", 220, 300)

                context.font = "20px Arial"
                context.fillStyle = "rgb(238, 197, 23)"
                let newInfectionStr = "Infection Rate " + infectionRate + "%"
                context.fillText(newInfectionStr, 230, 340)
            }
            this.active = false
        } else {
            context.fillStyle = "rgb(220, 220, 220)"
            context.fillText("Progress: " + Math.round(progress) + "%", 250, 15)
        }
        context.strokeStyle = "rgb(60, 70, 60)"
        context.beginPath();
        context.moveTo(35, 60);
        context.lineTo(565, 60);
        context.stroke();

        let offset = 60
        context.font = "18px Arial"
        context.fillStyle = "Gray"
        context.fillText("Entered:", offset, 50);
        context.fillStyle = "rgb(58, 136, 254)"
        context.fillText("Healthy:", 120 + offset, 50);
        context.fillStyle = "rgb(255, 100, 100)"
        context.fillText("Sick:", 245 + offset, 50);
        context.fillStyle = "rgb(238, 197, 23)"
        context.fillText("Infected:", 340 + offset, 50);

        context.font = "18px Arial"
        context.fillStyle = "rgb(220, 220, 220)"
        context.fillText(this.stats.numPeopleEntered, 80 + offset, 50);
        context.fillText(this.stats.numPeopleEntered - this.stats.numSickPeopleEntered, 200 + offset, 50);
        context.fillText(this.stats.numSickPeopleEntered, 295 + offset, 50);

        let curNewInfectionStr = this.stats.numSickPeopleAcquired.toString() + " (" + infectionRate.toString() + "%)"
        context.fillText(curNewInfectionStr, 420 + offset, 50);
    }
}