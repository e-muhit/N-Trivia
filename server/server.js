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

let rooms = {}

io.attach(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})

app.get('/start/:room/:level', (request, response) => {
    const room = request.params.room
    const level = request.params.level
    if (!rooms.hasOwnProperty(room)) {
        response.send({ users: null, err: 'Room does not exist' })
    }
    rooms[room].current = 0
    rooms[room].users.map(x => {
        x.points = 0,
            x.answer = []
    })
    rooms[room].starts++
    rooms[room].room.emit('start', { starts: rooms[room].starts })
    console.log(level)
    fetch(`https://opentdb.com/api.php?amount=1&difficulty=${level}&type=multiple&encode=url3986`)
        .then(response => response.json())
        .then(json => {
            rooms[room].questions = json.results.map((x) => {
                correct_answer = querystring.unescape(x.correct_answer);
                choices = x.incorrect_answers.map(answer => {
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
            rooms[room].room.emit('users', `Game started.`)
            response.send({ users: rooms[room].users, err: null });

            let questionDuration = 60;
            let timer = questionDuration;
            let roomTimer = setInterval(() => {
                if (timer === questionDuration) {
                    rooms[room].room.emit('question',
                        {
                            question: rooms[room].questions[rooms[room].current].question,
                            choices: rooms[room].questions[rooms[room].current].choices
                        })
                }
                rooms[room].room.emit('timer', { time: timer });
                if (--timer < 0 || rooms[room].answersAmount >= rooms[room].users.length) {
                    rooms[room].answersAmount = 0
                    timer = questionDuration;
                    rooms[room].current++;
                    if (rooms[room].current > rooms[room].questions.length - 1) {
                        clearInterval(roomTimer);
                        rooms[room].room.emit('score', { users: rooms[room].users })
                    }
                }
            }, 1000)
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

app.post('/create', (req, resp) => {
    const randomStringGenerator = () => {
        return Math.random().toString(36).toUpperCase().slice(2)
    }
    const room = randomStringGenerator();
    rooms[room] = {}
    rooms[room].room = io.of(`/${room}`)
    rooms[room].started = false;
    rooms[room].current = 0;
    rooms[room].answersAmount = 0;
    rooms[room].starts = 0;
    rooms[room].room.on('connection', (socket) => {
        socket.on('room', (ready) => {
            socket.emit('room', 'Room Ready')
        })
        socket.on('start', (msg) => {
            difficulty = msg
        })
        socket.on('answer', (answer) => {
            rooms[room].answersAmount++
            if ((rooms[room].started) && rooms[room].questions[rooms[room].current].question === answer.question && rooms[room].questions[rooms[room].current].correct === answer.answer) {
                for (let x = 0; x < rooms[room].users.length; x++) {
                    if (rooms[room].users[x].name == answer.user) {
                        rooms[room].users[x].points += 1000
                        rooms[room].users[x].answer.push(`${rooms[room].questions[rooms[room].current].question}, Your Answer: ${rooms[room].questions[rooms[room].current].choices[answer.answer]}  ✅`)
                        console.log(rooms[room].users[x]);
                    }
                }
            } else {
                for (let y = 0; y < rooms[room].users.length; y++) {
                    if (rooms[room].users[y].name == answer.user) {
                        rooms[room].users[y].answer.push(`${rooms[room].questions[rooms[room].current].question}, Your Answer: ${rooms[room].questions[rooms[room].current].choices[answer.answer]} ❌, Correct Answer: ${rooms[room].questions[rooms[room].current].choices[rooms[room].questions[rooms[room].current].correct]}`)
                        console.log(rooms[room].users[y]);
                    }
                }
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
    rooms[room].users.push({
        name: newUser,
        points: 0,
        answer: [],
        lie: ''
    });
    rooms[room].room.emit('users', { msg: `${newUser} has joined.`, users: rooms[room].users })
    resp.send({ users: rooms[room].users, err: null })
})

app.delete('/delete/:room', (req, resp) => {
    const room = req.params.room
    if (rooms.hasOwnProperty(room)) {
        rooms[room].room.emit('delete', 'delete')
        delete rooms[room]
    }
})