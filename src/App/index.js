import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./style.css";
import Room from "../Room";
import Homepage from "../Homepage";

class App extends Component {
  render() {
    return (
      <div>
        <Router>
          <nav>
            <Route path="/" exact component={Homepage} />
            <Route path="/room/:room" exact component={Room} />
            </nav>
        </Router>
      </div>
    );
  }
}

export default App;