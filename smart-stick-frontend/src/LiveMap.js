// src/LiveMap.js

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import UserInfo from './UserInfo';
// Import modern icons
import { FaGlobe, FaSatellite, FaRoad, FaListUl } from 'react-icons/fa'; 

// ===================================================
// CONFIGURATION
// ===================================================

const defaultCenter = { lat: 14.00, lng: 121.00 }; 
const API_URL = process.env.REACT_APP_API_URL;
const REFRESH_INTERVAL_MS = 5000; 
const DASHBOARD_BREAKPOINT = 1000;

// Main styles object for the dashboard
const dashboardStyles = {
    padding: '25px', 
    maxWidth: '1400px', 
    margin: '0 auto', 
    fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
};

// CSS Grid styles for the main content area (Top Row: Info + Map)
const topContentGridStyle = {
    display: 'grid', 
    gridTemplateColumns: '1.2fr 3fr', // Desktop layout: [Info] [Map]
    gap: '30px', 
    alignItems: 'stretch',
};

function LiveMap({ stickId, onLocationUpdate, onStatusChange }) {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [pathHistory, setPathHistory] = useState([]); 
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapTypeId, setMapTypeId] = useState('roadmap'); 
    const [isInitialLoad, setIsInitialLoad] = useState(true); // New state to track initial data fetch
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    const JWT_TOKEN = localStorage.getItem('token'); 

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDashboardMobile = windowWidth < DASHBOARD_BREAKPOINT;

    // Load Google Maps script
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    });

    // Helper function for authenticated fetch requests
    const authFetch = useCallback((endpoint) => {
        return fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
        });
    }, [JWT_TOKEN]);

    // --- 1. Fetch Latest Location (Real-Time Polling) ---
    const fetchLatestLocation = useCallback(async () => {
        if (!JWT_TOKEN || !stickId) return;

        try {
            const response = await authFetch(`/api/latest`);
            
            // If we get a response, the server is reachable (even if 404 or 500)
            if (onStatusChange) onStatusChange(true);

            if (!response.ok) {
                console.warn(`Latest location fetch failed: Status ${response.status}`);
                if (isInitialLoad) setIsInitialLoad(false); // Initial load attempt is complete
                return;
            }
            const data = await response.json();
            
            if (!data || !data.location || !data.location.coordinates) {
                console.warn("Location data received is incomplete. Skipping update.");
                if (isInitialLoad) setIsInitialLoad(false); // Initial load attempt is complete
                return;
            }

            const [lng, lat] = data.location.coordinates; 
            const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const timestamp = new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setCurrentLocation({
                position: newPos,
                timestamp: timestamp,
            });
            
            setMapCenter(newPos);
            if (onLocationUpdate) onLocationUpdate(timestamp);
            if (isInitialLoad) setIsInitialLoad(false); // Data received, initial load is complete
            
        } catch (error) {
            console.error("Error fetching latest data:", error.message);
            if (onStatusChange) onStatusChange(false);
            if (isInitialLoad) setIsInitialLoad(false); // Initial load attempt is complete
        }
    }, [JWT_TOKEN, stickId, authFetch, onLocationUpdate, onStatusChange, isInitialLoad]);


    // --- 2. Fetch Path History (Robust Error Handling) ---
    const fetchPathHistory = useCallback(async () => {
        if (!JWT_TOKEN || !stickId) return;

        try {
            const response = await authFetch(`/api/history?limit=500`); 
            
            // If we get a response, the server is reachable
            if (onStatusChange) onStatusChange(true);

            if (!response.ok) {
                console.error(`API Error fetching history: Status ${response.status}`);
                setPathHistory([]); 
                return;
            }
            
            const data = await response.json();

            // CRITICAL CHECK: Ensure the received data is an array
            if (Array.isArray(data)) {
                setPathHistory(data);
            } else {
                console.error("History data is not an array. Resetting state.");
                setPathHistory([]); 
            }
            
        } catch (error) {
            console.error("Network or parsing error fetching history:", error.message);
            setPathHistory([]); 
            if (onStatusChange) onStatusChange(false);
        }
    }, [JWT_TOKEN, stickId, authFetch, onStatusChange]);


    // --- 3. Lifecycle Effects ---
    useEffect(() => {
        fetchLatestLocation(); 
        fetchPathHistory(); 

        const intervalId = setInterval(fetchLatestLocation, REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [fetchLatestLocation, fetchPathHistory]);


    // --- 4. Helper Function for Responsive Styles (Top Grid only) ---
    const getResponsiveStyle = (styleName) => {
        if (styleName === 'topGrid') {
            // Stack columns below 1000px width for mobile/tablet screens
            if (isDashboardMobile) { 
                return { 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px'
                }; 
            }
            return topContentGridStyle;
        }
        return {};
    };

    // --- 5. Loading and Error States ---
    if (loadError) return <div style={{ color: '#c0392b', textAlign: 'center', marginTop: '50px' }}>⚠️ Error loading maps.</div>;
    if (!isLoaded) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em', color: '#34495e' }}>🗺️ Loading Google Maps...</div>;

    // --- 6. Render Component ---
    return (
        <div style={dashboardStyles}>
            
            {/* 1. TOP ROW: Info and Live Map (Responsive Grid/Flex) */}
            <div style={getResponsiveStyle('topGrid')}>
                
                {/* LEFT COLUMN: User Info and Latest Update */}
                <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                    minWidth: 0, 
                    width: '100%' 
                }}> 
                    
                    <UserInfo />
                </div>

                {/* RIGHT COLUMN: Live Map & Controls */}
                <div style={{ minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Map Type Controls (Responsive Flexbox) */}
                    <div style={{ 
                        marginBottom: '15px', 
                        display: 'flex', 
                        justifyContent: isDashboardMobile ? 'space-around' : 'flex-start',
                        gap: isDashboardMobile ? '0' : '10px',
                        flexWrap: 'wrap',
                    }}>
                        {['roadmap', 'hybrid', 'satellite'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setMapTypeId(type)} 
                                style={{
                                    padding: '8px 18px', 
                                    backgroundColor: mapTypeId === type ? '#00ADB5' : '#222831', 
                                    color: mapTypeId === type ? 'white' : '#EEEEEE', 
                                    border: '1px solid #00ADB5', 
                                    borderRadius: '5px', 
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: mapTypeId === type ? '0 4px 8px rgba(0, 173, 181, 0.4)' : 'none',
                                    flex: isDashboardMobile ? '1 1 auto' : '0 0 auto', 
                                    minWidth: isDashboardMobile ? '100px' : 'auto',
                                }}>
                                {type === 'roadmap' && <FaRoad style={{ marginRight: '6px' }} />}
                                {type === 'hybrid' && <FaGlobe style={{ marginRight: '6px' }} />}
                                {type === 'satellite' && <FaSatellite style={{ marginRight: '6px' }} />}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Map Container */}
                <div style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: '10px', overflow: 'hidden', flex: 1, minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                        <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%', flex: 1 }}
                            center={mapCenter}
                            zoom={18}
                            options={{ 
                                mapTypeId: mapTypeId, 
                                disableDefaultUI: true, 
                                zoomControl: true,
                            }}
                        >
                            {/* 1. Location History Path (Polyline) */}
                            {pathHistory.length > 0 && (
                                <Polyline 
                                    path={pathHistory} 
                                    options={{ 
                                        strokeColor: '#e74c3c', 
                                        strokeOpacity: 0.7,
                                        strokeWeight: 4,
                                    }}
                                />
                            )}
                            
                            {/* 2. Real-time Marker (Current Position) */}
                            {currentLocation && (
                                <Marker 
                                    position={currentLocation.position} 
                                    title={`Stick ${stickId} - Live Location`}
                                    icon={{ 
                                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                                        fillColor: "#00ADB5", 
                                        fillOpacity: 1, 
                                        strokeColor: "#222831", 
                                        strokeWeight: 1.5,
                                        scale: 1.5,
                                    }}
                                />
                            )}

                            {/* 3. Message for when no location has been received yet */}
                            {!currentLocation && !isInitialLoad && (
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    backgroundColor: 'rgba(34, 40, 49, 0.85)',
                                    color: '#EEEEEE', padding: '15px 25px', borderRadius: '8px',
                                    textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                    fontSize: '1.1em'
                                }}>
                                    Waiting for the first location update from the device...
                                </div>
                            )}
                        </GoogleMap>
                    </div>
                </div>
            </div>
            
            {/* 2. BOTTOM ROW: Location History List (FULL WIDTH) */}
            <div style={{ minWidth: 0, marginTop: '30px', width: '100%' }}> 
                <div style={{ 
                    padding: windowWidth < 600 ? '15px' : '25px', // Responsive padding
                    backgroundColor: '#393E46', 
                    color: '#EEEEEE',
                    borderRadius: '10px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                }}>
                    <h3 style={{ 
                        borderBottom: '2px solid #e74c3c', 
                        paddingBottom: '10px', 
                        color: '#EEEEEE', 
                        marginBottom: '15px', 
                        fontSize: '1.4em',
                        fontWeight: '600'
                    }}>
                        <FaListUl style={{ marginRight: '10px', verticalAlign: 'middle', color: '#e74c3c' }} /> Location History
                    </h3>

                    {pathHistory.length === 0 && (
                        <p style={{ color: '#EEEEEE', opacity: 0.7 }}>No historical data available yet. Ensure the ESP32 is sending data.</p>
                    )}
                    
                    {/* History List Container (Scrollable) */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}> 
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {/* Display history in reverse chronological order (most recent at top) */}
                            {pathHistory.slice().reverse().map((point, index) => (
                                <li key={index} style={{ 
                                    padding: '8px 0', 
                                    borderBottom: '1px dotted #e0e0e0', 
                                    fontSize: '0.9em',
                                    color: '#EEEEEE',
                                    wordWrap: 'break-word', 
                                }}>
                                    <strong style={{ color: '#00ADB5' }}>Time:</strong> {new Date(point.time).toLocaleTimeString('en-US')}
                                    <br />
                                    Lat: {point.lat.toFixed(4)}, Lon: {point.lng.toFixed(4)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LiveMap;