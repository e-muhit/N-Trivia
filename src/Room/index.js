import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import io from 'socket.io-client';
import "./style.css";

class Room extends Component {
    constructor(props) {
        super(props)
        this.state = {
            message: '',
            question: '',
            users: [],
            inputValue: '',
            answers: [],
            start: false,
            username: '',
            time: '',
            submitted: false,
            starts: 0,
            showScore: false,
            deleted: false,
            error: null,
            errorInfo: null,
            socket: null,
            questionNumber: 0
        }
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
            if (msg !== 'Game started') {
                this.setState({
                    message: msg.msg,
                    users: msg.users,
                    socket: io(`/${room}`)
                })
            }
        });
        socket.on('question', (obj) => {
            this.setState({
                question: obj.question,
                answers: obj.choices,
                start: true,
                submitted: false,
                showScore: false,
                questionNumber: this.state.questionNumber + 1
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
        socket.on('delete', (msg) => {
            this.setState({
                deleted: true,
                showScore: false
            })
        })
        fetch(`/user/${room}`)
            .then(response => response.json())
            .then(resjson => {
                this.setState({
                    users: resjson.users
                })
            })
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    killRoom() {
        const room = this.props.match.params.room
        console.log('hello');
        fetch(`/delete/${room}`, {
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
        let level;
        if (this.state.starts < 1) {
            level = 'easy'
        } else if (this.state.starts === 1) {
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
                                <h3 className="points" key={i}>{x.name}: {x.points}</h3>
                                {x.answer.map((y, index) => {
                                    if (x.name === this.state.username) {
                                        return (
                                            <div className="answer-container">
                                                <p key={index}>Question{index + 1}: {y}</p>
                                            </div>)
                                    }
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
        e.preventDefault();
        this.state.socket.emit('answer', { question: this.state.question, answer: value, user: this.state.username })
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
            });
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    multipleChoice() {
        return this.state.answers.map((element, index) => {
            return <button className={this.state.submitted ? 'hidding' : 'grid-button'} onClick={e => { this.submitAnswer(e, index) }} value={index} key={index}>{element}</button>
        })
    }

    render() {
        if (this.state.errorInfo) {
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        if (this.state.start === true) {
            return (
                <div className="questions-container">
                    <div className="question"><h1>{this.state.question}</h1></div>
                    <form className="buttons">
                        {this.multipleChoice()}
                    </form>
                    <div className="time"><div className="timer">{this.state.time}</div></div>
                    <footer><div>Name: {this.state.username}</div> <div>Question: {this.state.questionNumber}</div> <div>Room: {this.props.match.params.room}</div></footer>
                </div>
            )
        }
        if (this.state.showScore === true) {
            return (
                <div className="user-score-container">
                    {this.renderUsersAndPoints()}
                    <button onClick={this.startGame}>Play Again</button>
                    <button onClick={this.killRoom}>End Game</button>
                    <footer><div>Name: {this.state.username}</div> <div>Room: {this.props.match.params.room}</div></footer>
                </div>
            )
        }
        if (this.state.deleted === true) {
            return <Redirect to='/' />
        }
        return (
            <div className="starting">
                <h1>Welcome to Room {this.props.match.params.room}</h1>
                <form className={this.state.username ? 'hidden' : ''} onSubmit={this.newUser}>
                    <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} name='user' placeholder="Enter Username" />
                    <button type="submit">Submit</button>
                </form>
                <div className="message">{this.state.message}</div>
                {this.renderUsers()}
                <footer><div>Name: {this.state.username}</div> <div>Room: {this.props.match.params.room}</div></footer>
            </div>
        );
    }
}

export default Room;