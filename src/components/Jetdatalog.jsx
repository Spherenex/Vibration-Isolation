import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const JetEngineDashboard = () => {
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    flow_rate: 0,
    vibration: 0,
    status: 'unknown',
    last_update: '',
    device: ''
  });
  
  const [historicalData, setHistoricalData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Firebase configuration
  const FIREBASE_URL = 'https://smart-medicine-vending-machine-default-rtdb.asia-southeast1.firebasedatabase.app/4_JET_ENGINE.json';

  const fetchData = async () => {
    try {
      const response = await fetch(FIREBASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data) {
        const newReading = {
          temperature: data.temperature || 0,
          flow_rate: data.flow_rate || 0,
          vibration: data.vibration || 0,
          status: data.status || 'unknown',
          last_update: data.last_update || '',
          device: data.device || '',
          timestamp: new Date().toLocaleTimeString()
        };
        
        setCurrentData(newReading);
        setIsConnected(true);
        setError(null);
        
        // Add to historical data (keep last 20 readings)
        setHistoricalData(prev => {
          const updated = [...prev, newReading];
          return updated.slice(-20);
        });
      }
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up polling every 3 seconds
    const interval = setInterval(fetchData, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'running': return '#4CAF50';
      case 'stopped': return '#f44336';
      case 'maintenance': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const formatValue = (value, unit) => {
    return `${typeof value === 'number' ? value.toFixed(2) : value} ${unit}`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>JET Engine Monitoring Dashboard</h1>
        <div style={styles.connectionStatus}>
          <div 
            style={{
              ...styles.statusIndicator,
              backgroundColor: isConnected ? '#4CAF50' : '#f44336'
            }}
          ></div>
          <span style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>
          Error: {error}
        </div>
      )}

      <div style={styles.deviceInfo}>
        <h2 style={styles.deviceName}>{currentData.device}</h2>
        <p style={styles.lastUpdate}>Last Update: {currentData.last_update}</p>
        <div style={styles.statusBadge}>
          <span 
            style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor(currentData.status)
            }}
          ></span>
          Status: {currentData.status}
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <h3 style={styles.metricTitle}>Temperature</h3>
          <div style={styles.metricValue}>
            {formatValue(currentData.temperature, '°C')}
          </div>
          <div style={styles.metricIcon}>🌡️</div>
        </div>

        <div style={styles.metricCard}>
          <h3 style={styles.metricTitle}>Flow Rate</h3>
          <div style={styles.metricValue}>
            {formatValue(currentData.flow_rate, 'L/min')}
          </div>
          <div style={styles.metricIcon}>💧</div>
        </div>

        <div style={styles.metricCard}>
          <h3 style={styles.metricTitle}>Vibration</h3>
          <div style={styles.metricValue}>
            {formatValue(currentData.vibration, 'Hz')}
          </div>
          <div style={styles.metricIcon}>📳</div>
        </div>
      </div>

      <div style={styles.chartsContainer}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ff6b35" 
                strokeWidth={2}
                dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                name="Temperature (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Flow Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="flow_rate" 
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
                name="Flow Rate (L/min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Vibration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="vibration" 
                stroke="#9c27b0" 
                strokeWidth={2}
                dot={{ fill: '#9c27b0', strokeWidth: 2, r: 4 }}
                name="Vibration (Hz)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '2rem',
    fontWeight: '600'
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666'
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffcdd2'
  },
  deviceInfo: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  deviceName: {
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontSize: '1.4rem',
    fontWeight: '600'
  },
  lastUpdate: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#555'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  },
  metricTitle: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0'
  },
  metricIcon: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '2rem',
    opacity: 0.3
  },
  chartsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '25px'
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    margin: '0 0 20px 0',
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600',
    textAlign: 'center'
  }
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default JetEngineDashboard;