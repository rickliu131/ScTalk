import React from 'react';
import { Button, Segment, Form, Dropdown, Menu, Comment, TextArea, List, Checkbox, Message, Modal, Dimmer, Loader } from 'semantic-ui-react';
import toast, { Toaster } from 'react-hot-toast';
import URL from './address';
import './Room.css';
const { io } = require("socket.io-client");

class Room extends React.Component {
  constructor(props) {
    super(props);

    this.sendMsgClick = this.sendMsg.bind(this);
    this.changeOpennessClick = this.changeOpenness.bind(this);
    this.deleteRoomClick = this.deleteRoom.bind(this);
    this.fileInputChangeInvoked= this.fileInputChange.bind(this);
    this.fileUploadClick = this.fileUpload.bind(this);

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
      },

      deleteRoomConfirmShow: false,
      filesSelected: []
    }

    // room info that won't change after determined
    this.roomConst = {
      name: '',
      id: this.props.roomInfo.id, //string
      user: this.props.roomInfo.user
    }

    this.messagesEnd = null;
    this.fileInputRef = React.createRef();

    this.socket = io(URL);
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
    this.socket.on('disconnect', (reason) => {
      console.log('### Disconnect reason: ' + reason+' ###');
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
    })

    // this signals the user has formally joined the room, init package received
    this.socket.on('init cl', (roomName, roomStatus, roomMembers) => {
      this.roomConst.name = roomName;
      this.setState((prevState) => ({
        ...prevState,

        connectionStatus: 'joined',

        room: {
          isOpen: roomStatus == 1 ? true : false,
          members: roomMembers,
          messages: []
        }
      }));
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

    this.socket.on('msg-files cl', (fileNames, author, time) => {
      // for security purposes...
      // this is better done with receiving file links, rather than file names and synthesize the links
      const fileUrls = fileNames.map((fileName) => (
        <p className='filelinks'>
          <a href={`${URL}/files/${this.roomConst.id}/${fileName}`} target="_blank">{fileName}</a>
        </p>
      ));
      
      this.setState((prevState) => ({
        ...prevState,
        room: {
          ...prevState.room,
          messages: [...prevState.room.messages, {
            content: fileUrls,
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
  }

  // send methods, PROACTIVE
  // 'sv' means TO SERVER
  sendMsg() {
    const element = document.getElementById('text-input');
    if (element.value != '') {
      this.socket.emit('msg sv', element.value);
      element.value = '';
    }
  }

  changeOpenness() {
    const status = document.getElementById('openness').checked ? 1 : 0;
    this.socket.emit('status sv', status);
  }

  deleteRoomConfirmShowSet(show) {
    this.setState((prevState) => ({
      ...prevState,
      deleteRoomConfirmShow: show
    }));
  }

  deleteRoom() {
    const status = -1;
    this.socket.emit('status sv', status);
  }

  fileInputChange() {
    this.setState((prevState) => ({
      ...prevState,
      filesSelected: this.fileInputRef.current.files
    }));
    console.log('Number of selected files: '+this.fileInputRef.current.files.length);
  }

  async fileUpload() {
    function readFileAsync(file) {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      })
    }

    let processedFiles = [];
    const rawFiles = this.fileInputRef.current.files;
    for (let i=0; i<rawFiles.length; ++i) {
      const file = rawFiles[i];
      const result = await readFileAsync(file);
      processedFiles.push({
        data: result,
        name: file.name
      });
    }

    this.socket.emit('msg-files sv', processedFiles);

    this.fileInputRef.current.value = null;
    this.fileInputChange();
    toast("Files Sent", {duration: 1150, icon: '✅'});
  }

  // if leaves the room, the server is responsbile for broadcasting updated members list

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }
  
  componentDidMount() {
    this.receive();
  }
  
  componentDidUpdate() {
    if (this.messagesEnd != null) {
      this.scrollToBottom();
    } else {
      // console.log('messagesEnd: null');
    }
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
          <Message size='mini' className='menu-right-msgcopy' warning onClick={() => {
            navigator.clipboard.writeText(this.roomConst.id).then(() => {
              toast("Room ID Copied", {duration: 1150, icon: '📋'});
            }, () => {
              // toast("Copy failed", {duration: 1150, icon: '❌'});
            })
          }}>
            <p className='menu-right-msg-p'>
              #{this.roomConst.id}
            </p>
          </Message>
          <Message size='mini' className='menu-right-msgstatus' {...mode}>
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
              <Dropdown.Item onClick={() => {this.deleteRoomConfirmShowSet(true);}}>
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
            <Comment.Author as="span">{e.author}</Comment.Author>
            <Comment.Metadata>
              <div>{new Date(e.time).toLocaleString()}</div>
            </Comment.Metadata>
            <Comment.Text className='msg-content'>{e.content}</Comment.Text>
          </Comment.Content>
        </Comment>
      ));
      messagesRendered.push(<div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}></div>);
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
                            
                            //if text is empty, do nothing
                          }}} />
              <Segment.Inline className='chat-input-form-buttons'>
                {/* <span className='filename'>{this.state.filesSelected.length == 0 ? '' : this.fileInputRef.current.files[0].name+'...'}</span> */}
                <span className='filename'>{this.state.filesSelected.length == 0 ? '' : this.state.filesSelected.length+' 📄 Selected..'}</span>
                
                {this.state.filesSelected.length == 0 ? '' :
                <Button compact negative onClick={() => {
                  this.fileInputRef.current.value = null;
                  this.fileInputChange();
                  }}>Remove</Button>}
                {this.state.filesSelected.length == 0 ? '' :
                <Button compact positive hidden={this.state.filesSelected.length == 0} onClick={this.fileUploadClick}>Send</Button>}
                
                <input ref={this.fileInputRef} type="file" onChange={this.fileInputChangeInvoked} multiple hidden/>
                {this.state.filesSelected.length > 0 ? '' :
                  <Button icon='upload' onClick={() => this.fileInputRef.current.click()} />
                }
                {this.state.filesSelected.length > 0 ? '' :
                <Button primary onClick={this.sendMsgClick}>Send Text</Button>
                }
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

  deleteRoomConfirmCpnt() {
    return(
      <Modal size='mini' open={this.state.deleteRoomConfirmShow} >
        <Modal.Header>Delete Room</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to delete this room?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={() => {this.deleteRoomConfirmShowSet(false);}}>
            No
          </Button>
          <Button positive onClick={this.deleteRoomClick}>
            Yes
          </Button>
        </Modal.Actions>
      </Modal>
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
        {this.deleteRoomConfirmCpnt()}
        <Toaster />
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
        reason = 'Disconnected!';
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