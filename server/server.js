const express = require('express')
const socketio = require('socket.io');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const querystring = require('querystring')

const app = express();
app.use(bodyParser.json())
const PORT = process.env.PORT || 4567;
const server = app.listen(PORT, () => {
    console.log(`Express web server listening on port ${PORT}`);
});
const io = socketio(server);

// Objects of all the rooms
let rooms = {}

io.attach(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})
// https://opentdb.com/api.php?amount=5&difficulty=hard&type=multiple&encode=url3986
// (`https://opentdb.com/api.php?amount=5&category=${category}&difficulty=hard&type=multiple`)
app.get('/start/:room', (request, response) => {
    const room = request.params.room
    if (!rooms.hasOwnProperty(room)) {
        response.send({ users: null, err: 'Room does not exist' })
    }
    const categories = [...Array(24).keys()].map(x => x + 9);
    const category = categories[Math.floor(Math.random() * categories.length)]
    fetch(`https://opentdb.com/api.php?amount=5&difficulty=hard&type=multiple&encode=url3986`)
        .then(response => response.json())
        .then(json => {
            rooms[room].questions = json.results.map((x) => {
                correct_answer: querystring.unescape(x.correct_answer);
                choices: x.incorrect_answers.map(answer => {
                    return querystring.unescape(answer);
                });
                correct_position = Math.floor(Math.random() * (choices.length + 1));
                choices.splice(correct_position, 0, correct_answer);
                return {
                    question: querystring.unescape(x.question),
                    correct: correct_position,
                    choices: choices
                };
            })
            rooms[room].started = true;
            console.log(rooms);
            console.log(rooms[room].questions);
            rooms[room].room.emit('users', `Game started.`)
            response.send({ users: rooms[room].users, err: null });
        })
    // Interval, code to 
})

app.get('/user/:room', (request, response) => {
    const room = request.params.room
    if (!rooms.hasOwnProperty(room)) {
        response.send({ users: null, err: 'Room does not exist' })
    }
    else if (rooms[room].started) {
        response.send({ users: null, err: 'Game has started' })
    } else {
        response.send({ users: rooms[room].users, err: null });
    }
})

// io.on('connection', client => {
//     client.on('timer', (interval) => {
//         console.log('client is subscribing to timer with interval ', interval);
//         setInterval(() => {
//             client.emit('timer', new Date());
//         }, interval);
//     });
// })

// client.send(client.id);

app.post('/create', (req, resp) => {
    const randomStringGenerator = () => {
        return Math.random().toString(36).toUpperCase().slice(2)
    }
    const room = randomStringGenerator();
    rooms[room] = {}
    rooms[room].room = io.of(`/${room}`)
    rooms[room].started = false;
    rooms[room].current = 0;
    rooms[room].room.on('connection', (socket) => {
        socket.on('room', (ready) => {
            socket.emit('room', 'Room Ready')
        })
        socket.on('question', (answer) => {
            if ((rooms[room].started) && rooms[room].questions[rooms[room].current].question === answer.question && rooms[room].questions[rooms[room].current].correct === answer.answer) {
                // Add a point to user
            }
        })
    })

    resp.send({ roomName: room })

})

app.post('/user/:room', (req, resp) => {
    const room = req.params.room;
    if (!rooms.hasOwnProperty(room)) {
        return resp.send({ users: null, err: 'Room does not exist' })
    }
    if (rooms[room].started) {
        return response.send({ users: null, err: 'Game has started' })
    }
    const newUser = req.body.user;
    rooms[room].users = rooms[room].users || [];
    if (rooms[room].users.includes(newUser)) {
        return resp.send({ users: null, err: 'User name already registerd to room' })
    }
    rooms[room].users.push(newUser);
    rooms[room].room.emit('users', { msg: `${newUser} has joined.`, users: rooms[room].users })
    resp.send({ users: rooms[room].users, err: null })
})
