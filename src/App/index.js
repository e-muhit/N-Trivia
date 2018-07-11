import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Room from "../Room";
import Homepage from "../Homepage";

class App extends Component {
  render() {
    return (
      <div>
        <Router>
            <Route path="/" exact component={Homepage} />
        </Router>
      </div>
    );
  }
}

export default App;