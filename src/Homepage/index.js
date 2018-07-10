import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./style.css";

class Homepage extends Component {
    render() {
        return (
            <div className="Homepage">
                <button>CREATE A ROOM</button>
                <button>GO TO ROOM</button>
            </div>
        )
    }
}

export default Homepage;