import React from 'react';
import { useAppContext } from '../context/AppContext';
import { FaSignal, FaBatteryFull, FaBatteryThreeQuarters, FaBatteryHalf, FaBatteryQuarter, FaBatteryEmpty, FaBolt, FaUnlink, FaWifi, FaSatelliteDish, FaClock } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';

const Status = () => {
  const { batteryStatus, isLive, isReconnecting, lastUpdate, currentTime, connectionType, uptime } = useAppContext();

  const getBatteryColor = (level, isCharging) => {
    if (isCharging) return '#f1c40f'; // Gold color for charging
    if (level === null || level === undefined) return '#95a5a6';
    if (level >= 60) return '#2ecc71'; // Green
    if (level >= 25) return '#f1c40f'; // Yellow
    return '#e74c3c'; // Red
  };

  const getBatteryIcon = (level, isCharging) => {
    if (isCharging) return <FaBolt />;
    if (level === null || level === undefined) return <FaBatteryEmpty />;
    if (level >= 90) return <FaBatteryFull />;
    if (level >= 60) return <FaBatteryThreeQuarters />;
    if (level >= 35) return <FaBatteryHalf />;
    if (level >= 10) return <FaBatteryQuarter />;
    return <FaBatteryEmpty />;
  };

  const timeAgo = lastUpdate ? `${Math.max(0, Math.floor((currentTime - new Date(lastUpdate).getTime()) / 60000))}m ago` : 'N/A';

  const formatUptime = (milliseconds) => {
    if (milliseconds === null || milliseconds === undefined || milliseconds < 0) {
      return 'N/A';
    }
    if (milliseconds < 1000) {
      return 'Just now';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    if (parts.length === 0 && seconds > 0) {
        parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) return 'Just now';

    return parts.slice(0, 2).join(', ');
  };

  const statusCardStyle = {
    backgroundColor: '#393E46',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const statusItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#222831',
    borderRadius: '8px',
    borderLeft: '5px solid', // Will be colored based on status
  };

  const iconContainerStyle = {
    fontSize: '2em',
    marginRight: '20px',
    width: '40px',
    textAlign: 'center',
  };

  const textContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#EEEEEE',
  };

  const detailStyle = {
    margin: '4px 0 0',
    fontSize: '0.9em',
    color: '#bdc3c7',
  };

  return (
    <div style={{
        maxWidth: '800px',
        width: '95%',
        margin: '20px auto',
        fontFamily: '"Avenir Next", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h2 style={{ color: '#00ADB5', borderBottom: '1px solid #00ADB5', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FaSignal /> Stick Status
      </h2>
      
      <div style={statusCardStyle}>
        {/* Stick Connection Status */}
        <div style={{ ...statusItemStyle, borderColor: isLive ? '#2ecc71' : '#e74c3c' }}>
          <div style={{ ...iconContainerStyle, color: isLive ? '#2ecc71' : '#e74c3c' }}>
            {isLive ? <FaWifi /> : <FaUnlink />}
          </div>
          <div style={textContainerStyle}>
            <h3 style={titleStyle}>Connection Status</h3>
            {isReconnecting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <TailSpin color="#f1c40f" height={18} width={18} />
                <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>Reconnecting...</span>
              </div>
            ) : (
              <p style={{...detailStyle, color: isLive ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                {isLive ? 'LIVE' : `OFFLINE (${timeAgo})`}
                {isLive && connectionType && <span style={{ color: '#bdc3c7', fontWeight: 'normal', marginLeft: '8px' }}>via {connectionType}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Battery Status */}
        <div style={{ ...statusItemStyle, borderColor: getBatteryColor(batteryStatus.level, batteryStatus.isCharging) }}>
          <div style={{ ...iconContainerStyle, color: getBatteryColor(batteryStatus.level, batteryStatus.isCharging) }}>
            {getBatteryIcon(batteryStatus.level, batteryStatus.isCharging)}
          </div>
          <div style={textContainerStyle}>
            <h3 style={titleStyle}>Battery Status</h3>
            <p style={detailStyle}>
              {batteryStatus.level !== null ? `${batteryStatus.level}%` : 'Not Available'}
              {batteryStatus.isCharging && ' (Charging)'}
            </p>
          </div>
        </div>

        {/* Device Uptime */}
        <div style={{ ...statusItemStyle, borderColor: '#9b59b6' }}>
          <div style={{ ...iconContainerStyle, color: '#9b59b6' }}>
            <FaClock />
          </div>
          <div style={textContainerStyle}>
            <h3 style={titleStyle}>Device Uptime</h3>
            <p style={detailStyle}>
              {formatUptime(uptime)}
            </p>
          </div>
        </div>

        {/* Last Update Time */}
        <div style={{ ...statusItemStyle, borderColor: '#3498db' }}>
          <div style={{ ...iconContainerStyle, color: '#3498db' }}>
            <FaSatelliteDish />
          </div>
          <div style={textContainerStyle}>
            <h3 style={titleStyle}>Last Ping Received</h3>
            <p style={detailStyle}>
              {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'No data received yet.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;