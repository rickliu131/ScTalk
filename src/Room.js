'use strict';

import React from 'react';
import './Room.css';
import { Button, Segment, Form, Dropdown, Menu, Comment, TextArea, List, Checkbox, Message, Modal, Dimmer, Loader } from 'semantic-ui-react';
const { io } = require("socket.io-client");

class Room extends React.Component {
  constructor(props) {
    super(props);

    this.sendMsgClick = this.sendMsg.bind(this);
    this.changeOpennessClick = this.changeOpenness.bind(this);
    this.deleteRoomClick = this.deleteRoom.bind(this);

    // connectionStatus:
    // 'loading', loading to confirm status (have not received permit result yet)
    // 'forbidden', permit result received, forbidden (room doesn't exist or closed)
    // 'joined', permit result received (allowed), AND, init package received (which comes right after permit)
    // 'deleted', previously 'joined', now the room is deleted
    this.state = {
      connectionStatus: 'loading',

      room: {
        isOpen: false,
        members: [],
        messages: []
      }
    }

    // room info that won't change after determined
    this.roomConst = {
      name: '',
      id: this.props.roomInfo.id, //string
      user: this.props.roomInfo.user
    }

    const address = 'ws://192.168.1.66:3001';
    this.socket = io(address);
  }

  receive() {
    this.socket.on('connect', () => {
      console.log('Socket.io server connected!');

      // once connect, request permit
      this.socket.emit('join sv', this.roomConst.id, this.roomConst.user);
    });

    // receive methods, PASSIVE
    // 'cl' means TO CLIENT

    // Room deleted
    // 'Connected' but not 'joined' user ('loading'/'forbidden') will not receive this 'disconnect' command
    this.socket.on('disconnect', () => {
      this.setState((prevState) => ({
        ...prevState,
        connectionStatus: 'deleted'
      }));
    });

    this.socket.on('permit cl', (result) => {
      // result:
      // 0 - room is closed, or doesn't exist ('forbidden')
      // 1 - room is open to connect

      // if result is 0, update connectionStatus to 'forbidden', rerender will be trigged
      // if result is 1, connectionStatus should remain as 'loading', 
      //                 do nothing at this part, wait for 'init cl' event that will arrive shortly after
      
      if (result == 0) {
        this.setState((prevState) => ({
          ...prevState,
          connectionStatus: 'forbidden'
        }));
      }
      // this.setState((prevState) => ({
      //   ...prevState,
      //   connected: result == 1 ? true : false,
      // }));
      // this.discntReason = result == 1 ? '' : 'permit';
    })

    // this signals the user has formally joined the room, init package received
    this.socket.on('init cl', (roomName, roomStatus, roomMembers) => {
      this.roomConst.name = roomName;
      this.setState({
        connectionStatus: 'joined',

        room: {
          isOpen: roomStatus == 1 ? true : false,
          members: roomMembers,
          messages: []
        }
      });

      // console.log('init package: ');
      // console.log(roomName);
      // console.log(roomStatus);
      // console.log(roomMembers);
    });

    // after init methods

    this.socket.on('member cl', (action, member) => {
      // action: '+' or '-'
      if (action == '+') {
        // add
        this.setState((prevState) => ({
          ...prevState,
          room: {
            ...prevState.room,
            members: [...prevState.room.members, member]
          }
        }));
      } else {
        // remove, works fine with duplicate names
        let updatedMembers = this.state.room.members;
        const index = updatedMembers.indexOf(member);
        if (index > -1) {
          updatedMembers.splice(index, 1);

          this.setState((prevState) => ({
            ...prevState,
            room: {
              ...prevState.room,
              members: updatedMembers
            }
          }));
        }
      }
    });

    this.socket.on('msg cl', (content, author, time) => {
      this.setState((prevState) => ({
        ...prevState,
        room: {
          ...prevState.room,
          messages: [...prevState.room.messages, {
            content: content,
            author: author,
            time: time
          }]
        }
      }));
    });

    this.socket.on('status cl', (status) => {
      this.setState((prevState) => ({
        ...prevState,
        room: {
          ...prevState.room,
          isOpen: status == 1 ? true : false
        }
      }));
    });

    // this.socket.on('nkname cl', (ack) => {
    //   // ack is a callback function!
    //   ack(this.nickname);
    // });
  }

  // send methods, PROACTIVE
  // 'sv' means TO SERVER
  sendMsg() {
    const element = document.getElementById('text-input');
    this.socket.emit('msg sv', element.value);
    element.value = '';
  }

  changeOpenness() {
    const status = document.getElementById('openness').checked ? 1 : 0;
    this.socket.emit('status sv', status);
  }

  deleteRoom() {
    const status = -1;
    this.socket.emit('status sv', status);
  }

  // if leaves the room, the server is responsbile for broadcasting updated members list

  componentDidMount() {
    this.receive();
  }

  menuCpnt() {
    const isOpen = this.state.room.isOpen;
    const mode = isOpen ? {positive: true} : {negative: true};

    return(
      <Menu attached='top'>
        <div className='menu-left'>
          <h3>{this.roomConst.name}</h3>
        </div>

        <Menu.Menu position='right' className='menu-right'>
          <Message size='mini' className='menu-right-msg' color='grey'>
            <p className='menu-right-msg-p'>
              #{this.roomConst.id}
            </p>
          </Message>
          <Message size='mini' className='menu-right-msg' {...mode}>
            <p className='menu-right-msg-p'>
              {isOpen ? 'Open to Join' : 'Closed'}
            </p>
          </Message>
          <Dropdown item icon='setting' simple>
            <Dropdown.Menu>
            
              <Dropdown.Item>
                <Checkbox label='Allow Joining' id='openness'
                          onClick={this.changeOpennessClick} checked={isOpen}/>
              </Dropdown.Item>
              <Dropdown.Item onClick={this.deleteRoomClick}>
                Delete Room
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
    );
  }

  chatCpnt() {
    let messagesRendered;
    if (this.state.room.messages.length == 0) {
      messagesRendered = <p className='msg-empty'>: )</p>;
    } else {
      messagesRendered = this.state.room.messages.map((e) => (
        <Comment>
          <Comment.Content>
            <Comment.Author as="a">{e.author}</Comment.Author>
            <Comment.Metadata>
              <div>{new Date(e.time).toLocaleString()}</div>
            </Comment.Metadata>
            <Comment.Text className='msg-content'>{e.content}</Comment.Text>
          </Comment.Content>
        </Comment>
      ));
    }

    return (
      <div className='chat'>
        <Comment.Group className='chat-inner-all'>
          <Segment className='chat-messages'>
            {messagesRendered}
          </Segment>
          
          <div className='chat-input'>
            <Form className='chat-input-form'>
              <TextArea rows={3} placeholder='📝' className='chat-input-form-textarea' id='text-input'
                        onKeyPress={(e) => {
                          if (e.key == 'Enter') {
                            e.preventDefault();
                            this.sendMsgClick();
                            document.getElementById('text-input').value='';
                          }}} />
              <Segment.Inline className='chat-input-form-buttons'>
                <Button icon='upload'/>
                <Button primary onClick={this.sendMsgClick}>Send Text</Button>
              </Segment.Inline>

            </Form>
          </div>
        </Comment.Group>
      </div>
    );
  }

  infoCpnt() {
    const membersRendered = this.state.room.members.map((e) => (
      <List.Item>
        <List.Icon name='user secret' />
        <List.Content>{e}</List.Content>
      </List.Item>
    ));

    return (
      <div className='info'>
        <Segment className='info-seg'>
          <List>
            {membersRendered}
          </List>
        </Segment>
      </div>
    );
  }

  joinedCpnt() {
    return(
      <div className='full'>
        <div className='bar'>
          {this.menuCpnt()}
        </div>
        <div className='rest'>
          {this.chatCpnt()}
          {this.infoCpnt()}
        </div>
      </div>
    );
  }

  notJoinedCpnt() {
    // when this component is rendered, this.state.connectionStatus should not be 'joined'
    let element;
    if (this.state.connectionStatus == 'loading') {
      element = (
        <Segment size='huge' className='load'>
          <Dimmer active inverted>
            <Loader inverted content='Loading' size='large'/>
          </Dimmer>
        </Segment>
      );
    } else {
      let reason;
      if (this.state.connectionStatus == 'forbidden') {
        reason = 'Failed to connect to the room!';
      } else if (this.state.connectionStatus == 'deleted') {
        reason = 'This room has been deleted!';
      }
      element = (
        <Modal size='mini' open={true}>
          <Modal.Header>Oops..!</Modal.Header>
          <Modal.Content>
            <p>{reason}</p>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.props.handler}>
              OK
            </Button>
          </Modal.Actions>
        </Modal>
      );
    }

    return element;
  }

  render() {
    let element;
    if (this.state.connectionStatus == 'joined') {
      element = this.joinedCpnt();
    } else {
      element = this.notJoinedCpnt();
    }

    return element;
  }
}

export default Room;