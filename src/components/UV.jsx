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

  useEffect(() => {
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
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Update current data
        setUvData({
          uvIndex: data.UV_Index,
          uvIntensity: data.UV_Intensity,
          loading: false,
          error: null
        });
        
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
        setUvData({
          uvIndex: null,
          uvIntensity: null,
          loading: false,
          error: "No data available"
        });
      }
    }, (error) => {
      setUvData({
        uvIndex: null,
        uvIntensity: null,
        loading: false,
        error: error.message
      });
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []);

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

  // Chart data and options
// Add this code to your App.js to make the chart match the dark theme
// Replace your existing chartOptions with this updated version

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

// Also update your chartData to use more vibrant colors
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

  if (uvData.loading) {
    return <div className="loading">Loading UV data...</div>;
  }

  if (uvData.error) {
    return <div className="error">Error: {uvData.error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>UV Intensity Monitoring</h1>
      
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