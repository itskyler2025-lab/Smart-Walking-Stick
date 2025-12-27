// src/pages/Settings.jsx

import React from 'react';

const Settings = () => {
    return (
        <div style={{ 
            padding: '40px', 
            color: '#EEEEEE', 
            maxWidth: '800px', 
            margin: '20px auto',
            backgroundColor: '#393E46',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
            <h1 style={{ color: '#00ADB5', borderBottom: '1px solid #00ADB5', paddingBottom: '10px' }}>
                Settings
            </h1>
            <p>This is the settings page. User preferences and application settings will go here in the future.</p>
        </div>
    );
};

export default Settings;