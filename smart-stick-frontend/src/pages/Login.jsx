// src/pages/Login.js

import React, { useState } from 'react';
import { TailSpin } from 'react-loader-spinner'; // Import the loader
import { Link } from 'react-router-dom';
import api from '../utils/api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLinkHovered, setIsLinkHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      const response = await api.post('/api/auth/login', { username, password });
      
      const data = response.data;

      // Success: Call the handler to update App.js state
      onLoginSuccess(data.token, data.stickId); 

    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      await api.post('/api/auth/forgotpassword', { email });
      setMessage('If an account exists with this email, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setMessage('');
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
      <form onSubmit={isResetMode ? handleResetSubmit : handleLoginSubmit}>
        <h3 style={{ color: '#00ADB5', marginBottom: '20px' }}>
            {isResetMode ? "Reset Password" : "SWS Tracker"}
        </h3>
        {error && <p style={{ color: '#e74c3c', padding: '10px', backgroundColor: '#fcecec', borderRadius: '5px' }}>{error}</p>}
        {message && <p style={{ color: '#2ecc71', padding: '10px', backgroundColor: '#eafaf1', borderRadius: '5px' }}>{message}</p>}
        
        {!isResetMode ? (
          <>
            <input
              type="text"
              placeholder="Username or Email"
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
          </>
        ) : (
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', margin: '10px 0', boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' }}
          />
        )}
        
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
            <span onClick={toggleMode} style={{ color: '#00ADB5', fontSize: '0.9em', cursor: 'pointer' }}>
                {isResetMode ? "Back to Login" : "Forgot Password?"}
            </span>
        </div>
        
        <button type="submit" disabled={loading} 
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          style={{ width: '100%', padding: '12px', backgroundColor: isButtonHovered ? '#008C9E' : '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease', boxShadow: isButtonHovered ? '0 4px 10px rgba(0, 173, 181, 0.4)' : 'none' }}>
          {loading ? (
            <TailSpin color="white" height={20} width={20} />
          ) : (
            isResetMode ? "Send Reset Link" : "Login"
          )}
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
        Don't have an account? <Link 
          to="/register" 
          onMouseEnter={() => setIsLinkHovered(true)}
          onMouseLeave={() => setIsLinkHovered(false)}
          style={{ 
            color: '#00ADB5', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            textDecoration: isLinkHovered ? 'underline' : 'none' }}>Register here</Link>
      </p>
    </div>
  );
}

export default Login;