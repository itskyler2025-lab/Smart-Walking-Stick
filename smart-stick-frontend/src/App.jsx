// src/App.js

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, Outlet, NavLink } from 'react-router-dom';
import LiveMap from './components/LiveMap';
import Login from './pages/Login';
import Register from './pages/Register'; 
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings'; 
import Status from './pages/Status';
import { FaCog, FaMapMarkedAlt, FaSignal } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppContext } from './context/AppContext';
import { MOBILE_NAV_BREAKPOINT } from './utils/constants';

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

const AuthenticatedLayout = () => {
  const { stickId, handleLogout } = useAppContext();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < MOBILE_NAV_BREAKPOINT;

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#00ADB5' : '#EEEEEE',
    textDecoration: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.3s, color 0.3s',
    backgroundColor: isActive ? 'rgba(0, 173, 181, 0.2)' : 'transparent',
  });

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #222831 0%, #393E46 100%)', backgroundAttachment: 'fixed' }}>
      
      {/* Responsive Header (Dark Contrast) */}
      <header style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: isMobile ? '15px 10px' : '15px 40px', 
        backgroundColor: '#393E46',
        color: 'white', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
        fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <h1 style={{ margin: 0, fontSize: '1.8em', background: 'linear-gradient(to right, #00ADB5, #EEEEEE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            TrackMap 
            <span style={{ fontSize: '0.6em', opacity: 0.7, marginLeft: '10px' }}>({stickId})</span>
          </h1>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto',
          marginTop: isMobile ? '10px' : '0'
        }}>
          <nav style={{ display: 'flex', gap: '10px' }}>
            <NavLink to="/" style={navLinkStyle} end>
              <FaMapMarkedAlt />
              {!isMobile && 'Map'}
            </NavLink>
            <NavLink to="/settings" style={navLinkStyle}>
              <FaCog />
              {!isMobile && 'Settings'}
            </NavLink>
            <NavLink to="/status" style={navLinkStyle}>
              <FaSignal />
              {!isMobile && 'Status'}
            </NavLink>
          </nav>
          
          <button onClick={handleLogout} onMouseEnter={() => setIsLogoutHovered(true)} onMouseLeave={() => setIsLogoutHovered(false)} style={{ padding: '10px 20px', backgroundColor: isLogoutHovered ? '#c0392b' : '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', width: isMobile ? '100%' : 'auto', transition: 'background-color 0.3s ease, box-shadow 0.3s ease', boxShadow: isLogoutHovered ? '0 4px 8px rgba(231, 76, 60, 0.4)' : 'none' }}>
            Logout
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocus draggable theme="dark" />
    </div>
  );
};

function App() {
  const { isAuthenticated, handleLogin } = useAppContext();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <AuthWrapper><Login onLoginSuccess={handleLogin} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <AuthWrapper><Register onRegisterSuccess={() => navigate('/login')} /></AuthWrapper> : <Navigate to="/" />
      } />
      <Route path="/resetpassword/:token" element={<AuthWrapper><ResetPasswordPage /></AuthWrapper>} />
      
      {/* Protected Routes */}
      <Route element={
        isAuthenticated ? <AuthenticatedLayout /> : <Navigate to="/login" />
      }>
        <Route index element={<LiveMap />} />
        <Route path="settings" element={<Settings />} />
        <Route path="status" element={<Status />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;