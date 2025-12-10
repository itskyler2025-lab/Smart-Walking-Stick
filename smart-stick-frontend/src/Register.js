// src/Register.js

import React, { useState } from 'react';
import { FaUserPlus } from 'react-icons/fa'; // Icon for registration

const API_URL = process.env.REACT_APP_API_URL;

function Register({ onRegisterSuccess, switchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stickId, setStickId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, stickId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      alert('Registration successful! Please log in.');
      onRegisterSuccess(); 

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
            <FaUserPlus style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Register New Account
        </h3>
        {error && <p style={{ color: '#e74c3c', padding: '10px', backgroundColor: '#fcecec', borderRadius: '5px' }}>{error}</p>}
        
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        <input type="text" placeholder="Stick ID (e.g., WALKSTK-001)" value={stickId} onChange={(e) => setStickId(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>
            Register
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
        Already registered? <span onClick={switchToLogin} style={{ color: '#00ADB5', cursor: 'pointer', fontWeight: 'bold' }}>Login here</span>
      </p>
    </div>
  );
}

export default Register;