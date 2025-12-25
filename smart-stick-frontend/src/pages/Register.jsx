// src/pages/Register.js

import React, { useState } from 'react';
import { TailSpin } from 'react-loader-spinner'; // Import the loader
import { FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stickId, setStickId] = useState('');
  const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLinkHovered, setIsLinkHovered] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await api.post('/api/auth/register', { username, email, password, stickId });

      alert('Registration successful! Please log in.');
      onRegisterSuccess(); 

    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
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
        
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        <input type="text" placeholder="Stick ID (e.g., WALKSTK-001)" value={stickId} onChange={(e) => setStickId(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', backgroundColor: '#222831', color: '#EEEEEE', border: '1px solid #00ADB5', borderRadius: '5px' }} />
        
        <button type="submit"  disabled={loading} 
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          style={{ width: '100%', padding: '12px', backgroundColor: isButtonHovered ? '#008C9E' : '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease', boxShadow: isButtonHovered ? '0 4px 10px rgba(0, 173, 181, 0.4)' : 'none' }}>
        {loading ? (
          <TailSpin color="white" height={20} width={20} />
           ) : (
            "Register"
          )}
          </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
        Already registered? <Link 
          to="/login" 
          onMouseEnter={() => setIsLinkHovered(true)}
          onMouseLeave={() => setIsLinkHovered(false)}
          style={{ 
            color: '#00ADB5', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            textDecoration: isLinkHovered ? 'underline' : 'none' 
          }}>Login here</Link>
      </p>
    </div>
  );
}

export default Register;