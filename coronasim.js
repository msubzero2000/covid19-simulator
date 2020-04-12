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

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getParams() {
    var params = getUrlVars()

    let sdc = params['sdc']
    if (sdc == null) {
        sdc = "0"
    } else {
        sdc  = Math.min(Math.max(0, parseInt(sdc)), 1)
    }
    let maxPerPerson = params['mposl']
    if (maxPerPerson == null) {
        maxPerPerson = 10
    } else {
        maxPerPerson  = Math.min(Math.max(10, parseInt(maxPerPerson)), 50)
    }
    let numSickPeople = params['numSick']
    if (numSickPeople == null) {
        numSickPeople = 1
    } else {
        numSickPeople  = Math.min(Math.max(1, parseInt(numSickPeople)), 9)
    }
    return {
        sdc: sdc,
        maxPerPerson: maxPerPerson,
        numSickPeople: numSickPeople
    }
}

params = getParams()
let socialDistancePoorRadio = document.getElementById("sdPoorRadio");
let socialDistanceGoodRadio = document.getElementById("sdGoodRadio");
if (params.sdc == 0) {
    socialDistancePoorRadio.checked = true
} else{
    socialDistanceGoodRadio.checked = true
}

let maxPersonPerSiteSlider = document.getElementById("maxPersonPerSiteSlider");
let maxPersonPerSiteOutput = document.getElementById("maxPersonPerSiteOutput");
maxPersonPerSiteSlider.value = params.maxPerPerson
maxPersonPerSiteOutput.innerHTML = maxPersonPerSiteSlider.value + " at a time";

let numberOfSickPersonSlider = document.getElementById("numberOfSickPeopleEnteredSlider");
let numberOfSickPersonOutput = document.getElementById("numberOfSickPeopleEnteredOutput");
numberOfSickPersonSlider.value = params.numSickPeople
numberOfSickPersonOutput.innerHTML = numberOfSickPersonSlider.value + " in 10";

let restartButton = document.getElementById("restartSimulation");

restartSimulation()

function restartSimulation() {
    let stats = {
        numPeopleEntered: 0,
        numSickPeopleEntered: 0,
        numSickPeopleAcquired: 0
    }

    var sdCompliance = (socialDistanceGoodRadio.checked) ? 1 : 0

    let config = {
        socialDistanceCompliance: sdCompliance,
        numberOfSickPeople: numberOfSickPersonSlider.value, // x in 10 unit
        numPerson: 100,
        maxPersonInPlace: maxPersonPerSiteSlider.value,
        stageWidth: 600,
        stageHeight: 600,
        simulationDuration: 45, // 45 secs
        numTargetsToVisit: 6,
        infectedRadius: 30,
        infectionProbabiltyOnContact: 0.1,  // 10% chance of getting infected if within infected radius
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

socialDistancePoorRadio.onclick = function() {
    restartSimulation()
}

socialDistanceGoodRadio.onclick = function() {
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
