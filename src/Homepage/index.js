import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import "./style.css";
import Room from "../Room";
import io from 'socket.io-client';


class Homepage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            room: {},
            message: '',
            hideRoomEntry: true,
            users: [],
            inputValue: '',
            created: false,
            error: null,
            errorInfo: null
        }
        this.createClick = this.createClick.bind(this);
        this.updateInput = this.updateInput.bind(this)
        this.unhide = this.unhide.bind(this)
        this.redirectToRoom = this.redirectToRoom.bind(this)
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
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
                    })
                });
                socket.emit('room', 'Ready');
                this.setState({
                    room: { roomName: roomName, socket: socket },
                    created: true
                })
            })
    }

    updateInput(evt) {
        this.setState({ inputValue: evt.target.value })
    }

    unhide() {
        this.setState({ hideRoomEntry: false })
    }

    redirectToRoom() {
        return <Redirect to={{
            pathname: `/room/${this.state.inputValue}`,
            state: { message: this.state.message }
        }} />
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
        if (this.state.created === true) {
            return <Redirect to={{
                pathname: `/room/${this.state.room.roomName}`,
                state: { message: this.state.message }
            }} />
        }
        return (
            <div className="Homepage">
                <h1>N-Trivia</h1>
                <div className="button-div">
                    <button onClick={this.createClick}>CREATE A ROOM</button>
                    <button onClick={this.unhide}>GO TO ROOM</button>
                    <form className="room-input" action={`/room/${this.state.inputValue}`} onSubmit={this.redirectToRoom}>
                        {this.state.hideRoomEntry ? null : <input onChange={evt => this.updateInput(evt)} value={this.state.inputValue} placeholder="Enter Room Code" />}
                    </form>
                </div>
                <Router>
                    <Route path={`/room/${this.state.room.roomName}`} exact component={Room} />
                </Router>
            </div>
        )
    }
}

export default Homepage;