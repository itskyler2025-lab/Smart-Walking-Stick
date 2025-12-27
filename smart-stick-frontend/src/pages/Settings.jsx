import React, { useState } from 'react';
import { FaCog, FaLock, FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
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

  const { currentPassword, newPassword, confirmPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

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
    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Failed to change password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const inputContainerStyle = { position: 'relative', width: '100%', margin: '15px 0' };
  const inputStyle = { width: '100%', padding: '12px', paddingRight: '40px', margin: 0, boxSizing: 'border-box', border: '1px solid #00ADB5', borderRadius: '5px', backgroundColor: '#222831', color: '#EEEEEE' };
  const eyeIconStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#00ADB5', display: 'flex', alignItems: 'center', fontSize: '1.2em' };
  const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#00ADB5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease' };

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
        <h3 style={{ color: '#EEEEEE', display: 'flex', alignItems: 'center', gap: '10px' }}><FaLock /> Change Password</h3>
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

            <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? (
                    <TailSpin color="white" height={20} width={20} />
                ) : (
                    <><FaSave style={{ marginRight: '8px' }} /> Update Password</>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;