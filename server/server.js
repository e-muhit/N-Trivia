const express = require('express')
const app = express();
const PORT = process.env.PORT || 4567;
const server = app.listen(PORT, () => {
    console.log(`Express web server listening on port ${PORT}`);
});
const io = require('socket.io')(server);

io.attach(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})
const fetch = require('node-fetch');


app.get('/room.json', (request, response) => {
    const categories = [...Array(24).keys()].map(x => x + 9);
    const category = categories[Math.floor(Math.random() * categories.length)]
    return fetch(`https://opentdb.com/api.php?amount=5&category=${category}&difficulty=easy&type=multiple`)
        .then(response => response.json())
        .then(json => response.send(json))
})

io.on('connection', client => {
    client.on('subscribeToTimer', (interval) => {
        console.log('client is subscribing to timer with interval ', interval);
        setInterval(() => {
            client.emit('timer', new Date());
        }, interval);
    });
})

// function randomString() {
//     return Math.random().toString(36).toUpperCase().slice(2)
// }

// console.log(randomString());


// let nsp = io.of(`/${randomString()}`)
// nsp.on('connection', function (socket) {
//     console.log('someone connected');
// })
