import React, { useState } from 'react';
import { FaRoad, FaGlobe, FaSatellite, FaLocationArrow } from 'react-icons/fa';

const MapControls = ({ mapTypeId, setMapTypeId, isFollowing, onToggleFollow, isMobile }) => {
    const [hoveredMapType, setHoveredMapType] = useState(null);
    const [isRecenterHovered, setIsRecenterHovered] = useState(false);

    return (
        <div style={{ 
            marginBottom: '15px', 
            display: 'flex', 
            justifyContent: isMobile ? 'space-around' : 'flex-start',
            gap: isMobile ? '0' : '10px',
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
                        flex: isMobile ? '1 1 auto' : '0 0 auto', 
                        minWidth: isMobile ? '100px' : 'auto',
                    }}>
                    {type === 'roadmap' && <FaRoad style={{ marginRight: '6px' }} />}
                    {type === 'hybrid' && <FaGlobe style={{ marginRight: '6px' }} />}
                    {type === 'satellite' && <FaSatellite style={{ marginRight: '6px' }} />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
            ))}

            <button 
                onClick={onToggleFollow}
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
                    flex: isMobile ? '1 1 auto' : '0 0 auto', 
                    minWidth: isMobile ? '100px' : 'auto',
                    marginLeft: isMobile ? '0' : 'auto'
                }}>
                <FaLocationArrow style={{ marginRight: '6px' }} /> {isFollowing ? 'Following' : 'Follow Me'}
            </button>
        </div>
    );
};

export default MapControls;