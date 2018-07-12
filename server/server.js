const express = require('express')
const socketio = require('socket.io');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

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

// (`https://opentdb.com/api.php?amount=5&category=${category}&difficulty=hard&type=multiple`)
app.get('/start/:room', (request, response) => {
    const room = request.params.room
    if (!rooms.hasOwnProperty(room)) {
        response.send({ users: null, err: 'Room does not exist' })
    }
    const categories = [...Array(24).keys()].map(x => x + 9);
    const category = categories[Math.floor(Math.random() * categories.length)]
    return fetch(`https://opentdb.com/api.php?amount=5&difficulty=hard&type=multiple`)
        .then(response => response.json())
        .then(json => {
            rooms[room].questions = json;
            rooms[room].started = true;
            rooms[room].room.emit('users', `Game started.`)
            response.send({ users: rooms[room].users, err: null });
        })
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

app.post('/create', (req, resp) => {
    const randomStringGenerator = () => {
        return Math.random().toString(36).toUpperCase().slice(2)
    }
    const room = randomStringGenerator();
    console.log(rooms);
    rooms[room] = {}
    rooms[room].room = io.of(`/${room}`)
    rooms[room].started = false;
    rooms[room].room.on('connection', (socket) => {
        socket.on('room', (ready) => {
            socket.emit('room', 'Room Ready')
        })
    })

    resp.send({ roomName: room })

})

app.post('/user/:room', (req, resp) => {
    const room = req.params.room;
    if (!rooms.hasOwnProperty(room)) {
        resp.send({ users: null, err: 'Room does not exist' })
    }
    if (rooms[room].started) {
        response.send({ users: null, err: 'Game has started' })
    }
    const newUser = req.body.user;
    rooms[room].users = rooms[room].users || [];
    console.log(newUser);
    if (rooms[room].users.includes(newUser)) {
        resp.send({ users: null, err: 'User name already registerd to room' })
    }
    rooms[room].users.push(newUser);
    console.log(rooms[room].users);
    rooms[room].room.emit('users', {msg: `${newUser} has joined.`, users: rooms[room].users})
    resp.send({ users: rooms[room].users, err: null })
})
