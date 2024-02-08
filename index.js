const express = require('express')
var logger = require('morgan')
const cors = require('cors')
require('dotenv').config()
// const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())

//--------------------------------------------

require('dotenv').config()

const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(url)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

const personSchema = new mongoose.Schema({
    name: String,
    number: String
})

const Person = mongoose.model('Person', personSchema)

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

//------------------------------------------------------------------------------

logger.token('type', function (req, res) {
    return JSON.stringify(req.body)
})

app.use(
    logger(function (tokens, req, res) {
        return [
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'),
            '-',
            tokens['response-time'](req, res),
            'ms',
            tokens['type'](req, res)
        ].join(' ')
    })
)

// ok mongo
app.get('/api/persons', (request, response) => {
    Person.find({}).then(result => {
        response.json(result)
    })
})

// ok mongo
app.get('/info', (request, response) => {
    Person.find({}).then(result => {
        const len = result.length
        const date = new Date()
        const d = date.toUTCString()
        const resp = `<div><p>phone has info for ${len} people</p><p>${d}<p/></div>`
        response.send(resp)
    })
})

//ok mongo
app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(err => next(err))
})

// ok mongo
app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(err => next(err))
})

//ok mongo
app.post('/api/persons', (request, response) => {
    const contact = request.body

    if (!('name' in contact)) return response.status(404).send('missing name')

    if (!('number' in contact))
        return response.status(404).send('missing number')

    const person = new Person({
        name: contact.name,
        number: contact.number
    })

    person.save().then(savePerson => {
        response.json(savePerson)
    })
})

app.put('/api/persons/:id', (request, response) => {
    const { name, number, id } = request.body

    const person = {
        name: name,
        number: number
    }

    Person.findByIdAndUpdate(id, person, { new: true })
        .then(updateNote => {
            response.json(updateNote)
        })
        .catch(err => next(err))
})

const PORT = process.env.PORT || 3001

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)
