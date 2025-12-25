import React from 'react';
import { FaListUl } from 'react-icons/fa';

const LocationHistory = ({ groupedHistory, hasHistory }) => {
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

                {!hasHistory && (
                    <p style={{ color: '#EEEEEE', opacity: 0.7 }}>No historical data available yet. Ensure the ESP32 is sending data.</p>
                )}
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
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
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    borderBottom: '1px solid #00ADB5'
                                }}>
                                    {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </h4>
                                <ul style={{ listStyleType: 'none', paddingLeft: '15px' }}>
                                    {groupedHistory[dateKey].slice().reverse().map((point, index) => (
                                        <li key={`${dateKey}-${index}`} style={{ padding: '8px 0', borderBottom: '1px dotted #4a5568', fontSize: '0.9em', color: '#EEEEEE' }}>
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
    );
};

export default LocationHistory;