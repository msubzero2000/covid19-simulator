
class Target extends Actor {
    constructor(config, label, x, y) {
        super(config)
        this.x = x
        this.y = y
        this.label = label
    }

    createBody(group, colorStyle, sprite) {
        if (this.label == 'entrance' || this.label == 'exit') {
            this.body = Bodies.rectangle(this.x, this.y, 60, 40,
                {
                    isStatic: true,
                    collisionFilter: {
                        group: group,
                        mask: 4
                    },
                    render: {
                        sprite: sprite
                    }
                })
        } else {
            this.body = Bodies.circle(this.x, this.y, 25,
                {
                    isStatic: true,
                    collisionFilter: {
                        group: group,
                        mask: 4
                    },
                    render: {
                        sprite: sprite
                    }
                })
        }
        this.body.object = this
        return this.body
    }
    update() {
        return true
    }
}