// import { useState, useEffect } from "react";
// import {
//   BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
//   Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
//   ReferenceLine
// } from "recharts";
// import Papa from 'papaparse';
// import './Dashboard.css';

// const Dashboard = () => {
//   // Original state variables
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chartColumn, setChartColumn] = useState(null);
//   const [latestEntry, setLatestEntry] = useState(null);
//   const [lastUpdated, setLastUpdated] = useState(new Date());
  
//   // New state variables for electrical data
//   const [electricalData, setElectricalData] = useState([]);
//   const [latestElectricalEntry, setLatestElectricalEntry] = useState(null);

//   const fetchData = async () => {
//     try {
//       // Fetch original signal data
//       const response1 = await fetch("https://docs.google.com/spreadsheets/d/1Y9fZBlN63R2SJN02754nlEv6NmsoygK98oh7jEViiWw/export?format=csv&gid=0");
//       const text1 = await response1.text();
//       const result1 = Papa.parse(text1, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       // Fetch electrical data
//       const response2 = await fetch("https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0");
//       const text2 = await response2.text();
//       const result2 = Papa.parse(text2, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       // Process original signal data
//       if (result1.data && result1.data.length > 0) {
//         setData(result1.data);
//         setLatestEntry(result1.data[result1.data.length - 1]);

//         const headers = Object.keys(result1.data[0]);
//         const numericalColumns = headers.filter(header =>
//           typeof result1.data[0][header] === 'number'
//         );

//         if (numericalColumns.length > 0 && !chartColumn) {
//           setChartColumn(numericalColumns[0]);
//         }
//       }

//       // Process electrical data
//       if (result2.data && result2.data.length > 0) {
//         setElectricalData(result2.data);
//         setLatestElectricalEntry(result2.data[result2.data.length - 1]);
//       }

//       setLoading(false);
//       setLastUpdated(new Date());
//     } catch (err) {
//       setError("Failed to fetch data. Please try again later.");
//       setLoading(false);
//       console.error("Error fetching data:", err);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     const refreshInterval = setInterval(() => {
//       fetchData();
//     }, 1000);
//     return () => clearInterval(refreshInterval);
//   }, []);

//   if (loading) return <div className="loading">Loading data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (data.length === 0) return <div className="empty">No data available</div>;
//   if (!latestEntry) return <div className="empty">No latest entry found</div>;

//   const headers = Object.keys(data[0]);
//   const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');
  
//   // Get electrical data headers
//   const electricalHeaders = electricalData.length > 0 ? Object.keys(electricalData[0]) : [];
//   const electricalNumericalColumns = electricalHeaders.filter(header => 
//     electricalData.length > 0 && typeof electricalData[0][header] === 'number'
//   );

//   // Helper function to get exact data range for Y-axis
//   const getExactDataRange = (column, dataset) => {
//     const values = dataset
//       .map(item => item[column])
//       .filter(val => typeof val === 'number' && !isNaN(val));
    
//     if (values.length === 0) return ['auto', 'auto'];
    
//     const min = Math.min(...values);
//     const max = Math.max(...values);
    
//     // If min and max are the same, add small range
//     if (min === max) {
//       return [min - 0.1, max + 0.1];
//     }
    
//     return [min, max];
//   };

//   // Calculate S1 - S2 difference for latest entry (preserved functionality)
//   let latestDifference = null;
//   let latestFrequency = null;
  
//   if (latestEntry && typeof latestEntry.S1 === 'number' && typeof latestEntry.S2 === 'number') {
//     latestDifference = parseFloat((latestEntry.S1 - latestEntry.S2).toFixed(2));
    
//     let frequencyCount = 0;
//     data.forEach(row => {
//       if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
//         const diff = parseFloat((row.S1 - row.S2).toFixed(2));
//         if (diff === latestDifference) {
//           frequencyCount++;
//         }
//       }
//     });
//     latestFrequency = frequencyCount;
//   }

//   // Calculate frequency distribution - USING ALL DATA (preserved)
//   let frequencyMap = {};
//   if (headers.includes("S1") && headers.includes("S2")) {
//     data.forEach(row => {
//       if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
//         const diff = parseFloat((row.S1 - row.S2).toFixed(2));
//         frequencyMap[diff] = (frequencyMap[diff] || 0) + 1;
//       }
//     });
//   }

//   const frequencyChartData = Object.entries(frequencyMap)
//     .map(([diff, frequency]) => ({
//       difference: `${diff}`,
//       frequency,
//       value: frequency
//     }))
//     .sort((a, b) => Number(a.difference) - Number(b.difference));

//   // Prepare time series data for signals
//   const timeSeriesData = data.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   // Prepare time series data for electrical measurements
//   const electricalTimeSeriesData = electricalData.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   // Calculate RMS values using ALL data (preserved)
//   const calculateRMS = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sumSquares = values.reduce((sum, val) => sum + val * val, 0);
//     return Math.sqrt(sumSquares / values.length).toFixed(3);
//   };

//   // Calculate average for electrical data
//   const calculateAverage = (column, dataset = electricalData) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sum = values.reduce((sum, val) => sum + val, 0);
//     return (sum / values.length).toFixed(3);
//   };

//   // Calculate transmissibility (preserved)
//   const transmissibility = latestEntry && latestEntry.S1 && latestEntry.S2 
//     ? ((latestEntry.S2 / latestEntry.S1) * 100).toFixed(1) 
//     : 0;

//   return (
//     <div className="dashboard">
//       {/* Header */}
//       <div className="header-section">
//         <div className="header-content">
//           <h1 className="main-title">
//             <span className="title-icon">📊</span>
//             Signal & Electrical Analysis Dashboard
//           </h1>
//           <div className="status-indicator">
//             <div className="status-dot"></div>
//             <span>Live Recording</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Analysis Grid */}
//       <div className="analysis-main-grid">
        
//         {/* Signal Waveforms - Top Row with Exact Y-Axis Scaling */}
//         <div className="waveform-section">
//           <div className="section-title">Signal Waveforms - All {data.length} Data Points</div>
          
//           <div className="waveform-grid">
//             {numericalColumns.slice(0, 4).map((column, index) => (
//               <div key={column} className="waveform-container">
//                 <div className="waveform-header">
//                   <span className="signal-label">{column} Signal</span>
//                   <span className="rms-value">{calculateRMS(column)} g rms</span>
//                 </div>
                
//                 <div className="oscilloscope-display">
//                   <ResponsiveContainer width="100%" height={200}>
//                     <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//                       <defs>
//                         <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.8}/>
//                           <stop offset="100%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.1}/>
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                       <XAxis 
//                         dataKey="time" 
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#888' }}
//                       />
//                       <YAxis 
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#888' }}
//                         domain={getExactDataRange(column, data)}
//                       />
//                       <Line 
//                         type="monotone" 
//                         dataKey={column}
//                         stroke={index % 2 === 0 ? "#00ff41" : "#ff0080"}
//                         strokeWidth={1.5}
//                         dot={false}
//                         fill={`url(#gradient-${index})`}
//                       />
//                       <Tooltip 
//                         contentStyle={{
//                           backgroundColor: '#000',
//                           border: '1px solid #333',
//                           borderRadius: '4px',
//                           color: '#fff',
//                           fontSize: '12px'
//                         }}
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Electrical Measurements with Exact Y-Axis Scaling */}
//         <div className="waveform-section">
//           <div className="section-title">Electrical Measurements - All {electricalData.length} Data Points</div>
          
//           <div className="waveform-grid">
//             {/* Combined Voltage and Current Chart with Exact Y-Axis Ranges */}
//             {(electricalNumericalColumns.includes('Voltage_V') || electricalNumericalColumns.includes('Current_mA')) && (
//               <div className="waveform-container" style={{ width: '100%' }}>
//                 <div className="waveform-header">
//                   <span className="signal-label">Voltage and Current</span>
//                   <span className="rms-value">
//                     {electricalNumericalColumns.includes('Voltage_V') && `${calculateAverage('Voltage_V', electricalData)} V avg`} {' '}
//                     {electricalNumericalColumns.includes('Voltage_V') && electricalNumericalColumns.includes('Current_mA') && '|'} {' '}
//                     {electricalNumericalColumns.includes('Current_mA') && `${calculateAverage('Current_mA', electricalData)} mA avg`}
//                   </span>
//                 </div>
                
//                 <div className="oscilloscope-display">
//                   <ResponsiveContainer width="100%" height={300}>
//                     <LineChart data={electricalTimeSeriesData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
//                       <defs>
//                         <linearGradient id="voltage-gradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8}/>
//                           <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1}/>
//                         </linearGradient>
//                         <linearGradient id="current-gradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.8}/>
//                           <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.1}/>
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                       <XAxis 
//                         dataKey="time" 
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#888' }}
//                       />
                      
//                       {/* Left Y-Axis for Voltage - Exact Range */}
//                       <YAxis 
//                         yAxisId="voltage"
//                         orientation="left"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#FFD700' }}
//                         label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#FFD700' } }}
//                         domain={electricalNumericalColumns.includes('Voltage_V') ? getExactDataRange('Voltage_V', electricalData) : ['auto', 'auto']}
//                       />
                      
//                       {/* Right Y-Axis for Current - Exact Range */}
//                       <YAxis 
//                         yAxisId="current"
//                         orientation="right"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#00BFFF' }}
//                         label={{ value: 'Current (mA)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#00BFFF' } }}
//                         domain={electricalNumericalColumns.includes('Current_mA') ? getExactDataRange('Current_mA', electricalData) : ['auto', 'auto']}
//                       />
                      
//                       {electricalNumericalColumns.includes('Voltage_V') && (
//                         <Line 
//                           yAxisId="voltage"
//                           type="monotone" 
//                           dataKey="Voltage_V"
//                           stroke="#FFD700"
//                           strokeWidth={2}
//                           dot={false}
//                           name="Voltage (V)"
//                         />
//                       )}
                      
//                       {electricalNumericalColumns.includes('Current_mA') && (
//                         <Line 
//                           yAxisId="current"
//                           type="monotone" 
//                           dataKey="Current_mA"
//                           stroke="#00BFFF"
//                           strokeWidth={2}
//                           dot={false}
//                           name="Current (mA)"
//                         />
//                       )}
                      
//                       <Legend verticalAlign="top" height={36} />
//                       <Tooltip 
//                         contentStyle={{
//                           backgroundColor: '#000',
//                           border: '1px solid #333',
//                           borderRadius: '4px',
//                           color: '#fff',
//                           fontSize: '12px'
//                         }}
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Metrics and Analysis - Bottom Row */}
//         <div className="metrics-analysis-row">
          
//           {/* Current Values - Enhanced */}
//           <div className="current-values-panel">
//             <div className="panel-header">Current Signal Values</div>
//             <div className="values-grid">
//               {headers.slice(0, 6).map(header => (
//                 <div className="value-item" key={header}>
//                   <div className="value-label">{header}</div>
//                   <div className="value-display">
//                     {typeof latestEntry[header] === 'number'
//                       ? latestEntry[header].toFixed(3)
//                       : latestEntry[header]}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Electrical Values - New Panel */}
//           <div className="current-values-panel">
//             <div className="panel-header">Current Electrical Values</div>
//             <div className="values-grid">
//               {latestElectricalEntry && electricalHeaders.slice(0, 6).map(header => (
//                 <div className="value-item" key={header}>
//                   <div className="value-label">{header}</div>
//                   <div className="value-display">
//                     {typeof latestElectricalEntry[header] === 'number'
//                       ? latestElectricalEntry[header].toFixed(3)
//                       : latestElectricalEntry[header]}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Enhanced Key Metrics */}
//           <div className="key-metrics-panel">
//             <div className="panel-header">Analysis Results</div>
//             <div className="metrics-display">
              
//               <div className="metric-box input-metric">
//                 <div className="metric-label">Input Accelerometer RMS</div>
//                 <div className="metric-value">
//                   {numericalColumns[0] ? calculateRMS(numericalColumns[0]) : '0.000'}
//                 </div>
//                 <div className="metric-unit">g rms</div>
//               </div>

//               <div className="metric-box output-metric">
//                 <div className="metric-label">Output Accelerometer RMS</div>
//                 <div className="metric-value">
//                   {numericalColumns[1] ? calculateRMS(numericalColumns[1]) : '0.000'}
//                 </div>
//                 <div className="metric-unit">g rms</div>
//               </div>

//               <div className="metric-box transmissibility-metric">
//                 <div className="metric-label">Transmissibility</div>
//                 <div className="metric-value">{transmissibility}</div>
//                 <div className="metric-unit">%</div>
//               </div>

             

//             </div>
//           </div>

//           {/* Frequency Distribution - SHOWING ALL FREQUENCY DATA (preserved) */}
//           <div className="frequency-panel">
//             <div className="panel-header">Complete Pattern Distribution ({frequencyChartData.length} patterns)</div>
//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={frequencyChartData}>
//                 <defs>
//                   <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="#00ff41" />
//                     <stop offset="100%" stopColor="#004d00" />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.3} />
//                 <XAxis 
//                   dataKey="difference" 
//                   tick={{ fontSize: 8, fill: '#888' }}
//                   axisLine={false}
//                   tickLine={false}
//                   interval={Math.max(0, Math.floor(frequencyChartData.length / 10) - 1)}
//                 />
//                 <YAxis 
//                   tick={{ fontSize: 10, fill: '#888' }}
//                   axisLine={false}
//                   tickLine={false}
//                 />
//                 <Tooltip 
//                   contentStyle={{
//                     backgroundColor: '#000',
//                     border: '1px solid #333',
//                     borderRadius: '4px',
//                     color: '#fff',
//                     fontSize: '12px'
//                   }}
//                 />
//                 <Bar 
//                   dataKey="frequency" 
//                   fill="url(#barGradient)"
//                   stroke="#00ff41"
//                   strokeWidth={1}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//         </div>

//         {/* Enhanced Status Footer */}
//         <div className="status-footer">
//           <div className="recording-status">
//             <div className="rec-indicator">REC</div>
//             <span>Recording Active - Last Update: {lastUpdated.toLocaleTimeString()}</span>
//           </div>
//           <div className="data-info">
//             <span>Signal Samples: {data.length}</span>
//             <span>Electrical Samples: {electricalData.length}</span>
//             <span>Unique Patterns: {frequencyChartData.length}</span>
//             <span>Rate: 1 Hz</span>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import {
  BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
  Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine
} from "recharts";
import Papa from 'papaparse';
// ✅ CORRECT IMPORT APPROACH - This is the most reliable method
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const Dashboard = () => {
  // State variables
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartColumn, setChartColumn] = useState(null);
  const [latestEntry, setLatestEntry] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [electricalData, setElectricalData] = useState([]);
  const [latestElectricalEntry, setLatestElectricalEntry] = useState(null);

  const fetchData = async () => {
    try {
      // Fetch original signal data
      const response1 = await fetch("https://docs.google.com/spreadsheets/d/1Y9fZBlN63R2SJN02754nlEv6NmsoygK98oh7jEViiWw/export?format=csv&gid=0");
      const text1 = await response1.text();
      const result1 = Papa.parse(text1, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      // Fetch electrical data
      const response2 = await fetch("https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0");
      const text2 = await response2.text();
      const result2 = Papa.parse(text2, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      // Process original signal data
      if (result1.data && result1.data.length > 0) {
        setData(result1.data);
        setLatestEntry(result1.data[result1.data.length - 1]);

        const headers = Object.keys(result1.data[0]);
        const numericalColumns = headers.filter(header =>
          typeof result1.data[0][header] === 'number'
        );

        if (numericalColumns.length > 0 && !chartColumn) {
          setChartColumn(numericalColumns[0]);
        }
      }

      // Process electrical data
      if (result2.data && result2.data.length > 0) {
        setElectricalData(result2.data);
        setLatestElectricalEntry(result2.data[result2.data.length - 1]);
      }

      setLoading(false);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (data.length === 0) return <div className="empty">No data available</div>;
  if (!latestEntry) return <div className="empty">No latest entry found</div>;

  // ✅ VARIABLE DECLARATIONS - All variables declared BEFORE PDF function
  const headers = Object.keys(data[0]);
  const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');
  
  const electricalHeaders = electricalData.length > 0 ? Object.keys(electricalData[0]) : [];
  const electricalNumericalColumns = electricalHeaders.filter(header => 
    electricalData.length > 0 && typeof electricalData[0][header] === 'number'
  );

  // Helper functions
  const getExactDataRange = (column, dataset) => {
    const values = dataset
      .map(item => item[column])
      .filter(val => typeof val === 'number' && !isNaN(val));
    
    if (values.length === 0) return ['auto', 'auto'];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (min === max) {
      return [min - 0.1, max + 0.1];
    }
    
    return [min, max];
  };

  const calculateRMS = (column, dataset = data) => {
    const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
    if (values.length === 0) return '0.000';
    const sumSquares = values.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumSquares / values.length).toFixed(3);
  };

  const calculateAverage = (column, dataset = electricalData) => {
    const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
    if (values.length === 0) return '0.000';
    const sum = values.reduce((sum, val) => sum + val, 0);
    return (sum / values.length).toFixed(3);
  };

  // Calculate derived values
  let latestDifference = null;
  let latestFrequency = null;
  
  if (latestEntry && typeof latestEntry.S1 === 'number' && typeof latestEntry.S2 === 'number') {
    latestDifference = parseFloat((latestEntry.S1 - latestEntry.S2).toFixed(2));
    
    let frequencyCount = 0;
    data.forEach(row => {
      if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
        const diff = parseFloat((row.S1 - row.S2).toFixed(2));
        if (diff === latestDifference) {
          frequencyCount++;
        }
      }
    });
    latestFrequency = frequencyCount;
  }

  let frequencyMap = {};
  if (headers.includes("S1") && headers.includes("S2")) {
    data.forEach(row => {
      if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
        const diff = parseFloat((row.S1 - row.S2).toFixed(2));
        frequencyMap[diff] = (frequencyMap[diff] || 0) + 1;
      }
    });
  }

  const frequencyChartData = Object.entries(frequencyMap)
    .map(([diff, frequency]) => ({
      difference: `${diff}`,
      frequency,
      value: frequency
    }))
    .sort((a, b) => Number(a.difference) - Number(b.difference));

  const timeSeriesData = data.map((item, index) => ({
    time: index,
    ...item
  }));

  const electricalTimeSeriesData = electricalData.map((item, index) => ({
    time: index,
    ...item
  }));

  const transmissibility = latestEntry && latestEntry.S1 && latestEntry.S2 
    ? ((latestEntry.S2 / latestEntry.S1) * 100).toFixed(1) 
    : 0;

  // ✅ PDF GENERATION FUNCTION - Placed AFTER all variable declarations with robust error handling
  const generatePDFReport = () => {
    try {
      // Create PDF instance
      const doc = new jsPDF();
      
      // Verify autoTable is available with multiple checks
      if (typeof doc.autoTable !== 'function') {
        // Try to manually attach the plugin
        if (typeof autoTable === 'function') {
          doc.autoTable = function(options) {
            return autoTable(this, options);
          };
        } else {
          throw new Error('AutoTable plugin not available');
        }
      }

      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;

      // Header Section
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Signal & Electrical Analysis Report', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      doc.text(`Last Data Update: ${lastUpdated.toLocaleString()}`, margin, yPosition + 7);
      
      yPosition += 25;

      // Current Signal Values Section
      if (headers.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Current Signal Values', margin, yPosition);
        yPosition += 10;

        const signalTableData = headers.slice(0, 6).map(header => [
          header,
          typeof latestEntry[header] === 'number' 
            ? latestEntry[header].toFixed(3) 
            : String(latestEntry[header] || 'N/A')
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Parameter', 'Value']],
          body: signalTableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [22, 160, 133],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: 50
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 10,
            cellPadding: 3
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Current Electrical Values Section
      if (latestElectricalEntry && electricalHeaders.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Current Electrical Values', margin, yPosition);
        yPosition += 10;

        const electricalTableData = electricalHeaders.slice(0, 6).map(header => [
          header.replace('_', ' '),
          typeof latestElectricalEntry[header] === 'number' 
            ? latestElectricalEntry[header].toFixed(3) 
            : String(latestElectricalEntry[header] || 'N/A')
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Parameter', 'Value']],
          body: electricalTableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: 50
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 10,
            cellPadding: 3
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Analysis Results Section
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Analysis Results', margin, yPosition);
      yPosition += 10;

      const metricsData = [
        ['Input Accelerometer RMS', `${numericalColumns[0] ? calculateRMS(numericalColumns[0]) : '0.000'} g rms`],
        ['Output Accelerometer RMS', `${numericalColumns[1] ? calculateRMS(numericalColumns[1]) : '0.000'} g rms`],
        ['Transmissibility', `${transmissibility}%`],
        ['Signal Samples', data.length.toString()],
        ['Electrical Samples', electricalData.length.toString()],
        ['Unique Patterns', frequencyChartData.length.toString()],
        ['Current Difference (S1-S2)', latestDifference !== null ? latestDifference.toString() : 'N/A'],
        ['Pattern Frequency', latestFrequency !== null ? latestFrequency.toString() : 'N/A']
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: metricsData,
        theme: 'striped',
        headStyles: { 
          fillColor: [155, 89, 182],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 10,
          cellPadding: 3
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // RMS Values Summary
      if (numericalColumns.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('RMS Values Summary', margin, yPosition);
        yPosition += 10;

        const rmsData = numericalColumns.map(column => [
          `${column} Signal`,
          `${calculateRMS(column)} g rms`
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Signal', 'RMS Value']],
          body: rmsData,
          theme: 'striped',
          headStyles: { 
            fillColor: [230, 126, 34],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: 50
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 10,
            cellPadding: 3
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Electrical Measurements Summary
      if (electricalData.length > 0 && electricalNumericalColumns.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Electrical Measurements Summary', margin, yPosition);
        yPosition += 10;

        const electricalAvgData = electricalNumericalColumns.map(column => [
          column.replace('_', ' '),
          `${calculateAverage(column, electricalData)} ${column.includes('Voltage') ? 'V' : column.includes('Current') ? 'mA' : ''} avg`
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Parameter', 'Average Value']],
          body: electricalAvgData,
          theme: 'striped',
          headStyles: { 
            fillColor: [46, 204, 113],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: 50
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 10,
            cellPadding: 3
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Top Pattern Distribution
      if (frequencyChartData.length > 0) {
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Top 15 Pattern Distribution', margin, yPosition);
        yPosition += 10;

        const topFrequencyData = frequencyChartData
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 15)
          .map((item, index) => [
            (index + 1).toString(),
            item.difference,
            item.frequency.toString(),
            `${((item.frequency / data.length) * 100).toFixed(1)}%`
          ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Rank', 'Pattern Difference', 'Frequency', 'Percentage']],
          body: topFrequencyData,
          theme: 'striped',
          headStyles: { 
            fillColor: [231, 76, 60],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: 50
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 2
          }
        });
      }

      // Save the PDF
      const fileName = `Signal_Electrical_Report_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.pdf`;
      doc.save(fileName);
      
      // Success feedback
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to generate PDF report. ';
      if (error.message.includes('autoTable')) {
        errorMessage += 'PDF table plugin not available. Please refresh the page and try again.';
      } else if (error.message.includes('jsPDF')) {
        errorMessage += 'PDF library not loaded properly. Please refresh the page.';
      } else {
        errorMessage += 'Please try again or check your browser console for details.';
      }
      
      alert(errorMessage);
    }
  };

  // Test function for debugging
  const testPDFCapabilities = () => {
    console.log('Testing PDF capabilities...');
    console.log('jsPDF available:', typeof jsPDF);
    console.log('autoTable available:', typeof autoTable);
    
    try {
      const testDoc = new jsPDF();
      console.log('jsPDF instance created successfully');
      console.log('autoTable method available:', typeof testDoc.autoTable);
      alert('PDF capabilities test completed. Check console for details.');
    } catch (error) {
      console.error('PDF test failed:', error);
      alert('PDF test failed: ' + error.message);
    }
  };

  return (
    <div className="dashboard1">
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">📊</span>
            Signal & Electrical Analysis Dashboard
          </h1>
          <div className="header-actions">
            {/* Debug button - remove in production */}
            {/* <button 
              className="test-btn"
              onClick={testPDFCapabilities}
              style={{
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginRight: '10px'
              }}
            >
              🧪 Test PDF
            </button> */}
            
            <button 
              className="generate-report-btn"
              onClick={generatePDFReport}
            >
              📄 Generate Report
            </button>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>Live Recording</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="analysis-main-grid">
        
        {/* Signal Waveforms */}
        <div className="waveform-section">
          <div className="section-title">Signal Waveforms - All {data.length} Data Points</div>
          
          <div className="waveform-grid">
            {numericalColumns.slice(0, 4).map((column, index) => (
              <div key={column} className="waveform-container">
                <div className="waveform-header">
                  <span className="signal-label">{column} Signal</span>
                  <span className="rms-value">{calculateRMS(column)} g rms</span>
                </div>
                
                <div className="oscilloscope-display">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.8}/>
                          <stop offset="100%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#888' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#888' }}
                        domain={getExactDataRange(column, data)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={column}
                        stroke={index % 2 === 0 ? "#00ff41" : "#ff0080"}
                        strokeWidth={1.5}
                        dot={false}
                        fill={`url(#gradient-${index})`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#000',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Electrical Measurements */}
        <div className="waveform-section">
          <div className="section-title">Electrical Measurements - All {electricalData.length} Data Points</div>
          
          <div className="waveform-grid">
            {(electricalNumericalColumns.includes('Voltage_V') || electricalNumericalColumns.includes('Current_mA')) && (
              <div className="waveform-container" style={{ width: '100%' }}>
                <div className="waveform-header">
                  <span className="signal-label">Voltage and Current</span>
                  <span className="rms-value">
                    {electricalNumericalColumns.includes('Voltage_V') && `${calculateAverage('Voltage_V', electricalData)} V avg`} {' '}
                    {electricalNumericalColumns.includes('Voltage_V') && electricalNumericalColumns.includes('Current_mA') && '|'} {' '}
                    {electricalNumericalColumns.includes('Current_mA') && `${calculateAverage('Current_mA', electricalData)} mA avg`}
                  </span>
                </div>
                
                <div className="oscilloscope-display">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={electricalTimeSeriesData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="voltage-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="current-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#888' }}
                      />
                      
                      <YAxis 
                        yAxisId="voltage"
                        orientation="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#FFD700' }}
                        label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#FFD700' } }}
                        domain={electricalNumericalColumns.includes('Voltage_V') ? getExactDataRange('Voltage_V', electricalData) : ['auto', 'auto']}
                      />
                      
                      <YAxis 
                        yAxisId="current"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#00BFFF' }}
                        label={{ value: 'Current (mA)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#00BFFF' } }}
                        domain={electricalNumericalColumns.includes('Current_mA') ? getExactDataRange('Current_mA', electricalData) : ['auto', 'auto']}
                      />
                      
                      {electricalNumericalColumns.includes('Voltage_V') && (
                        <Line 
                          yAxisId="voltage"
                          type="monotone" 
                          dataKey="Voltage_V"
                          stroke="#FFD700"
                          strokeWidth={2}
                          dot={false}
                          name="Voltage (V)"
                        />
                      )}
                      
                      {electricalNumericalColumns.includes('Current_mA') && (
                        <Line 
                          yAxisId="current"
                          type="monotone" 
                          dataKey="Current_mA"
                          stroke="#00BFFF"
                          strokeWidth={2}
                          dot={false}
                          name="Current (mA)"
                        />
                      )}
                      
                      <Legend verticalAlign="top" height={36} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#000',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics and Analysis */}
        <div className="metrics-analysis-row">
          
          {/* Current Signal Values */}
          <div className="current-values-panel">
            <div className="panel-header">Current Signal Values</div>
            <div className="values-grid">
              {headers.slice(0, 6).map(header => (
                <div className="value-item" key={header}>
                  <div className="value-label">{header}</div>
                  <div className="value-display">
                    {typeof latestEntry[header] === 'number'
                      ? latestEntry[header].toFixed(3)
                      : latestEntry[header]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Electrical Values */}
          <div className="current-values-panel">
            <div className="panel-header">Current Electrical Values</div>
            <div className="values-grid">
              {latestElectricalEntry && electricalHeaders.slice(0, 6).map(header => (
                <div className="value-item" key={header}>
                  <div className="value-label">{header}</div>
                  <div className="value-display">
                    {typeof latestElectricalEntry[header] === 'number'
                      ? latestElectricalEntry[header].toFixed(3)
                      : latestElectricalEntry[header]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="key-metrics-panel">
            <div className="panel-header">Analysis Results</div>
            <div className="metrics-display">
              
              <div className="metric-box input-metric">
                <div className="metric-label">Input Accelerometer RMS</div>
                <div className="metric-value">
                  {numericalColumns[0] ? calculateRMS(numericalColumns[0]) : '0.000'}
                </div>
                <div className="metric-unit">g rms</div>
              </div>

              <div className="metric-box output-metric">
                <div className="metric-label">Output Accelerometer RMS</div>
                <div className="metric-value">
                  {numericalColumns[1] ? calculateRMS(numericalColumns[1]) : '0.000'}
                </div>
                <div className="metric-unit">g rms</div>
              </div>

              <div className="metric-box transmissibility-metric">
                <div className="metric-label">Transmissibility</div>
                <div className="metric-value">{transmissibility}</div>
                <div className="metric-unit">%</div>
              </div>

            </div>
          </div>

          {/* Frequency Distribution */}
          <div className="frequency-panel">
            <div className="panel-header">Complete Pattern Distribution ({frequencyChartData.length} patterns)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={frequencyChartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff41" />
                    <stop offset="100%" stopColor="#004d00" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.3} />
                <XAxis 
                  dataKey="difference" 
                  tick={{ fontSize: 8, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(frequencyChartData.length / 10) - 1)}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#000',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="frequency" 
                  fill="url(#barGradient)"
                  stroke="#00ff41"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Status Footer */}
        <div className="status-footer">
          <div className="recording-status">
            <div className="rec-indicator">REC</div>
            <span>Recording Active - Last Update: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="data-info">
            <span>Signal Samples: {data.length}</span>
            <span>Electrical Samples: {electricalData.length}</span>
            <span>Unique Patterns: {frequencyChartData.length}</span>
            <span>Rate: 1 Hz</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
