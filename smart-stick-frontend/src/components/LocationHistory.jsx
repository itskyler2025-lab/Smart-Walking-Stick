import React from 'react';
import { FaListUl, FaRoute, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const LocationHistory = ({ routes, onSelectRoute }) => {
    const formatDuration = (start, end) => {
        const diff = new Date(end) - new Date(start);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const calculateDistance = (route) => {
        if (!route || route.length < 2) return '0 m';
        
        let totalDistance = 0;
        const R = 6371e3; // Earth radius in meters
        const toRad = Math.PI / 180;

        for (let i = 0; i < route.length - 1; i++) {
            const lat1 = route[i].lat * toRad;
            const lat2 = route[i+1].lat * toRad;
            const deltaLat = (route[i+1].lat - route[i].lat) * toRad;
            const deltaLng = (route[i+1].lng - route[i].lng) * toRad;

            const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

            totalDistance += R * c;
        }

        return totalDistance > 1000 
            ? `${(totalDistance / 1000).toFixed(2)} km` 
            : `${Math.round(totalDistance)} m`;
    };

    return (
        <div style={{ minWidth: 0, marginTop: '15px', width: '100%' }}> 
            <div style={{ 
                padding: '15px', 
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

                {(!routes || routes.length === 0) && (
                    <p style={{ color: '#EEEEEE', opacity: 0.7 }}>No historical data available yet. Ensure the ESP32 is sending data.</p>
                )}
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {routes.map((route, index) => {
                            const startTime = new Date(route[0].time);
                            const endTime = new Date(route[route.length - 1].time);
                            const isLatest = index === 0;

                            return (
                                <li key={index} style={{ 
                                    marginBottom: '10px', 
                                    backgroundColor: '#222831', 
                                    borderRadius: '8px', 
                                    padding: '12px',
                                    borderLeft: isLatest ? '4px solid #e74c3c' : '4px solid #95a5a6',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => onSelectRoute(route)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2C3440'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#222831'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#EEEEEE', fontSize: '1em' }}>
                                            {startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span style={{ fontSize: '0.85em', color: isLatest ? '#e74c3c' : '#95a5a6', fontWeight: 'bold' }}>
                                            {isLatest ? 'LATEST TRIP' : `TRIP ${routes.length - index}`}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9em', color: '#bdc3c7' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <FaClock style={{ marginRight: '6px', color: '#00ADB5' }} />
                                            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <FaRoute style={{ marginRight: '6px', color: '#00ADB5' }} />
                                            {formatDuration(startTime, endTime)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <FaMapMarkerAlt style={{ marginRight: '6px', color: '#00ADB5' }} />
                                            {calculateDistance(route)}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LocationHistory;