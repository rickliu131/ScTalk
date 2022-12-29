'use strict';

import React from 'react';
import './Welcome.css';
import { Button, Header, Divider, Grid, Segment, Form } from 'semantic-ui-react'

class Welcome extends React.Component {
  constructor(props) {
    super(props);

    this.createRoomClick = this.createRoom.bind(this);
    this.joinRoomClick = this.joinRoom.bind(this);
    
    this.createRoomSubmitClick = this.createRoomSubmit.bind(this);
    this.joinRoomSubmitClick = this.joinRoomSubmit.bind(this);

    this.operationCancelClick = this.operationCancel.bind(this);

    this.state = {stage: 'select'};
  }

  operationCancel() {
    this.setState(() => ({
      stage: 'select'
    }));
  }

  createRoom() {
    // alert('creating');
    this.setState(() => ({
      stage: 'create'
    }));
  }

  createRoomSubmit() {
    // request createRoom API route

  }

  joinRoom() {
    // alert('joining');
    this.setState(() => ({
      stage: 'join'
    }));
  }

  joinRoomSubmit() {

  }

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
        <Header as='h2'>Create room</Header>
        <Segment placeholder>
          
          <Form>
            <Form.Field className='field-to-expand'>
              <label>Name of the chat room</label>
              <input />
            </Form.Field>
            <Form.Field className='field-to-expand'>
              <label>Your nickname</label>
              <input />
            </Form.Field>
            <Form.Field className='field-to-expand'>
              <div className='panel-create-buttons'>
                <Button primary onClick={this.createRoomSubmitClick}>Create & Join</Button>
                <Button onClick={this.operationCancelClick}>Cancel</Button>
              </div>
            </Form.Field>
          </Form>
          
        </Segment>
      </div>
    );
  }

  joinCpnt() {
    return (
      <div>
        <Header as='h2'>Join room</Header>
        <Segment placeholder>
          <Form>
            <Form.Field width={9}>
              <label>Room number</label>
              <input placeholder='#...'/>
            </Form.Field>
            <Form.Field width={9}>
              <div className='panel-create-buttons'>
                <Button primary onClick={this.joinRoomSubmitClick}>Join</Button>
                <Button onClick={this.operationCancelClick}>Cancel</Button>
              </div>
            </Form.Field>
          </Form>
        </Segment>
      </div>
    );
  }

  render() {
    let element = '';
    if (this.state.stage == 'select') {
      element = this.welcomeCpnt();
    } else if (this.state.stage == 'create') {
      element = this.createCpnt();
    } else if (this.state.stage == 'join') {
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
