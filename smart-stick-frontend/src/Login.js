// src/Login.js

import React, { useState } from 'react';

const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

function Login({ onLoginSuccess, switchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Success: Call the handler to update App.js state
      onLoginSuccess(data.token, data.stickId); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
        maxWidth: '360px', // Maximum size on desktop
        width: '95%', // Takes 95% width on all screens for responsiveness
        margin: '20px auto', 
        padding: '30px', 
        backgroundColor: '#393E46',
        color: '#EEEEEE',
        border: '1px solid #e0e0e0', 
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <form onSubmit={handleSubmit}>
        <h3 style={{ color: '#00ADB5', marginBottom: '20px' }}>
            SWS Tracker
        </h3>
        {error && <p style={{ color: '#e74c3c', padding: '10px', backgroundColor: '#fcecec', borderRadius: '5px' }}>{error}</p>}
        
        {/* Input fields use width: 100% for responsiveness */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' }}
        />
        
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>
            Login
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
        Don't have an account? <span onClick={switchToRegister} style={{ color: '#00ADB5', cursor: 'pointer', fontWeight: 'bold' }}>Register here</span>
      </p>
    </div>
  );
}

export default Login;