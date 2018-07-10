import React, { Component } from 'react';
import Room from "../Room";
import Homepage from "../Homepage";

class App extends Component {
  render() {
    return (
      <div>
        <Homepage />
        <Room />
      </div>
    );
  }
}

export default App;