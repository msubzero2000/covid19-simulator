class CoronaSim {

    constructor(config, stats) {
        Matter.Resolver._restingThresh = 1;
        this.config = config
        this.persons = new Array()
        this.stats = stats
        this.sickFrequency = config.numberOfSickPeople / 9.9 // To get 1 sick people per 10 otherwise the sicky will be no 11 due to floating point precission
        this.accumSickFrequency = 0

        for (let i=0; i< config.numPerson; i++) {
            let person = new Person(config, parseInt(config.socialDistanceCompliance), stats);
            this.persons.push(person)
        }
        this.supermarket = new Supermarket(document.querySelector('#render'), config, stats)

        let self = this;
        setInterval(function(){ self.update(); }, 250);
    }

    update() {
        for (let person of this.persons) {
            if (this.supermarket.numPerson() >= this.config.maxPersonInPlace || this.stats.numPeopleEntered >= this.config.numPerson) {
                return
            }
            if (person.place != this.supermarket) {
                this.supermarket.addPerson(person)

                // Decide if this person is supposed to be sick
                this.accumSickFrequency += this.sickFrequency

                if (this.accumSickFrequency >= 1.0) {
                    this.accumSickFrequency -= 1.0
                    person.startSick(false)
                }
                this.stats.numPeopleEntered += 1
                break
            }
        }
    }
}

function socialDistanceLabel(value) {
    switch (parseInt(value)) {
        case 0:
            return 'poor'
            break
        case 1:
            return 'moderate'
            break
        case 2:
            return 'good'
    }
}

let socialDistanceSlider = document.getElementById("socialDistanceSlider");
let socialDistanceOutput = document.getElementById("socialDistanceOutput");
socialDistanceOutput.innerHTML = socialDistanceLabel(socialDistanceSlider.value);

let maxPersonPerSiteSlider = document.getElementById("maxPersonPerSiteSlider");
let maxPersonPerSiteOutput = document.getElementById("maxPersonPerSiteOutput");
maxPersonPerSiteOutput.innerHTML = maxPersonPerSiteSlider.value + " at a time";

let numberOfSickPersonSlider = document.getElementById("numberOfSickPeopleEnteredSlider");
let numberOfSickPersonOutput = document.getElementById("numberOfSickPeopleEnteredOutput");
numberOfSickPersonOutput.innerHTML = numberOfSickPersonSlider.value + " in 10";

let restartButton = document.getElementById("restartSimulation");

restartSimulation()

function restartSimulation() {
    let stats = {
        numPeopleEntered: 0,
        numSickPeopleEntered: 0,
        numSickPeopleAcquired: 0
    }

    let config = {
        socialDistanceCompliance: socialDistanceSlider.value,
        numberOfSickPeople: numberOfSickPersonSlider.value, // x in 10 unit
        numPerson: 100,
        maxPersonInPlace: maxPersonPerSiteSlider.value,
        stageWidth: 600,
        stageHeight: 600,
        simulationDuration: 45, // 45 secs
        numTargetsToVisit: 6,
        infectedRadius: 25,
        infectionProbabiltyOnContact: 0.05,  // 5% chance of getting infected if within infected radius
        maxTimeForPersonToBeActive: 60, // 60 sec
        entrance: {
            x: 200,
            y: 510,
            sprite: {
                texture: 'images/pipe-entrance.png',
                xScale: 0.5, yScale: 0.5, yOffset: -0.6
            }
        },
        exit: {
            x: 400,
            y: 540,
            sprite: {
                texture: 'images/pipe-exit.png',
                xScale: 0.5, yScale: 0.5, yOffset: -0.37
            }
        },
        targets: [
            {
                label: 'meat', x: 150, y: 130, duration: 1,
                sprite: {
                    texture: 'images/meat.png',
                    xScale: 0.3, yScale: 0.3
                }
            },
            {
                label: 'vegies', x: 450, y: 130, duration: 1,
                sprite: {
                    texture: 'images/lettuce.png',
                    xScale: 0.3, yScale: 0.3
                }
            },
            {
                label: 'fruits', x: 150, y: 270, duration: 1,
                sprite: {
                    texture: 'images/fruits.png',
                    xScale: 0.2, yScale: 0.2
                }
            },
            {
                label: 'biscuits', x: 450, y: 270, duration: 1,
                sprite: {
                    texture: 'images/biscuits.png',
                    xScale: 0.2, yScale: 0.2
                }
            },
            {
                label: 'milk', x: 150, y: 410, duration: 1,
                sprite: {
                    texture: 'images/milk.png',
                    xScale: 0.2, yScale: 0.2
                }
            },
            {
                label: 'toilet roll', x: 450, y: 410, duration: 1,
                sprite: {
                    texture: 'images/toilet-rolls.png',
                    xScale: 0.2, yScale: 0.2
                }
            }
        ]
    }

    let sim = new CoronaSim(config, stats)
}

socialDistanceSlider.oninput = function() {
    socialDistanceOutput.innerHTML = socialDistanceLabel(this.value);

    restartSimulation()
}

maxPersonPerSiteSlider.oninput = function() {
    maxPersonPerSiteOutput.innerHTML = this.value + " at a time";

    restartSimulation()
}

numberOfSickPersonSlider.oninput = function() {
    numberOfSickPersonOutput.innerHTML = this.value + " in 10";

    restartSimulation()
}

restartButton.onclick = function() {
    restartSimulation()
}
