// App.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './UV.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [uvData, setUvData] = useState({
    uvIndex: null,
    uvIntensity: null,
    loading: true,
    error: null
  });
  
  // State for historical data
  const [historicalData, setHistoricalData] = useState({
    timestamps: [],
    uvIndexValues: [],
    uvIntensityValues: []
  });

  // State for alert functionality
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: '',
    timestamp: null
  });

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      console.log('Current notification permission:', Notification.permission);
      
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Permission granted:', permission === 'granted');
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    console.log('Notifications not supported in this browser');
    return false;
  };

  // Play alert sound
  const playAlertSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Could not play alert sound:', error);
    }
  };

  // Show browser notification
  const showNotification = (uvValue, uvState) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 UV Index Alert', {
        body: `UV Index is ${uvValue} (${uvState}). Take protective measures!`,
        icon: '/favicon.ico',
        tag: 'uv-alert',
        requireInteraction: true
      });
    }
  };

  // Debug alert state changes
  useEffect(() => {
    console.log('Alert state changed:', alert);
  }, [alert]);

  useEffect(() => {
    // Request notification permission on component mount
    requestNotificationPermission();

    // Firebase configuration
    const firebaseConfig = {
      databaseURL: "https://self-balancing-7a9fe-default-rtdb.firebaseio.com/"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Reference to the UV intensity data
    const uvDataRef = ref(database, '13_UV_Intensity_Index');

    // Listen for changes in the data
    const unsubscribe = onValue(uvDataRef, (snapshot) => {
      console.log('Firebase data received:', snapshot.exists());
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Complete data:', data);
        console.log('UV Index data:', data.UV_Index);
        console.log('UV Index value:', data.UV_Index?.value);
        console.log('Should show alert (UV > 4):', data.UV_Index?.value > 4);
        
        // Update current data
        setUvData({
          uvIndex: data.UV_Index,
          uvIntensity: data.UV_Intensity,
          loading: false,
          error: null
        });
        
        // Check for UV Index alert (threshold: 4)
        if (data.UV_Index && data.UV_Index.value > 4) {
          const currentTime = new Date().toLocaleTimeString();
          const alertMessage = `⚠️ High UV Alert! UV Index is ${data.UV_Index.value} (${data.UV_Index.state})`;
          
          console.log('Setting alert to show');
          setAlert({
            show: true,
            message: alertMessage,
            type: 'warning',
            timestamp: currentTime
          });
          
          // Play alert sound
          playAlertSound();
          
          // Show browser notification
          showNotification(data.UV_Index.value, data.UV_Index.state);
        } else {
          console.log('Clearing alert (UV Index safe)');
          setAlert({
            show: false,
            message: '',
            type: '',
            timestamp: null
          });
        }
        
        // Update historical data (keeping last 20 data points)
        const currentTime = new Date().toLocaleTimeString();
        
        setHistoricalData(prevData => {
          // Create copies of the arrays to avoid mutation
          const timestamps = [...prevData.timestamps, currentTime];
          const uvIndexValues = [...prevData.uvIndexValues, data.UV_Index.value];
          const uvIntensityValues = [...prevData.uvIntensityValues, data.UV_Intensity.value];
          
          // Keep only the last 20 data points
          const maxDataPoints = 20;
          
          return {
            timestamps: timestamps.slice(-maxDataPoints),
            uvIndexValues: uvIndexValues.slice(-maxDataPoints),
            uvIntensityValues: uvIntensityValues.slice(-maxDataPoints)
          };
        });
      } else {
        console.log('No Firebase data available');
        setUvData({
          uvIndex: null,
          uvIntensity: null,
          loading: false,
          error: "No data available"
        });
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setUvData({
        uvIndex: null,
        uvIntensity: null,
        loading: false,
        error: error.message
      });
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []); // CRITICAL FIX: Empty dependency array

  // Helper function to determine the color based on UV state
  const getStateColor = (state) => {
    switch(state) {
      case 'LOW':
        return '#4CAF50'; // Green
      case 'MODERATE':
        return '#FFC107'; // Yellow
      case 'HIGH':
        return '#FF9800'; // Orange
      case 'VERY HIGH':
        return '#F44336'; // Red
      case 'EXTREME':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  // Chart options with dark theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'UV Index',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'UV Intensity (mW/cm²)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            weight: 'bold'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'UV Data Over Time',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        cornerRadius: 8
      }
    },
    animation: {
      duration: 750
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      }
    }
  };

  // Chart data with vibrant colors
  const chartData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'UV Index',
        data: historicalData.uvIndexValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
        yAxisID: 'y',
        fill: true
      },
      {
        label: 'UV Intensity (mW/cm²)',
        data: historicalData.uvIntensityValues,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

  // Dismiss alert function
  const dismissAlert = () => {
    console.log('Alert dismissed by user');
    setAlert({
      show: false,
      message: '',
      type: '',
      timestamp: null
    });
  };

  if (uvData.loading) {
    return <div className="loading">Loading UV data...</div>;
  }

  if (uvData.error) {
    return <div className="error">Error: {uvData.error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>UV Intensity Monitoring</h1>
      
      {/* Debug Info - Remove after testing */}
      <div className="debug-info">
        <strong>Alert</strong> 
      </div>
      
      {/* Alert Banner */}
      {alert.show && (
        <div className="alert-banner">
          <div className="alert-content">
            <div className="alert-icon">🚨</div>
            <div className="alert-text">
              <span className="alert-message">{alert.message}</span>
              <div className="alert-subtext">
                Take protective measures: wear sunscreen, sunglasses, and protective clothing!
              </div>
            </div>
            <button 
              className="alert-close" 
              onClick={dismissAlert}
              title="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="dashboard-container">
        {uvData.uvIndex && (
          <div className="dashboard-card uv-index">
            <h2>UV Index</h2>
            <div 
              className="status-indicator" 
              style={{ backgroundColor: getStateColor(uvData.uvIndex.state) }}
            >
              {uvData.uvIndex.state}
            </div>
            <div className="value-container">
              <span className="value">{uvData.uvIndex.value}</span>
            </div>
            <div className="level">{uvData.uvIndex.level}</div>
            {uvData.uvIndex.value > 4 && (
              <div className="warning-badge">⚠️ High UV Alert!</div>
            )}
          </div>
        )}

        {uvData.uvIntensity && (
          <div className="dashboard-card uv-intensity">
            <h2>UV Intensity</h2>
            <div 
              className="status-indicator" 
              style={{ backgroundColor: getStateColor(uvData.uvIntensity.state) }}
            >
              {uvData.uvIntensity.state}
            </div>
            <div className="value-container">
              <span className="value">{uvData.uvIntensity.value}</span>
              <span className="unit">{uvData.uvIntensity.unit}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Graph Card */}
      <div className="chart-container">
        <div className="dashboard-card chart-card">
          <h2>UV Trends</h2>
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="last-updated">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default App;
