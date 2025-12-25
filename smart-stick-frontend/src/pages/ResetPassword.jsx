// src/pages/ResetPassword.js

import React, { useState } from 'react';
import { TailSpin } from 'react-loader-spinner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';

function ResetPassword({ token, onResetSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      // PUT request to reset password using the token
      await api.put(`/api/auth/resetpassword/${token}`, { password });
      
      setMessage('Password reset successful! Redirecting to login...');
      
      // Wait a moment before redirecting so user sees the success message
      setTimeout(() => {
        onResetSuccess();
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
        maxWidth: '360px', 
        width: '95%', 
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
            Reset Password
        </h3>
        {error && <p style={{ color: '#e74c3c', padding: '10px', backgroundColor: '#fcecec', borderRadius: '5px' }}>{error}</p>}
        {message && <p style={{ color: '#2ecc71', padding: '10px', backgroundColor: '#eafaf1', borderRadius: '5px' }}>{message}</p>}
        
        <div style={{ position: 'relative', width: '100%', margin: '10px 0' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', paddingRight: '40px', margin: 0, boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' }}
          />
          <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#00ADB5', display: 'flex', alignItems: 'center', fontSize: '1.2em' }}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div style={{ position: 'relative', width: '100%', margin: '10px 0' }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', paddingRight: '40px', margin: 0, boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' }}
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#00ADB5', display: 'flex', alignItems: 'center', fontSize: '1.2em' }}>
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        
        <button type="submit" disabled={loading} 
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          style={{ width: '100%', padding: '12px', backgroundColor: isButtonHovered ? '#008C9E' : '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease', boxShadow: isButtonHovered ? '0 4px 10px rgba(0, 173, 181, 0.4)' : 'none' }}>
          {loading ? <TailSpin color="white" height={20} width={20} /> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;