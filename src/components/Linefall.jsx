import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LineFallDetectionDashboard = () => {
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [voltageData, setVoltageData] = useState([]);
  const [currentVoltage, setCurrentVoltage] = useState(7.5);
  const [lineStatuses, setLineStatuses] = useState({
    button1: 'normal',
    button2: 'normal', 
    button3: 'normal',
    button4: 'normal'
  });
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [dataSource, setDataSource] = useState('Unknown');
  const [latestValues, setLatestValues] = useState({
    timestamp: new Date().toLocaleTimeString(),
    voltage: 7.5,
    button1: 'normal',
    button2: 'normal',
    button3: 'normal',
    button4: 'normal',
    lastButtonPressed: 'None',
    deviceId: 'Unknown',
    lastUpdated: new Date().toLocaleString()
  });

  // Extract sheet ID from your Google Sheets URL
  const SHEET_ID = '1-F7CH_R1rj2jpsjaqITktQ3j5iiTkhb_aqMnv9CmLnA';
  const SHEET_NAME = 'Sheet1'; // Change this to your actual sheet name
  
  // Function to fetch real data from Google Sheets
  const fetchGoogleSheetData = async () => {
    try {
      setConnectionStatus('Connecting to Google Sheet...');
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Sheet may not be public or accessible`);
      }
      
      const text = await response.text();
      
      // Parse the JSONP response
      const jsonData = JSON.parse(text.substring(47).slice(0, -2));
      
      if (jsonData.table && jsonData.table.rows && jsonData.table.rows.length > 0) {
        // Process the data - Get the LATEST ROW 
        const rows = jsonData.table.rows;
        const latestRow = rows[rows.length - 1]; // Always gets the most recent row
        
        setConnectionStatus('✅ Connected to Google Sheet');
        setDataSource('Google Sheet (Live Data)');
        
        const timestamp = latestRow.c[0]?.f || latestRow.c[0]?.v || new Date().toLocaleTimeString();
        const buttonPressed = latestRow.c[1]?.v?.toString() || ''; // "Button 1", "Button 2", etc.
        const deviceId = latestRow.c[2]?.v?.toString() || '';
        
        // Initialize all buttons as normal
        let buttonStatuses = {
          button1: 'normal',
          button2: 'normal',
          button3: 'normal',
          button4: 'normal'
        };
        
        // Check which button was pressed and set it to 'fault' (indicating activity)
        if (buttonPressed.includes('Button 1')) {
          buttonStatuses.button1 = 'fault';
        } else if (buttonPressed.includes('Button 2')) {
          buttonStatuses.button2 = 'fault';
        } else if (buttonPressed.includes('Button 3')) {
          buttonStatuses.button3 = 'fault';
        } else if (buttonPressed.includes('Button 4')) {
          buttonStatuses.button4 = 'fault';
        }
        
        const sheetData = {
          timestamp: timestamp,
          button1: buttonStatuses.button1,
          button2: buttonStatuses.button2,
          button3: buttonStatuses.button3,
          button4: buttonStatuses.button4,
          lastButtonPressed: buttonPressed,
          deviceId: deviceId
        };
        
        console.log(`✅ SUCCESS: Fetched REAL data from Google Sheet - Row ${rows.length}:`, sheetData);
        
        return sheetData;
      } else {
        throw new Error('No data found in Google Sheet');
      }
    } catch (error) {
      console.error('❌ ERROR: Could not fetch from Google Sheet:', error.message);
      setConnectionStatus('❌ Using Fallback Data - Check Sheet Permissions');
      setDataSource('Fallback (Not from Sheet)');
      
      // Fallback to prevent app crash
      return {
        timestamp: new Date().toLocaleTimeString(),
        button1: 'normal',
        button2: 'normal',
        button3: 'normal',
        button4: 'normal',
        lastButtonPressed: 'None',
        deviceId: 'Unknown'
      };
    }
  };

  // Generate initial voltage data for graph
  useEffect(() => {
    const generateInitialData = () => {
      const data = [];
      const now = new Date();
      
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 30000); // 30 seconds intervals
        data.push({
          time: time.toLocaleTimeString(),
          voltage: (7.0 + Math.random() * 1.0).toFixed(2),
        });
      }
      return data;
    };

    setVoltageData(generateInitialData());
  }, []);

  // Fetch data from Google Sheets and check for line faults
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch real button data from Google Sheets
      const sheetData = await fetchGoogleSheetData();
      
      // Generate voltage randomly between 7-8V (hardcoded, not from sheet)
      const randomVoltage = 7.0 + Math.random() * 1.0;
      setCurrentVoltage(randomVoltage);

      // Check for line faults from Google Sheet button data
      const newStatuses = {
        button1: sheetData.button1,
        button2: sheetData.button2,
        button3: sheetData.button3,
        button4: sheetData.button4
      };

      // Compare with previous statuses and trigger alerts for new faults
      Object.keys(newStatuses).forEach(buttonKey => {
        if (newStatuses[buttonKey] === 'fault' && lineStatuses[buttonKey] === 'normal') {
          const lineNumber = buttonKey.replace('button', '');
          setHighlightedButton(parseInt(lineNumber));
          // alert(`Line ${lineNumber} Fall Detection Alert! (Button ${lineNumber} fault detected in Google Sheet)`);
          
          // Auto-remove highlight after 5 seconds
          setTimeout(() => {
            setHighlightedButton(null);
          }, 5000);
        }
      });

      setLineStatuses(newStatuses);

      // Update latest values (buttons from sheet, voltage hardcoded)
      setLatestValues({
        timestamp: sheetData.timestamp,
        voltage: randomVoltage.toFixed(2),
        button1: sheetData.button1,
        button2: sheetData.button2,
        button3: sheetData.button3,
        button4: sheetData.button4,
        lastButtonPressed: sheetData.lastButtonPressed,
        deviceId: sheetData.deviceId,
        lastUpdated: new Date().toLocaleString()
      });

      // Add new data point to graph (hardcoded voltage)
      setVoltageData(prev => {
        const newData = [...prev];
        const now = new Date();
        newData.push({
          time: now.toLocaleTimeString(),
          voltage: randomVoltage.toFixed(2),
        });
        
        // Keep only last 20 data points
        if (newData.length > 20) {
          newData.shift();
        }
        
        return newData;
      });
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [lineStatuses]);

  const handleButtonClick = (lineNumber) => {
    // Manual check - simulate checking Google Sheet data for this specific button
    const currentStatus = lineStatuses[`button${lineNumber}`];
    if (currentStatus === 'fault') {
      setHighlightedButton(lineNumber);
      // alert(`Line ${lineNumber} Fall Detection Confirmed! (Button ${lineNumber} status from Google Sheet: FAULT)`);
    } else {
      // alert(`Line ${lineNumber} Status Check: NORMAL (Button ${lineNumber} from Google Sheet)`);
    }
    
    // Auto-remove highlight after 3 seconds for manual checks
    if (currentStatus === 'fault') {
      setTimeout(() => {
        setHighlightedButton(null);
      }, 3000);
    }
  };

  const buttonStyle = (lineNumber) => {
    const currentStatus = lineStatuses[`button${lineNumber}`];
    const isHighlighted = highlightedButton === lineNumber;
    const hasFault = currentStatus === 'fault';
    
    return {
      padding: '15px 30px',
      margin: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: '2px solid #333',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: hasFault ? '#ff4444' : '#f0f0f0',
      color: hasFault ? 'white' : '#333',
      boxShadow: hasFault ? '0 0 20px rgba(255, 68, 68, 0.6)' : '0 2px 4px rgba(0,0,0,0.1)',
      animation: isHighlighted ? 'pulse 1s infinite' : 'none',
    };
  };

  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  };

  const headerStyle = {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: 'bold',
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '30px',
  };

  const voltageDisplayStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
  };

  const voltageCardStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    minWidth: '200px',
  };

  const voltageValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c5aa0',
    margin: '10px 0',
  };

  const latestValuesStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    margin: '0 auto 30px auto',
    maxWidth: '800px',
  };

  const latestValuesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginTop: '15px',
  };

  const valueItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #e9ecef',
  };

  const labelStyle = {
    fontWeight: 'bold',
    color: '#495057',
  };

  const valueStyle = {
    color: '#007bff',
    fontWeight: 'bold',
  };

  const statusValueStyle = (status) => ({
    color: status === 'fault' ? '#dc3545' : '#28a745',
    fontWeight: 'bold',
  });

  const graphContainerStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    margin: '0 auto',
    maxWidth: '1200px',
  };

  const statusStyle = {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      
      <h1 style={headerStyle}>Line Fall Detection Monitoring System</h1>
      
      <div style={statusStyle}>
        <h3>System Status: {connectionStatus} | Data Source: {dataSource}</h3>
        <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
          <strong>📊 Connection Status:</strong> {connectionStatus}
          <br />
          <strong>📋 Button Data:</strong> {dataSource}
          <br />
          <strong>⚡ Voltage:</strong> Generated randomly (7.0V - 8.0V)
          <br />
          <br />
          <strong>🔧 SETUP REQUIRED if seeing "Fallback Data":</strong>
          <br />
          1. Open your Google Sheet: <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noopener noreferrer">Click here to open</a>
          <br />
          2. Click "Share" button → Change "Restricted" to "Anyone with the link" → Set to "Viewer"
          <br />
          3. Your current format is correct: Timestamp | Button X | ESP8266_BUTTON_LOGGER
          <br />
          4. Latest button pressed will trigger fall detection for that line
        </div>
      </div>

      <div style={buttonContainerStyle}>
        {[1, 2, 3, 4].map(lineNumber => {
          const currentStatus = lineStatuses[`button${lineNumber}`];
          return (
            <button
              key={lineNumber}
              style={buttonStyle(lineNumber)}
              onClick={() => handleButtonClick(lineNumber)}
            >
              Line {lineNumber}
              <div style={{fontSize: '12px', marginTop: '5px'}}>
                {currentStatus === 'fault' ? '⚠ FAULT DETECTED' : '✓ NORMAL'}
              </div>
              <div style={{fontSize: '10px', opacity: 0.8}}>
                (Button {lineNumber} from Sheet)
              </div>
            </button>
          );
        })}
      </div>

      <div style={voltageDisplayStyle}>
        <div style={voltageCardStyle}>
          <h3>System Voltage (Generated)</h3>
          <div style={voltageValueStyle}>
            {currentVoltage.toFixed(2)}V
          </div>
          <div style={{color: '#666', fontSize: '14px'}}>
            Range: 7.0V - 8.0V (Hardcoded)
          </div>
        </div>
      </div>

      <div style={latestValuesStyle}>
        <h3 style={{textAlign: 'center', marginBottom: '15px', color: '#333'}}>
          Latest Values: Buttons ({dataSource}) + Generated Voltage
        </h3>
        <div style={latestValuesGridStyle}>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Current Voltage (Generated):</span>
            <span style={valueStyle}>{latestValues.voltage}V</span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Last Button Pressed:</span>
            <span style={valueStyle}>{latestValues.lastButtonPressed}</span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Device ID:</span>
            <span style={valueStyle}>{latestValues.deviceId}</span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Timestamp (from Sheet):</span>
            <span style={valueStyle}>{latestValues.timestamp}</span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Button 1:</span>
            <span style={statusValueStyle(latestValues.button1)}>
              {latestValues.button1.toUpperCase()}
            </span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Button 2:</span>
            <span style={statusValueStyle(latestValues.button2)}>
              {latestValues.button2.toUpperCase()}
            </span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Button 3:</span>
            <span style={statusValueStyle(latestValues.button3)}>
              {latestValues.button3.toUpperCase()}
            </span>
          </div>
          <div style={valueItemStyle}>
            <span style={labelStyle}>Button 4:</span>
            <span style={statusValueStyle(latestValues.button4)}>
              {latestValues.button4.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#6c757d'}}>
          ESP8266 button data from Google Sheet | Voltage generated randomly | Last updated: {latestValues.lastUpdated}
        </div>
      </div>

      <div style={graphContainerStyle}>
        <h3 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>
          Real-time Voltage Monitoring
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={voltageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{fontSize: 12}}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[6.5, 8.5]}
              tick={{fontSize: 12}}
              label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [`${value}V`, 'System Voltage']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="voltage" 
              stroke="#8884d8" 
              strokeWidth={3}
              name="System Voltage"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{...statusStyle, marginTop: '20px'}}>
        <p style={{margin: '5px 0', fontSize: '14px', color: '#666'}}>
          • **Button Activity**: Reads latest row from your ESP8266 button logger data
          • **Fall Detection**: When new button press logged → triggers "Line X Fall Detection Alert!"
          • **Voltage**: Generated randomly between 7.0V - 8.0V (not from sheet)
          • **Real-time**: New button presses in your sheet trigger alerts within 3 seconds
        </p>
        <div style={{marginTop: '10px', fontSize: '12px', color: '#888'}}>
          Connection: {connectionStatus} | Last Check: {new Date().toLocaleTimeString()}
        </div>
        <div style={{marginTop: '10px', fontSize: '12px', color: dataSource.includes('Google Sheet') ? '#27ae60' : '#e74c3c'}}>
          <strong>{dataSource.includes('Google Sheet') ? '✅ LIVE DATA' : '❌ FALLBACK DATA'}</strong>: {dataSource.includes('Google Sheet') ? 'Successfully reading ESP8266 button data from your sheet!' : 'Not connected to sheet - check permissions!'}
        </div>
      </div>
    </div>
  );
};

export default LineFallDetectionDashboard;