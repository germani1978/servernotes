const express = require('express')
var morgan = require('morgan')
const cors = require('cors')
const app = express()

let notes = [
    {
        id: 1,
        name: 'Arto Hellas',
        number: '040-123456'
    },
    {
        id: 2,
        name: 'Ada Lovelace',
        number: '39-44-5323523'
    },
    {
        id: 3,
        name: 'Dan Abramov',
        number: '12-43-234345'
    },
    {
        id: 4,
        name: 'Mary Poppendieck',
        number: '39-23-6423122'
    }
]

morgan.token('type', function (req, res) {
    return JSON.stringify(req.body)
})

app.use(cors())

app.use(
    morgan(function (tokens, req, res) {
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

app.get('/api/persons', (request, response) => {
    response.json(notes)
})

app.get('/info', (request, response) => {
    const len = notes.length
    const date = new Date()
    const d = date.toUTCString()
    const resp = `<div><p>phone has info for ${len} people</p><p>${d}<p/></div>`
    response.send(resp)
})

app.get('/persons/:id', (request, response) => {
    const noteId = notes.filter(note => note.id === Number(request.params.id))
    noteId.length !== 0 ? response.send(noteId[0]) : response.sendStatus(404)
})

app.use(express.json())

app.post('/api/persons', (request, response) => {
    const contact = request.body

    if (!('name' in contact)) return response.status(404).send('missing name')

    if (!('number' in contact))
        return response.status(404).send('missing number')

    const max = notes.length === 0 ? 0 : Math.max(...notes.map(note => note.id))

    notes.push({
        ...contact,
        id: max + 1
    })

    response.json({
        ...contact,
        id: max + 1
    })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
