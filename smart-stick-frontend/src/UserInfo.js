// src/UserInfo.js

import React, { useState, useEffect } from 'react';
import { FaUser, FaPencilAlt, FaTimes, FaSave, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaTint, FaCalendarAlt, FaVenusMars } from 'react-icons/fa'; 

const initialUserData = {
    Name: "John Doe",
    Age: 72,
    Gender: "Male",
    BloodType: "A+",
    HomeAddress: "123 Main St, Anytown, PH",
    EmergencyContactName: "Jane Doe (Daughter)",
    EmergencyContactNumber: "0912 345 6789"
};

const iconMap = {
    Name: <FaIdCard style={{ color: '#00ADB5' }} />,
    Age: <FaCalendarAlt style={{ color: '#00ADB5' }} />,
    Gender: <FaVenusMars style={{ color: '#00ADB5' }} />,
    BloodType: <FaTint style={{ color: '#00ADB5' }} />,
    HomeAddress: <FaMapMarkerAlt style={{ color: '#00ADB5' }} />,
    EmergencyContactName: <FaPhoneAlt style={{ color: '#00ADB5' }} />,
    EmergencyContactNumber: <FaPhoneAlt style={{ color: '#00ADB5' }} />,
};

const MOBILE_BREAKPOINT = 600;

const UserInfo = () => {
    const [userData, setUserData] = useState(initialUserData);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(initialUserData);
    
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isSmallMobile = windowWidth < MOBILE_BREAKPOINT;

    const getInfoGridStyle = () => ({
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: isSmallMobile ? '10px' : '15px',
    });
    
    const handleSave = (e) => {
        e.preventDefault();
        setUserData(form);
        setIsEditing(false);
        alert("Personal information updated!");
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ 
            padding: '25px', 
            backgroundColor: '#393E46', 
            color: '#EEEEEE',
            borderRadius: '10px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ 
                borderBottom: '2px solid #00ADB5', 
                paddingBottom: '10px', 
                color: '#EEEEEE', 
                marginBottom: '20px', 
                fontSize: '1.5em',
                fontWeight: '600'
            }}>
                <FaUser style={{ marginRight: '10px', verticalAlign: 'middle', color: '#00ADB5' }} /> Personal Information 
            </h3>
            
            {isEditing ? (
                // Use responsive grid for the form layout
                <form onSubmit={handleSave} style={getInfoGridStyle()}>
                    {Object.keys(form).map(key => (
                        <div key={key}>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>{key.replace(/([A-Z])/g, ' $1')}:</label>
                            <input
                                type="text"
                                name={key}
                                value={form[key]}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', transition: 'border-color 0.3s', backgroundColor: '#222831', color: '#EEEEEE' }}
                            />
                        </div>
                    ))}
                    {/* Ensure buttons span full width on mobile if needed */}
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsEditing(false); setForm(userData); }} style={{ padding: '10px 25px', backgroundColor: '#222831', color: 'white', border: '1px solid #EEEEEE', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto' }}>
                            <FaTimes style={{ marginRight: '5px' }} /> Cancel
                        </button>
                        <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto' }}>
                            <FaSave style={{ marginRight: '5px' }} /> Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                // Use responsive grid for the display layout
                <div style={getInfoGridStyle()}>
                    {Object.entries(userData).map(([key, value]) => (
                        <p key={key} style={{ margin: '0', padding: '7px 0', borderBottom: '1px dotted #e0e0e0', display: 'flex', alignItems: 'flex-start', minWidth: 0, lineHeight: '1.6' }}>
                            <span style={{ flexShrink: 0, marginTop: '4px' }}>{iconMap[key]}</span>
                            <strong style={{ color: '#00ADB5', margin: '0 5px 0 8px', fontSize: '1em', width: isSmallMobile ? '130px' : '160px', flexShrink: 0 }}>{key.replace(/([A-Z])/g, ' $1')}:</strong>
                            <span style={{ flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left' }}>{value}</span>
                        </p>
                    ))}
                    {/* Ensure button spans full width on mobile if needed */}
                    <button 
                        onClick={() => { setForm(userData); setIsEditing(true); }} 
                        style={{ gridColumn: '1 / -1', padding: '12px 25px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0, 173, 181, 0.3)' }}>
                        <FaPencilAlt style={{ marginRight: '8px' }} /> Edit Information
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserInfo;