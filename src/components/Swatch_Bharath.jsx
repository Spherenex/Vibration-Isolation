import { useState, useEffect } from 'react';

// Simple Firebase-like interface for Firebase RTDB
const ControlDashboard = () => {
  // State for each control
  const [spray, setSpray] = useState("0");
  const [vacuumCleaner, setVacuumCleaner] = useState("0");
  const [wiper, setWiper] = useState("0");
  const [servoCommands, setServoCommands] = useState("S2,120");
  const [connectionStatus, setConnectionStatus] = useState("initializing");
  const [connectionError, setConnectionError] = useState(null);
  
  // State for servo settings
  const [servoNumber, setServoNumber] = useState(2);
  const [servoPosition, setServoPosition] = useState(120);
  
  // Firebase URL
  const firebaseUrl = "https://pick-and-place-50d64-default-rtdb.firebaseio.com";
  
  // Function to fetch data from Firebase
  const fetchFromFirebase = async (path) => {
    try {
      const response = await fetch(`${firebaseUrl}/${path}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      setConnectionError(`Failed to fetch ${path}: ${error.message}`);
      return null;
    }
  };
  
  // Function to update data in Firebase
  const updateFirebase = async (path, value) => {
    try {
      setConnectionStatus("updating");
      const response = await fetch(`${firebaseUrl}/${path}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error(`Error updating ${path}:`, error);
      setConnectionError(`Failed to update ${path}: ${error.message}`);
      setConnectionStatus("error");
      return false;
    }
  };
  
  // Initialize connection and fetch initial data
  useEffect(() => {
    const fetchAllData = async () => {
      setConnectionStatus("connecting");
      try {
        // Fetch all controls
        const sprayData = await fetchFromFirebase("Spray");
        if (sprayData !== null) setSpray(sprayData);
        
        const vacuumData = await fetchFromFirebase("Vacuum_Cleaner");
        if (vacuumData !== null) setVacuumCleaner(vacuumData);
        
        const wiperData = await fetchFromFirebase("Wiper");
        if (wiperData !== null) setWiper(wiperData);
        
        const servoData = await fetchFromFirebase("ServoCommands");
        if (servoData !== null) {
          setServoCommands(servoData);
          // Parse servo command to update UI
          try {
            const cmdParts = servoData.split(',');
            if (cmdParts.length === 2) {
              const servoNum = parseInt(cmdParts[0].substring(1));
              const servoPos = parseInt(cmdParts[1]);
              if (!isNaN(servoNum) && !isNaN(servoPos)) {
                setServoNumber(servoNum);
                setServoPosition(servoPos);
              }
            }
          } catch (e) {
            console.error("Error parsing servo command:", e);
          }
        }
        
        setConnectionStatus("connected");
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setConnectionStatus("error");
        setConnectionError(`Failed to connect: ${error.message}`);
      }
    };
    
    fetchAllData();
  }, []);
  
  // Updated Toggle functions to explicitly send "1" for ON and "0" for OFF
  const toggleSpray = async () => {
    const newValue = spray === "1" ? "0" : "1"; // If currently "1", set to "0", otherwise set to "1"
    setSpray(newValue); // Update UI immediately for responsiveness
    const success = await updateFirebase("Relay/Spray", newValue);
    if (!success) setSpray(spray); // Revert if failed
  };
  
  const toggleVacuum = async () => {
    const newValue = vacuumCleaner === "1" ? "0" : "1"; // If currently "1", set to "0", otherwise set to "1"
    setVacuumCleaner(newValue);
    const success = await updateFirebase("Relay/Vacuum_Cleaner", newValue);
    if (!success) setVacuumCleaner(vacuumCleaner);
  };
  
  const toggleWiper = async () => {
    const newValue = wiper === "1" ? "0" : "1"; // If currently "1", set to "0", otherwise set to "1"
    setWiper(newValue);
    const success = await updateFirebase("Relay/Wiper", newValue);
    if (!success) setWiper(wiper);
  };
  
  const updateServo = async () => {
    const newCommand = `S${servoNumber},${servoPosition}`;
    setServoCommands(newCommand);
    const success = await updateFirebase("ServoCommands", newCommand);
    if (!success) setServoCommands(servoCommands);
  };
  
  // CSS styles inline to avoid any import issues
  const styles = {
    dashboard: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      color: '#333',
      textAlign: 'center',
      marginBottom: '30px',
      borderBottom: '2px solid #ddd',
      paddingBottom: '10px',
    },
    section: {
      marginBottom: '30px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    sectionHeader: {
      color: '#444',
      marginBottom: '20px',
    },
    controlGroup: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px',
    },
    controlItem: {
      flex: 1,
      minWidth: '200px',
      textAlign: 'center',
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    controlTitle: {
      color: '#555',
      marginBottom: '10px',
    },
    statusIndicator: (isOn) => ({
      fontSize: '18px',
      fontWeight: 'bold',
      padding: '8px',
      margin: '10px 0',
      borderRadius: '5px',
      backgroundColor: isOn ? '#d4f7d4' : '#ffebee',
      color: isOn ? '#2e7d32' : '#c62828',
    }),
    button: (isOn) => ({
      padding: '12px 24px',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: isOn ? '#f44336' : '#4caf50',
      color: 'white',
    }),
    servoControl: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    servoInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    servoCommand: {
      fontFamily: 'monospace',
      fontSize: '18px',
      backgroundColor: '#f0f0f0',
      padding: '10px 15px',
      borderRadius: '5px',
      border: '1px solid #ddd',
    },
    servoInputs: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      alignItems: 'flex-end',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    label: {
      fontWeight: 'bold',
      color: '#555',
    },
    input: {
      padding: '10px',
      fontSize: '16px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      width: '80px',
    },
    slider: {
      width: '180px',
      height: '15px',
      marginTop: '10px',
    },
    updateButton: {
      padding: '12px 24px',
      backgroundColor: '#2196f3',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    connectionInfo: {
      marginTop: '20px',
      textAlign: 'center',
    },
    connectionStatus: (status) => {
      let color = '#777';
      let bgColor = '#f5f5f5';
      
      if (status === 'connected') {
        color = '#2e7d32';
        bgColor = '#e8f5e9';
      } else if (status === 'error') {
        color = '#c62828';
        bgColor = '#ffebee';
      } else if (status === 'connecting' || status === 'updating') {
        color = '#f57f17';
        bgColor = '#fff8e1';
      }
      
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: bgColor,
        color: color,
      };
    },
    statusDot: (status) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: 
        status === 'connected' ? '#2e7d32' : 
        status === 'error' ? '#c62828' : 
        status === 'connecting' || status === 'updating' ? '#f57f17' : 
        '#777',
    }),
    spinner: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #f57f17',
      animation: 'spin 1s linear infinite',
    },
    errorMessage: {
      color: '#c62828',
      backgroundColor: '#ffebee',
      padding: '10px',
      borderRadius: '5px',
      marginTop: '10px',
      textAlign: 'left',
    },
  };
  
  // Keyframes for spinner animation
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  const isConnected = connectionStatus === 'connected';
  const isLoading = connectionStatus === 'connecting' || connectionStatus === 'updating';
  
  return (
    <div style={styles.dashboard}>
      <style>{spinnerStyle}</style>
      <h1 style={styles.header}>Control Dashboard</h1>
      
      {isLoading && (
        <div style={styles.connectionStatus('connecting')}>
          <div style={styles.spinner}></div>
          <p>{connectionStatus === 'connecting' ? 'Connecting to Firebase...' : 'Updating...'}</p>
        </div>
      )}
      
      {connectionError && (
        <div style={styles.errorMessage}>
          {connectionError}
        </div>
      )}
      
      <div style={styles.section}>
        <h2 style={styles.sectionHeader}>Basic Controls</h2>
        
        <div style={styles.controlGroup}>
          <div style={styles.controlItem}>
            <h3 style={styles.controlTitle}>Spray</h3>
            <div style={styles.statusIndicator(spray === "1")}>
              {spray === "1" ? "ON" : "OFF"}
            </div>
            <button 
              style={styles.button(spray === "1")}
              onClick={toggleSpray}
              disabled={!isConnected}
            >
              {spray === "0" ? "Turn On" : "Turn Off"}
            </button>
          </div>
          
          <div style={styles.controlItem}>
            <h3 style={styles.controlTitle}>Vacuum Cleaner</h3>
            <div style={styles.statusIndicator(vacuumCleaner === "1")}>
              {vacuumCleaner === "1" ? "ON" : "OFF"}
            </div>
            <button 
              style={styles.button(vacuumCleaner === "1")}
              onClick={toggleVacuum}
              disabled={!isConnected}
            >
              {vacuumCleaner === "0" ? "Turn On" : "Turn Off"}
            </button>
          </div>
          
          <div style={styles.controlItem}>
            <h3 style={styles.controlTitle}>Wiper</h3>
            <div style={styles.statusIndicator(wiper === "1")}>
              {wiper === "1" ? "ON" : "OFF"}
            </div>
            <button 
              style={styles.button(wiper === "1")}
              onClick={toggleWiper}
              disabled={!isConnected}
            >
              {wiper === "0" ? "Turn On" : "Turn Off"}
            </button>
          </div>
        </div>
      </div>
      
      <div style={styles.section}>
        <h2 style={styles.sectionHeader}>Servo Controls</h2>
        <div style={styles.servoControl}>
          <div style={styles.servoInfo}>
            <h3 style={styles.controlTitle}>Current Command:</h3>
            <div style={styles.servoCommand}>{servoCommands}</div>
          </div>
          
          <div style={styles.servoInputs}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="servo-number">Servo Number:</label>
              <input 
                id="servo-number"
                style={styles.input}
                type="number" 
                min="1" 
                max="6" 
                value={servoNumber}
                onChange={(e) => setServoNumber(parseInt(e.target.value) || 1)}
                disabled={!isConnected}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="servo-position">Position:</label>
              <input 
                id="servo-position"
                style={styles.input}
                type="number" 
                min="0" 
                max="180" 
                value={servoPosition}
                onChange={(e) => setServoPosition(parseInt(e.target.value) || 0)}
                disabled={!isConnected}
              />
              <div>
                <input 
                  type="range" 
                  min="0" 
                  max="180" 
                  value={servoPosition}
                  style={styles.slider}
                  onChange={(e) => setServoPosition(parseInt(e.target.value))}
                  disabled={!isConnected}
                />
              </div>
            </div>
            
            <button 
              style={styles.updateButton}
              onClick={updateServo}
              disabled={!isConnected}
            >
              Update Servo
            </button>
          </div>
        </div>
      </div>
      
      <div style={styles.connectionInfo}>
        <div style={styles.connectionStatus(connectionStatus)}>
          <span style={styles.statusDot(connectionStatus)}></span>
          <p>
            {connectionStatus === 'connected' ? 'Connected to' : 
             connectionStatus === 'error' ? 'Error connecting to' :
             'Connecting to'}: https://pick-and-place-50d64-default-rtdb.firebaseio.com/
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlDashboard;