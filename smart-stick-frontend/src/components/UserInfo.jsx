// src/components/UserInfo.js

import React, { useState, useEffect } from 'react';
import { FaUser, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaTint, FaCalendarAlt, FaVenusMars, FaBriefcaseMedical, FaBirthdayCake } from 'react-icons/fa';
import api from '../utils/api'; // Import the api utility
import { toast } from 'react-toastify';

// This maps backend field names to frontend display names
const fieldDisplayMap = {
    fullName: "Name",
    birthdate: "Birthdate",
    age: "Age",
    gender: "Gender",
    bloodType: "Blood Type",
    homeAddress: "Home Address",
    emergencyContactName: "Emergency Contact Name",
    emergencyContactNumber: "Emergency Contact Number",
    medicalCondition: "Medical Conditions"
};

const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const iconMap = {
    Name: <FaIdCard style={{ color: '#00ADB5' }} />,
    Birthdate: <FaBirthdayCake style={{ color: '#00ADB5' }} />,
    Age: <FaCalendarAlt style={{ color: '#00ADB5' }} />,
    Gender: <FaVenusMars style={{ color: '#00ADB5' }} />,
    'Blood Type': <FaTint style={{ color: '#00ADB5' }} />,
    'Home Address': <FaMapMarkerAlt style={{ color: '#00ADB5' }} />,
    'Emergency Contact Name': <FaPhoneAlt style={{ color: '#00ADB5' }} />,
    'Emergency Contact Number': <FaPhoneAlt style={{ color: '#00ADB5' }} />,
    'Medical Conditions': <FaBriefcaseMedical style={{ color: '#00ADB5' }} />,
};

const MOBILE_BREAKPOINT = 600;

// Helper to format date for display, avoiding timezone issues
const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    // The date string from the form/API is 'YYYY-MM-DD'.
    // To prevent timezone shifts, we parse it as UTC.
    const [year, month, day] = dateString.split('-');
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

const UserInfo = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/user/profile');
                setUserData(res.data);
            } catch (err) {
                const errorMessage = err.response?.data?.msg || 'Failed to fetch user data.';
                setError(errorMessage);
                console.error(err);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isSmallMobile = windowWidth < MOBILE_BREAKPOINT;

    const getInfoGridStyle = () => ({
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: isSmallMobile ? '8px' : '10px',
    });
    
    if (loading) {
        return <div>Loading user information...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div style={{ 
            padding: '15px', 
            backgroundColor: '#393E46', 
            color: '#EEEEEE',
            borderRadius: '10px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ 
                borderBottom: '1px solid #00ADB5', 
                paddingBottom: '8px', 
                color: '#EEEEEE', 
                marginBottom: '12px', 
                fontSize: '1.3em',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <FaUser style={{ marginRight: '10px', verticalAlign: 'middle', color: '#00ADB5' }} /> Personal Information
            </h3>
            
            <div style={getInfoGridStyle()}>
                {Object.keys(fieldDisplayMap).map(key => (
                    <p key={key} style={{ margin: '0', padding: '4px 0', borderBottom: '1px dotted #e0e0e0', display: 'flex', alignItems: 'center', minWidth: 0, lineHeight: '1.4', fontSize: '0.9em' }}>
                        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{iconMap[fieldDisplayMap[key]]}</span>
                        <strong style={{ color: '#00ADB5', margin: '0 5px 0 8px', fontSize: '1em', width: isSmallMobile ? '130px' : '160px', flexShrink: 0 }}>{fieldDisplayMap[key]}:</strong>
                        <span style={{ flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left' }}>
                            {key === 'birthdate' ? formatDisplayDate(userData[key]) : (userData[key] || <span style={{opacity: 0.6}}>Not set</span>)}
                        </span>
                    </p>
                ))}
            </div>
        </div>
    );
};

export default UserInfo;