class Actor {
    constructor(config) {
        this.body = null
        this.place = null
        this.config = config
    }

    vectorFrom(actor) {
        return Vector.sub(actor.body.position, this.body.position)
    }

    collideWith(obj) {
    }
    closeTo(obj) {
    }
    getBody() {
        return this.body
    }
    setPlace(place) {
        this.place = place
    }
}
