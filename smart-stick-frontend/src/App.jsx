// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import LiveMap from './components/LiveMap';
import Login from './pages/Login';
import Register from './pages/Register'; 
import ResetPassword from './pages/ResetPassword';
import UserInfo from './components/UserInfo';
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

  // --- Authenticated Layout ---
  const AuthenticatedLayout = (
      <div className="App" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #222831 0%, #393E46 100%)', backgroundAttachment: 'fixed' }}>
        
        <div style={{ 
          padding: '15px 20px', 
          backgroundColor: '#393E46', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
        }}>
          <h1 style={{ margin: 0, color: '#00ADB5', fontSize: '1.5em' }}>Smart Stick Tracker</h1>
          <button onClick={handleLogout} style={{
            padding: '8px 15px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>Logout</button>
        </div>
        
        <UserInfo />
        <LiveMap stickId={stickId} onLocationUpdate={setLastUpdate} onStatusChange={setIsLive} onAuthError={handleLogout} onBatteryUpdate={setBatteryStatus} onReconnecting={setIsReconnecting} />
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

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <AuthWrapper><Login onLoginSuccess={handleLogin} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <AuthWrapper><Register onRegisterSuccess={() => navigate('/login')} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/resetpassword/:token" element={<AuthWrapper><ResetPasswordPage /></AuthWrapper>} />
      <Route path="/" element={
        isAuthenticated ? AuthenticatedLayout : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default App;