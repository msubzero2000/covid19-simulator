
class Wall extends Actor {
    constructor(config, x1, y1, x2, y2) {
        super(config)
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }
    createBody(group) {
        let centerX = (this.x2 + this.x1) / 2
        let centerY = (this.y2 + this.y1) / 2
        this.body = Bodies.rectangle(centerX, centerY, this.x2 - this.x1, this.y2 - this.y1,
            {
                isStatic: true,
                collisionFilter: {
                    group: group
                },
                render: {
                    fillStyle: 'rgb(80, 100, 80)'
                }
            })
        this.body.object = this
        return this.body
    }
    update() {
        return true
    }

}