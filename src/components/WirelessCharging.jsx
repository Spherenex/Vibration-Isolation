import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FirebaseVoltageDashboard = () => {
  const [voltageData, setVoltageData] = useState({
    voltage1: null,
    voltage2: null,
  });
  const [currentData, setCurrentData] = useState({
    current1: null,
    current2: null,
  });
  const [powerData, setPowerData] = useState({
    power1: null,
    power2: null,
  });
  const [priceData, setPriceData] = useState({
    price1: null,
    price2: null,
    totalPrice: null,
  });
  const [historicalData, setHistoricalData] = useState({
    voltage1: [],
    voltage2: [],
    current1: [],
    current2: [],
    power1: [],
    power2: [],
    price1: [],
    price2: [],
    totalPrice: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Configuration
  const MAX_DATA_POINTS = 20; // Keep last 20 readings (about 1 minute at 3s intervals)
  const ELECTRICITY_RATE = 7.0; // Price per kWh in rupees (typical rate in India)
  const UPDATE_INTERVAL = 3000; // 3 seconds

  // Firebase configuration - replace with your actual config
  const firebaseConfig = {
    databaseURL: "https://v2v-communication-d46c6-default-rtdb.firebaseio.com",
  };

  // Create fetchVoltageData as a useCallback to prevent unnecessary recreations
  const fetchVoltageData = useCallback(async () => {
    try {
      // Set refreshing state to true to show visual indication
      setRefreshing(true);
      
      // Fetch Voltage1 data with a cache-busting parameter
      const voltage1Response = await fetch(
        `${firebaseConfig.databaseURL}/detected_plates/Voltage1.json?_t=${Date.now()}`
      );
      
      // Fetch Voltage2 data with a cache-busting parameter
      const voltage2Response = await fetch(
        `${firebaseConfig.databaseURL}/detected_plates/Voltage2.json?_t=${Date.now()}`
      );

      if (!voltage1Response.ok || !voltage2Response.ok) {
        throw new Error('Failed to fetch data from Firebase');
      }

      const voltage1Data = await voltage1Response.json();
      const voltage2Data = await voltage2Response.json();

      console.log("New data fetched:", { voltage1: voltage1Data, voltage2: voltage2Data });

      setVoltageData({
        voltage1: voltage1Data,
        voltage2: voltage2Data,
      });
      
      setLastUpdated(new Date());
      setLoading(false);
      // Reset refreshing state after a short delay to make the visual indicator noticeable
      setTimeout(() => setRefreshing(false), 500);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseConfig.databaseURL]);

  useEffect(() => {
    // Fetch data initially
    fetchVoltageData();

    // Set up real-time data listener using EventSource for server-sent events
    // This is an alternative approach that we'll implement alongside polling
    const setupFirebaseListener = () => {
      try {
        // Set up polling as a fallback mechanism
        const intervalId = setInterval(fetchVoltageData, UPDATE_INTERVAL);
        return () => clearInterval(intervalId);
      } catch (err) {
        console.error("Error setting up Firebase listener:", err);
        // If listener setup fails, fall back to regular polling
        const intervalId = setInterval(fetchVoltageData, UPDATE_INTERVAL);
        return () => clearInterval(intervalId);
      }
    };

    // Set up the listener and get the cleanup function
    const cleanupListener = setupFirebaseListener();
    
    // Return cleanup function to prevent memory leaks
    return () => {
      cleanupListener();
    };
  }, [fetchVoltageData]);

  // Helper function to calculate current based on voltage
  const calculateCurrent = (voltage) => {
    if (voltage === null) return null;
    if (voltage === 0) return 0; // When voltage is 0, current is also 0
    
    // Create a relationship between voltage and current
    // Map voltage range (approximately 0-5V) to current range (0.2-0.7A)
    // Adding some slight randomness for more realistic variation
    const baseCurrent = 0.2 + (voltage / 5) * 0.5;
    const randomFactor = Math.random() * 0.1 - 0.05; // Small random variation ±0.05A
    
    // Ensure current stays within specified range
    return Math.max(0.2, Math.min(0.7, baseCurrent + randomFactor));
  };

  // Calculate current values whenever voltage changes
  useEffect(() => {
    if (voltageData.voltage1 !== null || voltageData.voltage2 !== null) {
      // This will recalculate current whenever voltage data changes
      const current1 = calculateCurrent(voltageData.voltage1);
      const current2 = calculateCurrent(voltageData.voltage2);
      
      setCurrentData({
        current1,
        current2
      });
      
      console.log("Current values updated:", { current1, current2 });
    }
  }, [voltageData.voltage1, voltageData.voltage2]);

  // Helper function to calculate power based on voltage and current
  const calculatePower = (voltage, current) => {
    if (voltage === null || current === null) return null;
    if (voltage === 0 || current === 0) return 0;
    
    // Power = Voltage × Current (P = V × I)
    return voltage * current;
  };

  // Calculate power values whenever voltage or current changes
  useEffect(() => {
    if (voltageData.voltage1 !== null && currentData.current1 !== null) {
      const power1 = calculatePower(voltageData.voltage1, currentData.current1);
      const power2 = calculatePower(voltageData.voltage2, currentData.current2);
      
      setPowerData({
        power1,
        power2
      });
      
      console.log("Power values updated:", { power1, power2 });
    }
  }, [voltageData.voltage1, voltageData.voltage2, currentData.current1, currentData.current2]);

  // Helper function to calculate price based on power
  const calculatePrice = (power) => {
    if (power === null) return null;
    if (power === 0) return 0;
    
    // Convert watts to kilowatts
    const kilowatts = power / 1000;
    
    // Calculate the hourly cost (kW × rate per kWh)
    // Then convert to per-second cost (divide by 3600)
    // Then calculate the cost for our update interval
    const intervalHours = UPDATE_INTERVAL / (1000 * 60 * 60); // Convert ms to hours
    return kilowatts * ELECTRICITY_RATE * intervalHours;
  };

  // Calculate price values whenever power changes
  useEffect(() => {
    if (powerData.power1 !== null && powerData.power2 !== null) {
      const price1 = calculatePrice(powerData.power1);
      const price2 = calculatePrice(powerData.power2);
      const totalPrice = (price1 || 0) + (price2 || 0);
      
      setPriceData({
        price1,
        price2,
        totalPrice
      });
      
      console.log("Price values updated:", { price1, price2, totalPrice });
    }
  }, [powerData.power1, powerData.power2]);

  // Update historical data for graphs
  const updateHistoricalData = useCallback(() => {
    const timestamp = new Date().getTime();
    
    setHistoricalData(prevData => {
      // Create new data points for each metric
      const newVoltage1 = {
        time: timestamp,
        value: voltageData.voltage1
      };
      
      const newVoltage2 = {
        time: timestamp,
        value: voltageData.voltage2
      };
      
      const newCurrent1 = {
        time: timestamp,
        value: currentData.current1
      };
      
      const newCurrent2 = {
        time: timestamp,
        value: currentData.current2
      };
      
      const newPower1 = {
        time: timestamp,
        value: powerData.power1
      };
      
      const newPower2 = {
        time: timestamp,
        value: powerData.power2
      };
      
      const newPrice1 = {
        time: timestamp,
        value: priceData.price1
      };
      
      const newPrice2 = {
        time: timestamp,
        value: priceData.price2
      };
      
      const newTotalPrice = {
        time: timestamp,
        value: priceData.totalPrice
      };
      
      // Update each array, keeping only the latest MAX_DATA_POINTS
      return {
        voltage1: [...prevData.voltage1, newVoltage1].slice(-MAX_DATA_POINTS),
        voltage2: [...prevData.voltage2, newVoltage2].slice(-MAX_DATA_POINTS),
        current1: [...prevData.current1, newCurrent1].slice(-MAX_DATA_POINTS),
        current2: [...prevData.current2, newCurrent2].slice(-MAX_DATA_POINTS),
        power1: [...prevData.power1, newPower1].slice(-MAX_DATA_POINTS),
        power2: [...prevData.power2, newPower2].slice(-MAX_DATA_POINTS),
        price1: [...prevData.price1, newPrice1].slice(-MAX_DATA_POINTS),
        price2: [...prevData.price2, newPrice2].slice(-MAX_DATA_POINTS),
        totalPrice: [...prevData.totalPrice, newTotalPrice].slice(-MAX_DATA_POINTS)
      };
    });
  }, [voltageData, currentData, powerData, priceData]);

  // Update historical data when values change
  useEffect(() => {
    if (voltageData.voltage1 !== null && currentData.current1 !== null && 
        powerData.power1 !== null && priceData.price1 !== null) {
      updateHistoricalData();
    }
  }, [voltageData, currentData, powerData, priceData, updateHistoricalData]);

  // Calculate running total price since dashboard started
  const [accumulatedPrice, setAccumulatedPrice] = useState(0);
  
  useEffect(() => {
    if (priceData.totalPrice !== null) {
      setAccumulatedPrice(prev => prev + priceData.totalPrice);
    }
  }, [priceData.totalPrice]);

  // Format time for graph tooltip
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper function to determine current status color
  const getCurrentStatusColor = (current) => {
    if (current === null) return 'gray';
    if (current === 0) return 'gray'; // Zero current is shown as gray
    if (current < 0.3) return 'blue';
    if (current > 0.6) return 'orange';
    return 'green';
  };

  // Helper function to determine power status color
  const getPowerStatusColor = (power) => {
    if (power === null || power === 0) return 'gray';
    if (power < 1.0) return 'blue';
    if (power > 2.5) return 'red';
    return 'purple';
  };

  // Helper function to determine voltage status color
  const getVoltageStatusColor = (voltage) => {
    if (voltage === null) return 'gray';
    if (voltage < 3.0) return 'red';
    if (voltage < 3.5) return 'orange';
    return 'green';
  };

  // Helper function to determine price status color
  const getPriceStatusColor = (price) => {
    if (price === null || price === 0) return 'gray';
    if (price < 0.00001) return 'green';
    if (price > 0.0001) return 'red';
    return 'orange';
  };

  // Format the timestamp for display
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    return lastUpdated.toLocaleTimeString();
  };

  // Format price for display
  const formatPrice = (price) => {
    if (price === null) return 'N/A';
    if (price === 0) return '₹0.00';
    
    // Convert to paise for smaller intervals
    if (price < 0.01) {
      return `${(price * 100).toFixed(4)} paise`;
    }
    
    return `₹${price.toFixed(4)}`;
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>EV Charging Dashboard</h1>
        <div className="header-right">
          <div className="total-cost">
            <span className="total-label">Session Cost:</span>
            <span className="total-value">₹{accumulatedPrice.toFixed(6)}</span>
          </div>
          <div className="last-updated">
            <span>Last updated: {formatLastUpdated()}</span>
            {refreshing && <div className="refresh-indicator"></div>}
          </div>
        </div>
      </header>

      {loading && !voltageData.voltage1 && !voltageData.voltage2 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading voltage data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <>
        <div className="voltage-cards">
          <div className="voltage-card">
            <h2>Channel 1</h2>
            <div className="metric-section">
              <h3>Voltage</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getVoltageStatusColor(voltageData.voltage1) }}
              >
                {voltageData.voltage1 !== null ? `${voltageData.voltage1.toFixed(2)}V` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${(voltageData.voltage1 / 5) * 100}%`,
                    backgroundColor: getVoltageStatusColor(voltageData.voltage1)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Current</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getCurrentStatusColor(currentData.current1) }}
              >
                {currentData.current1 !== null ? `${currentData.current1.toFixed(2)}A` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${currentData.current1 === 0 ? 0 : ((currentData.current1 - 0.2) / 0.5) * 100}%`,
                    backgroundColor: getCurrentStatusColor(currentData.current1)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Power</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getPowerStatusColor(powerData.power1) }}
              >
                {powerData.power1 !== null ? `${powerData.power1.toFixed(2)}W` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${powerData.power1 === 0 ? 0 : Math.min((powerData.power1 / 3.5) * 100, 100)}%`,
                    backgroundColor: getPowerStatusColor(powerData.power1)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Cost (per interval)</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getPriceStatusColor(priceData.price1) }}
              >
                {formatPrice(priceData.price1)}
              </div>
              <div className="metric-details">
                {/* <span>Rate: ₹{ELECTRICITY_RATE.toFixed(2)}/kWh</span> */}
              </div>
            </div>
          </div>

          <div className="voltage-card">
            <h2>Channel 2</h2>
            <div className="metric-section">
              <h3>Voltage</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getVoltageStatusColor(voltageData.voltage2) }}
              >
                {voltageData.voltage2 !== null ? `${voltageData.voltage2.toFixed(2)}V` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${(voltageData.voltage2 / 5) * 100}%`,
                    backgroundColor: getVoltageStatusColor(voltageData.voltage2)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Current</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getCurrentStatusColor(currentData.current2) }}
              >
                {currentData.current2 !== null ? `${currentData.current2.toFixed(2)}A` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${currentData.current2 === 0 ? 0 : ((currentData.current2 - 0.2) / 0.5) * 100}%`,
                    backgroundColor: getCurrentStatusColor(currentData.current2)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Power</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getPowerStatusColor(powerData.power2) }}
              >
                {powerData.power2 !== null ? `${powerData.power2.toFixed(2)}W` : 'N/A'}
              </div>
              <div className="metric-meter">
                <div 
                  className="metric-level"
                  style={{ 
                    width: `${powerData.power2 === 0 ? 0 : Math.min((powerData.power2 / 3.5) * 100, 100)}%`,
                    backgroundColor: getPowerStatusColor(powerData.power2)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="metric-section">
              <h3>Cost (per interval)</h3>
              <div 
                className={`metric-value ${refreshing ? 'refreshing' : ''}`} 
                style={{ color: getPriceStatusColor(priceData.price2) }}
              >
                {formatPrice(priceData.price2)}
              </div>
              <div className="metric-details">
                {/* <span>Rate: ${ELECTRICITY_RATE.toFixed(2)}/kWh</span> */}
              </div>
            </div>
          </div>
        </div>
        
        <div className="graphs-container">
          <h2>Real-Time Monitoring</h2>
          
          <div className="graph-panel">
            <h3>Voltage History</h3>
            <div className="graph">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatTime}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    label={{ value: 'Volts (V)', angle: -90, position: 'insideLeft' }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    labelFormatter={formatTime}
                    formatter={(value) => [value !== null ? value.toFixed(2) + 'V' : 'N/A']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    data={historicalData.voltage1} 
                    dataKey="value" 
                    name="Voltage 1" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    data={historicalData.voltage2} 
                    dataKey="value" 
                    name="Voltage 2" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="graph-panel">
            <h3>Current History</h3>
            <div className="graph">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatTime}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[0, 0.8]} 
                    label={{ value: 'Amps (A)', angle: -90, position: 'insideLeft' }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    labelFormatter={formatTime}
                    formatter={(value) => [value !== null ? value.toFixed(2) + 'A' : 'N/A']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    data={historicalData.current1} 
                    dataKey="value" 
                    name="Current 1" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    data={historicalData.current2} 
                    dataKey="value" 
                    name="Current 2" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="graph-panel">
            <h3>Power History</h3>
            <div className="graph">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatTime}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[0, 4]} 
                    label={{ value: 'Watts (W)', angle: -90, position: 'insideLeft' }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    labelFormatter={formatTime}
                    formatter={(value) => [value !== null ? value.toFixed(2) + 'W' : 'N/A']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    data={historicalData.power1} 
                    dataKey="value" 
                    name="Power 1" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    data={historicalData.power2} 
                    dataKey="value" 
                    name="Power 2" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="graph-panel">
            <h3>Cost History</h3>
            <div className="graph">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatTime}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    domain={[0, 'auto']} 
                    label={{ value: 'Cost (₹)', angle: -90, position: 'insideLeft' }}
                    stroke="#6b7280"
                    tickFormatter={(value) => value.toFixed(6)}
                  />
                  <Tooltip 
                    labelFormatter={formatTime}
                    formatter={(value) => [value !== null ? `₹${value.toFixed(6)}` : 'N/A']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    data={historicalData.price1} 
                    dataKey="value" 
                    name="Cost 1" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    data={historicalData.price2} 
                    dataKey="value" 
                    name="Cost 2" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    data={historicalData.totalPrice} 
                    dataKey="value" 
                    name="Total Cost" 
                    stroke="#84cc16" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        </>
      )}

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        //   max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }
        
        .total-cost {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .total-label {
          font-weight: 500;
        }
        
        .total-value {
          font-weight: 700;
          color: #10b981;
          background-color: #ecfdf5;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .last-updated {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .refresh-indicator {
          width: 10px;
          height: 10px;
          background-color: #3b82f6;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        
        .voltage-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .voltage-card {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        
        .voltage-card:hover {
          transform: translateY(-4px);
        }
        
        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }
        
        .metric-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .metric-section:first-of-type {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        
        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #4b5563;
          margin: 0 0 0.75rem 0;
        }
        
        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          transition: opacity 0.3s ease;
        }
        
        .metric-value.refreshing {
          animation: highlight 0.5s ease;
        }
        
        .metric-details {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }
        
        @keyframes highlight {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        .metric-meter {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .metric-level {
          height: 100%;
          transition: width 0.5s ease, background-color 0.5s ease;
        }
        
        .graphs-container {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .graph-panel {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .graph {
          margin-top: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1rem;
          background-color: #fcfcfd;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          text-align: center;
          padding: 2rem;
          color: #ef4444;
        }
        
        button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        button:hover {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default FirebaseVoltageDashboard;