import React from 'react';
import { FaCog } from 'react-icons/fa';

const Settings = () => {
  return (
    <div style={{
        maxWidth: '800px',
        width: '95%',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#393E46',
        color: '#EEEEEE',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h2 style={{ color: '#00ADB5', borderBottom: '1px solid #00ADB5', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaCog /> Settings</h2>
      <p>This is where user settings, like changing a password or managing account details, will be available.</p>
    </div>
  );
};

export default Settings;