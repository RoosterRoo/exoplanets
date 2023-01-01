const { getAllLaunches, ifLaunchExists, abortLaunch, scheduleNewLaunch} = require('../../models/launches.model')

const { getPagination } = require('../../services/query')

async function httpGetAllLaunches(req, res) {
    const {skip, limit } = getPagination(req.query)
    const launches = await getAllLaunches(skip, limit)
    res.status(200).json(launches)
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body

    if (!launch.mission || !launch.target || !launch.rocket || !launch.launchDate) {
        return res.status(400).json({
            error: "Missing required launch property"
        })
    }

    launch.launchDate = new Date(launch.launchDate)

    if (!isNaN(launch.launchDate)) {
        await scheduleNewLaunch(launch)
        return res.status(201).json(launch)
    } else {
        return res.status(400).json({
            error: "Invalid launch date"
        })
    }
    
}

async function httpAbortLaunch(req, res) {
    const launchId = Number(req.params.id)

    const abortedLaunch = await ifLaunchExists(launchId)

    if(!abortedLaunch) {
        return res.status(404).json({
            error: "Launch not found"
        })
    }
    const aborted = await abortLaunch(launchId)

    if (!aborted) {
        return res.status(400).json({
            error: "Launch not aborted"
        })
    }
    return res.status(200).json({
        ok: true
    })
}

module.exports =  {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,
}