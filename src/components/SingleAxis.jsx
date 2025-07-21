import { useState, useEffect, useRef } from 'react';

export default function WeatherMonitor() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [historicalData, setHistoricalData] = useState([]);
  
  // Separate refs for each graph
  const humidityCanvasRef = useRef(null);
  const temperatureCanvasRef = useRef(null);
  const rainCanvasRef = useRef(null);

  // Store historical data for graphing
  useEffect(() => {
    if (weatherData) {
      // Add mock data if we don't have enough historical points
      if (historicalData.length === 0) {
        // Create some initial data points for the graph
        const initialData = [];
        const baseTemp = weatherData.Temperature || 25;
        const baseHumidity = weatherData.Humidity || 60;
        const baseRain = weatherData.RainIntensity || 0;
        
        for (let i = 0; i < 10; i++) {
          initialData.push({
            timestamp: new Date(Date.now() - (10-i) * 30000), // 30 second intervals
            humidity: Math.max(0, Math.min(100, baseHumidity + (Math.random() - 0.5) * 10)),
            temperature: Math.max(0, baseTemp + (Math.random() - 0.5) * 5),
            rainIntensity: Math.max(0, baseRain + (Math.random() - 0.3) * 200),
            rainDetected: weatherData.RainDetected
          });
        }
        
        setHistoricalData([...initialData]);
      }
      
      // Add the new data point
      const newDataPoint = {
        timestamp: new Date(),
        humidity: weatherData.Humidity,
        temperature: weatherData.Temperature,
        rainIntensity: weatherData.RainIntensity || 0,
        rainDetected: weatherData.RainDetected
      };
      
      setHistoricalData(prevData => {
        // Keep last 30 data points for the graph
        const updatedData = [...prevData, newDataPoint];
        if (updatedData.length > 30) {
          return updatedData.slice(updatedData.length - 30);
        }
        return updatedData;
      });
    }
  }, [weatherData]);
  
  // Generic graph drawing function
  const drawGraph = (canvas, data, dataKey, color, label, unit, maxValue = null) => {
    if (!canvas || historicalData.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = height * (i / 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    const validDataPoints = historicalData.filter(d => d && typeof d[dataKey] === 'number');
    if (validDataPoints.length < 2) return;
    
    for (let i = 0; i < validDataPoints.length; i += 5) {
      const x = width * (i / (validDataPoints.length - 1));
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Find max and min values for scaling
    const values = validDataPoints.map(d => d[dataKey] || 0);
    const maxVal = maxValue || Math.max(...values, 1);
    const minVal = dataKey === 'temperature' ? Math.min(...values) - 5 : 0;
    const range = maxVal - minVal;
    
    // Draw main line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    validDataPoints.forEach((dataPoint, index) => {
      const x = width * (index / (validDataPoints.length - 1));
      const normalizedValue = (dataPoint[dataKey] - minVal) / range;
      const y = height - (height * normalizedValue);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Add gradient fill below the line
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color.replace('1)', '0.4)'));
    gradient.addColorStop(1, color.replace('1)', '0.1)'));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    validDataPoints.forEach((dataPoint, index) => {
      const x = width * (index / (validDataPoints.length - 1));
      const normalizedValue = (dataPoint[dataKey] - minVal) / range;
      const y = height - (height * normalizedValue);
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Add data points
    ctx.fillStyle = color;
    validDataPoints.forEach((dataPoint, index) => {
      const x = width * (index / (validDataPoints.length - 1));
      const normalizedValue = (dataPoint[dataKey] - minVal) / range;
      const y = height - (height * normalizedValue);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Add labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${label}`, 15, 25);
    
    // Add current value
    const currentValue = validDataPoints[validDataPoints.length - 1]?.[dataKey] || 0;
    ctx.textAlign = 'right';
    ctx.fillText(`${currentValue.toFixed(1)}${unit}`, width - 15, 25);
    
    // Add scale labels
    ctx.font = '11px Poppins, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${maxVal.toFixed(0)}${unit}`, width - 10, 15);
    ctx.fillText(`${minVal.toFixed(0)}${unit}`, width - 10, height - 5);
    
    // Add time labels
    if (validDataPoints.length > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px Poppins, sans-serif';
      
      const firstTime = validDataPoints[0].timestamp;
      const lastTime = validDataPoints[validDataPoints.length - 1].timestamp;
      
      ctx.fillText(formatTime(firstTime), 40, height - 8);
      ctx.fillText(formatTime(lastTime), width - 40, height - 8);
    }
  };
  
  // Draw all graphs
  useEffect(() => {
    const drawAllGraphs = () => {
      // Draw humidity graph
      if (humidityCanvasRef.current) {
        drawGraph(
          humidityCanvasRef.current, 
          historicalData, 
          'humidity', 
          'rgba(79, 172, 254, 1)', 
          'Humidity', 
          '%', 
          100
        );
      }
      
      // Draw temperature graph
      if (temperatureCanvasRef.current) {
        drawGraph(
          temperatureCanvasRef.current, 
          historicalData, 
          'temperature', 
          'rgba(255, 154, 158, 1)', 
          'Temperature', 
          '°C'
        );
      }
      
      // Draw rain intensity graph
      if (rainCanvasRef.current) {
        drawGraph(
          rainCanvasRef.current, 
          historicalData, 
          'rainIntensity', 
          'rgba(161, 140, 209, 1)', 
          'Rain Intensity', 
          '', 
          1200
        );
      }
    };
    
    // Draw graphs immediately if data exists
    if (historicalData.length > 0) {
      drawAllGraphs();
    }
    
    // Set up interval to redraw graphs every 2 seconds
    const graphInterval = setInterval(drawAllGraphs, 2000);
    
    return () => clearInterval(graphInterval);
  }, [historicalData]);

  function formatTime(date) {
    if (!(date instanceof Date)) return "";
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Initial data fetch
        const response = await fetch('https://waterdtection-default-rtdb.firebaseio.com/.json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data from Firebase');
        }
        
        const data = await response.json();
        setWeatherData(data.Single_Axis);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching initial data:', err);
      }
    };

    // Set up real-time data sync with polling
    const setupPolling = () => {
      const pollingInterval = setInterval(async () => {
        try {
          const response = await fetch('https://waterdtection-default-rtdb.firebaseio.com/.json');
          const data = await response.json();
          if (data && data.Single_Axis) {
            setWeatherData(data.Single_Axis);
            setCurrentTime(new Date());
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000); // Poll every 2 seconds
      
      return pollingInterval;
    };

    // Initialize data and setup real-time updates
    fetchInitialData();
    const pollingInterval = setupPolling();
    
    // Update current time every second for the clock display
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(pollingInterval);
      clearInterval(clockTimer);
    };
  }, []);

  if (loading) {
    return <div className="weather-container loading">Loading weather data...</div>;
  }

  if (error) {
    return <div className="weather-container error">Error: {error}</div>;
  }

  if (!weatherData) {
    return <div className="weather-container error">No weather data available</div>;
  }

  // Calculate trend for each metric
  const getTrend = (dataKey) => {
    if (historicalData.length < 3) return "stable";
    
    const recent = historicalData.slice(-3);
    const latest = recent[2][dataKey];
    const earliest = recent[0][dataKey];
    
    if (latest > earliest + (dataKey === 'rainIntensity' ? 50 : 2)) {
      return "increasing";
    } else if (latest < earliest - (dataKey === 'rainIntensity' ? 50 : 2)) {
      return "decreasing";
    } else {
      return "stable";
    }
  };

  // Format time for display
  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });

  // Format date for display
  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="weather-container">
      <h1>Real-Time Weather Monitor</h1>
      
      <div className="date-display">
        {formattedDate} • {formattedTime}
        <div className="connection-status">
          <span className="status-dot"></span> Live Data
        </div>
      </div>
      
      <div className="weather-cards">
        <div className="weather-card">
          <div className="card-icon humidity-icon">💧</div>
          <div className="card-data">{weatherData.Humidity}%</div>
          <div className="card-label">Humidity</div>
          <div className={`trend-indicator ${getTrend('humidity')}`}>
            {getTrend('humidity') === 'increasing' ? '↗' : getTrend('humidity') === 'decreasing' ? '↘' : '→'}
          </div>
        </div>
        
        <div className="weather-card">
          <div className="card-icon temp-icon">🌡️</div>
          <div className="card-data">{weatherData.Temperature}°C</div>
          <div className="card-label">Temperature</div>
          <div className={`trend-indicator ${getTrend('temperature')}`}>
            {getTrend('temperature') === 'increasing' ? '↗' : getTrend('temperature') === 'decreasing' ? '↘' : '→'}
          </div>
        </div>
        
        <div className="weather-card">
          <div className="card-icon rain-icon">{weatherData.RainDetected === 1 ? '🌧️' : '☀️'}</div>
          <div className="card-data">{weatherData.RainDetected === 1 ? 'Yes' : 'No'}</div>
          <div className="card-label">Rain Detected</div>
          <div className={`trend-indicator ${getTrend('rainIntensity')}`}>
            {getTrend('rainIntensity') === 'increasing' ? '↗' : getTrend('rainIntensity') === 'decreasing' ? '↘' : '→'}
          </div>
        </div>
      </div>
      
      {weatherData.RainDetected === 1 && (
        <div className="rain-alert">
          <span className="alert-icon">⚠️</span> 
          <div className="alert-content">
            <div className="alert-title">Rain Detected!</div>
            <div className="alert-info">Current intensity: {weatherData.RainIntensity}</div>
          </div>
        </div>
      )}
      
      <div className="graphs-container">
        <div className="graph-section">
          <div className="graph-container humidity-graph">
            <div className="graph-header">
              <h3>Humidity Levels</h3>
              <span className="current-value">{weatherData.Humidity}%</span>
            </div>
            <canvas 
              ref={humidityCanvasRef} 
              className="weather-graph" 
              width="600" 
              height="180"
            ></canvas>
          </div>
        </div>
        
        <div className="graph-section">
          <div className="graph-container temperature-graph">
            <div className="graph-header">
              <h3>Temperature Trends</h3>
              <span className="current-value">{weatherData.Temperature}°C</span>
            </div>
            <canvas 
              ref={temperatureCanvasRef} 
              className="weather-graph" 
              width="600" 
              height="180"
            ></canvas>
          </div>
        </div>
        
        <div className="graph-section">
          <div className="graph-container rain-graph">
            <div className="graph-header">
              <h3>Rain Intensity</h3>
              <span className="current-value">{weatherData.RainIntensity || 0}</span>
            </div>
            <canvas 
              ref={rainCanvasRef} 
              className="weather-graph" 
              width="600" 
              height="180"
            ></canvas>
          </div>
        </div>
      </div>
      
      <div className="status-bar">
        <div className="sensor-status">
          <span className={weatherData.SensorStatus === "OK" ? "status-ok" : "status-error"}>
            {weatherData.SensorStatus === "OK" ? "System Online" : "System Error"}
          </span>
        </div>
        <div className="last-update">
          Last Updated: {new Date(parseInt(weatherData.LastUpdate)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true})}
        </div>
      </div>
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .weather-container {
          font-family: 'Poppins', sans-serif;
          max-width: 1200px;
          margin: 20px auto;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          color: white;
        }

        .weather-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 8px;
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        }

        h1 {
          text-align: center;
          color: white;
          margin-bottom: 10px;
          font-weight: 700;
          letter-spacing: -0.5px;
          font-size: 2.2rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .date-display {
          text-align: center;
          margin: 20px 0 30px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .connection-status {
          display: inline-block;
          margin-top: 10px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          backdrop-filter: blur(10px);
          animation: fadeInOut 2s infinite;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #00f2fe;
          border-radius: 50%;
          margin-right: 6px;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeInOut {
          0%, 100% { background: rgba(255, 255, 255, 0.2); }
          50% { background: rgba(255, 255, 255, 0.3); }
        }

        .weather-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .weather-card {
          padding: 25px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .weather-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: inline-block;
          padding: 15px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .weather-card:hover .card-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .card-data {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 10px 0 5px;
          color: white;
          letter-spacing: -0.5px;
        }

        .card-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .trend-indicator {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .trend-indicator.increasing {
          color: #4ade80;
        }

        .trend-indicator.decreasing {
          color: #f87171;
        }

        .trend-indicator.stable {
          color: #fbbf24;
        }

        .rain-alert {
          background: linear-gradient(135deg, #ff4d4d 0%, #f9cb28 100%);
          color: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          animation: pulse 2s infinite;
          font-weight: 600;
          box-shadow: 0 10px 20px rgba(231, 76, 60, 0.3);
        }

        .alert-icon {
          font-size: 2rem;
          margin-right: 15px;
          animation: shake 1.5s infinite;
        }

        .alert-content {
          flex: 1;
        }

        .alert-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .alert-info {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .graphs-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 25px;
          margin: 30px 0;
        }

        .graph-section {
          width: 100%;
        }

        .graph-container {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .graph-container:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .humidity-graph {
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%);
        }

        .temperature-graph {
          background: linear-gradient(135deg, rgba(255, 154, 158, 0.2) 0%, rgba(250, 208, 196, 0.2) 100%);
        }

        .rain-graph {
          background: linear-gradient(135deg, rgba(161, 140, 209, 0.2) 0%, rgba(251, 194, 235, 0.2) 100%);
        }

        .graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .graph-header h3 {
          margin: 0;
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .current-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
          background: rgba(255, 255, 255, 0.2);
          padding: 5px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .weather-graph {
          width: 100%;
          height: 180px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.1);
        }

        .status-bar {
          display: flex;
          justify-content: space-between;
          padding: 20px;
          margin-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .sensor-status {
          display: flex;
          align-items: center;
        }

        .sensor-status::before {
          content: '•';
          font-size: 30px;
          margin-right: 8px;
        }

        .status-ok {
          color: #4ade80;
          font-weight: 600;
        }

        .status-error {
          color: #f87171;
          font-weight: 600;
        }

        .loading {
          text-align: center;
          padding: 80px;
          color: white;
          font-size: 1.2rem;
          position: relative;
        }

        .loading::after {
          content: '';
          width: 30px;
          height: 30px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          position: absolute;
          left: 50%;
          top: 120px;
          transform: translateX(-50%);
        }

        @keyframes spin {
          to { transform: translateX(-50%) rotate(360deg); }
        }

        .error {
          text-align: center;
          padding: 50px;
          color: #f87171;
          font-weight: 500;
          background: rgba(248, 113, 113, 0.1);
          border-radius: 12px;
          margin: 30px 0;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(255, 77, 77, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 77, 77, 0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: rotate(5deg); }
        }

        @media (max-width: 768px) {
          .weather-container {
            margin: 10px;
            padding: 20px;
          }
          
          .weather-cards {
            grid-template-columns: 1fr;
          }
          
          .status-bar {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .weather-graph {
            height: 150px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
        }

        @media (min-width: 1024px) {
          .graphs-container {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .graph-section:last-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
}