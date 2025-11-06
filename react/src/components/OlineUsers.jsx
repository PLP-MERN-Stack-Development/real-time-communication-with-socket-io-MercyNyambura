import React from 'react';

export default function OnlineUsers({ users = [] }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">Users</h4>
      <ul className="space-y-2">
        {users.map(u => (
          <li key={u.socketId} className="flex items-center justify-between">
            <div>{u.username}</div>
            <div className={`text-xs ${u.online ? 'text-green-600' : 'text-gray-400'}`}>{u.online ? 'online' : 'offline'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
