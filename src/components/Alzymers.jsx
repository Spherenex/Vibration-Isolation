// import { useState, useEffect } from "react";

// // Import Firebase (uncomment when implementing)
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, off } from "firebase/database";

// const Dashboard = () => {
//     // State to store the fetched data
//     const [data, setData] = useState({
//         ecgValue: 0,
//         heartRate: 0,
//         humidity: 0,
//         spo2: 0,
//         temperature: 0,
//         alertMessage: "",
//         ecgAbnormal: false,
//         hrAlert: false,
//         spo2Alert: false,
//         tempAlert: false,
//         isAlertActive: false,
//         fallDetected: false
//     });

//     // State for loading and error handling
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         //  REAL-TIME FIREBASE IMPLEMENTATION (uncomment and configure to use)

//         // Firebase configuration - replace with your project settings
//         const firebaseConfig = {
//             apiKey: "AIzaSyAhLCi6JBT5ELkAFxTplKBBDdRdpATzQxI",
//             authDomain: "smart-medicine-vending-machine.firebaseapp.com",
//             databaseURL: "https://smart-medicine-vending-machine-default-rtdb.asia-southeast1.firebasedatabase.app",
//             projectId: "smart-medicine-vending-machine",
//             storageBucket: "smart-medicine-vending-machine.firebasestorage.app",
//             messagingSenderId: "705021997077",
//             appId: "1:705021997077:web:5af9ec0b267e597e1d5e1c",
//             measurementId: "G-PH0XLJSYVS"

//         };

//         // Initialize Firebase
//         const app = initializeApp(firebaseConfig);
//         const db = getDatabase(app);
//         const dataRef = ref(db, "8_Smart_Assistive_Alzymers");

//         // Set up real-time listener
//         onValue(dataRef, (snapshot) => {
//             const fetchedData = snapshot.val();
//             if (fetchedData) {
//                 setData({
//                     ecgValue: fetchedData.ecgValue || 0,
//                     heartRate: fetchedData.heartRate || 0,
//                     humidity: fetchedData.humidity || 0,
//                     spo2: fetchedData.spo2 || 0,
//                     temperature: fetchedData.temperature || 0,
//                     alertMessage: fetchedData.alertMessage || "",
//                     ecgAbnormal: fetchedData.ecgAbnormal || false,
//                     hrAlert: fetchedData.hrAlert || false,
//                     spo2Alert: fetchedData.spo2Alert || false,
//                     tempAlert: fetchedData.tempAlert || false,
//                     isAlertActive: fetchedData.isAlertActive || false,
//                     fallDetected: fetchedData.fallDetected || false
//                 });
//             }
//             setLoading(false);
//         }, (error) => {
//             console.error("Error fetching data:", error);
//             setError("Failed to fetch data from Firebase: " + error.message);
//             setLoading(false);
//         });

//         // Cleanup function to detach listener when component unmounts
//         return () => {
//             off(dataRef);
//         };

//         // FOR DEMO ONLY - Mock data implementation (remove when using Firebase)
//         const mockDataFetch = async () => {
//             try {
//                 // Simulating API fetch delay
//                 await new Promise(resolve => setTimeout(resolve, 1000));

//                 // Sample data from screenshot
//                 const responseData = {
//                     alertMessage: "🌡 LOW TEMP!",
//                     ecgValue: 468,
//                     ecgAbnormal: false,
//                     heartRate: 74,
//                     hrAlert: false,
//                     humidity: 61,
//                     spo2: 96,
//                     spo2Alert: false,
//                     temperature: 30.5,
//                     tempAlert: true,
//                     isAlertActive: true,
//                     fallDetected: false
//                 };

//                 setData(responseData);
//                 setLoading(false);
//             } catch (err) {
//                 console.error("Error fetching mock data:", err);
//                 setError("Failed to fetch data. Please try again later.");
//                 setLoading(false);
//             }
//         };

//         mockDataFetch();
//     }, []);

//     // Function to determine status text based on alert boolean
//     const getStatusText = (isAlert) => {
//         return isAlert ? "Abnormal" : "Normal";
//     };

//     // Function to determine status class based on alert boolean
//     const getStatusClass = (isAlert) => {
//         return isAlert ? "status-abnormal" : "status-normal";
//     };

//     if (loading) {
//         return <div className="loading">Loading dashboard data...</div>;
//     }

//     if (error) {
//         return <div className="error">{error}</div>;
//     }

//     return (
//         <div className="dashboard">
//             <header className="dashboard-header">
//                 <h1>Medical Monitoring Dashboard</h1>
//                 <div className="alerts-container">
//                     {data.isAlertActive && (
//                         <div className="alert-banner">
//                             <div className="alert-icon-wrapper">
//                                 <span className="alert-icon">⚠️</span>
//                             </div>
//                             <div className="alert-content">
//                                 <span className="alert-title">ALERT</span>
//                                 <span className="alert-message">{data.alertMessage}</span>
//                             </div>
//                             <button className="alert-action">Acknowledge</button>
//                         </div>
//                     )}
//                     {data.fallDetected && (
//                         <div className="alert-banner critical">
//                             <div className="alert-icon-wrapper critical">
//                                 <span className="alert-icon">🚨</span>
//                             </div>
//                             <div className="alert-content">
//                                 <span className="alert-title">EMERGENCY</span>
//                                 <span className="alert-message">FALL DETECTED - IMMEDIATE ATTENTION REQUIRED</span>
//                             </div>
//                             <button className="alert-action critical">Respond</button>
//                         </div>
//                     )}
//                 </div>
//             </header>

//             <div className="cards-container">
//                 {/* ECG Card */}
//                 <div className={`card ${data.ecgAbnormal ? 'abnormal' : ''}`}>
//                     <div className="card-header">
//                         <h2>ECG</h2>
//                         <div className={`status-indicator ${getStatusClass(data.ecgAbnormal)}`}>
//                             {getStatusText(data.ecgAbnormal)}
//                         </div>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric">
//                             <span className="value">{data.ecgValue}</span>
//                             <span className="unit">mV</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Heart Rate Card */}
//                 <div className={`card ${data.hrAlert ? 'abnormal' : ''}`}>
//                     <div className="card-header">
//                         <h2>Heart Rate</h2>
//                         <div className={`status-indicator ${getStatusClass(data.hrAlert)}`}>
//                             {getStatusText(data.hrAlert)}
//                         </div>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric">
//                             <span className="value">{data.heartRate}</span>
//                             <span className="unit">BPM</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* SPO2 Card */}
//                 <div className={`card ${data.spo2Alert ? 'abnormal' : ''}`}>
//                     <div className="card-header">
//                         <h2>Blood Oxygen</h2>
//                         <div className={`status-indicator ${getStatusClass(data.spo2Alert)}`}>
//                             {getStatusText(data.spo2Alert)}
//                         </div>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric">
//                             <span className="value">{data.spo2}</span>
//                             <span className="unit">%</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Temperature Card */}
//                 <div className={`card ${data.tempAlert ? 'abnormal' : ''}`}>
//                     <div className="card-header">
//                         <h2>Temperature</h2>
//                         <div className={`status-indicator ${getStatusClass(data.tempAlert)}`}>
//                             {getStatusText(data.tempAlert)}
//                         </div>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric">
//                             <span className="value">{data.temperature}</span>
//                             <span className="unit">°C</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Humidity Card */}
//                 <div className="card">
//                     <div className="card-header">
//                         <h2>Humidity</h2>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric">
//                             <span className="value">{data.humidity}</span>
//                             <span className="unit">%</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Fall Detection Card */}
//                 <div className={`card ${data.fallDetected ? 'fall-card' : ''}`}>
//                     <div className="card-header">
//                         <h2>Fall Detection</h2>
//                         <div className={`status-indicator ${data.fallDetected ? 'status-critical' : 'status-normal'}`}>
//                             {data.fallDetected ? 'Fall Detected' : 'No Fall Detected'}
//                         </div>
//                     </div>
//                     <div className="card-body">
//                         <div className="metric fall-status">
//                             {data.fallDetected ? (
//                                 <div className="emergency-container">
//                                     <div className="emergency-icon">🚨</div>
//                                     <div className="emergency-message">Patient Fall Detected</div>
//                                     <div className="emergency-action">
//                                         <button className="action-button">Call Caregiver</button>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="normal-status">
//                                     <div className="status-icon">✓</div>
//                                     <div className="status-message">Patient Status Normal</div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Real-time connection indicator */}
//             <div className="realtime-indicator">
//                 <div className="realtime-dot"></div>
//                 <span>Real-time connection active</span>
//             </div>

//             {/* Firebase Implementation Guide */}
            
//         </div>
//     );
// };

// // Add CSS styling
// const style = document.createElement("style");
// style.textContent = `
//   * {
//     box-sizing: border-box;
//     margin: 0;
//     padding: 0;
//     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//   }

//   body {
//     background-color: #f5f5f5;
//   }

//   .dashboard {
//     padding: 20px;
//     max-width: 1200px;
//     margin: 0 auto;
//   }

//   .dashboard-header {
//     display: flex;
//     flex-direction: column;
//     margin-bottom: 30px;
//     padding-bottom: 15px;
//     border-bottom: 1px solid #e0e0e0;
//   }

//   .dashboard-header h1 {
//     color: #333;
//     font-size: 28px;
//     margin-bottom: 15px;
//   }
  
//   .alerts-container {
//     display: flex;
//     flex-direction: column;
//     gap: 10px;
//     width: 100%;
//   }

//   .alert-banner {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     background-color: #fff;
//     border-radius: 8px;
//     overflow: hidden;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//     border-left: 4px solid #ff9800;
//     width: 100%;
//   }
  
//   .alert-banner.critical {
//     border-left: 4px solid #d50000;
//     background-color: rgba(213, 0, 0, 0.05);
//   }
  
//   .alert-icon-wrapper {
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     background-color: #ff9800;
//     color: white;
//     width: 100%;
//     height: 60px;
//     flex-shrink: 0;
//   }
  
//   .alert-icon-wrapper.critical {
//     background-color: #d50000;
//     animation: flash 1s infinite;
//   }
  
//   @keyframes flash {
//     0% { opacity: 1; }
//     50% { opacity: 0.7; }
//     100% { opacity: 1; }
//   }
  
//   .alert-icon {
//     font-size: 24px;
//   }
  
//   .alert-content {
//   width: 100%;
//     padding: 12px 15px;
//     flex-grow: 1;
//     display: flex;
//     flex-direction: column;
//   }
  
//   .alert-title {
//     font-weight: 700;
//     font-size: 14px;
//     color: #555;
//     margin-bottom: 4px;
//     letter-spacing: 0.5px;
//   }
  
//   .critical .alert-title {
//     color: #d50000;
//   }
  
//   .alert-message {
//     font-size: 16px;
//     color: #333;
//     font-weight: 500;
//   }
  
//   .critical .alert-message {
//     font-weight: 600;
//   }
  
//   .alert-action {
//     margin-right: 15px;
//     background-color: transparent;
//     border: 1px solid #ff9800;
//     color: #ff9800;
//     border-radius: 4px;
//     font-weight: 600;
//     cursor: pointer;
//     transition: all 0.2s ease;
//     width:100%;
//     margin-left: 15px;
//   }
  
//   .alert-action:hover {
//     background-color: #ff9800;
//     color: white;
//   }
  
//   .alert-action.critical {
//     border-color: #d50000;
//     color: #d50000;
//     background-color: rgba(213, 0, 0, 0.1);
//   }
  
//   .alert-action.critical:hover {
//     background-color: #d50000;
//     color: white;
//   }

//   @keyframes pulse {
//     0% { opacity: 1; }
//     50% { opacity: 0.8; }
//     100% { opacity: 1; }
//   }

//   .alert-icon {
//     margin-right: 10px;
//     font-size: 20px;
//   }

//   .cards-container {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//     gap: 20px;
//   }

//   .card {
//     background-color: white;
//     border-radius: 8px;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//     overflow: hidden;
//     transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
//     position: relative;
//   }

//   .card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
//   }
  
//   .card.abnormal::before {
//     content: "";
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     height: 4px;
//     background-color: #ff9800;
//   }
  
//   .card.critical::before {
//     content: "";
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     height: 4px;
//     background-color: #d50000;
//   }

//   .card-header {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 15px 20px;
//     background-color: #f9f9f9;
//     border-bottom: 1px solid #eee;
//   }

//   .card-header h2 {
//     font-size: 18px;
//     color: #444;
//     font-weight: 600;
//   }

//   .status-indicator {
//     padding: 6px 12px;
//     border-radius: 20px;
//     font-size: 12px;
//     font-weight: 600;
//     text-transform: uppercase;
//     display: flex;
//     align-items: center;
//     gap: 5px;
//   }
  
//   .status-indicator::before {
//     content: "";
//     display: inline-block;
//     width: 8px;
//     height: 8px;
//     border-radius: 50%;
//   }

//   .status-normal {
//     background-color: rgba(56, 142, 60, 0.1);
//     color: #388e3c;
//   }
  
//   .status-normal::before {
//     background-color: #388e3c;
//   }

//   .status-abnormal {
//     background-color: rgba(211, 47, 47, 0.1);
//     color: #d32f2f;
//     animation: pulse 2s infinite;
//   }
  
//   .status-abnormal::before {
//     background-color: #d32f2f;
//     animation: blink 2s infinite;
//   }
  
//   .status-critical {
//     background-color: rgba(213, 0, 0, 0.15);
//     color: #d50000;
//     animation: pulse 1s infinite;
//   }
  
//   .status-critical::before {
//     background-color: #d50000;
//     animation: blink 1s infinite;
//   }
  
//   @keyframes blink {
//     0% { opacity: 0.4; }
//     50% { opacity: 1; }
//     100% { opacity: 0.4; }
//   }
  
//   .fall-card {
//     border: 2px solid #d50000;
//     box-shadow: 0 4px 12px rgba(213, 0, 0, 0.2);
//   }
  
//   .fall-status {
//     width: 100%;
//   }
  
//   .emergency-container {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     width: 100%;
//     text-align: center;
//   }
  
//   .emergency-icon {
//     font-size: 42px;
//     color: #d50000;
//     margin-bottom: 10px;
//     animation: pulse 1s infinite;
//   }
  
//   .emergency-message {
//     font-size: 18px;
//     font-weight: 600;
//     color: #d50000;
//     margin-bottom: 15px;
//   }
  
//   .emergency-action {
//     margin-top: 5px;
//   }
  
//   .action-button {
//     background-color: #d50000;
//     color: white;
//     border: none;
//     padding: 10px 20px;
//     border-radius: 4px;
//     font-weight: 600;
//     cursor: pointer;
//     transition: all 0.2s ease;
//     box-shadow: 0 2px 5px rgba(213, 0, 0, 0.3);
//   }
  
//   .action-button:hover {
//     background-color: #b71c1c;
//     box-shadow: 0 4px 8px rgba(213, 0, 0, 0.4);
//   }
  
//   .normal-status {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     text-align: center;
//     width: 100%;
//   }
  
//   .status-icon {
//     font-size: 36px;
//     color: #388e3c;
//     margin-bottom: 10px;
//   }
  
//   .status-message {
//     font-size: 16px;
//     color: #388e3c;
//     font-weight: 600;
//   }

//   .card-body {
//     padding: 20px;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//   }

//   .metric {
//     text-align: center;
//   }

//   .value {
//     font-size: 36px;
//     font-weight: 700;
//     color: #333;
//     display: block;
//   }

//   .unit {
//     font-size: 14px;
//     color: #757575;
//     margin-top: 5px;
//     display: block;
//   }

//   .loading, .error {
//     text-align: center;
//     padding: 50px;
//     font-size: 18px;
//     color: #666;
//   }

//   .error {
//     color: #d32f2f;
//   }

//   .firebase-note {
//     margin-top: 40px;
//     padding: 20px;
//     background-color: #e3f2fd;
//     border-radius: 8px;
//     font-size: 14px;
//   }

//   .firebase-note pre {
//     margin-top: 10px;
//     background-color: #f5f5f5;
//     padding: 15px;
//     border-radius: 4px;
//     overflow-x: auto;
//     font-family: 'Courier New', Courier, monospace;
//   }

//   @media (max-width: 768px) {
//     .cards-container {
//       grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
//     }
    
//     .dashboard-header {
//       flex-direction: column;
//       align-items: flex-start;
//     }
    
//     .alert-banner {
//       flex-direction: column;
//     }
    
//     .alert-icon-wrapper {
//       width: 100%;
//       height: 40px;
//     }
    
//     .alert-action {
//       width: 100%;
//       margin: 10px 0;
//     }
//   }

//   /* New styles for real-time update indicator */
//   .realtime-indicator {
//     position: fixed;
//     bottom: 20px;
//     right: 20px;
//     background-color: #333;
//     color: white;
//     padding: 8px 15px;
//     border-radius: 20px;
//     font-size: 12px;
//     display: flex;
//     align-items: center;
//     box-shadow: 0 2px 10px rgba(0,0,0,0.2);
//   }
  
//   .realtime-dot {
//     height: 8px;
//     width: 8px;
//     background-color: #4caf50;
//     border-radius: 50%;
//     margin-right: 8px;
//     animation: blink 1.5s infinite;
//   }
  
//   @keyframes blink {
//     0% { opacity: 0.4; }
//     50% { opacity: 1; }
//     100% { opacity: 0.4; }
//   }
// `;

// document.head.appendChild(style);

// export default Dashboard;

import { useState, useEffect } from "react";

// Import Firebase (uncomment when implementing)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off, set } from "firebase/database";

const Dashboard = () => {
    // State to store the fetched data
    const [data, setData] = useState({
        ecgValue: 0,
        heartRate: 0,
        humidity: 0,
        spo2: 0,
        temperature: 0,
        alertMessage: "",
        ecgAbnormal: false,
        hrAlert: false,
        spo2Alert: false,
        tempAlert: false,
        isAlertActive: false,
        fallDetected: false
    });
    
    // Location state
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationPermission, setLocationPermission] = useState("not-requested");

    // State for loading and error handling
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        //  REAL-TIME FIREBASE IMPLEMENTATION (uncomment and configure to use)

        // Firebase configuration - replace with your project settings
        const firebaseConfig = {
            apiKey: "AIzaSyAhLCi6JBT5ELkAFxTplKBBDdRdpATzQxI",
            authDomain: "smart-medicine-vending-machine.firebaseapp.com",
            databaseURL: "https://smart-medicine-vending-machine-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "smart-medicine-vending-machine",
            storageBucket: "smart-medicine-vending-machine.firebasestorage.app",
            messagingSenderId: "705021997077",
            appId: "1:705021997077:web:5af9ec0b267e597e1d5e1c",
            measurementId: "G-PH0XLJSYVS"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const dataRef = ref(db, "8_Smart_Assistive_Alzymers");

        // Set up real-time listener
        onValue(dataRef, (snapshot) => {
            const fetchedData = snapshot.val();
            if (fetchedData) {
                setData({
                    ecgValue: fetchedData.ecgValue || 0,
                    heartRate: fetchedData.heartRate || 0,
                    humidity: fetchedData.humidity || 0,
                    spo2: fetchedData.spo2 || 0,
                    temperature: fetchedData.temperature || 0,
                    alertMessage: fetchedData.alertMessage || "",
                    ecgAbnormal: fetchedData.ecgAbnormal || false,
                    hrAlert: fetchedData.hrAlert || false,
                    spo2Alert: fetchedData.spo2Alert || false,
                    tempAlert: fetchedData.tempAlert || false,
                    isAlertActive: fetchedData.isAlertActive || false,
                    fallDetected: fetchedData.fallDetected || false
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setError("Failed to fetch data from Firebase: " + error.message);
            setLoading(false);
        });

        // Cleanup function to detach listener when component unmounts
        return () => {
            off(dataRef);
        };

        // FOR DEMO ONLY - Mock data implementation (remove when using Firebase)
        /*
        const mockDataFetch = async () => {
            try {
                // Simulating API fetch delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Sample data from screenshot
                const responseData = {
                    alertMessage: "🌡 LOW TEMP!",
                    ecgValue: 468,
                    ecgAbnormal: false,
                    heartRate: 74,
                    hrAlert: false,
                    humidity: 61,
                    spo2: 96,
                    spo2Alert: false,
                    temperature: 30.5,
                    tempAlert: true,
                    isAlertActive: true,
                    fallDetected: false
                };

                setData(responseData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching mock data:", err);
                setError("Failed to fetch data. Please try again later.");
                setLoading(false);
            }
        };

        mockDataFetch();
        */
    }, []);

  // Function to get location permission with force option
  const requestLocationPermission = (forceRequest = false) => {
    // Don't re-request permission if already denied unless forced
    if (locationPermission === "denied" && !forceRequest) {
      // Show instructions instead
      return;
    }
    
    setLocationPermission("requesting");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationPermission("denied");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLocationPermission("granted");
        
        // Store location in Firebase when permission is granted
        storeLocationInFirebase(latitude, longitude);
        
        // Set up watchPosition for continuous tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            storeLocationInFirebase(latitude, longitude);
          },
          (error) => {
            console.error("Error watching position:", error);
            setLocationError(`Error watching position: ${error.message}`);
          },
          { enableHighAccuracy: true }
        );
        
        // Store watchId for cleanup
        return () => navigator.geolocation.clearWatch(watchId);
      },
      (error) => {
        console.error("Error getting location:", error);
        
        // Handle permission denied specifically
        if (error.code === 1) { // PERMISSION_DENIED
          setLocationError("Location access was denied. You'll need to reset permissions in your browser settings.");
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          setLocationError("Location information is unavailable. Please check your device's GPS or network connection.");
        } else if (error.code === 3) { // TIMEOUT
          setLocationError("Location request timed out. Please try again.");
        } else {
          setLocationError(`Error getting location: ${error.message}`);
        }
        
        setLocationPermission("denied");
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
    
    // Function to store location in Firebase
    const storeLocationInFirebase = (latitude, longitude) => {
        try {
            const db = getDatabase();
            const locationRef = ref(db, "8_Smart_Assistive_Alzymers/location");
            set(locationRef, {
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error storing location in Firebase:", error);
        }
    };
    
    // Effect to automatically request location if fall is detected
    useEffect(() => {
        if (data.fallDetected && locationPermission === "not-requested") {
            requestLocationPermission();
        }
    }, [data.fallDetected, locationPermission]);

    // Function to determine status text based on alert boolean
    const getStatusText = (isAlert) => {
        return isAlert ? "Abnormal" : "Normal";
    };

    // Function to determine status class based on alert boolean
    const getStatusClass = (isAlert) => {
        return isAlert ? "status-abnormal" : "status-normal";
    };

    if (loading) {
        return <div className="loading">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Medical Monitoring Dashboard</h1>
                <div className="alerts-container">
                    {data.isAlertActive && (
                        <div className="alert-banner">
                            <div className="alert-icon-wrapper">
                                <span className="alert-icon">⚠️</span>
                            </div>
                            <div className="alert-content">
                                <span className="alert-title">ALERT</span>
                                <span className="alert-message">{data.alertMessage}</span>
                            </div>
                            <button className="alert-action">Acknowledge</button>
                        </div>
                    )}
                    {data.fallDetected && (
                        <div className="alert-banner critical">
                            <div className="alert-icon-wrapper critical">
                                <span className="alert-icon">🚨</span>
                            </div>
                            <div className="alert-content">
                                <span className="alert-title">EMERGENCY</span>
                                <span className="alert-message">FALL DETECTED - IMMEDIATE ATTENTION REQUIRED</span>
                            </div>
                            <button className="alert-action critical">Respond</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="cards-container">
                {/* ECG Card */}
                <div className={`card ${data.ecgAbnormal ? 'abnormal' : ''}`}>
                    <div className="card-header">
                        <h2>ECG</h2>
                        <div className={`status-indicator ${getStatusClass(data.ecgAbnormal)}`}>
                            {getStatusText(data.ecgAbnormal)}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric">
                            <span className="value">{data.ecgValue}</span>
                            <span className="unit">mV</span>
                        </div>
                    </div>
                </div>

                {/* Heart Rate Card */}
                <div className={`card ${data.hrAlert ? 'abnormal' : ''}`}>
                    <div className="card-header">
                        <h2>Heart Rate</h2>
                        <div className={`status-indicator ${getStatusClass(data.hrAlert)}`}>
                            {getStatusText(data.hrAlert)}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric">
                            <span className="value">{data.heartRate}</span>
                            <span className="unit">BPM</span>
                        </div>
                    </div>
                </div>

                {/* SPO2 Card */}
                <div className={`card ${data.spo2Alert ? 'abnormal' : ''}`}>
                    <div className="card-header">
                        <h2>Blood Oxygen</h2>
                        <div className={`status-indicator ${getStatusClass(data.spo2Alert)}`}>
                            {getStatusText(data.spo2Alert)}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric">
                            <span className="value">{data.spo2}</span>
                            <span className="unit">%</span>
                        </div>
                    </div>
                </div>

                {/* Temperature Card */}
                <div className={`card ${data.tempAlert ? 'abnormal' : ''}`}>
                    <div className="card-header">
                        <h2>Temperature</h2>
                        <div className={`status-indicator ${getStatusClass(data.tempAlert)}`}>
                            {getStatusText(data.tempAlert)}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric">
                            <span className="value">{data.temperature}</span>
                            <span className="unit">°C</span>
                        </div>
                    </div>
                </div>

                {/* Humidity Card */}
                <div className="card">
                    <div className="card-header">
                        <h2>Humidity</h2>
                    </div>
                    <div className="card-body">
                        <div className="metric">
                            <span className="value">{data.humidity}</span>
                            <span className="unit">%</span>
                        </div>
                    </div>
                </div>

                {/* Fall Detection Card */}
                <div className={`card ${data.fallDetected ? 'fall-card' : ''}`}>
                    <div className="card-header">
                        <h2>Fall Detection</h2>
                        <div className={`status-indicator ${data.fallDetected ? 'status-critical' : 'status-normal'}`}>
                            {data.fallDetected ? 'Fall Detected' : 'No Fall Detected'}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric fall-status">
                            {data.fallDetected ? (
                                <div className="emergency-container">
                                    <div className="emergency-icon">🚨</div>
                                    <div className="emergency-message">Patient Fall Detected</div>
                                    {locationPermission !== "granted" && (
                                        <div className="emergency-location-request">
                                            <p>Share location for emergency services</p>
                                            <button className="action-button location-btn" onClick={() => requestLocationPermission(true)}>
                                                Share Location
                                            </button>
                                        </div>
                                    )}
                                    <div className="emergency-action">
                                        <button className="action-button">Call Caregiver</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="normal-status">
                                    <div className="status-icon">✓</div>
                                    <div className="status-message">Patient Status Normal</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Real-time connection indicator */}
            <div className="realtime-indicator">
                <div className="realtime-dot"></div>
                <span>Real-time connection active</span>
            </div>

            {/* Location Permission Request */}
            {locationPermission === "not-requested" && (
                <div className="location-permission-banner">
                    <div className="permission-icon">📍</div>
                    <div className="permission-content">
                        <h3>Enable Location Tracking</h3>
                        <p>Location tracking helps emergency services locate the patient quickly in case of a fall or other medical emergency.</p>
                    </div>
                    <button className="permission-button" onClick={requestLocationPermission}>
                        Enable Location
                    </button>
                </div>
            )}
            
            {locationPermission === "requesting" && (
                <div className="location-permission-banner requesting">
                    <div className="permission-icon">⏳</div>
                    <div className="permission-content">
                        <h3>Requesting Location Access</h3>
                        <p>Please allow location access in your browser when prompted.</p>
                    </div>
                </div>
            )}
            
            {locationPermission === "granted" && (
                <div className="location-permission-banner granted">
                    <div className="permission-icon">✅</div>
                    <div className="permission-content">
                        <h3>Location Tracking Active</h3>
                        <p>
                            Current coordinates: {location?.latitude.toFixed(6)}, {location?.longitude.toFixed(6)}
                        </p>
                    </div>
                    <button className="permission-button view-map">
                        View Map
                    </button>
                </div>
            )}
            
            {locationPermission === "denied" && (
                <div className="location-permission-banner denied">
                    <div className="permission-icon">❌</div>
                    <div className="permission-content">
                        <h3>Location Access Denied</h3>
                        <p>{locationError || "Please enable location services in your browser settings for emergency tracking."}</p>
                        <div className="browser-instructions">
                            <details>
                                <summary>How to enable location in your browser</summary>
                                <div className="browser-instructions-content">
                                    <h4>Chrome</h4>
                                    <ol>
                                        <li>Click the lock/info icon in the address bar</li>
                                        <li>Find "Location" and select "Allow"</li>
                                        <li>Refresh the page</li>
                                    </ol>
                                    
                                    <h4>Firefox</h4>
                                    <ol>
                                        <li>Click the shield/lock icon in the address bar</li>
                                        <li>Click "Site Permissions"</li>
                                        <li>Find "Access Your Location" and change to "Allow"</li>
                                        <li>Refresh the page</li>
                                    </ol>
                                    
                                    <h4>Safari</h4>
                                    <ol>
                                        <li>Open Safari Preferences</li>
                                        <li>Go to "Websites" tab, then "Location"</li>
                                        <li>Find this website and select "Allow"</li>
                                        <li>Refresh the page</li>
                                    </ol>
                                    
                                    <h4>Mobile Devices</h4>
                                    <p>Ensure location services are enabled in your device settings and that this browser has permission to access your location.</p>
                                </div>
                            </details>
                        </div>
                    </div>
                    <button className="permission-button retry" onClick={() => requestLocationPermission(true)}>
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

// Add CSS styling
const style = document.createElement("style");
style.textContent = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  body {
    background-color: #f5f5f5;
  }

  .dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
  }

  .dashboard-header h1 {
    color: #333;
    font-size: 28px;
    margin-bottom: 15px;
  }
  
  .alerts-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .alert-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #ff9800;
    width: 100%;
  }
  
  .alert-banner.critical {
    border-left: 4px solid #d50000;
    background-color: rgba(213, 0, 0, 0.05);
  }
  
  .alert-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ff9800;
    color: white;
    width: 100%;
    height: 60px;
    flex-shrink: 0;
  }
  
  .alert-icon-wrapper.critical {
    background-color: #d50000;
    animation: flash 1s infinite;
  }
  
  @keyframes flash {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  .alert-icon {
    font-size: 24px;
  }
  
  .alert-content {
  width: 100%;
    padding: 12px 15px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .alert-title {
    font-weight: 700;
    font-size: 14px;
    color: #555;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }
  
  .critical .alert-title {
    color: #d50000;
  }
  
  .alert-message {
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }
  
  .critical .alert-message {
    font-weight: 600;
  }
  
  .alert-action {
    margin-right: 15px;
    background-color: transparent;
    border: 1px solid #ff9800;
    color: #ff9800;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width:100%;
    margin-left: 15px;
  }
  
  .alert-action:hover {
    background-color: #ff9800;
    color: white;
  }
  
  .alert-action.critical {
    border-color: #d50000;
    color: #d50000;
    background-color: rgba(213, 0, 0, 0.1);
  }
  
  .alert-action.critical:hover {
    background-color: #d50000;
    color: white;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }

  .alert-icon {
    margin-right: 10px;
    font-size: 20px;
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    position: relative;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  
  .card.abnormal::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background-color: #ff9800;
  }
  
  .card.critical::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background-color: #d50000;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #f9f9f9;
    border-bottom: 1px solid #eee;
  }

  .card-header h2 {
    font-size: 18px;
    color: #444;
    font-weight: 600;
  }

  .status-indicator {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .status-indicator::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-normal {
    background-color: rgba(56, 142, 60, 0.1);
    color: #388e3c;
  }
  
  .status-normal::before {
    background-color: #388e3c;
  }

  .status-abnormal {
    background-color: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
    animation: pulse 2s infinite;
  }
  
  .status-abnormal::before {
    background-color: #d32f2f;
    animation: blink 2s infinite;
  }
  
  .status-critical {
    background-color: rgba(213, 0, 0, 0.15);
    color: #d50000;
    animation: pulse 1s infinite;
  }
  
  .status-critical::before {
    background-color: #d50000;
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
  
  .fall-card {
    border: 2px solid #d50000;
    box-shadow: 0 4px 12px rgba(213, 0, 0, 0.2);
  }
  
  .fall-status {
    width: 100%;
  }
  
  .emergency-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }
  
  .emergency-icon {
    font-size: 42px;
    color: #d50000;
    margin-bottom: 10px;
    animation: pulse 1s infinite;
  }
  
  .emergency-message {
    font-size: 18px;
    font-weight: 600;
    color: #d50000;
    margin-bottom: 15px;
  }
  
  .emergency-action {
    margin-top: 5px;
  }
  
  .action-button {
    background-color: #d50000;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(213, 0, 0, 0.3);
  }
  
  .action-button:hover {
    background-color: #b71c1c;
    box-shadow: 0 4px 8px rgba(213, 0, 0, 0.4);
  }
  
  .normal-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
  }
  
  .status-icon {
    font-size: 36px;
    color: #388e3c;
    margin-bottom: 10px;
  }
  
  .status-message {
    font-size: 16px;
    color: #388e3c;
    font-weight: 600;
  }

  .card-body {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .metric {
    text-align: center;
  }

  .value {
    font-size: 36px;
    font-weight: 700;
    color: #333;
    display: block;
  }

  .unit {
    font-size: 14px;
    color: #757575;
    margin-top: 5px;
    display: block;
  }

  .loading, .error {
    text-align: center;
    padding: 50px;
    font-size: 18px;
    color: #666;
  }

  .error {
    color: #d32f2f;
  }

  /* New styles for real-time update indicator */
  .realtime-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .realtime-dot {
    height: 8px;
    width: 8px;
    background-color: #4caf50;
    border-radius: 50%;
    margin-right: 8px;
    animation: blink 1.5s infinite;
  }

  /* New styles for location permission banner */
  .location-permission-banner {
    margin-top: 20px;
    margin-bottom: 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-left: 4px solid #2196f3;
  }
  
  .location-permission-banner.requesting {
    border-left-color: #ff9800;
    background-color: rgba(255, 152, 0, 0.05);
  }
  
  .location-permission-banner.granted {
    border-left-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.05);
  }
  
  .location-permission-banner.denied {
    border-left-color: #f44336;
    background-color: rgba(244, 67, 54, 0.05);
  }
  
  .permission-icon {
    font-size: 24px;
    margin-right: 15px;
  }
  
  .permission-content {
    flex-grow: 1;
  }
  
  .permission-content h3 {
    font-size: 16px;
    margin-bottom: 5px;
    color: #333;
  }
  
  .permission-content p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
  
  .permission-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 15px;
  }
  
  .permission-button:hover {
    background-color: #1976d2;
  }
  
  .permission-button.view-map {
    background-color: #4caf50;
  }
  
  .permission-button.view-map:hover {
    background-color: #388e3c;
  }
  
  .permission-button.retry {
    background-color: #f44336;
  }
  
  .permission-button.retry:hover {
    background-color: #d32f2f;
  }
  
  .emergency-location-request {
    background-color: rgba(213, 0, 0, 0.1);
    padding: 10px;
    border-radius: 6px;
    margin: 10px 0;
    text-align: center;
    width: 100%;
  }
  
  .emergency-location-request p {
    margin-bottom: 10px;
    font-size: 14px;
    color: #d50000;
  }
  
  .location-btn {
    background-color: #2196f3;
    margin-bottom: 10px;
  }
  
  .location-btn:hover {
    background-color: #1976d2;
  }
  
  @media (max-width: 768px) {
    .cards-container {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
    
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .alert-banner {
      flex-direction: column;
    }
    
    .alert-icon-wrapper {
      width: 100%;
      height: 40px;
    }
    
    .alert-action {
      width: 100%;
      margin: 10px 0;
    }
    
    .location-permission-banner {
      flex-direction: column;
      text-align: center;
    }
    
    .permission-icon {
      margin-right: 0;
      margin-bottom: 10px;
    }
    
    .permission-button {
      margin-left: 0;
      margin-top: 15px;
      width: 100%;
    }
  }
`;

document.head.appendChild(style);

export default Dashboard;