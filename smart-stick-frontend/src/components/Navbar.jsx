import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    return (
        <div style={{
            backgroundColor: '#222831',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #00ADB5',
            marginBottom: '20px',
            borderRadius: '10px'
        }}>
            <h2 style={{ margin: 0, color: '#00ADB5', fontSize: '1.5em' }}>Smart Stick</h2>
            
            <button onClick={handleLogout} style={{
                backgroundColor: 'transparent',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '5px',
                padding: '8px 15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
            }}>
                <FaSignOutAlt style={{ marginRight: '8px' }} /> Logout
            </button>
        </div>
    );
};

export default Navbar;