import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./style.css";
import Room from "../Room";
import io from 'socket.io-client';


class Homepage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            room: {},
            message: '',
            hideUserEntry: true,
            users: [],
            inputValue: ''
        }
        this.createClick = this.createClick.bind(this);
        this.updateInput = this.updateInput.bind(this)
        this.newUser = this.newUser.bind(this)
    }

    createClick() {
        fetch('/create', {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        }).then(response => response.json())
            .then((json) => {
                const roomName = json.roomName;
                const socket = io(`/${roomName}`);
                socket.on('room', (msg) => {
                    this.setState({
                        message: msg,
                        hideUserEntry: false
                    })
                });
                socket.emit('room', 'Ready');
                this.setState({
                    room: { roomName: roomName, socket: socket }
                })
            })
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    newUser(evt) {
        evt.preventDefault();
        const newUser = {
            user: this.state.inputValue
        }
        fetch('/user/:room', {
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
                users: resjson,
                inputValue: ''
            });
        });
    }
    render() {
        return (
            <div className="Homepage">
                <button onClick={this.createClick}>CREATE A ROOM</button>
                <button>GO TO ROOM</button>
                <div>{this.state.message}</div>
                <form onSubmit={evt => this.newUser(evt)}>
                    {this.state.hideUserEntry ? null : <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} name='user' placeholder="Enter Username" />}
                </form>
                <Router>
                    <Route path={`/${this.state.room.roomName}`} exact component={Room} />
                </Router>
            </div>
        )
    }
}

export default Homepage;