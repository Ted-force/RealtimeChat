
import './App.css';
import React from 'react';
import { useState, useEffect } from 'react';
import socket from './socket';
import toast, { Toaster } from 'react-hot-toast';
import ScrollToBottom from 'react-scroll-to-bottom';
import {css} from '@emotion/css'

const ROOT_CSS = css({
  height: window.innerHeight/2,
  width: window.innerWidth/2,
})

function App() {
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  //private message
  const [privateMessage, setPrivateMessage] = useState("");

  useEffect(() => {
    socket.on('user joined', (data) => {
      console.log(data);
    });

    socket.on('message client', (data) => {
      // console.log(message);
      // setMessages((prevMessages) => [...prevMessages, message]);
      setMessages((prevMessages) => [...prevMessages, {
        id:data.id,
        name:data.name,
        message:data.message
      }
     ]);
    });

   

    return () => {
      socket.off('user joined');
      socket.off('message client');
      
    }
  }, []);

  useEffect(() => {
   socket.on('user connected', (user) =>{
    user.connected = true;
    user.messages = [];
    user.hasNewMessages = false;
    setUsers((prevUsers) => [...prevUsers, user]);
    toast.success(`${user.username} connected`);
   })



    socket.on('users', (users) => {
      users.forEach((user) => {
        user.self = user.userID === socket.id;
        user.connected = true;
        user.messages = [];
        user.hasNewMessages = false;
      });
      //put curent user first and sort
      const sorted = users.sort((a,b) => {
        if(a.self) return -1;
        if(b.self) return 1;
        if(a.username < b.username) return -1;
        if(a.username > b.username) return 1;
      })
      setUsers(users);
    })

    socket.on('username taken', () => {
      toast.error('username taken');
    })

    return () => {
      socket.off('users');
      socket.off('user connected');
      socket.off('username taken');
    }

  }, [socket]);

  useEffect(() => {
    socket.on('private message', ({message,from}) => {
      // console.log(`${from} sent a private message to ${message}`);
      const allusers = users;
      let i = allusers.findIndex((u) => u.userID === from);
      let fuser = allusers[i];

      fuser.messages.push({
        message,
        fromSelf: false
      });

      if(fuser)
      {
        if(selectedUser)
        {
          if(fuser.userID !== selectedUser.userID)
          {
            fuser.hasNewMessages = true;
          }
        }else {
          fuser.hasNewMessages = true;
        }
        allusers[i] = fuser;
        setUsers([...allusers]);
      }
    });

    return () => {
      socket.off('private message');
    }

  },[users]);


  useEffect(() => {
    socket.on('user disconnected', (userID) => {
      let allUsers = users;

      let index = allUsers.findIndex((user) => user.userID === userID);
      let fUser = allUsers[index];
      fUser.connected = false;

      allUsers[index] = fUser;
      setUsers([...allUsers]);
      // disconnected alert
      toast.error(`${fUser.username} disconnected`);
    })

    return () => {
      socket.off('user disconnected');
    }
  }, [users,socket]);
    



  
  

  const handleUsername = (e) => {
    e.preventDefault();
    // console.log(username);
    // socket.emit("username", username);
    // setConnected(true);
    socket.auth = { username };
    socket.connect();
    console.log(socket);

    setTimeout(() => {
      if (socket.connected) {
        console.log("socket.connected", socket);
        setConnected(true);
      }
    }, 300);
  };

  const handleMessage = (e) => {
    e.preventDefault();
    socket.emit('message', {
      id: Date.now(),
      name: username,
      message
    });
    setMessage('');
  }

  const handleUsernameClick = (user) => {
    if(user.self || !user.connected) return;
    setSelectedUser({...user, hasNewMessages:false});

    let allUsers = users;
    let index = allUsers.findIndex((u) => u.userID === user.userID);
    let foundUser = allUsers[index];
    foundUser.hasNewMessages = false;

    allUsers[index] = foundUser;
    setUsers([...allUsers]);
  };

  const handlePrivateMessage = (e) => {
    e.preventDefault();
    if(selectedUser)
    {
      socket.emit('private message', {
        id: Date.now(),
        name: username,
        message: privateMessage,
        to: selectedUser.userID
      });
      let updated = selectedUser;
      updated.messages.push({
        message: privateMessage,
        fromSelf: true,
        hasNewMessages: false
      })
      setSelectedUser(updated);
      setPrivateMessage('');
    }

  }





  
  return (
    <div className="container text-center">
      <Toaster/>
      <div className='row'>
         <div className='d-flex justify-content-evenly pt-2 pb-1'>
          {connected && users.map((user, index) => user.connected &&
          (<div key={user.userID} onClick={()=> {
            handleUsernameClick(user);
          }}  >
            {user.username} {user.self && "(you)"}
            {user.connected ? (
                  <span className="online-dot"></span>
                ) : (
                  <span className="offline-dot"></span>
                )}
                {user.hasNewMessages && <b className='text-danger'>**</b>}
            </div>))}

         </div>
      </div>
      
        {
          !connected && 
          <div className='row'>
          <form onSubmit={handleUsername} className="text-center pt-3">
          <div className="row g-3">
            <div className="col-md-8">
              <input value={username}
              onChange={(e)=>setUsername(e.target.value)} 
              type="text"
              placeholder='Enter your name'
              className='form-control'
              />

            </div>
            <div className='col-md-4'>
              <button className='btn btn secondary' type="submit">
                Join
              </button>

            </div>

          </div>

        </form>
        </div>
        }
      <div className='row'>
      {connected && 
      <div className='col-md-6'>
          <form onSubmit={handleMessage} className="text-center pt-3">
          <div className="row g-3">
            <div className="col-10">
              <input value={message}
              onChange={(e)=>setMessage(e.target.value)} 
              type="text"
              placeholder='Enter your Message'
              className='form-control'
              />

            </div>
            <div className='col-2'>
              <button className='btn btn secondary' type="submit">
                Send
              </button>

            </div>

          </div>

        </form>
        <br />

        <div className="col">
        <ScrollToBottom className={ROOT_CSS}>
        {messages.map((message, index) => 
        (<div className='alert alert-secondary' key={message.id}>
          {message.name}:{message.message}</div>))}
        </ScrollToBottom>

        </div>
        
        </div>
        
          
        }
        <br/>

        {selectedUser && 
      <div className='col-md-6'>
          <form onSubmit={handlePrivateMessage} className="text-center pt-3">
          <div className="row g-3">
            <div className="col-10">
              <input value={privateMessage}
              onChange={(e)=>setPrivateMessage(e.target.value)} 
              type="text"
              placeholder='Enter your private Message'
              className='form-control'
              />

            </div>
            <div className='col-2'>
              <button className='btn btn secondary' type="submit">
                Send
              </button>

            </div>

          </div>

        </form>
        <br />

        <div className="col">
        <ScrollToBottom className={ROOT_CSS}>
        {selectedUser && selectedUser.messages && selectedUser.messages
        .map((msg, index) =><div key={index} className="alert alert-secondary">{msg.fromSelf ? "(You)":
        selectedUser.username}{": "}{msg.message}</div> )}
        </ScrollToBottom>

        </div>
        
        </div>
        
          
        }
        <div className='col-md-6'>
           private chat
        </div>

      </div>

      

     

      {/* <div className='row'>
        <pre>
          {JSON.stringify(selectedUser,null, 4)}
        </pre>

      </div> */}
     
      
      
    </div>
  );

}

export default App;
