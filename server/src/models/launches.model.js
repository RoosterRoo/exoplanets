const axios = require('axios')

const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100

const SPACEX_URL = 'https://api.spacexdata.com/v4/launches/query'

async function loadSpaceXData() {

    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    })
    if(firstLaunch) {
        console.log('Launches already loaded!');
    } else {
        populateLaunches()
    }
}

async function populateLaunches() {
    const response = await axios.post(SPACEX_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1
                    }
                }, {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    }, {
        headers: { 'Accept-Encoding': 'application/json' }
    }
    )

    if(response.status !== 200) {
        console.log('Problem downloading data');
        throw new Error('Download failed')
    }

    const launchDocs = response.data.docs
    // console.log(launchDocs)
    for(const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads']
        const customers = payloads.flatMap((payload) => {
            return payload['customers']
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        }
        console.log(`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch)
    }
}

async function getAllLaunches(skip, limit) {
    //return Array.from(launches.values())
    return await launchesDatabase
    .find({}, {
        '_id': 0, '__v': 0
    })
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit)
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber')

    if(!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER
    }

    return latestLaunch.flightNumber
}

async function saveLaunch(launch) {
    return await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    })
}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter)
}

async function ifLaunchExists(id) {
    return findLaunch({
        flightNumber: id,
    })
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target
    })

    if(!planet) {
        throw new Error('No matching planet found')
    }

    const currentFlightNumber = await getLatestFlightNumber() + 1

    const newLaunch = Object.assign(launch, {
                flightNumber: currentFlightNumber,
                upcoming: true,
                success: true,
                customers: ["ZTM", "ISRO"],
                flightNumber: currentFlightNumber
            })
    await saveLaunch(newLaunch)
}

async function abortLaunch(id) {
    const aborted = await launchesDatabase.updateOne({
        flightNumber: id
    }, {
        upcoming: false,
        success: false
    })

    return aborted.modifiedCount === 1
}

module.exports = {
    loadSpaceXData,
    getAllLaunches,
    ifLaunchExists,
    scheduleNewLaunch,
    abortLaunch,
}