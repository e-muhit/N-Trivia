import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import io from 'socket.io-client';
import "./style.css";
// import { timer } from './app';

class Room extends Component {
    constructor(props) {
        super(props)
        //     timestamp
        // }));
        this.state = {
            message: '',
            question: '',
            users: [],
            inputValue: '',
            answers: [],
            isHidden: true,
            start: false,
            username: '',
            time: '',
            submitted: false,
            points: 0,
            starts: 0,
            showScore: false
        }
        // this.nextQuestion = this.nextQuestion.bind(this)
        this.updateInput = this.updateInput.bind(this)
        this.newUser = this.newUser.bind(this)
        this.multipleChoice = this.multipleChoice.bind(this)
        this.startGame = this.startGame.bind(this)
        this.renderUsers = this.renderUsers.bind(this)
        this.renderUsersAndPoints = this.renderUsersAndPoints.bind(this)
        this.sortPoints = this.sortPoints.bind(this)
        this.killRoom = this.killRoom.bind(this)
    }

    componentDidMount() {
        const room = this.props.match.params.room
        const socket = io(`/${room}`);
        this.setState({
            users: []
        })
        socket.on('users', (msg) => {
            if (msg != 'Game started') {
                this.setState({
                    message: msg.msg,
                    users: msg.users
                })
            }
        });
        socket.on('question', (obj) => {
            this.setState({
                question: obj.question,
                answers: obj.choices,
                start: true,
                submitted: false,
                showScore: false
            })
        })
        socket.on('timer', (obj) => {
            this.setState({
                time: obj.time
            })
        })
        socket.on('start', (obj) => {
            this.setState({
                starts: obj.starts
            })
        })
        socket.on('score', (obj) => {
            this.setState({
                users: obj.users,
                showScore: true,
                start: false
            })
        })
        fetch(`/user/${room}`)
            .then(response => response.json())
            .then(resjson => {
                this.setState({
                    users: resjson.users
                })
                if (this.state.users !== undefined) {
                    if (this.state.users.length >= 3) {
                        this.setState({
                            isHidden: false
                        })
                    }
                }
            })
    }
    killRoom(){
        const room = this.props.match.params.room
        console.log('hello');
        fetch(`/delete/${room}`,{
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        })
        .then(() => {
            return <Redirect to='/' />
        })
    }

    sortPoints(a, b) {
        if (a.points < b.points) {
            return 1
        } else if (a.points > b.points) {
            return -1
        } else {
            return 0
        }
    }

    startGame() {
        const room = this.props.match.params.room
        const socket = io(`/${room}`);
        let level;
        if (this.state.starts < 1) {
            level = 'easy'
        } else if (this.state.starts == 1) {
            level = 'medium'
        } else {
            level = 'hard'
        }
        fetch(`/start/${room}/${level}`)
            .then(resp => resp.json())
            .then(rejson => console.log(rejson))
    }


    renderUsers() {
        const renderButton = () => {
            if (this.state.users.length > 1 && this.state.username !== null) {
                return <button onClick={this.startGame}>Start Game</button>
            }
        }
        if (this.state.users !== undefined) {
            return (
                <div>
                    <ul>
                        {this.state.users.map((x, i) => {
                            return <li key={i}>{x.name}</li>
                        })}
                    </ul>
                    {renderButton()}
                </div>
            )
        }
    }

    renderUsersAndPoints() {
        if (this.state.users !== undefined) {
            let temp = this.state.users.slice(0)
            temp.sort((a, b) => {
                if (a.points < b.points) {
                    return 1
                } else if (a.points > b.points) {
                    return -1
                } else {
                    return 0
                }
            })
            return (
                <div>
                    {temp.map((x, i) => {
                        return (
                            <div>
                                <h3 key={i}>{x.name}: {x.points}</h3>
                                {x.answer.map((y, index) => {
                                    return <p key={index}>Question{index + 1}: {y}</p>
                                })}
                            </div>
                        )
                    })}
                </div>
            )
        }
    }

    submitAnswer = (e, value) => {
        const room = this.props.match.params.room
        const socket = io(`/${room}`);
        e.preventDefault();
        socket.emit('answer', { question: this.state.question, answer: value, user: this.state.username })
        this.setState({
            submitted: true
        })
    }

    newUser(evt) {
        evt.preventDefault();
        const newUser = {
            user: this.state.inputValue
        }
        const room = this.props.match.params.room
        fetch(`/user/${room}`, {
            method: "POST",
            body: JSON.stringify(newUser),
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        })
            .then(response => response.json())
            .then(resjson => {
                this.setState({
                    users: resjson.users,
                    username: newUser.user,
                    inputValue: ''
                })
                if (this.state.users.length >= 3) {
                    this.setState({
                        isHidden: false
                    })
                }
            });
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    multipleChoice() {
        return this.state.answers.map((element, index) => {
            return <button className={this.state.submitted ? 'hidden' : ''} onClick={e => { this.submitAnswer(e, index) }} value={index} key={index}>{element}</button>
        })
    }

    render() {
        if (this.state.start === true) {
            return (
                <div>
                    <h1>{this.state.question}</h1>
                    <form>
                        {this.multipleChoice()}
                    </form>
                    <div>{this.state.time}</div>
                    <footer>{this.state.username}</footer>
                </div>
            )
        }
        if (this.state.showScore === true) {
            return (
                <div>
                    {this.renderUsersAndPoints()}
                    <button onClick={this.startGame}>Play Again</button>
                    <button onClick={this.killRoom}>End Game</button>
                    <footer>{this.state.username}</footer>
                </div>
            )
        }
        return (
            <div>
                <form className={this.state.username ? 'hidden' : ''} onSubmit={this.newUser}>
                    <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} name='user' placeholder="Enter Username" />
                    <input type="submit" />
                </form>
                <div>{this.state.message}</div>
                {this.renderUsers()}
                <footer>{this.state.username}</footer>
            </div>
        );
    }
}

export default Room;