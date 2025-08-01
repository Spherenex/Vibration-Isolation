import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9ererNsNonAzH0zQo_GS79XPOyCoMxr4",
  authDomain: "waterdtection.firebaseapp.com",
  databaseURL: "https://waterdtection-default-rtdb.firebaseio.com",
  projectId: "waterdtection",
  storageBucket: "waterdtection.firebasestorage.app",
  messagingSenderId: "690886375729",
  appId: "1:690886375729:web:172c3a47dda6585e4e1810",
  measurementId: "G-TXF33Y6XY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const Dashboard = () => {
  const [healthData, setHealthData] = useState({
    bp: "0/0",
    hr: 0,
    hum: 0,
    spo2: 0,
    tem: 0,
    securityWarning: false
  });
  
  // Mock data variable name fix
  const [historicalData, setHistoricalData] = useState({
    hr: [],
    hum: [],
    spo2: [],
    temp: []  // Using 'temp' here for initialization consistency
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // No longer using tabs

  useEffect(() => {
    // Initialize historical data with mock data
    const now = Date.now();
    const mockData = {
      hr: Array(20).fill().map((_, i) => ({
        time: new Date(now - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * (90 - 65) + 65) // Random HR between 65-90
      })),
      hum: Array(20).fill().map((_, i) => ({
        time: new Date(now - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * (60 - 40) + 40) // Random humidity between 40-60
      })),
      spo2: Array(20).fill().map((_, i) => ({
        time: new Date(now - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * (100 - 94) + 94) // Random SpO2 between 94-100
      })),
      temp: Array(20).fill().map((_, i) => ({
        time: new Date(now - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: (Math.random() * (37.5 - 36.5) + 36.5).toFixed(1) // Random temp between 36.5-37.5
      }))
    };
    
    setHistoricalData(mockData);

    // Adding error handling for Firebase initialization
    try {
      console.log("Connecting to Firebase at:", firebaseConfig.databaseURL);
      
      // Reference to the data location (adjust path as needed)
      const dataRef = ref(database, '4_EXO_1');
      
      // Set up a listener for real-time updates with error handling
      const unsubscribe = onValue(
        dataRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Data received:", data);
            
            // Update current health data
            setHealthData({
              ...data,
              securityWarning: true // Assuming the security warning is always relevant
            });
            
            // Update historical data with new data point
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            setHistoricalData(prev => {
              const updateMetric = (metric, value) => {
                // Handle NaN values
                const safeValue = isNaN(Number(value)) ? 0 : Number(value);
                const newData = [...prev[metric], { time: currentTime, value: safeValue }];
                return newData.slice(-20); // Keep only the last 20 data points
              };
              
              return {
                hr: updateMetric('hr', data.hr),
                hum: updateMetric('hum', data.hum),
                spo2: updateMetric('spo2', data.spo2),
                temp: updateMetric('temp', data.temp)
              };
            });
            
          } else {
            console.log("No data available at path: 4_EXO_1");
            setError("No data available at this path. Check your database structure.");
          }
          setLoading(false);
        }, 
        (error) => {
          console.error("Firebase error:", error);
          setError(`Firebase error: ${error.message}. Make sure your database URL and path are correct.`);
          setLoading(false);
        }
      );
      
      // Clean up listener on component unmount
      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase setup error:", err);
      setError(`Error setting up Firebase: ${err.message}. Check your Firebase configuration.`);
      setLoading(false);
    }
  }, []);

  // Function to determine color based on value ranges
  const getValueColor = (type, value) => {
    if (value === 0 || value === "0/0") return "#888"; // Gray for zero values
    
    switch(type) {
      case 'hr':
        return value < 60 || value > 100 ? "#ff4d4d" : "#4caf50";
      case 'spo2':
        return value < 95 ? "#ff4d4d" : "#4caf50";
      case 'tem':
        // Adjusted for room/environmental temperature (not body temperature)
        return value < 10 || value > 40 ? "#ff4d4d" : "#4caf50";
      case 'hum':
        return value < 30 || value > 60 ? "#ff9800" : "#4caf50";
      case 'bp':
        // Add basic BP validation (this is simplified)
        if (value === "0/0") return "#888";
        const [systolic, diastolic] = value.split('/').map(Number);
        if (systolic > 140 || diastolic > 90 || systolic < 90 || diastolic < 60) {
          return "#ff4d4d";
        }
        return "#4caf50";
      default:
        return "#4caf50";
    }
  };
  
  // Function to get graph color
  const getGraphColor = (type) => {
    switch(type) {
      case 'hr': return "#ff6b81";
      case 'spo2': return "#70a1ff";
      case 'tem': return "#ff9f43";
      case 'hum': return "#54a0ff";
      default: return "#4caf50";
    }
  };
  
  // Function to get graph y-axis domain
  const getYAxisDomain = (type) => {
    switch(type) {
      case 'hr': return [40, 120];
      case 'spo2': return [90, 100];
      case 'tem': return [15, 40]; // Adjusted for environmental temperature range
      case 'hum': return [20, 70];
      default: return [0, 'auto'];
    }
  };
  
  // Get unit for each metric
  const getUnit = (type) => {
    switch(type) {
      case 'hr': return "BPM";
      case 'spo2': return "%";
      case 'tem': return "°C";
      case 'hum': return "%";
      default: return "";
    }
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      {healthData.securityWarning && (
        <div className="security-warning">
          <AlertTriangle size={20} />
          <span>Your security rules are defined as public, so anyone can steal, modify or delete data in your database</span>
        </div>
      )}
      
      <h1>Health Monitoring Dashboard</h1>
      
      <div className="metrics-with-graphs">
        {/* Heart Rate */}
        <div className="metric-graph-container">
          <div className="metric-card">
            <h2>Heart Rate</h2>
            <div className="metric-value" style={{color: getValueColor('hr', healthData.hr)}}>
              {healthData.hr}
            </div>
            <div className="metric-label">BPM</div>
          </div>
          
          <div className="graph-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.hr} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis domain={getYAxisDomain('hr')} stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none' }} 
                  formatter={(value) => [`${value} ${getUnit('hr')}`, 'Heart Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={getGraphColor('hr')} 
                  strokeWidth={2}
                  dot={{ stroke: getGraphColor('hr'), strokeWidth: 2, r: 4 }}
                  activeDot={{ stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* SpO2 */}
        <div className="metric-graph-container">
          <div className="metric-card">
            <h2>SpO₂</h2>
            <div className="metric-value" style={{color: getValueColor('spo2', healthData.spo2)}}>
              {healthData.spo2}
            </div>
            <div className="metric-label">%</div>
          </div>
          
          <div className="graph-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.spo2} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis domain={getYAxisDomain('spo2')} stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none' }}
                  formatter={(value) => [`${value} ${getUnit('spo2')}`, 'SpO₂']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={getGraphColor('spo2')} 
                  strokeWidth={2}
                  dot={{ stroke: getGraphColor('spo2'), strokeWidth: 2, r: 4 }}
                  activeDot={{ stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Temperature */}
        <div className="metric-graph-container">
          <div className="metric-card">
            <h2>Temperature</h2>
            <div className="metric-value" style={{color: getValueColor('tem', healthData.tem)}}>
              {healthData.tem}
            </div>
            <div className="metric-label">°C</div>
          </div>
          
          <div className="graph-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.temp} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis domain={getYAxisDomain('tem')} stroke="#888" />
                // Add tooltip formatter that handles NaN values
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none' }}
                  formatter={(value) => {
                    // Handle NaN values in tooltip
                    const displayValue = isNaN(value) ? "N/A" : value;
                    return [`${displayValue} ${getUnit('tem')}`, 'Temperature'];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={getGraphColor('tem')} 
                  strokeWidth={2}
                  dot={{ stroke: getGraphColor('tem'), strokeWidth: 2, r: 4 }}
                  activeDot={{ stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Humidity */}
        <div className="metric-graph-container">
          <div className="metric-card">
            <h2>Humidity</h2>
            <div className="metric-value" style={{color: getValueColor('hum', healthData.hum)}}>
              {healthData.hum}
            </div>
            <div className="metric-label">%</div>
          </div>
          
          <div className="graph-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historicalData.hum} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#888" />
                <YAxis domain={getYAxisDomain('hum')} stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none' }}
                  formatter={(value) => [`${value} ${getUnit('hum')}`, 'Humidity']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={getGraphColor('hum')} 
                  strokeWidth={2}
                  dot={{ stroke: getGraphColor('hum'), strokeWidth: 2, r: 4 }}
                  activeDot={{ stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Blood Pressure - No Graph */}
        <div className="metric-graph-container bp-container">
          <div className="metric-card">
            <h2>Blood Pressure</h2>
            <div className="metric-value" style={{color: getValueColor('bp', healthData.bp)}}>
              {healthData.bp}
            </div>
            <div className="metric-label">mmHg</div>
          </div>
        </div>
      </div>
      
      <div className="data-footer">
        <div className="data-source">Source: 4_EXO_1</div>
        <div className="data-timestamp">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
      
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          background-color: #1e1e1e;
          color: #e0e0e0;
          padding: 20px;
        }
        
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #2d2d2d;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .security-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #4c1d1d;
          color: #ff8a8a;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #ff4d4d;
        }
        
        h1 {
          font-size: 28px;
          margin-bottom: 24px;
          color: #ffffff;
          border-bottom: 1px solid #444;
          padding-bottom: 12px;
        }
        
        .view-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .toggle-btn {
          padding: 8px 16px;
          background-color: #363636;
          border: none;
          border-radius: 4px;
          color: #b0b0b0;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-btn.active {
          background-color: #4c6ef5;
          color: white;
        }
        
        .toggle-btn:hover:not(.active) {
          background-color: #424242;
        }
        
        .metrics-with-graphs {
          display: flex;
          flex-direction: column;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .metric-graph-container {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 20px;
          background-color: #333;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .bp-container {
          grid-template-columns: 1fr;
        }
        
        .metric-card {
          background-color: #363636;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }
        
        .metric-card:hover {
          transform: translateY(-5px);
        }
        
        .graph-card {
          background-color: #363636;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .data-footer {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #777;
          border-top: 1px solid #444;
          padding-top: 12px;
        }
        
        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #888;
        }
        
        .error {
          color: #ff6b6b;
        }
        
        .metric-card h2 {
          font-size: 16px;
          margin-bottom: 12px;
          color: #b0b0b0;
        }
        
        .metric-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #888;
        }
        
        @media (max-width: 768px) {
          .metric-graph-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }
          
          .data-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;