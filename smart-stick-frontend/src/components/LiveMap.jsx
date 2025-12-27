// src/components/LiveMap.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Polyline, useLoadScript, OverlayView } from '@react-google-maps/api';
import UserInfo from './UserInfo';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from '../utils/config';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

import EmergencyBanner from './EmergencyBanner';
import MapControls from './MapControls';
import LocationHistory from './LocationHistory';

// ===================================================
// CONFIGURATION
// ===================================================

import { DASHBOARD_MOBILE_BREAKPOINT } from '../utils/constants';
const defaultCenter = { lat: 14.00, lng: 121.00 };

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

function LiveMap() {
    const { stickId, setLastUpdate, setIsLive, handleLogout, setBatteryStatus, setIsReconnecting, API_URL, setConnectionType, setUptime } = useAppContext();
    const [currentLocation, setCurrentLocation] = useState(null);
    const [pathHistory, setPathHistory] = useState([]); 
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapTypeId, setMapTypeId] = useState('roadmap'); 
    const [isInitialLoad, setIsInitialLoad] = useState(true); // New state to track initial data fetch
    const [isEmergency, setIsEmergency] = useState(false);
    const [mapZoom, setMapZoom] = useState(18);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isFollowing, setIsFollowing] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    
    // Date Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [groupedHistory, setGroupedHistory] = useState({});

    // Ref to track last update time for offline detection
    const lastUpdateTimestampRef = useRef(0);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debug: Check if Map ID is loaded
    useEffect(() => {
        if (!GOOGLE_MAPS_MAP_ID) {
            console.error("❌ Map ID is undefined. Troubleshooting:");
            console.error("1. Vercel Env Var must be named EXACTLY 'VITE_GOOGLE_MAPS_MAP_ID'.");
            console.error("2. Did you click 'Redeploy' after adding the variable?");
            console.error("3. Try a Hard Refresh (Ctrl+F5) to clear browser cache.");
        }
    }, []);

    const isDashboardMobile = windowWidth < DASHBOARD_MOBILE_BREAKPOINT;

    // Ref to track following state inside callbacks without triggering re-renders/re-effects
    const isFollowingRef = useRef(true);
    useEffect(() => {
        isFollowingRef.current = isFollowing;
    }, [isFollowing]);

    // Reference to the map instance for accessing state (like zoom)
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const animationFrameRef = useRef(null);

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
            
            const data = response.data;
            
            if (!data || !data.location || !data.location.coordinates) {
                console.warn("Location data received is incomplete. Skipping update.");
                setIsInitialLoad(false); // Initial load attempt is complete
                return;
            }

            // Check if device is online (data < 60 seconds old)
            const dataTime = new Date(data.timestamp).getTime();
            lastUpdateTimestampRef.current = dataTime;
            const isOnline = (Date.now() - dataTime) < 60000; // 60 seconds
            setIsLive(isOnline);

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
            setLastUpdate(data.timestamp); // Send raw timestamp for calculation
            
            setBatteryStatus({ level: data.batteryLevel, isCharging: data.isCharging });
            setConnectionType(data.connectionType);
            setUptime(data.uptime);
            
            
            // Check if the latest data has emergency flag
            if (data.emergency) setIsEmergency(true);

            setIsInitialLoad(false); // Data received, initial load is complete
            
        } catch (error) {
            console.error("Error fetching latest data:", error.response ? `${error.response.status} - ${error.response.data.message}` : error.message);
            setIsLive(false);
            setIsInitialLoad(false); // Initial load attempt is complete
        }
    }, [stickId, setLastUpdate, setIsLive, setBatteryStatus, setConnectionType, setUptime]);


    // --- 2. Fetch Path History (Robust Error Handling) ---
    const fetchPathHistory = useCallback(async () => {
        if (!stickId) return;

        try {
            const params = new URLSearchParams({ limit: 500 });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get(`/api/history?${params.toString()}`); 
            
            // A successful history fetch implies the server is reachable, but we rely on the socket for 'live' status.

            const data = response.data;

            // CRITICAL CHECK: Ensure the received data is an array
            if (Array.isArray(data)) {
                setPathHistory(data);
            } else {
                console.error("History data is not an array. Resetting state.");
                setPathHistory([]); 
            }
            
        } catch (error) {
            console.error("Error fetching history:", error.response ? `${error.response.status} - ${error.response.data.message}` : error.message);
            setPathHistory([]); 
            // Don't set status to offline here, as it might just be a history-specific API issue.
        }
    }, [stickId, startDate, endDate]);

    // --- 3. Emergency Clear Handler ---
    const handleClearEmergency = async () => {
        try {
            await api.post('/api/emergency/clear');
            setIsEmergency(false); 
            toast.success("Emergency status cleared.");
        } catch (error) {
            console.error("Error clearing emergency:", error);
            toast.error("Failed to clear emergency status. Please try again.");
        }
    };

    // --- 3.5 Toggle Follow Handler ---
    const handleToggleFollow = () => {
        if (isFollowing) {
            setIsFollowing(false);
        } else {
            if (currentLocation && currentLocation.position) {
                if (mapRef.current) {
                    mapRef.current.panTo(currentLocation.position);
                    mapRef.current.setZoom(18);
                }
                setMapCenter(currentLocation.position);
                setMapZoom(18);
                setIsFollowing(true);
            }
        }
    };

    // --- 3.6 History Item Click Handler ---
    const handleHistoryItemClick = (point) => {
        setMapCenter({ lat: point.lat, lng: point.lng });
        setMapZoom(20); // Zoom in close to the selected point
        setIsFollowing(false); // Stop following live updates so user can inspect this point
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

        // Track disconnection to show "Restored" toast only on reconnection, not initial load
        let hasDisconnected = false;

        // Listen for connection events to manage "Reconnecting" state
        socket.on('connect', () => {
            setIsReconnecting(false);
            
            if (hasDisconnected) {
                toast.success("Connection Restored 🟢");
                hasDisconnected = false;
            }
        });

        socket.on('disconnect', () => {
            hasDisconnected = true;
            setIsReconnecting(true);
            setIsLive(false); // Immediately show OFFLINE when socket drops
        });

        // Handle connection errors (e.g., authentication failure)
        socket.on('connect_error', (err) => {
            setIsReconnecting(true);
            
            if (err.message === 'Authentication error') {
                handleLogout();
            }
        });

        // Listen for emergency cleared event (from self or other clients)
        socket.on('emergencyCleared', () => {
            setIsEmergency(false);
        });

        // Listen for real-time updates
        socket.on('locationUpdate', (data) => {
            lastUpdateTimestampRef.current = Date.now();
            setIsLive(true); // Real-time data means it's online

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
                setPathHistory(prev => [...prev, { lat: newPos.lat, lng: newPos.lng, time: data.timestamp }].slice(-500));
                
                setLastUpdate(data.timestamp); // Send raw timestamp for calculation
                
                setBatteryStatus({ level: data.batteryLevel, isCharging: data.isCharging });
                setConnectionType(data.connectionType);
                setUptime(data.uptime);

                if (data.emergency) {
                    setIsEmergency(true);
                    setIsFollowing(true);
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [stickId, API_URL, setLastUpdate, setIsLive, handleLogout, setBatteryStatus, setIsReconnecting, setConnectionType, setUptime]);

    // --- Effect 3: Watchdog Timer for Offline Detection ---
    useEffect(() => {
        const interval = setInterval(() => {
            const timeSinceLastUpdate = Date.now() - lastUpdateTimestampRef.current;
            // Consider offline if no data for 60 seconds (ESP32 sends every 10s)
            if (lastUpdateTimestampRef.current > 0 && timeSinceLastUpdate > 60000) {
                setIsLive(false);
            }
        }, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [setIsLive]);

    // --- 2.5 Advanced Marker Management ---
    useEffect(() => {
        if (mapReady && currentLocation && mapRef.current) {
            const updateMarker = async () => {
                const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
                
                if (!markerRef.current) {
                    // Create a customized PinElement
                    const pin = new PinElement({
                        background: "#e74c3c", // Match your path color (Red)
                        borderColor: "#c0392b",
                        glyphColor: "white",
                        scale: 1.1,
                    });

                    // Add the pulsing class for CSS animation
                    pin.element.classList.add('live-marker-pulse');

                    markerRef.current = new AdvancedMarkerElement({
                        map: mapRef.current,
                        position: currentLocation.position,
                        title: `Stick ${stickId} - Live Location`,
                        content: pin.element, // Use the custom pin
                    });
                } else {
                    // Smooth Animation Logic
                    const startPos = markerRef.current.position;
                    const endPos = currentLocation.position;

                    // Helper to handle both LatLng object and Literal
                    const getLat = (p) => (typeof p.lat === 'function' ? p.lat() : p.lat);
                    const getLng = (p) => (typeof p.lng === 'function' ? p.lng() : p.lng);

                    const startLat = getLat(startPos);
                    const startLng = getLng(startPos);

                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                    const duration = 1000; // 1 second animation
                    const startTime = performance.now();

                    const animate = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 3); // Ease Out Cubic

                        const nextLat = startLat + (endPos.lat - startLat) * ease;
                        const nextLng = startLng + (endPos.lng - startLng) * ease;

                        if (markerRef.current) markerRef.current.position = { lat: nextLat, lng: nextLng };
                        if (progress < 1) animationFrameRef.current = requestAnimationFrame(animate);
                    };
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
            };
            updateMarker();
        }
    }, [mapReady, currentLocation, stickId]);

    // Cleanup marker on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
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
            
            <EmergencyBanner 
                isEmergency={isEmergency} 
                onClear={handleClearEmergency} 
                isMobile={isDashboardMobile} 
            />
            
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
                    
                    <MapControls 
                        mapTypeId={mapTypeId}
                        setMapTypeId={setMapTypeId}
                        isFollowing={isFollowing}
                        onToggleFollow={handleToggleFollow}
                        isMobile={isDashboardMobile}
                    />

                    {/* Map Container */}
                <div style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: '10px', overflow: 'hidden', flex: 1, minHeight: '55vh', display: 'flex', flexDirection: 'column' }}>
                        <GoogleMap
                        mapId={GOOGLE_MAPS_MAP_ID}
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
                                mapId: GOOGLE_MAPS_MAP_ID,
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
            
            {/* Date Filter Controls */}
            <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#393E46', 
                borderRadius: '10px', 
                display: 'flex', 
                gap: '15px', 
                alignItems: 'center',
                flexWrap: 'wrap',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <strong style={{ color: '#00ADB5' }}>Filter History:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#EEEEEE', fontSize: '0.9em' }}>From:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #00ADB5', backgroundColor: '#222831', color: 'white', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: '#EEEEEE', fontSize: '0.9em' }}>To:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #00ADB5', backgroundColor: '#222831', color: 'white', outline: 'none' }}
                    />
                </div>
                {(startDate || endDate) && (
                    <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        style={{ 
                            padding: '8px 15px', 
                            backgroundColor: '#e74c3c', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            <LocationHistory 
                groupedHistory={groupedHistory} 
                hasHistory={pathHistory.length > 0} 
                onSelectPoint={handleHistoryItemClick}
            />
        </div>
    );
}

export default LiveMap;