import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestForToken } from '../utils/firebase';
import { API_URL as baseURL } from '../utils/config';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    const [stickId, setStickId] = useState(() => localStorage.getItem('stickId'));
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isLive, setIsLive] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [batteryStatus, setBatteryStatus] = useState({ level: null, isCharging: false });
    const [currentTime, setCurrentTime] = useState(Date.now());
    const navigate = useNavigate();

    // Update 'currentTime' every minute for the "X min ago" display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Request push notification permission on login
    useEffect(() => {
        if (isAuthenticated) {
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

    const value = {
        isAuthenticated,
        stickId,
        lastUpdate,
        isLive,
        isReconnecting,
        batteryStatus,
        currentTime,
        API_URL: baseURL,
        handleLogin,
        handleLogout,
        setLastUpdate,
        setIsLive,
        setIsReconnecting,
        setBatteryStatus,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};