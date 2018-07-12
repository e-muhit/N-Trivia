import React, { Component } from 'react';
import io from 'socket.io-client';
// import { timer } from './app';

class Room extends Component {
    constructor(props) {
        super(props)
        // timer((err, timestamp) => this.setState({
        //     timestamp
        // }));
        this.state = {
            message: '',
            questions: '',
            correct_answers: '',
            wrong_answers: '',
            users: [],
            currentQuestionIndex: 0,
            inputValue: '',
            answers: [],
            isHidden: true,
            // startGame: false,
            username: null,
        }
        this.nextQuestion = this.nextQuestion.bind(this)
        this.updateInput = this.updateInput.bind(this)
        this.newUser = this.newUser.bind(this)
        this.multipleChoice = this.multipleChoice.bind(this)
        this.startGame = this.startGame.bind(this)
        this.renderUsers = this.renderUsers.bind(this)
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

    startGame(){
        
    }
    renderUsers() {
        if (this.state.users !== undefined) {
            return (
                <div>
                    <ul>
                        {this.state.users.map((x, i) => {
                            return <li key={i}>{x}</li>
                        })}
                    </ul>
                    {this.state.users.length <= 1 && this.state.username ? null : <button onClick={this.startGame}>Start Game</button>}
                </div>
            )
        }
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

    startGame() {
        this.setState({ startGame: true })
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    nextQuestion() {
        this.setState({
            currentQuestionIndex: this.state.currentQuestionIndex + 1
        })
        if (this.state.currentQuestionIndex >= this.state.questions.length - 1) {
            this.setState({
                currentQuestionIndex: 0
            })
        }
    }
    multipleChoice() {
        let current = this.state.answers[this.state.currentQuestionIndex]
        return current.map(element => {
            return <button>{element}</button>
        })
    }
    render() {
        // if (this.state.startGame === true) {
        //     return (
        //         <div>
        //             <h1>{this.state.questions[this.state.currentQuestionIndex]}</h1>
        //             <form>
        //                 {this.multipleChoice()}
        //             </form>
        //             <button onClick={this.nextQuestion}>Next Question</button>
        //         </div>
        //     )
        // }
        return (
            <div>
                <form className={this.state.username ? '' : 'hidden'} onSubmit={this.newUser}>
                    <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} name='user' placeholder="Enter Username" />
                    <input type="submit" />
                </form>
                <div>{this.state.message}</div>
                {this.renderUsers()}
            </div>
        );
    }
}

export default Room;