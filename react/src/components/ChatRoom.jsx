import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/socketContext';
import MessageList from './MessageList';
import OnlineUsers from './OnlineUsers';
import dayjs from 'dayjs';

export default function ChatRoom({ username }){
  const { socket, users, rooms, notifications } = useSocket();
  const [currentRoom, setCurrentRoom] = useState('global');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [page, setPage] = useState(1);
  const fileRef = useRef();

  // load initial messages
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`http://localhost:5000/api/messages?room=${currentRoom}&page=${page}&limit=20`);
      const j = await res.json();
      setMessages(prev => [...j.data, ...prev]); // prepend older messages when paginating
    };
    load();
  }, [currentRoom, page]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      // show browser notification
      if (Notification && Notification.permission === 'granted') {
        new Notification(`${msg.from.username}`, { body: msg.text || 'Attachment', silent: true });
      }
      // sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(()=>{});
    };

    const onTyping = ({ username: u, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [u]: isTyping }));
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [u]: false }));
      }, 3000);
    };

    socket.on('message', onMessage);
    socket.on('typing', onTyping);
    socket.on('message:read', ({ messageId, by }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readBy: Array.from(new Set([...(m.readBy||[]), by])) } : m));
    });
    socket.on('message:react', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    return () => {
      socket.off('message', onMessage);
      socket.off('typing', onTyping);
    };
  }, [socket]);

  const sendMessage = async (to=null) => {
    if (!text && !fileRef.current?.files?.length) return;
    const attachments = [];
    if (fileRef.current?.files?.length) {
      // read first file as base64 for demo
      const f = fileRef.current.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        attachments.push({ name: f.name, data: reader.result });
        socket.emit('message', { room: currentRoom, text, attachments }, (ack) => {
          // ack handling
          if (ack?.ok) {
            setText('');
            fileRef.current.value = '';
          }
        });
      };
      reader.readAsDataURL(f);
    } else {
      socket.emit('message', { room: currentRoom, text }, (ack) => {
        if (ack?.ok) setText('');
      });
    }
  };

  const handleTyping = (val) => {
    setText(val);
    socket && socket.emit('typing', { room: currentRoom, isTyping: !!val });
  };

  const markRead = (messageId) => {
    socket && socket.emit('message:read', { room: currentRoom, messageId });
  };

  const reactTo = (messageId, reaction) => {
    socket && socket.emit('message:react', { room: currentRoom, messageId, reaction });
  };

  return (
    <div className="h-screen grid grid-cols-4">
      <div className="col-span-1 border-r p-4">
        <h3 className="font-bold mb-2">Rooms</h3>
        <div className="space-y-2">
          {rooms.map(r => <button key={r} className={`block w-full text-left p-2 rounded ${r===currentRoom ? 'bg-blue-100' : ''}`} onClick={() => setCurrentRoom(r)}>{r}</button>)}
        </div>
        <hr className="my-3"/>
        <OnlineUsers users={users} />
        <div className="mt-3">
          <h4>Notifications</h4>
          {notifications.slice(0,5).map((n,i) => <div key={i} className="text-sm text-gray-600">{n.type} {n.username||''}</div>)}
        </div>
      </div>

      <div className="col-span-3 flex flex-col">
        <div className="flex-1 overflow-auto p-4">
          <MessageList messages={messages} username={username} onSeen={markRead} onReact={reactTo} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2 items-center">
            <input type="file" ref={fileRef} />
            <input value={text} onChange={e=>handleTyping(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Type a message" />
            <button onClick={()=>sendMessage()} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Typing: {Object.keys(typingUsers).filter(k=>typingUsers[k]).join(', ')}
          </div>
          <div className="mt-2">
            <button onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded">Load older</button>
          </div>
        </div>
      </div>
    </div>
  );
}
