'use strict';

import Welcome from './Welcome';
import Room from './Room';
import React from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entered: false,
      roomInfo: {
        id: -1,
        user: ''
      }
    }

    this.enterInvoked = this.enter.bind(this);
    this.exitInvoked = this.exit.bind(this);
  }

  enter(roomID, roomUser) {
    this.setState({
      entered: true,
      roomInfo: {
        id: roomID,
        user: roomUser
      }
    });
    console.log('enter!');
  }

  exit() {
    // return to welcome page
    this.setState({
      entered: false,
      roomInfo: {
        id: -1,
        user: ''
      }
    });
  }

  render() {
    return (
      <div>
        {this.state.entered ? 
        <Room roomInfo={this.state.roomInfo} handler={this.exitInvoked}/>
        :
        <Welcome handler={this.enterInvoked}/>}
      </div>
    );
  }
}

export default App;
