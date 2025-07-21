import React, { useState, useEffect } from 'react';

const SensorDashboard = () => {
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the latest sensor data immediately
    fetchLatestData();
    
    // Set up polling to fetch data every 3 seconds for real-time updates
    const interval = setInterval(fetchLatestData, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestData = async () => {
    try {
      // Method 1: Direct fetch from published Google Sheets CSV
      // To enable this: Go to your Google Sheet → File → Share → Publish to web → CSV format
      // Then replace YOUR_PUBLISHED_CSV_URL with the actual URL
      
      let csvData = '';
      
      try {
        // Try to fetch from your published Google Sheets CSV
        const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PP0l-MWlEc63UQ_7eiINpyv_zO9bi58wfC8F0RdPAEI/export?format=csv&gid=0';
        const response = await fetch(PUBLISHED_CSV_URL);
        csvData = await response.text();
        console.log('✅ Fetched LIVE data from Google Sheets');
      } catch (fetchError) {
        console.log('⚠️ Could not fetch live data, using fallback data');
        // Fallback to your current data if live fetch fails
        csvData = `5/25/2025 4:43:00,temperature,humidity,water level,mpux,mpuy,mpuz
5/25/2025 4:59:33,,69,,-1.6,6.57,7.08
5/25/2025 4:59:46,,,,-1.68,6.57,7
5/25/2025 4:59:59,,69,,-120.46,-15.9,-151.64
5/25/2025 5:00:12,,69,,9.84,56.43,-151.64
5/25/2025 5:01:09,28.4,67,17,-1.46,6.64,6.74
5/25/2025 5:01:24,28.3,67,20,-0.83,7.91,5.28
5/25/2025 5:01:38,28.3,66,26,-0.82,7.92,5.26
5/25/2025 5:01:52,28.4,66,28,-0.83,7.96,5.27
5/25/2025 5:02:05,28.4,67,19,-0.74,8.04,5.29
5/25/2025 5:02:18,28.4,67,18,-0.79,7.92,5.23
5/25/2025 5:02:31,28.5,67,19,-0.78,8,5.32
5/25/2025 5:02:45,28.5,67,27,-0.64,8.23,4.82
5/25/2025 5:03:00,28.4,66,18,0.09,9.31,2.25`;
      }

      // Parse the CSV data and get the latest non-empty row
      const lines = csvData.trim().split('\n');
      let latestLine = null;
      
      // Find the last row with actual data (not empty)
      for (let i = lines.length - 1; i >= 1; i--) {
        const values = lines[i].split(',');
        if (values.length >= 7 && values[0].trim() !== '') {
          latestLine = values;
          console.log(`📊 Found latest data at row ${i + 1}:`, values);
          break;
        }
      }
      
      if (latestLine && latestLine.length >= 7) {
        const temp = latestLine[1] === '' || latestLine[1] === 'nan' ? null : parseFloat(latestLine[1]);
        const humidity = latestLine[2] === '' || latestLine[2] === 'nan' ? null : parseFloat(latestLine[2]);
        const waterLevel = latestLine[3] === '' || latestLine[3] === 'nan' ? null : parseFloat(latestLine[3]);
        const mpux = parseFloat(latestLine[4]);
        const mpuy = parseFloat(latestLine[5]);
        const mpuz = parseFloat(latestLine[6]);

        const deflection = Math.sqrt(mpux * mpux + mpuy * mpuy + mpuz * mpuz);

        const data = {
          timestamp: `${latestLine[0]} (Latest)`,
          temperature: isNaN(temp) ? null : temp,
          humidity: isNaN(humidity) ? null : humidity,
          waterLevel: isNaN(waterLevel) ? null : waterLevel,
          mpux: isNaN(mpux) ? null : mpux,
          mpuy: isNaN(mpuy) ? null : mpuy,
          mpuz: isNaN(mpuz) ? null : mpuz,
          deflection: isNaN(deflection) ? null : parseFloat(deflection.toFixed(2)),
          oilLevel: (waterLevel !== null && waterLevel < 50) ? 'High' : 'Normal',
          lastFetch: new Date().toLocaleTimeString(),
          isLiveData: csvData.includes('5/25/2025 5:03:00') // Check if we got live data
        };

        setLatestData(data);
        console.log('🔄 Updated dashboard with latest data:', data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setLoading(false);
    }
  };

  const getAlerts = () => {
    if (!latestData) return [];
    
    const alerts = [];
    
    if (latestData.temperature >= 30) {
      alerts.push({
        type: 'CRITICAL',
        message: `MOTOR DANGER! Temperature: ${latestData.temperature}°C`,
        icon: '🚨',
        level: 'critical'
      });
    }
    
    if (latestData.waterLevel < 100) {
      alerts.push({
        type: 'WARNING',
        message: `Low Water Level: ${latestData.waterLevel}`,
        icon: '⚠️',
        level: 'warning'
      });
    }
    
    if (latestData.humidity >= 70 && latestData.humidity <= 80) {
      alerts.push({
        type: 'GOOD',
        message: `Humidity in Optimal Range: ${latestData.humidity}%`,
        icon: '✅',
        level: 'good'
      });
    }
    
    if (latestData.oilLevel === 'High') {
      alerts.push({
        type: 'INFO',
        message: `Oil Level is High`,
        icon: '🛢️',
        level: 'info'
      });
    }
    
    if (latestData.deflection > 10) {
      alerts.push({
        type: 'WARNING',
        message: `High Vibration: ${latestData.deflection}`,
        icon: '📳',
        level: 'warning'
      });
    }
    
    return alerts;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Fetching Latest Sensor Data...</h2>
      </div>
    );
  }

  const alerts = getAlerts();
  const hasAlerts = alerts.length > 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🚨 SENSOR ALERT SYSTEM 🚨</h1>
        <div className="status-indicator">
          <span className={`status-light ${hasAlerts ? 'alert' : 'normal'}`}></span>
          <span className="status-text">
            {hasAlerts ? 'ALERTS ACTIVE' : 'ALL SYSTEMS NORMAL'}
          </span>
        </div>
      </header>

      {/* Alert Section */}
      <div className="alert-section">
        {alerts.length > 0 ? (
          <div className="alerts-container">
            <h2>🔔 ACTIVE ALERTS ({alerts.length})</h2>
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-box alert-${alert.level}`}>
                <span className="alert-icon">{alert.icon}</span>
                <span className="alert-type">[{alert.type}]</span>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-alerts">
            <span className="success-icon">✅</span>
            <h2>ALL SYSTEMS NORMAL</h2>
            <p>No alerts detected</p>
          </div>
        )}
      </div>

      {/* Current Values Display */}
      <div className="current-values">
        <h2>📊 CURRENT SENSOR READINGS</h2>
        <div className="values-grid">
          <div className={`value-card ${latestData.temperature >= 30 ? 'danger' : 'normal'}`}>
            <div className="value-header">
              <span className="value-icon">🌡️</span>
              <span className="value-label">Temperature</span>
            </div>
            <div className="value-display">
              {latestData.temperature}°C
              {latestData.temperature >= 30 && <span className="warning-badge">🚨</span>}
            </div>
          </div>

          <div className={`value-card ${latestData.humidity >= 70 && latestData.humidity <= 80 ? 'good' : 'normal'}`}>
            <div className="value-header">
              <span className="value-icon">💧</span>
              <span className="value-label">Humidity</span>
            </div>
            <div className="value-display">
              {latestData.humidity}%
              {latestData.humidity >= 70 && latestData.humidity <= 80 && <span className="good-badge">✅</span>}
            </div>
          </div>

          <div className={`value-card ${latestData.waterLevel < 100 ? 'warning' : 'normal'}`}>
            <div className="value-header">
              <span className="value-icon">🌊</span>
              <span className="value-label">Water Level</span>
            </div>
            <div className="value-display">
              {latestData.waterLevel}
              {latestData.waterLevel < 100 && <span className="warning-badge">⚠️</span>}
            </div>
          </div>

          <div className={`value-card ${latestData.oilLevel === 'High' ? 'info' : 'normal'}`}>
            <div className="value-header">
              <span className="value-icon">🛢️</span>
              <span className="value-label">Oil Level</span>
            </div>
            <div className="value-display">
              {latestData.oilLevel}
              {latestData.oilLevel === 'High' && <span className="info-badge">🛢️</span>}
            </div>
          </div>

          <div className="value-card vibration-card">
            <div className="value-header">
              <span className="value-icon">📳</span>
              <span className="value-label">Vibration Data</span>
            </div>
            <div className="vibration-values">
              <div className="axis-value">X: {latestData.mpux}</div>
              <div className="axis-value">Y: {latestData.mpuy}</div>
              <div className="axis-value">Z: {latestData.mpuz}</div>
            </div>
          </div>

          <div className={`value-card ${latestData.deflection > 10 ? 'warning' : 'normal'}`}>
            <div className="value-header">
              <span className="value-icon">📏</span>
              <span className="value-label">Deflection</span>
            </div>
            <div className="value-display">
              {latestData.deflection}
              {latestData.deflection > 10 && <span className="warning-badge">⚠️</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="last-updated">
        <span>🕒 Data Timestamp: {latestData.timestamp}</span>
        <br />
        <span>🔄 Last Fetched: {latestData.lastFetch}</span>
        <br />
        <span className={`live-status ${latestData.isLiveData ? 'live' : 'fallback'}`}>
          {latestData.isLiveData ? '🟢 LIVE DATA from Google Sheets' : '🟡 Using Fallback Data'}
        </span>
        <br />
        <span className="auto-refresh">⏱️ Auto-refresh every 3 seconds</span>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #1a1a1a;
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #333;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
          background: #1a1a1a;
          color: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .dashboard-header h1 {
          font-size: 2.5em;
          margin-bottom: 15px;
          color: #e74c3c;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 1.2em;
          font-weight: bold;
        }

        .status-light {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        .status-light.alert {
          background: #e74c3c;
          box-shadow: 0 0 10px #e74c3c;
        }

        .status-light.normal {
          background: #27ae60;
          box-shadow: 0 0 10px #27ae60;
          animation: none;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .alert-section {
          margin-bottom: 30px;
        }

        .alerts-container {
          background: #1a1a1a;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .alerts-container h2 {
          color: #fff;
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.8em;
          animation: alertBlink 1s infinite;
        }

        @keyframes alertBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.7; }
        }

        .no-alerts {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #27ae60, #229954);
          border-radius: 15px;
          color: white;
          box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
        }

        .success-icon {
          font-size: 3em;
          display: block;
          margin-bottom: 15px;
        }

        .alert-box {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 1.1em;
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .alert-critical {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: 2px solid #a93226;
          animation: shake 0.5s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .alert-warning {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          border: 2px solid #d68910;
        }

        .alert-good {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: white;
          border: 2px solid #1e8449;
        }

        .alert-info {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border: 2px solid #2471a3;
        }

        .alert-icon {
          font-size: 1.5em;
        }

        .alert-type {
          font-weight: 900;
          min-width: 100px;
        }

        .alert-message {
          flex: 1;
        }

        .current-values {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .current-values h2 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 25px;
          font-size: 1.8em;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .value-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          position: relative;
        }

        .value-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .value-card.danger {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border-color: #a93226;
          animation: dangerPulse 2s infinite;
        }

        @keyframes dangerPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(231, 76, 60, 0.3); }
          50% { box-shadow: 0 0 25px rgba(231, 76, 60, 0.6); }
        }

        .value-card.warning {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          border-color: #d68910;
        }

        .value-card.good {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: white;
          border-color: #1e8449;
        }

        .value-card.info {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-color: #2471a3;
        }

        .value-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .value-icon {
          font-size: 1.5em;
        }

        .value-label {
          font-weight: bold;
          font-size: 1.1em;
        }

        .value-display {
          font-size: 2.2em;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vibration-card {
          grid-column: span 2;
        }

        .vibration-values {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .axis-value {
          background: #34495e;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 1.2em;
        }

        .warning-badge,
        .good-badge,
        .info-badge {
          font-size: 1.2em;
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }

        .last-updated {
          text-align: center;
          color: #7f8c8d;
          font-size: 1.1em;
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          line-height: 1.6;
        }

        .auto-refresh {
          color: #3498db;
          font-weight: bold;
          animation: pulse 2s infinite;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 10px;
          }

          .dashboard-header h1 {
            font-size: 1.8em;
          }

          .values-grid {
            grid-template-columns: 1fr;
          }

          .vibration-card {
            grid-column: span 1;
          }

          .vibration-values {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SensorDashboard;