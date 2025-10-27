import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Cognito config
const COGNITO_DOMAIN = 'https://week7-demo-green.auth.us-east-2.amazoncognito.com';
const CLIENT_ID = '1p9dvdbpfgu1i2p60fuhuqrah';
const REDIRECT_URI = 'https://diwilrwjzu7ud.cloudfront.net';
const NOTES_API = 'https://di6iz02yv9.execute-api.us-east-1.amazonaws.com/prod';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt'));
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // On load: grab token from URL if Cognito redirected back
  useEffect(() => {
    const url = new URL(window.location);
    const code = url.searchParams.get('code');
    if (code) {
      exchangeCodeForTokens(code);
    } else if (token) {
      fetchNotes();
    }
  }, [token]);

  // Exchange authorization code for JWT
  async function exchangeCodeForTokens(code) {
    const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    const data = await res.json();
    if (data.id_token) {
      localStorage.setItem('jwt', data.id_token);
      setToken(data.id_token);
      window.history.replaceState({}, document.title, '/'); // clean URL
    }
  }

  // Login: redirect to Cognito hosted UI
  function login() {
    const url = `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid+email`;
    window.location = url;
  }

  // Logout: clear token & redirect
  function logout() {
    localStorage.removeItem('jwt');
    setToken(null);
    window.location = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;
  }

  // Fetch notes (Bearer token)
  async function fetchNotes() {
    const res = await axios.get(`${NOTES_API}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotes(res.data);
  }

  // Create note
  async function createNote() {
    await axios.post(`${NOTES_API}/notes`, { title, content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTitle(''); setContent(''); fetchNotes();
  }

  if (!token) return (
    <div style={{ padding: 40 }}>
      <h2>Week 7 – Secure Notes App</h2>
      <button onClick={login}>Login with Cognito</button>
    </div>
  );

  return (
    <div style={{ padding: 40 }}>
      <h2>My Notes</h2>
      <button onClick={logout}>Logout</button>
      <br /><br />
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <br />
      <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
      <br />
      <button onClick={createNote}>Add Note</button>
      <ul>
        {notes.map(n => <li key={n.noteId}><strong>{n.title}</strong>: {n.content}</li>)}
      </ul>
    </div>
  );
}

export default App;