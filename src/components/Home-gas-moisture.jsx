import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Firebase configuration - using the URL from your screenshot
const firebaseConfig = {
  databaseURL: "https://self-balancing-7a9fe-default-rtdb.firebaseio.com/",
};

const Dashboard = () => {
  // State for current sensor data
  const [sensorData, setSensorData] = useState({
    gas: 0,
    humidity: 0,
    motion: 0,
    temperature: 0,
    timestamp: "0"
  });
  
  // State for historical data
  const [historyData, setHistoryData] = useState([]);
  
  // State for alerts
  const [showGasAlert, setShowGasAlert] = useState(false);
  const [showMotionAlert, setShowMotionAlert] = useState(false);
  
  // Connection status
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Ref to track if we've initialized Firebase
  const firebaseInitialized = useRef(false);
  
  // Initialize Firebase and listen for updates
  useEffect(() => {
    let firebaseApp;
    let database;
    let unsubscribe;
    
    const initFirebase = async () => {
      if (firebaseInitialized.current) return;
      
      try {
        // Import Firebase SDK
        const { initializeApp } = await import('firebase/app');
        const { getDatabase, ref, onValue, off } = await import('firebase/database');
        
        // Initialize Firebase
        firebaseApp = initializeApp(firebaseConfig);
        database = getDatabase(firebaseApp);
        firebaseInitialized.current = true;
        
        console.log("Firebase initialized successfully");
        
        // Reference to sensor data - exact path as shown in screenshot
        const sensorRef = ref(database, '/11_Home_CO2');
        
        // Listen for changes
        onValue(sensorRef, (snapshot) => {
          const data = snapshot.val();
          console.log("Data received from Firebase:", data);
          
          if (data) {
            // Update last update time
            setLastUpdateTime(new Date());
            
            // Format the data
            const formattedData = {
              gas: Number(data.gas) || 0,
              humidity: Number(data.humidity) || 0,
              motion: Number(data.motion) || 0,
              temperature: Number(data.temperature) || 0,
              timestamp: data.timestamp || String(Math.floor(Date.now() / 1000))
            };
            
            console.log("Formatted data:", formattedData);
            
            // Update sensor data state
            setSensorData(formattedData);
            
            // Update history
            setHistoryData(prev => {
              // Only add if different from last entry or more than 60 seconds passed
              const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;
              
              if (!lastEntry || 
                  lastEntry.gas !== formattedData.gas || 
                  lastEntry.motion !== formattedData.motion ||
                  Math.abs(lastEntry.temperature - formattedData.temperature) > 0.1 ||
                  Math.abs(lastEntry.humidity - formattedData.humidity) > 1) {
                return [...prev, formattedData].slice(-20);
              }
              
              return prev;
            });
            
            // Set connection status
            setIsConnected(true);
          }
        }, (error) => {
          console.error("Firebase error:", error);
          setIsConnected(false);
        });
        
        // Store unsubscribe function
        unsubscribe = () => off(sensorRef);
        
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        setIsConnected(false);
      }
    };
    
    // Initialize Firebase
    initFirebase();
    
    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  // Handle alerts
  useEffect(() => {
    // Gas alert
    if (sensorData.gas === 1) {
      setShowGasAlert(true);
      const timer = setTimeout(() => setShowGasAlert(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [sensorData.gas]);
  
  useEffect(() => {
    // Motion alert
    if (sensorData.motion === 1) {
      setShowMotionAlert(true);
      const timer = setTimeout(() => setShowMotionAlert(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [sensorData.motion]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Invalid time';
    }
  };
  
  return (
    <div className="dashboard">
      <header>
        <h1>HVAC Dashboard</h1>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Connected to Firebase' : 'Disconnected'}</span>
          {lastUpdateTime && (
            <span className="last-update">Last update: {lastUpdateTime.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="security-warning">
          <span className="warning-icon">⚠️</span>
          Your security rules are defined as public, so anyone can steal, modify or delete data in your database
        </div>
      </header>
      
      <div className="alerts-container">
        {showGasAlert && (
          <div className="alert gas-alert">
            <span className="alert-icon">🚨</span>
            <span className="alert-text">GAS DETECTED! Please check your home immediately.</span>
          </div>
        )}
        
        {showMotionAlert && (
          <div className="alert motion-alert">
            <span className="alert-icon">👤</span>
            <span className="alert-text">MOTION DETECTED! Movement in your home.</span>
          </div>
        )}
      </div>
      
      <div className="sensors-container">
        <div className="sensor-card">
          <h2>Co2</h2>
          <div className={`sensor-value ${sensorData.gas === 1 ? 'alert-value' : ''}`}>
            {sensorData.gas}
          </div>
          <div className="sensor-status">
            {sensorData.gas === 0 ? 'Normal' : 'ALERT'}
          </div>
        </div>
        
        <div className="sensor-card">
          <h2>Motion</h2>
          <div className={`sensor-value ${sensorData.motion === 1 ? 'alert-value' : ''}`}>
            {sensorData.motion}
          </div>
          <div className="sensor-status">
            {sensorData.motion === 0 ? 'No Movement' : 'MOVEMENT DETECTED'}
          </div>
        </div>
        
        <div className="sensor-card">
          <h2>Temperature</h2>
          <div className="sensor-value">
            {sensorData.temperature}°C
          </div>
        </div>
        
        <div className="sensor-card">
          <h2>Humidity</h2>
          <div className="sensor-value">
            {sensorData.humidity}%
          </div>
        </div>
      </div>
      
      {historyData.length > 0 && (
        <div className="graphs-container">
          <div className="graph-card">
            <h2>Temperature History</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={historyData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis 
                  label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="graph-card">
            <h2>Humidity History</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={historyData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis 
                  label={{ value: '%', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Humidity']} />
                <Legend />
                <Line type="monotone" dataKey="humidity" stroke="#387df5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="graph-card">
            <h2>Gas & Motion Events</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={historyData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis 
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  label={{ value: 'Status', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line type="stepAfter" dataKey="gas" stroke="#ff0000" dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="stepAfter" dataKey="motion" stroke="#00bb00" dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* <div className="debug-section">
        <h3>Current Sensor Values (Debug)</h3>
        <pre>{JSON.stringify(sensorData, null, 2)}</pre>
      </div> */}
      
      <style jsx>{`
        /* Dashboard Styles */
        .dashboard {
          font-family: Arial, sans-serif;
          padding: 20px;
          background-color: #f0f2f5;
          min-height: 100vh;
        }
        
        header {
          margin-bottom: 30px;
        }
        
        h1 {
          color: #333;
          margin: 0 0 15px 0;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }
        
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          transition: background-color 0.3s ease;
        }
        
        .connected {
          background-color: #28a745;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
        }
        
        .disconnected {
          background-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
        }
        
        .last-update {
          margin-left: 20px;
          font-style: italic;
        }
        
        .security-warning {
          background-color: #ffecec;
          border-left: 4px solid #f44336;
          padding: 10px 15px;
          color: #a94442;
          display: flex;
          align-items: center;
          margin-top: 10px;
        }
        
        .warning-icon {
          margin-right: 10px;
          font-size: 20px;
        }
        
        .alerts-container {
          margin-bottom: 20px;
          min-height: 60px;
        }
        
        .alert {
          padding: 15px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          animation: fadeIn 0.3s ease-in;
        }
        
        .gas-alert {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .motion-alert {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
        }
        
        .alert-icon {
          font-size: 24px;
          margin-right: 15px;
        }
        
        .alert-text {
          font-weight: bold;
        }
        
        .sensors-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .sensor-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
          transition: transform 0.2s ease-in-out;
        }
        
        .sensor-card:hover {
          transform: translateY(-5px);
        }
        
        .sensor-card h2 {
          margin: 0 0 15px 0;
          color: #555;
          font-size: 18px;
        }
        
        .sensor-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        
        .alert-value {
          color: #dc3545;
          animation: pulse 1.5s infinite;
        }
        
        .sensor-status {
          font-size: 14px;
          color: #666;
        }
        
        .graphs-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .graph-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        .graph-card h2 {
          margin: 0 0 15px 0;
          color: #555;
          font-size: 18px;
        }
        
        .debug-section {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .debug-section h3 {
          margin-top: 0;
          font-size: 16px;
          color: #555;
        }
        
        pre {
          background-color: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
        
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .sensors-container {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .graphs-container {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .sensors-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;