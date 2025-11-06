import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children, username }) => {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState(['global']);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!username) return; // don't connect until username provided
    const s = io('http://localhost:5000', { transports: ['websocket','polling'] , reconnectionAttempts: 5});
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('auth', { username }, (res) => {
        if (res && res.ok) {
          console.log('authenticated', res);
        }
      });
    });

    s.on('user:list', (list) => setUsers(list));
    s.on('room:list', (r) => setRooms(r));
    s.on('notification', (n) => setNotifications(prev => [n, ...prev]));
    s.on('connect_error', (err) => console.error('socket connect error', err));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [username]);

  return <SocketContext.Provider value={{ socket: socketRef.current, users, rooms, notifications }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
