// src/components/UserInfo.js

import React, { useState, useEffect } from 'react';
import { FaUser, FaPencilAlt, FaTimes, FaSave, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaTint, FaCalendarAlt, FaVenusMars, FaBriefcaseMedical } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import api from '../utils/api'; // Import the api utility
import { toast } from 'react-toastify';

// This maps backend field names to frontend display names
const fieldDisplayMap = {
    fullName: "Name",
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
    Age: <FaCalendarAlt style={{ color: '#00ADB5' }} />,
    Gender: <FaVenusMars style={{ color: '#00ADB5' }} />,
    'Blood Type': <FaTint style={{ color: '#00ADB5' }} />,
    'Home Address': <FaMapMarkerAlt style={{ color: '#00ADB5' }} />,
    'Emergency Contact Name': <FaPhoneAlt style={{ color: '#00ADB5' }} />,
    'Emergency Contact Number': <FaPhoneAlt style={{ color: '#00ADB5' }} />,
    'Medical Conditions': <FaBriefcaseMedical style={{ color: '#00ADB5' }} />,
};

const MOBILE_BREAKPOINT = 600;

const UserInfo = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [isEditHovered, setIsEditHovered] = useState(false); // State for hover effect
    const [isSaveHovered, setIsSaveHovered] = useState(false);
    const [isCancelHovered, setIsCancelHovered] = useState(false);
    
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/user/profile');
                const profileData = {
                    fullName: res.data.fullName || '',
                    age: res.data.age || '',
                    gender: res.data.gender || '',
                    bloodType: res.data.bloodType || '',
                    homeAddress: res.data.homeAddress || '',
                    emergencyContactName: res.data.emergencyContactName || '',
                    emergencyContactNumber: res.data.emergencyContactNumber || '',
                    medicalCondition: res.data.medicalCondition || ''
                };
                setUserData(profileData);
                setForm(profileData);
            } catch (err) {
                setError('Failed to fetch user data.');
                console.error(err);
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
    
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put('/api/user/profile', form);
            const updatedProfileData = {
                fullName: res.data.fullName || '',
                age: res.data.age || '',
                gender: res.data.gender || '',
                bloodType: res.data.bloodType || '',
                homeAddress: res.data.homeAddress || '',
                emergencyContactName: res.data.emergencyContactName || '',
                emergencyContactNumber: res.data.emergencyContactNumber || '',
                medicalCondition: res.data.medicalCondition || ''
            };
            setUserData(updatedProfileData);
            setIsEditing(false);
            toast.success("Personal information updated!");
        } catch (err) {
            const errorMessage = err.response?.data?.msg || "Failed to update information.";
            toast.error(errorMessage);
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const editButtonStyle = {
        gridColumn: '1 / -1',
        padding: '12px 25px',
        backgroundColor: isEditHovered ? '#008C9E' : '#00ADB5', // Darker on hover
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '20px',
        fontWeight: 'bold',
        boxShadow: isEditHovered ? '0 4px 12px rgba(0, 173, 181, 0.5)' : '0 2px 5px rgba(0, 173, 181, 0.3)',
        transition: 'all 0.3s ease' // Smooth transition
    };

    const saveButtonStyle = {
        padding: '10px 25px',
        backgroundColor: isSaveHovered ? '#008C9E' : '#00ADB5',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: isSaving ? 'not-allowed' : 'pointer',
        opacity: isSaving ? 0.7 : 1,
        fontWeight: 'bold',
        flex: '1 1 auto',
        transition: 'all 0.3s ease',
        boxShadow: isSaveHovered ? '0 4px 8px rgba(0, 173, 181, 0.4)' : 'none'
    };

    const cancelButtonStyle = {
        padding: '10px 25px',
        backgroundColor: isCancelHovered ? '#393E46' : '#222831',
        color: 'white',
        border: '1px solid #EEEEEE',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        flex: '1 1 auto',
        transition: 'all 0.3s ease',
        boxShadow: isCancelHovered ? '0 4px 8px rgba(255, 255, 255, 0.1)' : 'none'
    };

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
            
            {isEditing ? (
                // Use responsive grid for the form layout
                <form onSubmit={handleSave} style={getInfoGridStyle()}>
                    {Object.keys(fieldDisplayMap).map(key => (
                        <div key={key}>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>{fieldDisplayMap[key]}:</label>
                            {key === 'bloodType' ? (
                                <select
                                    name={key}
                                    value={form[key] || ''}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', transition: 'border-color 0.3s', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                                >
                                    <option value="">Select Blood Type</option>
                                    {validBloodTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            ) : key === 'gender' ? (
                                <select
                                    name={key}
                                    value={form[key] || ''}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', transition: 'border-color 0.3s', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                                >
                                    <option value="">Select Gender</option>
                                    {validGenders.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    name={key}
                                    value={form[key] || ''}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', transition: 'border-color 0.3s', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                                />
                            )}
                        </div>
                    ))}
                    {/* Ensure buttons span full width on mobile if needed */}
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => { setIsEditing(false); setForm(userData); }} 
                            style={cancelButtonStyle}
                            onMouseEnter={() => setIsCancelHovered(true)}
                            onMouseLeave={() => setIsCancelHovered(false)}
                        >
                            <FaTimes style={{ marginRight: '5px' }} /> Cancel
                        </button>
                        <button 
                            type="submit" 
                            style={saveButtonStyle}
                            onMouseEnter={() => setIsSaveHovered(true)}
                            onMouseLeave={() => setIsSaveHovered(false)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <TailSpin color="white" height={20} width={20} />
                                </div>
                            ) : (
                                <><FaSave style={{ marginRight: '5px' }} /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                // Use responsive grid for the display layout
                <div style={getInfoGridStyle()}>
                    {Object.keys(fieldDisplayMap).map(key => (
                        <p key={key} style={{ margin: '0', padding: '4px 0', borderBottom: '1px dotted #e0e0e0', display: 'flex', alignItems: 'center', minWidth: 0, lineHeight: '1.4', fontSize: '0.9em' }}>
                            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{iconMap[fieldDisplayMap[key]]}</span>
                            <strong style={{ color: '#00ADB5', margin: '0 5px 0 8px', fontSize: '1em', width: isSmallMobile ? '130px' : '160px', flexShrink: 0 }}>{fieldDisplayMap[key]}:</strong>
                            <span style={{ flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left' }}>{userData[key]}</span>
                        </p>
                    ))}
                    {/* Ensure button spans full width on mobile if needed */}
                    <button 
                        onClick={() => { setForm(userData); setIsEditing(true); }} 
                        style={editButtonStyle}
                        onMouseEnter={() => setIsEditHovered(true)}
                        onMouseLeave={() => setIsEditHovered(false)}>
                        <FaPencilAlt style={{ marginRight: '8px' }} /> Edit Information
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserInfo;