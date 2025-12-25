// src/components/LiveMap.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Polyline, useLoadScript, OverlayView } from '@react-google-maps/api';
import UserInfo from './UserInfo';
// Import modern icons
import { FaGlobe, FaSatellite, FaRoad, FaListUl, FaExclamationTriangle, FaLocationArrow } from 'react-icons/fa'; 
import { GOOGLE_MAPS_API_KEY, API_URL } from '../utils/config';
import { io } from 'socket.io-client';
import api from '../utils/api';

// ===================================================
// CONFIGURATION
// ===================================================

const defaultCenter = { lat: 14.00, lng: 121.00 }; 
const DASHBOARD_BREAKPOINT = 1000;

// --- EMERGENCY SOUND GENERATOR ---
const playEmergencySound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Siren sound effect (Sawtooth wave for "harsh" alarm sound)
    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    
    // Ramp frequency up and down (Siren)
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
    osc.frequency.linearRampToValueAtTime(600, now + 0.6);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.9);
    osc.frequency.linearRampToValueAtTime(600, now + 1.2);

    // Volume envelope
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.0, now + 1.2);

    osc.start(now);
    osc.stop(now + 1.2);

    osc.onended = () => {
        ctx.close();
    };
};

// Main styles object for the dashboard
const dashboardStyles = {
    padding: '15px', 
    maxWidth: '1400px', 
    margin: '0 auto', 
    fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
};

// CSS Grid styles for the main content area (Top Row: Info + Map)
const topContentGridStyle = {
    display: 'grid', 
    gridTemplateColumns: '1.2fr 3fr', // Desktop layout: [Info] [Map]
    gap: '15px', 
    alignItems: 'stretch',
};

const libraries = ['marker'];

// Access Map ID directly to ensure it loads from Vite env
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

function LiveMap({ stickId, onLocationUpdate, onStatusChange, onAuthError, onBatteryUpdate }) {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [pathHistory, setPathHistory] = useState([]); 
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapTypeId, setMapTypeId] = useState('roadmap'); 
    const [isInitialLoad, setIsInitialLoad] = useState(true); // New state to track initial data fetch
    const [isEmergency, setIsEmergency] = useState(false);
    const [mapZoom, setMapZoom] = useState(18);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isFollowing, setIsFollowing] = useState(true);
    const [hoveredMapType, setHoveredMapType] = useState(null);
    const [isRecenterHovered, setIsRecenterHovered] = useState(false);
    const [isClearEmergencyHovered, setIsClearEmergencyHovered] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    
    const [groupedHistory, setGroupedHistory] = useState({});
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debug: Check if Map ID is loaded
    useEffect(() => {
        if (!MAP_ID) console.error("❌ Map ID is missing. Check .env file and restart server.");
    }, []);

    const isDashboardMobile = windowWidth < DASHBOARD_BREAKPOINT;

    // Ref to track following state inside callbacks without triggering re-renders/re-effects
    const isFollowingRef = useRef(true);
    useEffect(() => {
        isFollowingRef.current = isFollowing;
    }, [isFollowing]);

    // Reference to the map instance for accessing state (like zoom)
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
        setMapReady(true);
    }, []);

    // Load Google Maps script
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // --- 1. Fetch Latest Location (Real-Time Polling) ---
    const fetchLatestLocation = useCallback(async () => {
        if (!stickId) return;

        try {
            const response = await api.get('/api/latest');
            
            // If we get a response, the server is reachable (even if 404 or 500)
            if (onStatusChange) onStatusChange(true);

            const data = response.data;
            
            if (!data || !data.location || !data.location.coordinates) {
                console.warn("Location data received is incomplete. Skipping update.");
                setIsInitialLoad(false); // Initial load attempt is complete
                return;
            }

            const [lng, lat] = data.location.coordinates; 
            const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const timestamp = new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setCurrentLocation({
                position: newPos,
                timestamp: timestamp,
            });
            
            if (isFollowingRef.current) {
                setMapCenter(newPos);
            }
            if (onLocationUpdate) onLocationUpdate(timestamp);
            if (data.batteryLevel !== undefined && onBatteryUpdate) onBatteryUpdate(data.batteryLevel);
            
            // Check if the latest data has emergency flag
            if (data.emergency) setIsEmergency(true);

            setIsInitialLoad(false); // Data received, initial load is complete
            
        } catch (error) {
            console.error("Error fetching latest data:", error.response?.status || error.message);
            if (onStatusChange) onStatusChange(false);
            setIsInitialLoad(false); // Initial load attempt is complete
        }
    }, [stickId, onLocationUpdate, onStatusChange, onBatteryUpdate]);


    // --- 2. Fetch Path History (Robust Error Handling) ---
    const fetchPathHistory = useCallback(async () => {
        if (!stickId) return;

        try {
            const response = await api.get('/api/history?limit=500'); 
            
            // If we get a response, the server is reachable
            if (onStatusChange) onStatusChange(true);

            const data = response.data;

            // CRITICAL CHECK: Ensure the received data is an array
            if (Array.isArray(data)) {
                setPathHistory(data);
            } else {
                console.error("History data is not an array. Resetting state.");
                setPathHistory([]); 
            }
            
        } catch (error) {
            console.error("Error fetching history:", error.response?.status || error.message);
            setPathHistory([]); 
            if (onStatusChange) onStatusChange(false);
        }
    }, [stickId, onStatusChange]);

    // --- 3. Emergency Clear Handler ---
    const handleClearEmergency = async () => {
        try {
            await api.post('/api/emergency/clear');
            setIsEmergency(false); 
        } catch (error) {
            console.error("Error clearing emergency:", error);
            alert("Failed to clear emergency status. Please try again.");
        }
    };

    // --- 3.5 Reset View Handler ---
    const handleResetView = () => {
        if (currentLocation && currentLocation.position) {
            setMapCenter(currentLocation.position);
            setMapZoom(18);
            setIsFollowing(true);
        }
    };

    // --- 4. Emergency Sound Loop ---
    useEffect(() => {
        let intervalId;
        if (isEmergency) {
            playEmergencySound();
            intervalId = setInterval(playEmergencySound, 1500);
            setMapZoom(20); // Automatically zoom in when emergency is triggered
        }
        return () => clearInterval(intervalId);
    }, [isEmergency]);

    // --- 5. Lifecycle Effects ---
    // Effect 1: Initial Data Fetch
    useEffect(() => {
        fetchLatestLocation(); 
        fetchPathHistory(); 
    }, [fetchLatestLocation, fetchPathHistory]);

    // --- New Effect for Grouping History ---
    useEffect(() => {
        const grouped = pathHistory.reduce((acc, point) => {
            // 'en-CA' gives a YYYY-MM-DD format which is great for sorting
            const date = new Date(point.time);
            // Adjust for timezone to prevent grouping across midnight UTC
            const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(point);
            return acc;
        }, {});
        setGroupedHistory(grouped);
    }, [pathHistory]);

    // Effect 2: Socket.io Connection
    useEffect(() => {
        const token = localStorage.getItem('token');

        // Initialize Socket.io connection
        const socket = io(API_URL, {
            auth: {
                token: token
            }
        });

        // Join the room for this specific stickId
        if (stickId) {
            socket.emit('join', stickId);
        }

        // Handle connection errors (e.g., authentication failure)
        socket.on('connect_error', (err) => {
            if (err.message === 'Authentication error') {
                if (onAuthError) onAuthError();
            }
        });

        // Listen for emergency cleared event (from self or other clients)
        socket.on('emergencyCleared', () => {
            setIsEmergency(false);
        });

        // Listen for real-time updates
        socket.on('locationUpdate', (data) => {
            if (onStatusChange) onStatusChange(true);

            if (data && data.location && data.location.coordinates) {
                const [lng, lat] = data.location.coordinates;
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
                const timestamp = new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                setCurrentLocation({
                    position: newPos,
                    timestamp: timestamp,
                });
                if (isFollowingRef.current) {
                    setMapCenter(newPos);
                }
                
                // Append new point to history (Polyline)
                setPathHistory(prev => [...prev, { lat: newPos.lat, lng: newPos.lng, time: data.timestamp }]);
                
                if (onLocationUpdate) onLocationUpdate(timestamp);
                if (data.batteryLevel !== undefined && onBatteryUpdate) onBatteryUpdate(data.batteryLevel);

                if (data.emergency) {
                    setIsEmergency(true);
                    setIsFollowing(true);
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [stickId, onLocationUpdate, onStatusChange, onAuthError, onBatteryUpdate]);

    // --- 2.5 Advanced Marker Management ---
    useEffect(() => {
        if (mapReady && currentLocation && mapRef.current) {
            const updateMarker = async () => {
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
                
                if (!markerRef.current) {
                    markerRef.current = new AdvancedMarkerElement({
                        map: mapRef.current,
                        position: currentLocation.position,
                        title: `Stick ${stickId} - Live Location`,
                    });
                } else {
                    markerRef.current.position = currentLocation.position;
                }
            };
            updateMarker();
        }
    }, [mapReady, currentLocation, stickId]);

    // Cleanup marker on unmount
    useEffect(() => {
        return () => {
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
        };
    }, []);

    // --- 5. Helper Function for Responsive Styles (Top Grid only) ---
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

    // --- 6. Loading and Error States ---
    if (loadError) return <div style={{ color: '#c0392b', textAlign: 'center', marginTop: '50px' }}>⚠️ Error loading maps.</div>;
    if (!isLoaded) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em', color: '#34495e' }}>🗺️ Loading Google Maps...</div>;

    // --- 7. Render Component ---
    return (
        <div style={dashboardStyles}>
            
            {/* EMERGENCY BANNER */}
            {isEmergency && (
                <div style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    marginBottom: '25px',
                    display: 'flex',
                    flexDirection: isDashboardMobile ? 'column' : 'row',
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
                        onClick={handleClearEmergency}
                        onMouseEnter={() => setIsClearEmergencyHovered(true)}
                        onMouseLeave={() => setIsClearEmergencyHovered(false)}
                        style={{
                            backgroundColor: isClearEmergencyHovered ? '#f1f1f1' : 'white',
                            color: '#e74c3c',
                            border: 'none',
                            padding: '10px 25px',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1em',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                            boxShadow: isClearEmergencyHovered ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        Clear Emergency
                    </button>
                </div>
            )}
            
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
                                onMouseEnter={() => setHoveredMapType(type)}
                                onMouseLeave={() => setHoveredMapType(null)}
                                style={{
                                    padding: '8px 18px', 
                                    backgroundColor: mapTypeId === type ? '#00ADB5' : (hoveredMapType === type ? '#393E46' : '#222831'), 
                                    color: mapTypeId === type ? 'white' : '#EEEEEE', 
                                    border: '1px solid #00ADB5', 
                                    borderRadius: '5px', 
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (mapTypeId === type || hoveredMapType === type) ? '0 4px 8px rgba(0, 173, 181, 0.4)' : 'none',
                                    flex: isDashboardMobile ? '1 1 auto' : '0 0 auto', 
                                    minWidth: isDashboardMobile ? '100px' : 'auto',
                                }}>
                                {type === 'roadmap' && <FaRoad style={{ marginRight: '6px' }} />}
                                {type === 'hybrid' && <FaGlobe style={{ marginRight: '6px' }} />}
                                {type === 'satellite' && <FaSatellite style={{ marginRight: '6px' }} />}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}

                        {/* Reset View Button */}
                        <button 
                            onClick={handleResetView}
                            onMouseEnter={() => setIsRecenterHovered(true)}
                            onMouseLeave={() => setIsRecenterHovered(false)}
                            style={{
                                padding: '8px 18px', 
                                backgroundColor: isFollowing ? '#00ADB5' : (isRecenterHovered ? '#008C9E' : '#222831'), 
                                color: isFollowing ? 'white' : '#00ADB5', 
                                border: '1px solid #00ADB5', 
                                borderRadius: '5px', 
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: (isFollowing || isRecenterHovered) ? '0 4px 8px rgba(0, 173, 181, 0.4)' : 'none',
                                flex: isDashboardMobile ? '1 1 auto' : '0 0 auto', 
                                minWidth: isDashboardMobile ? '100px' : 'auto',
                                marginLeft: isDashboardMobile ? '0' : 'auto'
                            }}>
                            <FaLocationArrow style={{ marginRight: '6px' }} /> {isFollowing ? 'Following' : 'Recenter'}
                        </button>
                    </div>

                    {/* Map Container */}
                <div style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: '10px', overflow: 'hidden', flex: 1, minHeight: '55vh', display: 'flex', flexDirection: 'column' }}>
                        <GoogleMap
                        mapId={MAP_ID}
                        mapContainerStyle={{ width: '100%', height: '100%', flex: 1 }}
                            center={mapCenter}
                            zoom={mapZoom}
                            onLoad={onMapLoad}
                            onDragStart={() => setIsFollowing(false)}
                            onZoomChanged={() => {
                                if (mapRef.current) {
                                    setMapZoom(mapRef.current.getZoom());
                                }
                            }}
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
                            
                            {/* 3. Emergency Pulse Overlay */}
                            {isEmergency && currentLocation && (
                                <OverlayView
                                    position={currentLocation.position}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                >
                                    <div className="emergency-map-pulse" />
                                </OverlayView>
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
            <div style={{ minWidth: 0, marginTop: '15px', width: '100%' }}> 
                <div style={{ 
                    padding: '15px', // Reduced padding
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
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {/* Sort dates in descending order and map over them */}
                            {Object.keys(groupedHistory).sort().reverse().map(dateKey => (
                                <li key={dateKey}>
                                    <h4 style={{
                                        color: '#EEEEEE',
                                        backgroundColor: '#222831',
                                        padding: '8px 10px',
                                        margin: '10px 0 5px 0',
                                        borderRadius: '4px',
                                        fontSize: '1.1em',
                                        fontWeight: 'bold',
                                        position: 'sticky', // Makes the date header stick to the top on scroll
                                        top: 0,
                                        zIndex: 1,
                                        borderBottom: '1px solid #00ADB5'
                                    }}>
                                        {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { // Add time to avoid timezone issues
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h4>
                                    <ul style={{ listStyleType: 'none', paddingLeft: '15px' }}>
                                        {/* Display points for each date in reverse chronological order */}
                                        {groupedHistory[dateKey].slice().reverse().map((point, index) => (
                                            <li key={`${dateKey}-${index}`} style={{ 
                                                padding: '8px 0', 
                                                borderBottom: '1px dotted #4a5568', 
                                                fontSize: '0.9em',
                                                color: '#EEEEEE',
                                            }}>
                                                <strong style={{ color: '#00ADB5' }}>Time:</strong> {new Date(point.time).toLocaleTimeString('en-US')}
                                                <br />
                                                <span style={{ opacity: 0.8 }}>Lat: {point.lat.toFixed(4)}, Lon: {point.lng.toFixed(4)}</span>
                                            </li>
                                        ))}
                                    </ul>
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