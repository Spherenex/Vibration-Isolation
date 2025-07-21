import { useState, useEffect } from 'react';

// CSS styles
const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #1e1e2e;
  color: #cdd6f4;
}

header {
  background-color: #181825;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  text-align: center;
}

h1 {
  font-size: 28px;
  color: #89b4fa;
}

main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.control-section {
  background-color: #313244;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

h2 {
  color: #a6e3a1;
  margin-bottom: 15px;
  border-bottom: 1px solid #45475a;
  padding-bottom: 10px;
}

.status-display {
display: none;
  background-color: #11111b;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 16px;
}

.status-value {
  color: #f5c2e7;
  font-weight: bold;
}

.button-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-button {
  padding: 15px 25px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  min-width: 120px;
  text-transform: uppercase;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.control-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.forward-button {
  background-color: #a6e3a1;
  color: #1e1e2e;
}

.stop-button {
  background-color: #f38ba8;
  color: #1e1e2e;
}

.backward-button {
  background-color: #fab387;
  color: #1e1e2e;
}

.servo-button {
  background-color: #89b4fa;
  color: #1e1e2e;
}

footer {
display: none;
  background-color: #181825;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  color: #6c7086;
}

.warning {
  color: #f38ba8;
  margin-top: 5px;
  font-style: italic;
}

@media (max-width: 600px) {
  .button-container {
    flex-direction: column;
    align-items: center;
  }
  
  .control-button {
    width: 100%;
    max-width: 250px;
  }
}
`;

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const Dashboard = () => {
  const [driveStatus, setDriveStatus] = useState('');
  const [servoStatus, setServoStatus] = useState('');
  const [db, setDb] = useState(null);

  // Map position numbers to degree positions
  const servoPositionMap = {
    '0': '0°',
    '1': '45°', 
    '2': '90°',
    '3': '135°',
    '4': '180°'
  };

  useEffect(() => {
    // Firebase configuration
    const firebaseConfig = {
      // Using the correct URL format for Firebase RTDB in asia-southeast1 region
      databaseURL: 'https://smart-medicine-vending-machine-default-rtdb.asia-southeast1.firebasedatabase.app/'
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    setDb(database);

    // Listen for drive status changes
    const driveRef = ref(database, '10_self-balancing_bot/drive/status');
    onValue(driveRef, (snapshot) => {
      const data = snapshot.val();
      setDriveStatus(data);
    });

    // Listen for servo status changes
    const servoRef = ref(database, '10_self-balancing_bot/servo/status');
    onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      setServoStatus(data);
      console.log("Servo status from Firebase:", data); // Debug log
    });
  }, []);

  // Function to send drive commands
  const sendDriveCommand = (command) => {
    if (db) {
      const driveCommandRef = ref(db, '10_self-balancing_bot/drive/command');
      set(driveCommandRef, command)
        .then(() => {
          console.log(`Drive command ${command} sent successfully`);
        })
        .catch((error) => {
          console.error('Error sending drive command:', error);
        });
    }
  };

  // Function to send servo commands
  const sendServoCommand = (command) => {
    if (db) {
      const servoCommandRef = ref(db, '10_self-balancing_bot/servo/command');
      set(servoCommandRef, command)
        .then(() => {
          console.log(`Servo command ${command} sent successfully`);
        })
        .catch((error) => {
          console.error('Error sending servo command:', error);
        });
    }
  };

  return (
    <div>
      <style>{styles}</style>
      <div className="dashboard">
        <header>
          <h1>Self-Balancing Bot Control Dashboard</h1>
        </header>
        
        <main>
          <section className="control-section">
            <h2>Drive Controls</h2>
            <div className="status-display">
              <p>Current Status: <span className="status-value">{driveStatus}</span></p>
            </div>
            <div className="button-container">
              <button 
                className="control-button forward-button" 
                onClick={() => sendDriveCommand('F')}
              >
                Forward
              </button>
              <button 
                className="control-button stop-button" 
                onClick={() => sendDriveCommand('S')}
              >
                Stop
              </button>
              <button 
                className="control-button backward-button" 
                onClick={() => sendDriveCommand('B')}
              >
                Backward
              </button>
            </div>
          </section>

          <section className="control-section">
            <h2>Servo Controls</h2>
            <div className="status-display">
              <p>Current Status: <span className="status-value">
                {
                  (() => {
                    // Check if status is in "Position: X" format
                    if (typeof servoStatus === 'string' && servoStatus.startsWith('Position:')) {
                      const positionNumber = servoStatus.split(':')[1].trim();
                      return servoPositionMap[positionNumber] || positionNumber + '°';
                    }
                    return servoStatus;
                  })()
                }
              </span></p>
            </div>
            <div className="button-container">
              <button 
                className="control-button servo-button" 
                onClick={() => sendServoCommand('a')}
              >
                0°
              </button>
              <button 
                className="control-button servo-button" 
                onClick={() => sendServoCommand('b')}
              >
                45°
              </button>
              <button 
                className="control-button servo-button" 
                onClick={() => sendServoCommand('c')}
              >
                90°
              </button>
              <button 
                className="control-button servo-button" 
                onClick={() => sendServoCommand('d')}
              >
                135°
              </button>
              <button 
                className="control-button servo-button" 
                onClick={() => sendServoCommand('e')}
              >
                180°
              </button>
            </div>
          </section>
        </main>

        <footer>
          <p>Connected to: smart-medicine-vending-machine-default-rtdb.asia-southeast1.firebasedatabase.app</p>
          <p className="warning">Warning: Database is publicly accessible. Consider updating security rules.</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;