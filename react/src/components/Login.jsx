import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }){
  const [name, setName] = useState('');
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin(name.trim());
    nav('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="p-6 border rounded shadow">
        <h2 className="text-xl mb-4">Enter your username</h2>
        <input value={name} onChange={e => setName(e.target.value)} className="border p-2 w-64" placeholder="username" />
        <div className="mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Join Chat</button>
        </div>
      </form>
    </div>
  );
}
