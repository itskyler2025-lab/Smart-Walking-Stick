import React, { useState, useEffect } from 'react';
import { FaCog, FaLock, FaSave, FaEye, FaEyeSlash, FaTimes, FaPencilAlt, FaEnvelope, FaUser } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Settings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isChangeProfileVisible, setIsChangeProfileVisible] = useState(false);

  // Field mapping for profile form
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
  
  // Email State
  const [emailFormData, setEmailFormData] = useState({
    emailCurrentPassword: '',
    newEmail: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [isChangeEmailVisible, setIsChangeEmailVisible] = useState(false);

  const { currentPassword, newPassword, confirmPassword } = formData;
  const { emailCurrentPassword, newEmail } = emailFormData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'birthdate') {
        const newAge = calculateAge(value);
        setProfileForm(prevForm => ({
            ...prevForm,
            birthdate: value,
            age: newAge
        }));
    } else {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    }
  };

  const calculateAge = (birthdateString) => {
    if (!birthdateString) return '';
    const [year, month, day] = birthdateString.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : '';
  };

  const onEmailChange = e => setEmailFormData({ ...emailFormData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
        return;
    }

    setLoading(true);
    try {
      const res = await api.put('/api/user/change-password', { currentPassword, newPassword });
      toast.success(res.data.msg);
      // Clear form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangePasswordVisible(false); // Hide form on success
    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Failed to change password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
        const res = await api.put('/api/user/profile', profileForm);
        const updatedProfileData = {
            ...res.data,
            birthdate: res.data.birthdate ? new Date(res.data.birthdate).toISOString().split('T')[0] : '',
        };
        setProfileData(updatedProfileData);
        setProfileForm(updatedProfileData);
        setIsChangeProfileVisible(false);
        toast.success("Personal information updated!");
    } catch (err) {
        const errorMessage = err.response?.data?.msg || "Failed to update information.";
        toast.error(errorMessage);
        console.error(err);
    } finally {
        setProfileSaving(false);
    }
  };

  const onEmailSubmit = async e => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await api.put('/api/user/change-email', { currentPassword: emailCurrentPassword, newEmail });
      toast.success(res.data.msg);
      setEmailFormData({
        emailCurrentPassword: '',
        newEmail: '',
      });
      setIsChangeEmailVisible(false);
    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Failed to update email.";
      toast.error(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancel = () => {
    setIsChangePasswordVisible(false);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleProfileCancel = () => {
    setIsChangeProfileVisible(false);
    // Reset form to the last saved state
    setProfileForm(profileData);
  };

  const handleEmailCancel = () => {
    setIsChangeEmailVisible(false);
    setEmailFormData({
      emailCurrentPassword: '',
      newEmail: '',
    });
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
        try {
            setProfileLoading(true);
            const res = await api.get('/api/user/profile');
            const data = {
                ...res.data,
                birthdate: res.data.birthdate ? new Date(res.data.birthdate).toISOString().split('T')[0] : '',
            };
            setProfileData(data);
            setProfileForm(data);
        } catch (err) {
            toast.error('Failed to fetch user profile.');
        } finally {
            setProfileLoading(false);
        }
    };
    fetchUserData();
  }, []);

  const inputContainerStyle = { position: 'relative', width: '100%', margin: '15px 0' };
  const inputStyle = { width: '100%', padding: '12px', paddingRight: '40px', margin: 0, boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' };
  const eyeIconStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#00ADB5', display: 'flex', alignItems: 'center', fontSize: '1.2em' };
  const buttonStyle = { padding: '10px 25px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease' };
  const cancelButtonStyle = { ...buttonStyle, backgroundColor: '#393E46', border: '1px solid #EEEEEE' };

  return (
    <div style={{
        maxWidth: '800px',
        width: '95%',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#393E46',
        color: '#EEEEEE',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h2 style={{ color: '#00ADB5', borderBottom: '1px solid #00ADB5', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaCog /> Settings</h2>
      
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '10px' }}><FaUser /> Personal Information</h3>
        {profileLoading ? <TailSpin color="#00ADB5" height={25} width={25} /> : (
          isChangeProfileVisible ? (
            <form onSubmit={onProfileSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                {Object.keys(fieldDisplayMap).map(key => (
                    <div key={key}>
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '5px', color: '#00ADB5', fontSize: '0.9em' }}>{fieldDisplayMap[key]}:</label>
                        {key === 'birthdate' ? (
                            <input type="date" name={key} value={profileForm[key] || ''} onChange={onProfileChange} max={new Date().toISOString().split('T')[0]} style={inputStyle} />
                        ) : key === 'age' ? (
                            <input type="number" name={key} value={profileForm[key] || ''} readOnly style={{...inputStyle, backgroundColor: '#30353d', cursor: 'not-allowed'}} />
                        ) : key === 'bloodType' ? (
                            <select name={key} value={profileForm[key] || ''} onChange={onProfileChange} style={inputStyle}>
                                <option value="">Select Blood Type</option>
                                {validBloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        ) : key === 'gender' ? (
                            <select name={key} value={profileForm[key] || ''} onChange={onProfileChange} style={inputStyle}>
                                <option value="">Select Gender</option>
                                {validGenders.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        ) : (
                            <input type="text" name={key} value={profileForm[key] || ''} onChange={onProfileChange} style={inputStyle} />
                        )}
                    </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleProfileCancel} style={cancelButtonStyle}>
                      <FaTimes style={{ marginRight: '8px' }} /> Cancel
                  </button>
                  <button type="submit" disabled={profileSaving} style={buttonStyle}>
                      {profileSaving ? <TailSpin color="white" height={20} width={20} /> : <><FaSave style={{ marginRight: '8px' }} /> Save Info</>}
                  </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsChangeProfileVisible(true)} style={{...buttonStyle, width: 'auto', marginTop: '10px'}}>
              <FaPencilAlt style={{ marginRight: '8px' }} /> Edit Information
            </button>
          )
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '10px' }}><FaEnvelope /> Email</h3>
        
        {isChangeEmailVisible ? (
          <form onSubmit={onEmailSubmit}>
              <div style={inputContainerStyle}>
                  <input
                      type="email"
                      placeholder="New Email Address"
                      name="newEmail"
                      value={newEmail}
                      onChange={onEmailChange}
                      required
                      style={inputStyle}
                  />
              </div>

              <div style={inputContainerStyle}>
                  <input
                      type={showEmailPass ? "text" : "password"}
                      placeholder="Current Password (to verify)"
                      name="emailCurrentPassword"
                      value={emailCurrentPassword}
                      onChange={onEmailChange}
                      required
                      style={inputStyle}
                  />
                  <span onClick={() => setShowEmailPass(!showEmailPass)} style={eyeIconStyle}>
                      {showEmailPass ? <FaEyeSlash /> : <FaEye />}
                  </span>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleEmailCancel} style={cancelButtonStyle}>
                      <FaTimes style={{ marginRight: '8px' }} /> Cancel
                  </button>
                  <button type="submit" disabled={emailLoading} style={buttonStyle}>
                      {emailLoading ? <TailSpin color="white" height={20} width={20} /> : <><FaSave style={{ marginRight: '8px' }} /> Update Email</>}
                  </button>
              </div>
          </form>
        ) : (
          <button onClick={() => setIsChangeEmailVisible(true)} style={{...buttonStyle, width: 'auto', marginTop: '10px'}}>
            <FaPencilAlt style={{ marginRight: '8px' }} /> Change Email
          </button>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '10px' }}><FaLock /> Password</h3>
        
        {isChangePasswordVisible ? (
          <form onSubmit={onSubmit}>
              <div style={inputContainerStyle}>
                  <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Current Password"
                      name="currentPassword"
                      value={currentPassword}
                      onChange={onChange}
                      required
                      style={inputStyle}
                  />
                  <span onClick={() => setShowCurrent(!showCurrent)} style={eyeIconStyle}>
                      {showCurrent ? <FaEyeSlash /> : <FaEye />}
                  </span>
              </div>

              <div style={inputContainerStyle}>
                  <input
                      type={showNew ? "text" : "password"}
                      placeholder="New Password (min. 6 characters)"
                      name="newPassword"
                      value={newPassword}
                      onChange={onChange}
                      required
                      style={inputStyle}
                  />
                  <span onClick={() => setShowNew(!showNew)} style={eyeIconStyle}>
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                  </span>
              </div>

              <div style={inputContainerStyle}>
                  <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm New Password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={onChange}
                      required
                      style={inputStyle}
                  />
                  <span onClick={() => setShowConfirm(!showConfirm)} style={eyeIconStyle}>
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={handleCancel} style={cancelButtonStyle}>
                      <FaTimes style={{ marginRight: '8px' }} /> Cancel
                  </button>
                  <button type="submit" disabled={loading} style={buttonStyle}>
                      {loading ? <TailSpin color="white" height={20} width={20} /> : <><FaSave style={{ marginRight: '8px' }} /> Update Password</>}
                  </button>
              </div>
          </form>
        ) : (
          <button onClick={() => setIsChangePasswordVisible(true)} style={{...buttonStyle, width: 'auto', marginTop: '10px'}}>
            <FaPencilAlt style={{ marginRight: '8px' }} /> Change Password
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;