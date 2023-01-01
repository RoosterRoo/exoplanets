const request = require('supertest')
const app = require('../../app')
const { mongoConnect, mongoDisconnect } = require('../../services/mongo')
// const { currentFlightNumber } = require('../../models/launches.model')

describe('Launches API test', () => {

    beforeAll(async () => {
        await mongoConnect()
    })

    afterAll(async () => {
        await mongoDisconnect()
    })

    describe('Test /GET launches', () => {
    test('It should respond with status 200', async () => {
        const response = await request(app)
        .get('/v1/launches')
        .expect('Content-Type', /json/)
        expect(response.statusCode).toBe(200)
    })
})

    describe('Test /POST launches', () => {
        const completeLaunchData = {
        mission: "USS Enterprise",
        rocket: 'NCC 1701-D',
        target: 'Kepler-62 f',
        launchDate: 'January 4, 2028'
        }

        const launchDatawithoutDate = {
        mission: "USS Enterprise",
        rocket: 'NCC 1701-D',
        target: 'Kepler-62 f',
        }

    test('It should respond with status 201 created', async () => {
        const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchData)
        .expect('Content-Type', /json/)
        .expect(201)

        const requestDate = new Date(completeLaunchData.launchDate).valueOf()
        const responseDate = new Date(response.body.launchDate).valueOf()

        //const responseFlightNumber = Number(response.body.flightNumber)

        expect(requestDate).toBe(responseDate)

        expect(response.body).toMatchObject(launchDatawithoutDate)

        //expect(responseFlightNumber).toBe(currentFlightNumber + 1)
    })

    test('It should respond with status 400 for missing properties', async () => {
        const response = await request(app)
        .post('/v1/launches')
        .send(launchDatawithoutDate)
        .expect('Content-Type', /json/)
        .expect(400)
        
        expect(response.body).toStrictEqual({
            error: "Missing required launch property"
        })
    })

    test('It should respond with status 400 for invalid date', async () => {
        const response = await request(app)
        .post('/v1/launches')
        .send({
            ...completeLaunchData,
            launchDate: 'hello'
        })
        .expect('Content-Type', /json/)
        .expect(400)

        expect(response.body).toStrictEqual({
            error: "Invalid launch date"
        })
    })
    
    })
})


