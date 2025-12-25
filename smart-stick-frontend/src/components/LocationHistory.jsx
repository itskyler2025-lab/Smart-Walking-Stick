import React from 'react';
import { FaListUl, FaMapMarkerAlt } from 'react-icons/fa';

const LocationHistory = ({ groupedHistory, hasHistory, onSelectPoint }) => {
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
                                <ul style={{ listStyleType: 'none', paddingLeft: '10px', position: 'relative' }}>
                                    {groupedHistory[dateKey].slice().reverse().map((point, index, arr) => (
                                        <li key={`${dateKey}-${index}`} style={{ 
                                            padding: '0 0 20px 20px', 
                                            position: 'relative',
                                            // Draw vertical line for all items except the last one in the group
                                            borderLeft: index !== arr.length - 1 ? '2px solid #4a5568' : '2px solid transparent', 
                                            marginLeft: '10px'
                                        }}>
                                            {/* Timeline Dot */}
                                            <div style={{
                                                position: 'absolute', left: '-6px', top: '0',
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                backgroundColor: '#00ADB5', border: '2px solid #393E46'
                                            }} />
                                            
                                            {/* Content */}
                                            <div style={{ marginTop: '-5px' }}>
                                                <strong style={{ color: '#EEEEEE', fontSize: '0.95em' }}>
                                                    {new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </strong>
                                                {/* Replaced raw coordinates with a functional link */}
                                                <div 
                                                    onClick={() => onSelectPoint && onSelectPoint(point)}
                                                    style={{ 
                                                        fontSize: '0.85em', color: '#00ADB5', marginTop: '2px', 
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        width: 'fit-content'
                                                    }}
                                                    title={`Lat: ${point.lat.toFixed(5)}, Lng: ${point.lng.toFixed(5)}`}
                                                >
                                                    <FaMapMarkerAlt style={{ marginRight: '4px' }} /> View Location
                                                </div>
                                            </div>
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