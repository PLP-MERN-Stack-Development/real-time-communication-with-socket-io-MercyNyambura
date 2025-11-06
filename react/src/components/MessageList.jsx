import React from 'react';
import dayjs from 'dayjs';

export default function MessageList({ messages = [], username, onSeen, onReact }) {
  return (
    <div className="space-y-4">
      {messages.map(m => (
        <div key={m.id} className={`p-3 rounded ${m.from.socketId===m.from.socketId ? '' : ''} `}>
          <div className="flex items-center justify-between">
            <div className="font-semibold">{m.from.username}</div>
            <div className="text-xs text-gray-500">{dayjs(m.timestamp).format('HH:mm')}</div>
          </div>
          <div className="mt-1">{m.text}</div>
          {m.attachments?.map((a, i) => (
            <div key={i} className="mt-2">
              <img src={a.data} alt={a.name} className="max-w-xs rounded" />
            </div>
          ))}
          <div className="mt-2 flex items-center gap-2">
            <button onClick={()=>onSeen && onSeen(m.id)} className="text-xs">Mark read</button>
            <button onClick={()=>onReact && onReact(m.id, '')} className="text-xs"></button>
            <span className="text-xs text-gray-500">{Object.entries(m.reactions||{}).map(([r, arr]) => `${r} ${arr.length}`).join(' • ')}</span>
            <div className="ml-auto text-xs text-gray-400">{m.readBy?.length ? `Read: ${m.readBy.length}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
