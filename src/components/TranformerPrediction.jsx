import { useState, useEffect } from 'react';

// Firebase configuration
const App = () => {
  const [transformerData, setTransformerData] = useState({
    Temperature: 0,
    Voltage: 0,
    Vibration: 0,
    Humidity: 0,
    Magnitude: 0,
    Power: 0,
    Current: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Firebase database URL
        const url = 'https://waterdtection-default-rtdb.firebaseio.com/Transformer_Prediction.json';
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        setTransformerData(data);
        setLoading(false);
        
        // Check for alert conditions
        const alertConditions = [];
        
        if (data.Temperature > 35) {
          alertConditions.push('Temperature is too high');
        }
        
        if (data.Voltage < 5) {
          alertConditions.push('Voltage is too low');
        }
        
        if (data.Vibration === 1) {
          alertConditions.push('Vibration detected');
        }
        
        if (alertConditions.length > 0) {
          setAlertMessage(`ALERT: Transformer failure! ${alertConditions.join(', ')}`);
          setShowAlert(true);
        } else {
          setShowAlert(false);
        }
        
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up interval to fetch data every 10 seconds
    const intervalId = setInterval(fetchData, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="loading">Loading transformer data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Automatic Battery Monitoring Using ML</h1>
      
      {showAlert && (
        <div className="alert">
          {alertMessage}
        </div>
      )}
      
      <div className="dashboard">
        <div className={`card ${transformerData.Power > 35 ? 'warning' : ''}`}>
          <h2>Power</h2>
          <div className="value">{transformerData.Power}V</div>
          {/* {transformerData.Power > 35 && (
            <div className="status critical">Critical</div>
          )} */}
        </div>
        
        <div className={`card ${transformerData.Current < 5 ? 'warning' : ''}`}>
          <h2>Current</h2>
          <div className="value">{transformerData.Current}A</div>
          {/* {transformerData.Current < 5 && (
            <div className="status critical">Critical</div>
          )} */}
        </div>
        
        {/* <div className={`card ${transformerData.Vibration === 1 ? 'warning' : ''}`}>
          <h2>Vibration</h2>
          <div className="value">{transformerData.Vibration}</div>
          {transformerData.Vibration === 1 && (
            <div className="status critical">Critical</div>
          )}
        </div> */}
        
        {/* <div className="card">
          <h2>Humidity</h2>
          <div className="value">{transformerData.Humidity}%</div>
        </div> */}
        
        {/* <div className="card">
          <h2>Magnitude</h2>
          <div className="value">{transformerData.Magnitude}</div>
        </div> */}
      </div>
      
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          background-color: #f5f5f5;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        
        .dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .card {
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .card h2 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #555;
        }
        
        .value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        
        .warning {
          border-left: 5px solid #ff4d4f;
          background-color: #fff1f0;
        }
        
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
        }
        
      
        
        .alert {
          background-color: #ff4d4f;
          color: white;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: bold;
          text-align: center;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
          }
        }
        
        .loading, .error {
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }
        
        .error {
          color: #ff4d4f;
        }
      `}</style>
    </div>
  );
};

export default App;