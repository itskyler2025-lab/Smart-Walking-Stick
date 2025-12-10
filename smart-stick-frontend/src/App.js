// src/App.js

import React, { useState, useEffect } from 'react';
import LiveMap from './LiveMap';
import Login from './Login';
import Register from './Register'; 
import { FaRegClock } from 'react-icons/fa';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stickId, setStickId] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check local storage on initial load (session persistence)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedStickId = localStorage.getItem('stickId');
    if (token && storedStickId) {
      setIsAuthenticated(true);
      setStickId(storedStickId);
    }
  }, []);

  const handleLogin = (token, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('stickId', id);
    setStickId(id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('stickId');
    setStickId(null);
    setIsAuthenticated(false);
  };

  const isMobile = windowWidth < 600;

  // --- Authenticated View ---
  if (isAuthenticated) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #222831 0%, #393E46 100%)', backgroundAttachment: 'fixed' }}>
        
        {/* Responsive Header (Dark Contrast) */}
        <header style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', // Stack vertically on small screens
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: isMobile ? '15px 10px' : '15px 40px', 
          backgroundColor: '#393E46', // Surface color
          color: 'white', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
          fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        }}>
          
          <h1 style={{ 
            margin: isMobile ? '0 0 10px 0' : 0, 
            fontSize: isMobile ? '1.5em' : '1.8em', // Responsive font size
            textAlign: isMobile ? 'center' : 'left',
            width: isMobile ? '100%' : 'auto', // Full width on mobile
            background: 'linear-gradient(to right, #00ADB5, #EEEEEE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Smart Stick Tracker 
            <span style={{ fontSize: '0.6em', opacity: 0.7, marginLeft: '10px' }}>({stickId})</span>
          </h1>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px', 
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto',
            marginTop: isMobile ? '10px' : '0'
          }}>
            {lastUpdate && (
              <span style={{ fontSize: '0.9em', display: 'flex', alignItems: 'center', color: '#EEEEEE', whiteSpace: 'nowrap' }}>
                <FaRegClock style={{ marginRight: '5px' }} /> Last Update: {lastUpdate}
              </span>
            )}
            
            {/* Live Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid #2ecc71' }}>
                <span className="live-pulse" style={{ 
                    height: '8px', 
                    width: '8px', 
                    backgroundColor: '#2ecc71', 
                    borderRadius: '50%', 
                    display: 'inline-block', 
                    marginRight: '6px'
                }}></span>
                <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.8em', letterSpacing: '1px' }}>LIVE</span>
            </div>
            
            {/* Logout Button (High contrast, clearly visible action) */}
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#e74c3c', // Distinct Red for safety/action
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1em',
                width: isMobile ? '100%' : 'auto', // Full width on mobile
              }}>
              Logout
            </button>
          </div>
        </header>
        <LiveMap stickId={stickId} onLocationUpdate={setLastUpdate} />
      </div>
    );
  }

  // --- Unauthenticated View (Login/Register) ---
  return (
    <div className="App" style={{ 
        textAlign: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #222831 0%, #393E46 100%)',
        backgroundAttachment: 'fixed',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
      {isRegistering ? (
        <Register 
          onRegisterSuccess={() => setIsRegistering(false)} 
          switchToLogin={() => setIsRegistering(false)} 
        />
      ) : (
        <Login 
          onLoginSuccess={handleLogin} 
          switchToRegister={() => setIsRegistering(true)} 
        />
      )}
    </div>
  );
}

export default App;