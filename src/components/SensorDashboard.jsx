import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Configuration - Set to your Firebase database URL if available
// Set to empty string to use demo mode only
const FIREBASE_URL = 'https://waterdtection-default-rtdb.firebaseio.com/'; // 'https://YOUR-PROJECT-ID.firebaseio.com'
const SENSOR_PATH = '/DHT_sensors';

// Enhanced demo data for testing when Firebase is unavailable
const DEMO_DATA = {
  Flame: "0",
  Humidity: "69.1",
  Smoke: "0",
  TemperatureC: "29.4",
  TemperatureF: "84.92",
  _isDemo: true // Flag to indicate this is demo data
};

// Function to generate random sensor readings for demo mode
const generateRandomReading = () => {
  // Random temperature between 25-35°C
  const tempC = (25 + Math.random() * 10).toFixed(1);
  // Convert to Fahrenheit
  const tempF = ((parseFloat(tempC) * 9/5) + 32).toFixed(2);
  // Random humidity between 40-80%
  const humidity = (40 + Math.random() * 40).toFixed(1);
  // Random chance for flame detection (1 in 20)
  const flame = Math.random() < 0.05 ? "1" : "0";
  // Random smoke level (mostly 0, occasionally 1-3)
  const smokeChance = Math.random();
  let smoke = "0";
  if (smokeChance > 0.9) smoke = Math.ceil(Math.random() * 3).toString();
  
  return {
    Flame: flame,
    Humidity: humidity,
    Smoke: smoke,
    TemperatureC: tempC,
    TemperatureF: tempF,
    _isDemo: true
  };
};

// CSS styles
const styles = {
  dashboard: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: '0',
    color: '#333',
    fontSize: '24px'
  },
  lastUpdated: {
    color: '#666',
    fontSize: '14px'
  },
  securityAlert: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #ef9a9a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  demoDataBanner: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #a5d6a7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  alertIcon: {
    marginRight: '10px',
    fontSize: '20px'
  },
  dismiss: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#c62828',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  dismissGreen: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#2e7d32',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  learn: {
    color: '#c62828',
    marginRight: '15px',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  cardTitle: {
    margin: '0 0 5px 0',
    color: '#666',
    fontSize: '16px',
    fontWeight: 'normal'
  },
  cardValue: {
    margin: '0',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333'
  },
  cardUnit: {
    fontSize: '16px',
    color: '#666'
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '20px'
  },
  chartTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '18px'
  },
  alertMessage: {
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite'
  },
  fireAlert: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    border: '1px solid #ef9a9a'
  },
  smokeAlert: {
    backgroundColor: '#e8eaf6',
    color: '#3949ab',
    border: '1px solid #c5cae9'
  },
  refreshButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '10px'
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '15px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '8px'
  },
  statusConnected: {
    backgroundColor: '#4caf50'
  },
  statusDisconnected: {
    backgroundColor: '#f44336'
  },
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.7 },
    '100%': { opacity: 1 }
  }
};

export default function SensorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [securityDismissed, setSecurityDismissed] = useState(false);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Generate mock historical data (last 24 hours with hourly readings)
  const generateMockData = (baseData) => {
    const mockData = [];
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i);
      
      // Base values from current reading with some randomness
      const baseHumidity = baseData ? parseFloat(baseData.Humidity) : 70;
      const baseTempC = baseData ? parseFloat(baseData.TemperatureC) : 30;
      const baseTempF = baseData ? parseFloat(baseData.TemperatureF) : 85;
      
      // More realistic variations based on time of day
      const hourFactor = Math.sin((time.getHours() - 6) * Math.PI / 12); // Peak at noon, low at midnight
      const tempVariation = hourFactor * 3; // 3°C variation throughout the day
      
      mockData.push({
        time: time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        humidity: (baseHumidity + (Math.random() * 4 - 2) - hourFactor * 5).toFixed(1), // Humidity drops during hottest part of day
        temperatureC: (baseTempC + tempVariation + (Math.random() * 0.8 - 0.4)).toFixed(1),
        temperatureF: ((baseTempC + tempVariation) * 9/5 + 32 + (Math.random() * 0.8 - 0.4)).toFixed(2),
      });
    }
    
    return mockData;
  };

  // Update historical data when current data changes
  useEffect(() => {
    if (data) {
      setHistoricalData(generateMockData(data));
    }
  }, [data]);

  // Fetch data from Firebase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If no Firebase URL is configured, use demo mode directly
      if (!FIREBASE_URL) {
        console.log('No Firebase URL configured, using demo mode');
        setData(DEMO_DATA);
        setIsUsingDemoData(true);
        setIsConnected(false);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
      
      // Try fetching from the configured Firebase URL with JSON extension
      let response = await fetch(`${FIREBASE_URL}${SENSOR_PATH}.json`);
      
      // If that fails, try alternative approaches
      if (!response.ok) {
        console.log(`Failed to fetch from ${FIREBASE_URL}${SENSOR_PATH}.json with status: ${response.status}`);
        
        // Try without .json extension
        response = await fetch(`${FIREBASE_URL}${SENSOR_PATH}`);
        
        if (!response.ok) {
          console.log(`Failed to fetch from ${FIREBASE_URL}${SENSOR_PATH} with status: ${response.status}`);
          
          // Try the root URL as a last resort
          response = await fetch(`${FIREBASE_URL}/.json`);
          
          if (!response.ok) {
            throw new Error(`Cannot connect to Firebase database (${response.status} ${response.statusText}). Please check your connection and database URL.`);
          }
          
          const rootData = await response.json();
          console.log('Available Firebase data structure:', rootData);
          
          // Check if our sensor path exists in the root data
          if (rootData && rootData.DHT_sensors) {
            console.log('Found DHT_sensors in root data');
            const sensorData = rootData.DHT_sensors;
            setData(sensorData);
            setIsUsingDemoData(false);
            setIsConnected(true);
            setLastUpdated(new Date());
            return;
          } else {
            throw new Error(`Sensor data not found at path: ${SENSOR_PATH}`);
          }
        }
      }
      
      // Process successful response
      const result = await response.json();
      console.log('Fetched sensor data:', result);
      setData(result);
      setIsUsingDemoData(false);
      setIsConnected(true);
      setError(null);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setIsConnected(false);
      
      // Use demo data when Firebase is unavailable
      if (!isUsingDemoData) {
        console.log('Switching to demo data');
        setData(DEMO_DATA);
        setIsUsingDemoData(true);
      }
      
      // Reduce polling frequency after multiple failures
      if (retryCount > 3) {
        console.log('Multiple connection failures, reducing polling frequency');
      }
      
      setRetryCount(prev => prev + 1);
      
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up polling - use reduced frequency after failures
    const interval = setInterval(() => {
      // If in demo mode, generate new random data occasionally to simulate changes
      if (isUsingDemoData) {
        setData(generateRandomReading());
        setLastUpdated(new Date());
        setHistoricalData(prev => {
          // Add the new data point and remove the oldest if we have more than 25 points
          const newData = [...prev];
          if (newData.length >= 25) newData.shift();
          
          const now = new Date();
          newData.push({
            time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            humidity: data.Humidity,
            temperatureC: data.TemperatureC,
            temperatureF: data.TemperatureF,
          });
          
          return newData;
        });
      } else {
        fetchData();
      }
    }, retryCount > 3 ? 60000 : 30000); // 60s if failing, 30s normally
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [retryCount, isUsingDemoData, data]); // Dependencies updated

  // Manual refresh handler
  const handleRefresh = () => {
    if (isUsingDemoData) {
      // In demo mode, generate new random data
      setData(generateRandomReading());
      setLastUpdated(new Date());
    } else {
      fetchData();
    }
  };

  // Reconnect to Firebase handler
  const handleReconnect = () => {
    setRetryCount(0); // Reset retry count
    setError(null);
    fetchData();
  };

  if (loading && !data) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.header}>
          <h1 style={styles.title}>Sensor Dashboard</h1>
        </div>
        <div style={{textAlign: 'center', padding: '50px 0'}}>
          Loading sensor data...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {!securityDismissed && (
        <div style={styles.securityAlert}>
          <div>
            <span style={styles.alertIcon}>⚠️</span>
            Your security rules are defined as public, so anyone can steal, modify or delete data in your database
          </div>
          <div>
            <a href="https://firebase.google.com/docs/database/security" style={styles.learn} target="_blank" rel="noopener noreferrer">Learn more</a>
            <button style={styles.dismiss} onClick={() => setSecurityDismissed(true)}>Dismiss</button>
          </div>
        </div>
      )}
      
      {isUsingDemoData && !demoBannerDismissed && (
        <div style={styles.demoDataBanner}>
          <div>
            <span style={styles.alertIcon}>ℹ️</span>
            Running in demo mode with simulated sensor data. 
            {FIREBASE_URL ? 
              'Could not connect to Firebase database.' : 
              'No Firebase URL configured.'
            }
          </div>
          <div>
            {FIREBASE_URL && <button style={styles.dismissGreen} onClick={handleReconnect}>Try reconnect</button>}
            <button style={styles.dismissGreen} onClick={() => setDemoBannerDismissed(true)}>Dismiss</button>
          </div>
        </div>
      )}
      
      {error && !isUsingDemoData && (
        <div style={{...styles.securityAlert, backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba'}}>
          <div>
            <span style={styles.alertIcon}>⚠️</span>
            {error}
          </div>
          <button style={{...styles.dismiss, color: '#856404'}} onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sensor Dashboard {isUsingDemoData ? '(Demo Mode)' : ''}</h1>
          <div style={styles.connectionStatus}>
            <div 
              style={{
                ...styles.statusDot, 
                ...(isConnected ? styles.statusConnected : styles.statusDisconnected)
              }} 
            />
            {isConnected ? 'Connected to Firebase' : 'Demo Mode (Simulated Data)'}
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button style={styles.refreshButton} onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Alert messages */}
      {data && data.Flame === "1" && (
        <div style={{...styles.alertMessage, ...styles.fireAlert}}>
          ⚠️ ALERT: Flame detected! Please check the sensor area immediately.
        </div>
      )}
      
      {data && data.Smoke !== "0" && (
        <div style={{...styles.alertMessage, ...styles.smokeAlert}}>
          ⚠️ ALERT: Smoke detected (Level: {data.Smoke})! Please check the sensor area.
        </div>
      )}
      
      {/* Sensor readings */}
      <div style={styles.cardsContainer}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Humidity</h3>
          <p style={styles.cardValue}>
            {data?.Humidity}<span style={styles.cardUnit}>%</span>
          </p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Temperature (°C)</h3>
          <p style={styles.cardValue}>{data?.TemperatureC}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Temperature (°F)</h3>
          <p style={styles.cardValue}>{data?.TemperatureF}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Flame Sensor</h3>
          <p style={styles.cardValue}>{data?.Flame === "1" ? "🔥 Active" : "Inactive"}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Smoke Sensor</h3>
          <p style={styles.cardValue}>{data?.Smoke !== "0" ? `💨 Level ${data.Smoke}` : "Clear"}</p>
        </div>
      </div>
      
      {/* Charts */}
      <div style={styles.chartContainer}>
        <h2 style={styles.chartTitle}>Temperature Trends (24 Hours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" orientation="left" stroke="#ff7300" />
            <YAxis yAxisId="right" orientation="right" stroke="#8884d8" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperatureC" name="Temperature (°C)" stroke="#ff7300" activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="temperatureF" name="Temperature (°F)" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div style={styles.chartContainer}>
        <h2 style={styles.chartTitle}>Humidity Trends (24 Hours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}