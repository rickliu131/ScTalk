import React from 'react';
import { Button, Header, Divider, Grid, Segment, Form, Loader, Dimmer, Modal } from 'semantic-ui-react';
import axios from 'axios';
import URL from './address';
import './Welcome.css';

// constants
const url = URL;
const urlCreateRoom = url + '/createRoom';

class Welcome extends React.Component {
  constructor(props) {
    super(props);

    this.createRoomClick = this.createRoom.bind(this);
    this.joinRoomClick = this.joinRoom.bind(this);
    
    this.createRoomSubmitClick = this.createRoomSubmit.bind(this);
    this.joinRoomSubmitClick = this.joinRoomSubmit.bind(this);

    this.resetClick = this.reset.bind(this);

    this.state = {
      page: 'welcome',
      loading: false,
      error: false
    };
  }

  reset() {
    this.setState(() => ({
      page: 'welcome',
      loading: false,
      error: false
    }));
  }

  createRoom() {
    this.setState(() => ({
      page: 'create-room',
      loading: false,
      error: false
    }));
  }

  createRoomSubmit() {
    // request createRoom API route
    this.setState(() => ({
      page: 'create-room',
      loading: true,
      error: false
    }));

    const roomName = document.getElementById('create-room-1').value;
    const nickname = document.getElementById('create-room-2').value;

    console.log('Create Room - Room Name: ' + roomName);
    console.log('Create Room - User Nickname: ' + nickname);

    axios.post(urlCreateRoom,
      {roomName: roomName})
      .then((res) => {
        const roomID = res.data.roomID;
        this.props.handler(roomID, nickname);
        console.log('Passed RoomID ('+roomID+') and Nickname ('+nickname+') to the handler..');
        // to be rerendered entirely
      })
      .catch((error) => {
        this.setState(() => ({
          page: 'create-room',
          loading: false,
          error: true
        }));
      });
  }

  joinRoom() {
    this.setState(() => ({
      page: 'join-room',
      loading: false,
      error: false
    }));
  }

  joinRoomSubmit() {
    this.setState(() => ({
      page: 'join-room',
      loading: true,
      error: false
    }));

    const roomID = document.getElementById('join-room-1').value;
    const nickname = document.getElementById('join-room-2').value;

    console.log('Join Room - Room ID: ' + roomID);
    console.log('Join Room - User Nickname: ' + nickname);

    this.props.handler(roomID, nickname);
    console.log('Passed RoomID ('+roomID+') and Nickname ('+nickname+') to the handler..');

    // to be rerendered entirely
  }

  // ------

  welcomeCpnt() {
    return(
      <div>
        <Header as='h2' textAlign='center'>Welcome to ScTalk!</Header>
        <Segment placeholder>
            <Grid>
              <Grid.Row>
                <Button primary onClick={this.createRoomClick}>Create Room</Button>
              </Grid.Row>
              <Divider horizontal>Or</Divider>
              <Grid.Row>
                <Button primary onClick={this.joinRoomClick}>Join Room</Button>
              </Grid.Row>
            </Grid>
          </Segment>
      </div>
    );
  }

  createCpnt() {
    // input: room name, nickname
    return (
      <div>
        <Header as='h2'>Create Room</Header>
        <Segment placeholder>
          {this.state.loading ?
          <Dimmer active inverted>
            <Loader inverted>Loading..</Loader>
          </Dimmer>
          :
          <Form>
            <Form.Field className='field-to-expand'>
              <label>Room Name</label>
              <input id='create-room-1' />
            </Form.Field>
            <Form.Field className='field-to-expand'>
              <label>Your Nickname</label>
              <input id='create-room-2' />
            </Form.Field>
            <Form.Field className='field-to-expand'>
              <div className='panel-buttons'>
                <Button primary onClick={this.createRoomSubmitClick}>Create & Join</Button>
                <Button onClick={this.resetClick}>Cancel</Button>
              </div>
            </Form.Field>
          </Form>}
          <Modal size='mini' open={this.state.error}>
            <Modal.Header>Error</Modal.Header>
            <Modal.Content>
              <p>Unable to create room</p>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={this.createRoomClick}>
                Go back
              </Button>
            </Modal.Actions>
          </Modal>
        </Segment>
      </div>
    );
  }

  joinCpnt() {
    return (
      <div>
        <Header as='h2'>Join Room</Header>
        <Segment placeholder>
          {this.state.loading ? 
          <Dimmer active inverted>
            <Loader inverted>Loading..</Loader>
          </Dimmer>
          :
          <Form>
            <Form.Field width={9}>
              <label>Room ID</label>
              <input placeholder='#...' id='join-room-1' />
            </Form.Field>
            <Form.Field width={9}>
              <label>Your Nickname</label>
              <input id='join-room-2' />
            </Form.Field>
            <Form.Field width={9}>
              <div className='panel-buttons'>
                <Button primary onClick={this.joinRoomSubmitClick}>Join</Button>
                <Button onClick={this.resetClick}>Cancel</Button>
              </div>
            </Form.Field>
          </Form>}
          <Modal size='mini' open={this.state.error}>
            <Modal.Header>Error</Modal.Header>
            <Modal.Content>
              <p>Unable to join room</p>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={this.joinRoomClick}>
                Go back
              </Button>
            </Modal.Actions>
          </Modal>
        </Segment>
      </div>
    );
  }

  render() {
    let element = '';
    let page = this.state.page;
    if (page == 'welcome') {
      element = this.welcomeCpnt();
    } else if (page == 'create-room') {
      element = this.createCpnt();
    } else if (page == 'join-room') {
      element = this.joinCpnt();
    }
    
    return (
      <div className='full'>
        <div className='container'>
          {element}
        </div>
      </div>
    );
  }
}

export default Welcome;
