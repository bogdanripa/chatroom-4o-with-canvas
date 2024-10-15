import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  withCredentials: true, // we need this to make sure the client connects to the same function when possible
});

const App: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const loaded = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nicknameCopyRef = useRef('');

  const sendMessage = (channel: string, message: any) => {
    if (socket.connected)
      socket.emit(channel, message);
    else {
      console.log('socket not connected');
      socket.connect();
    }
  }

  const handleJoin = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    nicknameCopyRef.current = nickname;
    sendMessage('join', nickname);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      sendMessage('message', { nickname, content: inputMessage });
      console.log('sent message');
      setInputMessage('');
    }
  };

  const handleLeave = () => {
    setJoined(false);
    socket.disconnect();
    socket.connect();
  };

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    console.log('useEffect');

    socket.on('connect', () => {
      console.log('socket connected');
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected');
    });

    socket.on('joined', () => {
      console.log('joined');
      setJoined(true);
    });

    socket.on('nicknameInUse', () => {
      console.log('nicknameInUse');
      alert('Nickname already in use');
    });

    socket.on('users', (usersList) => {
      console.log('got usersList');
      setUsers(usersList);
    });

    socket.on('messages', (messagesList) => {
      console.log('got messagesList');
      setMessages(messagesList);
    });

    socket.on('newMessage', (message) => {
      console.log('got new message');
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('reconnect', () => {
      console.log('reconnecting');
      sendMessage('join', nicknameCopyRef.current);
    });

    setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 1000 * 20); // every 20 seconds

  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div id="app" className="main-container">
      {!joined ? (
        <div className="join-container">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
          />
          <button onClick={handleJoin}>Join Room</button>
        </div>
      ) : (
        <>
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className="message">
                  <strong>{msg.nickname}:</strong> {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="new-message-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Enter a message"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
          <div className="users-list">
            <h4>Users in the room:</h4>
            <ul>
              {users.map((user, index) => (
                <li key={index}>{user.nickname}</li>
              ))}
            </ul>
            <button className="leave-chat-button" onClick={handleLeave}>Leave Chat Room</button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;