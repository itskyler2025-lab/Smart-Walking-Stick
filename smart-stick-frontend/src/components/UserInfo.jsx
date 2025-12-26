// src/components/UserInfo.js

import React, { useState, useEffect } from 'react';
import { FaUser, FaPencilAlt, FaTimes, FaSave, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaTint, FaCalendarAlt, FaVenusMars, FaBriefcaseMedical, FaCamera, FaLock } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import api from '../utils/api'; // Import the api utility
import { toast } from 'react-toastify';

// This maps backend field names to frontend display names
const fieldDisplayMap = {
    fullName: "Name",
    birthDate: "Birth Date",
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
    'Birth Date': <FaCalendarAlt style={{ color: '#00ADB5' }} />,
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
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'edit', 'password', 'email'
    const [form, setForm] = useState({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [emailForm, setEmailForm] = useState({
        newEmail: '',
        password: ''
    });
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
                    email: res.data.email || '',
                    birthDate: res.data.birthDate ? new Date(res.data.birthDate).toISOString().split('T')[0] : '',
                    age: res.data.age || '',
                    gender: res.data.gender || '',
                    bloodType: res.data.bloodType || '',
                    homeAddress: res.data.homeAddress || '',
                    emergencyContactName: res.data.emergencyContactName || '',
                    emergencyContactNumber: res.data.emergencyContactNumber || '',
                    medicalCondition: res.data.medicalCondition || '',
                    profileImage: res.data.profileImage || '',
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
                email: res.data.email || '',
                birthDate: res.data.birthDate ? new Date(res.data.birthDate).toISOString().split('T')[0] : '',
                age: res.data.age || '',
                gender: res.data.gender || '',
                bloodType: res.data.bloodType || '',
                homeAddress: res.data.homeAddress || '',
                emergencyContactName: res.data.emergencyContactName || '',
                emergencyContactNumber: res.data.emergencyContactNumber || '',
                medicalCondition: res.data.medicalCondition || '',
                profileImage: res.data.profileImage || '',
            };
            setUserData(updatedProfileData);
            setActiveTab('profile');
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
        const { name, value } = e.target;
        if (name === 'birthDate') {
            const age = calculateAge(value);
            setForm({ ...form, birthDate: value, age: age });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handlePasswordChangeInput = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setIsSaving(true);
        try {
            await api.put('/api/user/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success("Password changed successfully!");
            setActiveTab('profile');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            const errorMessage = err.response?.data?.msg || "Failed to change password.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailChangeInput = (e) => {
        setEmailForm({ ...emailForm, [e.target.name]: e.target.value });
    };

    const submitEmailChange = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put('/api/user/change-email', {
                email: emailForm.newEmail,
                password: emailForm.password
            });
            toast.success("Email updated successfully!");
            setUserData({ ...userData, email: res.data.email });
            setActiveTab('profile');
            setEmailForm({ newEmail: '', password: '' });
        } catch (err) {
            const errorMessage = err.response?.data?.msg || "Failed to update email.";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Check file size (e.g., limit to 1MB)
                if (reader.result.length > 1024 * 1024) {
                    toast.error("Image is too large. Please select a file smaller than 1MB.");
                    return;
                }
                setForm({ ...form, profileImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return '';
        const birthDate = new Date(birthDateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const triggerImageInput = () => {
        document.getElementById('profileImageInput').click();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
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

    const actionButtonStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#00ADB5',
        border: '2px solid #00ADB5',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        transition: 'all 0.3s ease'
    };

    if (loading) {
        return <div>Loading user information...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#393E46', 
            color: '#EEEEEE',
            borderRadius: '10px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            minHeight: '500px',
            overflow: 'hidden'
        }}>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <h3 style={{ 
                    borderBottom: '1px solid #00ADB5', 
                    paddingBottom: '8px', 
                    color: '#EEEEEE', 
                    marginBottom: '20px', 
                    fontSize: '1.3em',
                    fontWeight: '600'
                }}>
                    {activeTab === 'profile' && 'Personal Information'}
                    {activeTab === 'edit' && 'Edit Profile'}
                    {activeTab === 'email' && 'Change Email Address'}
                    {activeTab === 'password' && 'Change Password'}
                </h3>

            {activeTab === 'edit' && (
                <form onSubmit={handleSave} style={getInfoGridStyle()}>
                    <div style={{ textAlign: 'center', marginBottom: '20px', gridColumn: '1 / -1', position: 'relative' }}>
                        <img 
                            src={form.profileImage || 'https://via.placeholder.com/150'} 
                            alt="Profile" 
                            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00ADB5' }} 
                        />
                        <input 
                            type="file" 
                            id="profileImageInput" 
                            style={{ display: 'none' }} 
                            accept="image/png, image/jpeg"
                            onChange={handleImageChange}
                        />
                        <button type="button" onClick={triggerImageInput} style={{
                            position: 'absolute', bottom: 0, right: 'calc(50% - 50px)',
                            backgroundColor: 'rgba(0, 173, 181, 0.8)', color: 'white',
                            border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                            <FaCamera />
                        </button>
                    </div>

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
                                key === 'age' ? (
                                    <input
                                        type="text"
                                        name={key}
                                        value={form[key] || ''}
                                        readOnly
                                        style={{ width: '100%', padding: '10px', border: '1px solid #4A5568', borderRadius: '4px', backgroundColor: '#2C3139', color: '#AAA', boxSizing: 'border-box' }}
                                    />
                                ) : (
                                <input
                                    type={key === 'birthDate' ? 'date' : 'text'}
                                    name={key}
                                    value={form[key] || ''}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', transition: 'border-color 0.3s', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                                />
                                )
                            )}
                        </div>
                    ))}
                    {/* Ensure buttons span full width on mobile if needed */}
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => { setActiveTab('profile'); setForm(userData); }} 
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
            )}

            {activeTab === 'password' && (
                <form onSubmit={submitPasswordChange} style={getInfoGridStyle()}>
                    <div>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>Current Password:</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChangeInput}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>New Password:</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChangeInput}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>Confirm New Password:</label>
                        <input
                            type="password"
                            name="confirmNewPassword"
                            value={passwordForm.confirmNewPassword}
                            onChange={handlePasswordChangeInput}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => { setActiveTab('profile'); setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); }} 
                            style={cancelButtonStyle}
                            onMouseEnter={() => setIsCancelHovered(true)}
                            onMouseLeave={() => setIsCancelHovered(false)}
                        >
                            <FaTimes style={{ marginRight: '5px' }} /> Cancel
                        </button>
                        <button type="submit" style={saveButtonStyle} onMouseEnter={() => setIsSaveHovered(true)} onMouseLeave={() => setIsSaveHovered(false)} disabled={isSaving}>
                            {isSaving ? <TailSpin color="white" height={20} width={20} /> : <><FaSave style={{ marginRight: '5px' }} /> Update Password</>}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'email' && (
                <form onSubmit={submitEmailChange} style={getInfoGridStyle()}>
                    <div style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>Current Email:</label>
                        <div style={{ padding: '10px', backgroundColor: '#2C3139', borderRadius: '4px', color: '#AAA' }}>{userData.email}</div>
                    </div>
                    <div>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>New Email Address:</label>
                        <input
                            type="email"
                            name="newEmail"
                            value={emailForm.newEmail}
                            onChange={handleEmailChangeInput}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>Current Password (to confirm):</label>
                        <input
                            type="password"
                            name="password"
                            value={emailForm.password}
                            onChange={handleEmailChangeInput}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #00ADB5', borderRadius: '4px', backgroundColor: '#222831', color: '#EEEEEE', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="submit" style={saveButtonStyle} onMouseEnter={() => setIsSaveHovered(true)} onMouseLeave={() => setIsSaveHovered(false)} disabled={isSaving}>
                            {isSaving ? <TailSpin color="white" height={20} width={20} /> : <><FaSave style={{ marginRight: '5px' }} /> Update Email</>}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'profile' && (
                <div style={getInfoGridStyle()}>
                    {/* Profile Image */}
                    <div style={{ textAlign: 'center', marginBottom: '20px', gridColumn: '1 / -1' }}>
                        <img 
                            src={userData.profileImage || 'https://via.placeholder.com/150'} 
                            alt="Profile" 
                            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00ADB5' }} 
                        />
                    </div>
                    
                    {Object.keys(fieldDisplayMap).map(key => (
                        <p key={key} style={{ margin: '0', padding: '4px 0', borderBottom: '1px dotted #e0e0e0', display: 'flex', alignItems: 'center', minWidth: 0, lineHeight: '1.4', fontSize: '0.9em' }}>
                            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{iconMap[fieldDisplayMap[key]]}</span>
                            <strong style={{ color: '#00ADB5', margin: '0 5px 0 8px', fontSize: '1em', width: isSmallMobile ? '130px' : '160px', flexShrink: 0 }}>{fieldDisplayMap[key]}:</strong>
                            <span style={{ flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left' }}>
                                {key === 'birthDate' && userData[key]
                                    ? new Date(userData[key] + 'T00:00:00').toLocaleDateString()
                                    : userData[key]}
                            </span>
                        </p>
                    ))}
                    <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                        <button onClick={() => { setForm(userData); setActiveTab('edit'); }} style={actionButtonStyle}>
                            <FaPencilAlt style={{ marginRight: '8px' }} /> Edit Information
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default UserInfo;