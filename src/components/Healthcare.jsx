import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Firebase implementation using Firebase SDK
const HealthDashboard = () => {
    const [healthData, setHealthData] = useState({
        Exo_Skeleton: "Loading...",
        Diastolic: "Loading...",
        ECG_BPM: "Loading...",
        ECG_Value: "Loading...",
        HR: "Loading...",
        Humidity: "Loading...",
        SpO2: "Loading...",
        Systolic: "Loading...",
        Temperature: "Loading..."
    });
    const [historicalData, setHistoricalData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState("Initializing Firebase connection...");
    const [updateCount, setUpdateCount] = useState(0);

    useEffect(() => {
        try {
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

            // Reference to your data
            const dataRef = ref(database, 'Exo_Skeleton');

            setDebugInfo("Firebase initialized. Waiting for data...");

            // Listen for changes
            const unsubscribe = onValue(dataRef, (snapshot) => {
                setUpdateCount(prev => prev + 1);
                setDebugInfo(`Data update received (${new Date().toLocaleTimeString()})`);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log("Firebase data:", data);

                    let newHealthData = {};

                    // Check if data has the expected structure
                    if (data.Exo_Skeleton !== undefined || data.HR !== undefined) {
                        // Data is at root level
                        newHealthData = data;
                    } else {
                        // Try to find data in child nodes
                        const keys = Object.keys(data);
                        setDebugInfo(prev => `${prev}\nFound keys: ${keys.join(', ')}`);

                        if (keys.length > 0) {
                            // Check the first child
                            const firstChild = data[keys[0]];
                            if (firstChild && (firstChild.Exo_Skeleton !== undefined || firstChild.HR !== undefined)) {
                                setDebugInfo(prev => `${prev}\nFound health data in: ${keys[0]}`);
                                newHealthData = firstChild;
                            } else {
                                setDebugInfo(prev => `${prev}\nCould not find health data in expected format`);
                                setError("Data structure doesn't match expected format");
                                return;
                            }
                        }
                    }

                    setHealthData(newHealthData);

                    // Add to historical data with timestamp
                    const timestamp = new Date();
                    const timeString = timestamp.toLocaleTimeString();
                    
                    setHistoricalData(prev => {
                        const newPoint = {
                            time: timeString,
                            timestamp: timestamp.getTime(),
                            ...Object.fromEntries(
                                Object.entries(newHealthData).map(([key, value]) => [
                                    key, 
                                    typeof value === 'number' ? value : parseFloat(value) || 0
                                ])
                            )
                        };
                        
                        // Keep only last 50 data points to prevent memory issues
                        const updated = [...prev, newPoint].slice(-50);
                        return updated;
                    });

                    setIsLoading(false);
                } else {
                    setDebugInfo(prev => `${prev}\nNo data found at specified path`);
                    setError("No data available in the database");
                    setIsLoading(false);
                }
            }, (err) => {
                console.error("Firebase error:", err);
                setDebugInfo(prev => `${prev}\nError: ${err.message}`);
                setError("Failed to connect to database: " + err.message);
                setIsLoading(false);
            });

            // Clean up listener on unmount
            return () => unsubscribe();

        } catch (err) {
            console.error("Setup error:", err);
            setDebugInfo(prev => `${prev}\nSetup error: ${err.message}`);
            setError("Failed to initialize Firebase: " + err.message);
            setIsLoading(false);
        }
    }, []);

    // Define the metrics configuration
    const metricsConfig = [
        { key: 'Diastolic', label: 'Diastolic', unit: 'mmHg', color: '#f54242', type: 'line' },
        { key: 'ECG_BPM', label: 'ECG BPM', unit: 'BPM', color: '#42f5a7', type: 'line' },
        { key: 'ECG_Value', label: 'ECG Value', unit: 'mV', color: '#a742f5', type: 'line' },
        { key: 'HR', label: 'Heart Rate', unit: 'BPM', color: '#f542cb', type: 'line' },
        { key: 'Humidity', label: 'Humidity', unit: '%', color: '#42b8f5', type: 'bar' },
        { key: 'SpO2', label: 'SpO2', unit: '%', color: '#f5a742', type: 'line' },
        { key: 'Systolic', label: 'Systolic', unit: 'mmHg', color: '#f54242', type: 'line' },
        { key: 'Temperature', label: 'Temperature', unit: '°C', color: '#42f56f', type: 'line' }
    ];

    const metricCards = metricsConfig.map(config => ({
        id: config.key.toLowerCase(),
        label: config.key,
        value: typeof healthData[config.key] === 'number' ? 
            (config.key === 'ECG_BPM' ? healthData[config.key].toFixed(2) : healthData[config.key]) : 
            healthData[config.key],
        unit: config.unit,
        color: config.color
    }));

    const CustomTooltip = ({ active, payload, label, metric }) => {
        if (active && payload && payload.length) {
            const config = metricsConfig.find(m => m.key === metric);
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{`Time: ${label}`}</p>
                    <p className="tooltip-value">
                        {`${config?.label}: ${payload[0].value}${config?.unit || ''}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderChart = (metric) => {
        const config = metricsConfig.find(m => m.key === metric);
        if (!config || historicalData.length === 0) return null;

        const chartData = historicalData.map(point => ({
            time: point.time,
            value: point[metric] || 0
        }));

        if (config.type === 'bar') {
            return (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip metric={metric} />} />
                        <Bar dataKey="value" fill={config.color} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip metric={metric} />} />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={config.color} 
                        strokeWidth={2}
                        dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: config.color, strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Health Metrics Dashboard</h1>
            </header>

            {error && <div className="error-message">{error}</div>}

            {/* Debug panel with connection status */}
            {/* <div className="debug-panel">
                <h3>Firebase Connection Status</h3>
                <div className="connection-status">
                    <span className={updateCount > 0 ? "status-connected" : "status-disconnected"}>
                        {updateCount > 0 ? "Connected" : "Not Connected"}
                    </span>
                    <span>Updates received: {updateCount}</span>
                    <span>Data points: {historicalData.length}</span>
                </div>
                <pre>{debugInfo}</pre>
                <button onClick={() => console.log('Current health data:', healthData)}>
                    Log Current Data to Console
                </button>
            </div> */}

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div>Loading health metrics...</div>
                </div>
            ) : (
                <>
                    {/* Cards Section */}
                    <div className="cards-container">
                        {metricCards.map((card) => (
                            <div key={card.id} className="metric-card" style={{ borderTopColor: card.color }}>
                                <div className="card-label">{card.label}</div>
                                <div className="card-value">
                                    {card.value}
                                    <span className="card-unit">{card.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="charts-container">
                        <h2 className="charts-header">Health Metrics Trends</h2>
                        {historicalData.length > 0 ? (
                            <div className="charts-grid">
                                {metricsConfig.map(metric => (
                                    <div key={metric.key} className="individual-chart">
                                        <div className="chart-header">
                                            <h3 className="chart-title" style={{ color: metric.color }}>
                                                {metric.label}
                                            </h3>
                                            <span className="current-value">
                                                Current: {healthData[metric.key]} {metric.unit}
                                            </span>
                                        </div>
                                        <div className="chart-wrapper">
                                            {renderChart(metric.key)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">No historical data available yet. Charts will appear as data is received from Firebase.</div>
                        )}
                    </div>
                </>
            )}
            
            <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
        }
        
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f7;
          min-height: 100vh;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
          text-align: center;
        }
        
        .dashboard-header h1 {
          color: #333;
          font-size: 28px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
          border-left: 5px solid #c62828;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 50px 0;
          color: #666;
          font-size: 18px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          margin-bottom: 20px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .debug-panel {
          background-color: #f0f8ff;
          border: 1px solid #add8e6;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
          font-family: monospace;
          font-size: 12px;
        }
        
        .connection-status {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .status-connected {
          color: green;
        }
        
        .status-disconnected {
          color: red;
        }
        
        .debug-panel pre {
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 150px;
          overflow-y: auto;
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 3px;
          margin: 10px 0;
          border: 1px solid #ddd;
        }
        
        .debug-panel button {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 8px 16px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .debug-panel button:hover {
          background-color: #45a049;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        
        .metric-card {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 15px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-top: 5px solid;
          display: flex;
          flex-direction: column;
          min-height: 120px;
        }
        
        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .card-label {
          font-size: 16px;
          font-weight: bold;
          color: #666;
          margin-bottom: 10px;
        }
        
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-top: auto;
          display: flex;
          align-items: baseline;
        }
        
        .card-unit {
          font-size: 14px;
          color: #777;
          margin-left: 5px;
        }
        
        .charts-container {
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
        }
        
        .charts-header {
          color: #333;
          font-size: 24px;
          margin-bottom: 30px;
          text-align: center;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
        }
        
        .individual-chart {
          background-color: #fafafa;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #e0e0e0;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .chart-wrapper {
          background-color: white;
          border-radius: 6px;
          padding: 10px;
        }
        
        .chart-title {
          color: #333;
          font-size: 18px;
          margin: 0;
          font-weight: bold;
        }
        
        .current-value {
          font-size: 14px;
          color: #666;
          font-weight: normal;
          background-color: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        
        .custom-tooltip {
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .tooltip-label {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        
        .tooltip-value {
          color: #666;
        }
        
        .no-data {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 50px;
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 2px dashed #ddd;
        }
        
        @media (max-width: 768px) {
          .cards-container {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }
          
          .card-value {
            font-size: 20px;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .chart-title {
            font-size: 16px;
          }
          
          .current-value {
            font-size: 12px;
          }
        }
      `}</style>
        </div>
    );
};

export default HealthDashboard;