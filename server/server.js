const express = require('express')
const socketio = require('socket.io');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
// app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
const PORT = process.env.PORT || 4567;
const server = app.listen(PORT, () => {
    console.log(`Express web server listening on port ${PORT}`);
});
const io = socketio(server);

let users = {}

io.attach(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})

// (`https://opentdb.com/api.php?amount=5&category=${category}&difficulty=hard&type=multiple`)
app.get('/room.json', (request, response) => {
    const categories = [...Array(24).keys()].map(x => x + 9);
    const category = categories[Math.floor(Math.random() * categories.length)]
    return fetch(`https://opentdb.com/api.php?amount=5&difficulty=hard&type=multiple`)
        .then(response => response.json())
        .then(json => response.send(json))
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
    const randomString = randomStringGenerator();

    let newRoom = io.of(`/${randomString}`)
    newRoom.on('connection', (socket) => {
        socket.on('room', (ready) => {
            socket.emit('room', 'Room Ready')
        })
    })

    resp.send({roomName: randomString})

})

app.post('/user/:room', (req, resp) => {
    const room = req.params.room;
    let roomSocket = io.of(`/${room}`);
    const newUser = req.body.user;
    users[room] = users[room] || [];
    console.log(newUser);    
    users[room].push(newUser);
    console.log(users);
    // users.concat(newUser);
    roomSocket.emit('room', { users: users[room] })
    resp.send({ users: users[room] })
})
