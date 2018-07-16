import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./style.css";
import Room from "../Room";
import Homepage from "../Homepage";

class App extends Component {
  constructor(props) {
    super(props)
  
    this.state = {
       error: null,
       errorInfo: null,
       music: []
    }
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
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
    return (
      <div className="App">
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