// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import LiveMap from './components/LiveMap';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';
import { FaRegClock, FaUnlink, FaBatteryFull, FaBatteryThreeQuarters, FaBatteryHalf, FaBatteryQuarter, FaBatteryEmpty, FaBolt } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import { requestForToken } from './utils/firebase'; // Import the new function
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Auth Wrapper for Login/Register ---
const AuthWrapper = ({ children }) => (
  <div className="App" style={{ 
      textAlign: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #222831 0%, #393E46 100%)',
      backgroundAttachment: 'fixed',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
  }}>
    {children}
  </div>
);

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  return <ResetPassword token={token} onResetSuccess={() => navigate('/login')} />;
};

// --- NavLink Component for Hover Effects ---
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        color: isHovered ? '#00ADB5' : '#EEEEEE', 
        textDecoration: 'none', 
        fontWeight: 'bold', 
        fontSize: '0.9em', 
        paddingBottom: '4px',
        borderBottom: isActive ? '2px solid #00ADB5' : '2px solid transparent',
        transition: 'all 0.2s ease-in-out'
      }}>
      {children}
    </Link>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [stickId, setStickId] = useState(() => {
    return localStorage.getItem('stickId');
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(true); // To track connection status
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [batteryStatus, setBatteryStatus] = useState({ level: null, isCharging: false });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update 'currentTime' every minute to refresh the "X min ago" display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Effect to handle Push Notification setup
  useEffect(() => {
    if (isAuthenticated) {
      // Request permission and get token
      requestForToken();
    }
  }, [isAuthenticated]);

  const handleLogin = (token, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('stickId', id);
    setStickId(id);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('stickId');
    setStickId(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  const isMobile = windowWidth < 600;

  const getBatteryColor = (level, isCharging) => {
    if (isCharging) return '#f1c40f'; // Gold color for charging
    if (level === null || level === undefined) return '#95a5a6';
    if (level >= 60) return '#2ecc71'; // Green
    if (level >= 25) return '#f1c40f'; // Yellow
    return '#e74c3c'; // Red
  };

  const getBatteryIcon = (level, isCharging) => {
    if (isCharging) return <FaBolt />;
    if (level === null || level === undefined) return <FaBatteryEmpty />;
    if (level >= 90) return <FaBatteryFull />;
    if (level >= 60) return <FaBatteryThreeQuarters />;
    if (level >= 35) return <FaBatteryHalf />;
    if (level >= 10) return <FaBatteryQuarter />;
    return <FaBatteryEmpty />;
  };

  // --- Authenticated Layout Component ---
  // This component now wraps any page that requires authentication.
  // It accepts 'children' to render the specific page content (e.g., LiveMap or Settings).
  const AuthenticatedLayout = ({ children }) => {
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
                <FaRegClock style={{ marginRight: '5px' }} /> Last Update: {new Date(lastUpdate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            
            {/* Live Status Indicator */}
            {isLive ? (
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
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid #e74c3c' }}>
                  <FaUnlink style={{ color: '#e74c3c', marginRight: '6px' }} />
                  <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.8em', letterSpacing: '1px' }}>
                    OFFLINE {lastUpdate ? `(${Math.max(0, Math.floor((currentTime - new Date(lastUpdate).getTime()) / 60000))}m ago)` : ''}
                  </span>
              </div>
            )}

            {/* Reconnecting Spinner - Shows when offline and trying to reconnect */}
            {!isLive && isReconnecting && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TailSpin color="#f1c40f" height={18} width={18} />
                  <span style={{ color: '#f1c40f', fontSize: '0.8em', fontWeight: 'bold' }}>Reconnecting...</span>
               </div>
            )}
            
            {/* Battery Level Indicator */}
            <div 
              className={batteryStatus.level !== null && batteryStatus.level < 20 && !batteryStatus.isCharging ? "low-battery-pulse" : ""}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                border: `1px solid ${getBatteryColor(batteryStatus.level, batteryStatus.isCharging)}`, // Border matches battery color
                transition: 'all 0.3s ease',
                boxShadow: batteryStatus.level !== null && batteryStatus.level < 20 && !batteryStatus.isCharging ? '0 0 8px rgba(231, 76, 60, 0.4)' : 'none'
            }}>
                <span style={{ 
                    color: getBatteryColor(batteryStatus.level, batteryStatus.isCharging), 
                    fontSize: '1.2em', 
                    marginRight: '8px', 
                    display: 'flex', 
                    alignItems: 'center' 
                }}>
                    {getBatteryIcon(batteryStatus.level, batteryStatus.isCharging)}
                </span>
                <span style={{ color: '#EEEEEE', fontWeight: 'bold', fontSize: '0.9em' }}>
                    {batteryStatus.level !== null ? `${batteryStatus.level}%` : '--%'}
                </span>
            </div>

            {/* Navigation Bar */}
            <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>

            {/* Logout Button (High contrast, clearly visible action) */}
            <button 
              onClick={handleLogout} 
              onMouseEnter={() => setIsLogoutHovered(true)}
              onMouseLeave={() => setIsLogoutHovered(false)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: isLogoutHovered ? '#c0392b' : '#e74c3c', // Darker red on hover
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1em',
                width: isMobile ? '100%' : 'auto', // Full width on mobile
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: isLogoutHovered ? '0 4px 8px rgba(231, 76, 60, 0.4)' : 'none'
              }}>
              Logout
            </button>
          </div>
        </header>
        
        {/* This is where the page content (LiveMap or Settings) will be rendered */}
        {children}

        <ToastContainer 
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocus
          draggable
          theme="dark"
        />
      </div>
    );
  };
  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <AuthWrapper><Login onLoginSuccess={handleLogin} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <AuthWrapper><Register onRegisterSuccess={() => navigate('/login')} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/resetpassword/:token" element={<AuthWrapper><ResetPasswordPage /></AuthWrapper>} />
      
      {/* Main dashboard route now uses the layout component */}
      <Route path="/" element={
        isAuthenticated 
          ? <AuthenticatedLayout>
              <LiveMap stickId={stickId} onLocationUpdate={setLastUpdate} onStatusChange={setIsLive} onAuthError={handleLogout} onBatteryUpdate={setBatteryStatus} onReconnecting={setIsReconnecting} />
            </AuthenticatedLayout> 
          : <Navigate to="/login" />
      } />
      {/* New settings route, also protected by the layout */}
      <Route path="/settings" element={
        isAuthenticated 
          ? <AuthenticatedLayout><Settings /></AuthenticatedLayout> 
          : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default App;