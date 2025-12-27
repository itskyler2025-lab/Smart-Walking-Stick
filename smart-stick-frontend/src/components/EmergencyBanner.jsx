import React from 'react';

const EmergencyBanner = ({ isEmergency, onClear, isMobile }) => {
    if (!isEmergency) return null;

    return (
        <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
            animation: 'pulse 2s infinite'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? '10px' : '0' }}>
                <span style={{ fontSize: '1.5em', marginRight: '10px' }}>🚨</span>
                <div>
                    <strong style={{ fontSize: '1.1em', display: 'block' }}>EMERGENCY ALERT</strong>
                    <span style={{ fontSize: '0.9em' }}>Panic Button Activated!</span>
                </div>
            </div>
            <button 
                onClick={onClear}
                style={{
                    backgroundColor: 'white',
                    color: '#e74c3c',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    width: isMobile ? '100%' : 'auto'
                }}
            >
                Clear Emergency
            </button>
        </div>
    );
};

export default EmergencyBanner;