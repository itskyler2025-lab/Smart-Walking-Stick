import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const EmergencyBanner = ({ isEmergency, onClear, isMobile }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (!isEmergency) return null;

    return (
        <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            marginBottom: '25px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
            animation: 'emergency-pulse 2s infinite'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2em', fontWeight: 'bold' }}>
                <FaExclamationTriangle style={{ marginRight: '15px', fontSize: '1.5em' }} />
                <span>EMERGENCY ALERT: Panic Button Pressed!</span>
            </div>
            <button 
                onClick={onClear}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    backgroundColor: isHovered ? '#f1f1f1' : 'white',
                    color: '#e74c3c',
                    border: 'none',
                    padding: '10px 25px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1em',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                    boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                }}
            >
                Clear Emergency
            </button>
        </div>
    );
};

export default EmergencyBanner;