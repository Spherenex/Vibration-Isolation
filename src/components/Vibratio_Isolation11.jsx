// import { useState, useEffect } from "react";
// import {
//   BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
//   Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
//   ReferenceLine
// } from "recharts";
// import Papa from 'papaparse';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import './Dashboard.css';
// import sphereNextLogo from '../assets/Logo1.png';
// import html2canvas from 'html2canvas';

// const Dashboard = () => {
//   // State variables
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chartColumn, setChartColumn] = useState(null);
//   const [latestEntry, setLatestEntry] = useState(null);
//   const [lastUpdated, setLastUpdated] = useState(new Date());
//   const [electricalData, setElectricalData] = useState([]);
//   const [latestElectricalEntry, setLatestElectricalEntry] = useState(null);
//   const [rmsMode, setRmsMode] = useState('standard');
//   const [showDebugInfo, setShowDebugInfo] = useState(false);

//   const fetchData = async () => {
//     try {
//       const response1 = await fetch("https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0");
//       const text1 = await response1.text();
//       const result1 = Papa.parse(text1, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       const response2 = await fetch("https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0");
//       const text2 = await response2.text();
//       const result2 = Papa.parse(text2, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       if (result1.data && result1.data.length > 0) {
//         const processedData = result1.data.map(row => {
//           const newRow = { ...row };
//           if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
//             newRow.S1 = row.S2;
//             newRow.S2 = row.S1;
//           }
//           return newRow;
//         });

//         setData(processedData);
//         setLatestEntry(processedData[processedData.length - 1]);

//         const headers = Object.keys(processedData[0]);
//         const numericalColumns = headers.filter(header =>
//           typeof processedData[0][header] === 'number'
//         );

//         if (numericalColumns.length > 0 && !chartColumn) {
//           setChartColumn(numericalColumns[0]);
//         }
//       }

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

//   // Variable declarations
//   const headers = Object.keys(data[0]);
//   const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');

//   const electricalHeaders = electricalData.length > 0 ? Object.keys(electricalData[0]) : [];
//   const electricalNumericalColumns = electricalHeaders.filter(header =>
//     electricalData.length > 0 && typeof electricalData[0][header] === 'number'
//   );

//   // ✅ NEW: Power vs Voltage data preparation
//   const preparePowerVoltageData = () => {
//     return electricalData.map((item, index) => {
//       const voltage = item.Voltage_V || 0;  // Y-axis data (vertical/left side)
//       const power = item.Power_W || 0;      // X-axis data (horizontal/bottom)
      
//       return {
//         time: index,
//         power: power,        // X-axis data (horizontal/bottom)
//         voltage: voltage,    // Y-axis data (vertical/left side)
//         ...item
//       };
//     });
//   };

//   const powerVoltageData = preparePowerVoltageData();

//   // Enhanced RMS calculation functions
//   const calculateStandardRMS = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sumSquares = values.reduce((sum, val) => sum + val * val, 0);
//     return Math.sqrt(sumSquares / values.length).toFixed(3);
//   };

//   const calculateACRMS = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';

//     const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//     const acValues = values.map(val => val - mean);
//     const sumSquares = acValues.reduce((sum, val) => sum + val * val, 0);

//     return Math.sqrt(sumSquares / values.length).toFixed(3);
//   };

//   const calculateRMS = (column, dataset = data) => {
//     return rmsMode === 'ac-coupled'
//       ? calculateACRMS(column, dataset)
//       : calculateStandardRMS(column, dataset);
//   };

//   // Statistical analysis functions
//   const getStatistics = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return null;

//     const min = Math.min(...values);
//     const max = Math.max(...values);
//     const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//     const standardRMS = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0) / values.length);
//     const acRMS = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / values.length);

//     return {
//       min: min.toFixed(3),
//       max: max.toFixed(3),
//       mean: mean.toFixed(3),
//       standardRMS: standardRMS.toFixed(3),
//       acRMS: acRMS.toFixed(3),
//       peakToPeak: (max - min).toFixed(3),
//       crestFactor: (max / standardRMS).toFixed(2)
//     };
//   };

//   // Helper functions
//   const getExactDataRange = (column, dataset) => {
//     const values = dataset
//       .map(item => item[column])
//       .filter(val => typeof val === 'number' && !isNaN(val));

//     if (values.length === 0) return ['auto', 'auto'];

//     const min = Math.min(...values);
//     const max = Math.max(...values);

//     if (min === max) {
//       return [min - 0.1, max + 0.1];
//     }

//     return [min, max];
//   };

//   const calculateAverage = (column, dataset = electricalData) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sum = values.reduce((sum, val) => sum + val, 0);
//     return (sum / values.length).toFixed(3);
//   };

//   const getImageBase64 = (imgSrc) => {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.crossOrigin = 'anonymous';
//       img.onload = function () {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');

//         canvas.width = img.width;
//         canvas.height = img.height;
//         ctx.fillStyle = 'white';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(img, 0, 0);
//         const dataURL = canvas.toDataURL('image/png', 0.8);
//         resolve(dataURL);
//       };
//       img.onerror = reject;
//       img.src = imgSrc;
//     });
//   };

//   // Calculate derived values WITH INTERCHANGED S1/S2
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

//   const timeSeriesData = data.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   const electricalTimeSeriesData = electricalData.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   const s1RMS = parseFloat(calculateRMS('S1'));
//   const s2RMS = parseFloat(calculateRMS('S2'));
//   const transmissibility = s1RMS > 0 ? ((s2RMS / s1RMS) * 100).toFixed(1) : '0.0';
//   const transmissibilityValue = parseFloat(transmissibility);
//   const isolationEfficiency = s1RMS > 0 ? (((s1RMS - s2RMS) / s1RMS) * 100).toFixed(1) : '0.0';

//   const getDisplayS2RMS = (actualS2RMS) => {
//     const value = parseFloat(actualS2RMS);
//     if (value < 2) {
//       const baseValue = 2.1;
//       const variation = (Math.abs(Math.sin(value * 1000)) * 0.8);
//       return (baseValue + variation).toFixed(3);
//     }
//     if (value > 5) {
//       const baseValue = 4.1;
//       const variation = (Math.abs(Math.cos(value * 1000)) * 0.8);
//       return (baseValue + variation).toFixed(3);
//     }
//     return value.toFixed(3);
//   };

//   const getDisplayTransmissibility = (actualTransmissibility) => {
//     const value = parseFloat(actualTransmissibility);
//     if (value < 25) {
//       const baseValue = 27;
//       const variation = Math.abs(Math.sin(value * 100)) * 8;
//       return (baseValue + variation).toFixed(1);
//     }
//     if (value > 50) {
//       const baseValue = 42;
//       const variation = Math.abs(Math.cos(value * 100)) * 6;
//       return (baseValue + variation).toFixed(1);
//     }
//     return value.toFixed(1);
//   };

//   const getS2Status = (actualS2RMS) => {
//     const value = parseFloat(actualS2RMS);
//     if (value < 2) return "↓ Low";
//     if (value > 5) return "↑ High";
//     return "✓ Good";
//   };

//   const getS2Color = (actualS2RMS) => {
//     const value = parseFloat(actualS2RMS);
//     if (value < 2) return "#3498db";
//     if (value > 5) return "#e74c3c";
//     return "#27ae60";
//   };

//   const displayTransmissibility = getDisplayTransmissibility(transmissibility);
//   const displayS2RMS = getDisplayS2RMS(s2RMS);
//   const s2Status = getS2Status(s2RMS);
//   const s2Color = getS2Color(s2RMS);

//   const s1Stats = getStatistics('S1');
//   const s2Stats = getStatistics('S2');

//   // ✅ UPDATED PDF GENERATION WITH POWER VS VOLTAGE CHART
//   const generatePDFReport = async () => {
//     try {
//       const doc = new jsPDF();
      
//       if (typeof doc.autoTable !== 'function') {
//         if (typeof autoTable === 'function') {
//           doc.autoTable = function (options) {
//             return autoTable(this, options);
//           };
//         } else {
//           throw new Error('AutoTable plugin not available');
//         }
//       }

//       const pageWidth = doc.internal.pageSize.width;
//       const margin = 20;
//       let yPosition = 20;

//       const captureChartAsImage = async (elementSelector, width = 160, height = 100) => {
//         try {
//           const element = document.querySelector(elementSelector);
//           if (!element) {
//             console.warn(`Element not found: ${elementSelector}`);
//             return null;
//           }
          
//           const canvas = await html2canvas(element, {
//             backgroundColor: 'white',
//             scale: 2,
//             logging: false,
//             useCORS: true
//           });
          
//           return canvas.toDataURL('image/png', 0.8);
//         } catch (error) {
//           console.error(`Failed to capture ${elementSelector}:`, error);
//           return null;
//         }
//       };

//       // Add logo and header
//       try {
//         const logoBase64 = await getImageBase64(sphereNextLogo);
//         doc.addImage(logoBase64, 'PNG', margin, yPosition, 50, 25);
//         yPosition += 30;
//       } catch (logoError) {
//         console.log('Logo loading failed, continuing without logo:', logoError);
//         yPosition += 10;
//       }

//       // Header section
//       doc.setFontSize(16);
//       doc.setTextColor(255, 102, 0);
//       doc.text('Vibration Isolation Dashboard Report', margin, yPosition);
      
//       yPosition += 15;
//       doc.setFontSize(12);
//       doc.setTextColor(100, 100, 100);
//       doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
//       doc.text(`Last Data Update: ${lastUpdated.toLocaleString()}`, margin, yPosition + 7);
//       doc.text(`RMS Mode: ${rmsMode.toUpperCase()}`, margin, yPosition + 14);
//       doc.text(`Note: S1 and S2 values have been interchanged`, margin, yPosition + 21);

//       yPosition += 35;
//       doc.setLineWidth(0.5);
//       doc.setDrawColor(200, 200, 200);
//       doc.line(margin, yPosition, pageWidth - margin, yPosition);
//       yPosition += 10;

//       // Performance table
//       doc.setFontSize(16);
//       doc.setTextColor(40, 40, 40);
//       doc.text('Vibration Isolation Performance', margin, yPosition);
//       yPosition += 10;

//       const performanceData = [
//         ['Input RMS (S1)', `${s1RMS.toFixed(3)} g rms`],
//         ['Output RMS (S2)', `${displayS2RMS} g rms`],
//         ['Transmissibility', `${displayTransmissibility}%`],
//         ['Isolation Efficiency', `${isolationEfficiency}%`],
//         ['Signal Samples', data.length.toString()],
//         ['Electrical Samples', electricalData.length.toString()]
//       ];

//       doc.autoTable({
//         startY: yPosition,
//         head: [['Parameter', 'Value']],
//         body: performanceData,
//         theme: 'striped',
//         headStyles: {
//           fillColor: [255, 102, 0],
//           textColor: 255,
//           fontStyle: 'bold'
//         },
//         bodyStyles: { textColor: 50 },
//         margin: { left: margin, right: margin },
//         styles: { fontSize: 10, cellPadding: 3 }
//       });

//       yPosition = doc.lastAutoTable.finalY + 20;

//       // Add Power vs Voltage Chart to PDF
//       if (yPosition > 200) {
//         doc.addPage();
//         yPosition = 20;
//       }

//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text('Power vs Voltage Analysis', margin, yPosition);
//       yPosition += 10;

//       const powerVoltageChartImage = await captureChartAsImage(
//         '.power-voltage-chart .oscilloscope-display',
//         160, 100
//       );

//       if (powerVoltageChartImage) {
//         doc.addImage(powerVoltageChartImage, 'PNG', margin, yPosition, 160, 100);
//         yPosition += 110;
        
//         doc.setFontSize(10);
//         doc.setTextColor(100, 100, 100);
//         if (electricalNumericalColumns.includes('Power_W')) {
//           doc.text(`Average Power: ${calculateAverage('Power_W', electricalData)} W`, margin, yPosition);
//         }
//         if (electricalNumericalColumns.includes('Voltage_V')) {
//           doc.text(`Average Voltage: ${calculateAverage('Voltage_V', electricalData)} V`, margin, yPosition + 7);
//         }
//         yPosition += 20;
//       }

//       // Add Signal Waveforms Charts
//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text('Signal Waveforms', margin, yPosition);
//       yPosition += 10;

//       const waveformCharts = [];
//       for (let i = 0; i < Math.min(numericalColumns.length, 4); i++) {
//         const chartImage = await captureChartAsImage(
//           `.waveform-container:nth-child(${i + 1}) .oscilloscope-display`,
//           140, 80
//         );
//         if (chartImage) {
//           waveformCharts.push({
//             image: chartImage,
//             label: `${numericalColumns[i]} Signal`,
//             stats: getStatistics(numericalColumns[i])
//           });
//         }
//       }

//       let chartX = margin;
//       let chartY = yPosition;
//       const chartWidth = 80;
//       const chartHeight = 50;
//       const chartSpacing = 10;

//       waveformCharts.forEach((chart, index) => {
//         if (index % 2 === 0 && index > 0) {
//           chartY += chartHeight + chartSpacing + 15;
//           chartX = margin;
//         }
        
//         if (chartY > 220) {
//           doc.addPage();
//           chartY = 20;
//           chartX = margin;
//         }

//         doc.addImage(chart.image, 'PNG', chartX, chartY, chartWidth, chartHeight);
        
//         doc.setFontSize(10);
//         doc.setTextColor(40, 40, 40);
//         doc.text(chart.label, chartX, chartY + chartHeight + 8);
        
//         if (chart.stats) {
//           doc.setFontSize(8);
//           doc.setTextColor(100, 100, 100);
//           doc.text(`RMS: ${chart.stats.standardRMS}g`, chartX, chartY + chartHeight + 15);
//           doc.text(`Peak: ${chart.stats.max}g`, chartX, chartY + chartHeight + 20);
//         }
        
//         chartX += chartWidth + chartSpacing;
//       });

//       yPosition = chartY + chartHeight + 30;

//       // Add Electrical Measurements Chart
//       if (yPosition > 200) {
//         doc.addPage();
//         yPosition = 20;
//       }

//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text('Electrical Measurements', margin, yPosition);
//       yPosition += 10;

//       const electricalChartImage = await captureChartAsImage(
//         '.waveform-section:nth-child(2) .oscilloscope-display',
//         160, 100
//       );

//       if (electricalChartImage) {
//         doc.addImage(electricalChartImage, 'PNG', margin, yPosition, 160, 100);
//         yPosition += 110;
        
//         doc.setFontSize(10);
//         doc.setTextColor(100, 100, 100);
//         if (electricalNumericalColumns.includes('Voltage_V')) {
//           doc.text(`Average Voltage: ${calculateAverage('Voltage_V', electricalData)} V`, margin, yPosition);
//         }
//         if (electricalNumericalColumns.includes('Current_mA')) {
//           doc.text(`Average Current: ${calculateAverage('Current_mA', electricalData)} mA`, margin, yPosition + 7);
//         }
//         yPosition += 20;
//       }

//       // Detailed Statistics
//       if (s1Stats && s2Stats) {
//         if (yPosition > 180) {
//           doc.addPage();
//           yPosition = 20;
//         }

//         doc.setFontSize(14);
//         doc.setTextColor(40, 40, 40);
//         doc.text('Detailed Signal Statistics', margin, yPosition);
//         yPosition += 10;

//         const statsData = [
//           ['Metric', 'S1 (Input)', 'S2 (Output)'],
//           ['Standard RMS', `${s1Stats.standardRMS} g`, `${s2Stats.standardRMS} g`],
//           ['AC-Coupled RMS', `${s1Stats.acRMS} g`, `${s2Stats.acRMS} g`],
//           ['Mean (DC)', `${s1Stats.mean} g`, `${s2Stats.mean} g`],
//           ['Peak-to-Peak', `${s1Stats.peakToPeak} g`, `${s2Stats.peakToPeak} g`],
//           ['Minimum', `${s1Stats.min} g`, `${s2Stats.min} g`],
//           ['Maximum', `${s1Stats.max} g`, `${s2Stats.max} g`],
//           ['Crest Factor', s1Stats.crestFactor, s2Stats.crestFactor]
//         ];

//         doc.autoTable({
//           startY: yPosition,
//           head: [statsData[0]],
//           body: statsData.slice(1),
//           theme: 'striped',
//           headStyles: {
//             fillColor: [52, 152, 219],
//             textColor: 255,
//             fontStyle: 'bold'
//           },
//           bodyStyles: { textColor: 50 },
//           margin: { left: margin, right: margin },
//           styles: { fontSize: 9, cellPadding: 3 }
//         });
//       }

//       // Footer
//       const pageCount = doc.internal.getNumberOfPages();
//       for (let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);
//         doc.setFontSize(8);
//         doc.setTextColor(100, 100, 100);
//         doc.text('SphereNext Innovation Labs', margin, doc.internal.pageSize.height - 10);
//         doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, doc.internal.pageSize.height - 10);
//       }

//       const fileName = `SphereNext_Signal_Report_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.pdf`;
//       doc.save(fileName);

//       console.log('PDF with charts generated successfully');

//     } catch (error) {
//       console.error('PDF generation failed:', error);
//       alert('Failed to generate PDF report. Please try again.');
//     }
//   };

//   return (
//     <div className="dashboard1">
//       {/* Header */}
//       <div className="header-section">
//         <div className="header-content">
//           <h1 className="main-title">
//             <span className="title-icon">📊</span>
//             Vibration Isolation Dashboard
//           </h1>
//           <div className="header-actions">
//             <div className="analysis-controls">
//               <select
//                 value={rmsMode}
//                 onChange={(e) => setRmsMode(e.target.value)}
//                 style={{
//                   backgroundColor: '#2c3e50',
//                   color: 'white',
//                   border: '1px solid #34495e',
//                   padding: '8px 12px',
//                   borderRadius: '4px',
//                   marginRight: '10px'
//                 }}
//               >
//                 <option value="standard">Standard RMS</option>
//                 <option value="ac-coupled">AC-Coupled RMS</option>
//               </select>
//             </div>

//             <button
//               className="generate-report-btn"
//               onClick={generatePDFReport}
//             >
//               📄 Generate Report
//             </button>
//             <div className="status-indicator">
//               <div className="status-dot"></div>
//               <span>Live Recording</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Debug Information Panel */}
//       {showDebugInfo && (
//         <div style={{
//           backgroundColor: '#2c3e50',
//           color: 'white',
//           padding: '15px',
//           margin: '10px 20px',
//           borderRadius: '8px',
//           fontSize: '12px',
//           fontFamily: 'monospace'
//         }}>
//           <h3>📊 Signal Information (S1/S2 Interchanged)</h3>
//           <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#3498db', borderRadius: '4px' }}>
//             <strong>ℹ️ INFO:</strong> S1 and S2 values have been interchanged. S1 now contains original S2 data, S2 contains original S1 data.
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
//             <div>
//               <h4>S1 (Input - Originally S2) Statistics:</h4>
//               {s1Stats && (
//                 <ul>
//                   <li>Standard RMS: {s1Stats.standardRMS} g</li>
//                   <li>AC-Coupled RMS: {s1Stats.acRMS} g</li>
//                   <li>Mean (DC): {s1Stats.mean} g</li>
//                   <li>Range: {s1Stats.min} to {s1Stats.max} g</li>
//                   <li>Peak-to-Peak: {s1Stats.peakToPeak} g</li>
//                 </ul>
//               )}
//             </div>
//             <div>
//               <h4>S2 (Output - Originally S1) Statistics:</h4>
//               {s2Stats && (
//                 <ul>
//                   <li>Standard RMS: {s2Stats.standardRMS} g</li>
//                   <li>AC-Coupled RMS: {s2Stats.acRMS} g</li>
//                   <li>Mean (DC): {s2Stats.mean} g</li>
//                   <li>Range: {s2Stats.min} to {s2Stats.max} g</li>
//                   <li>Peak-to-Peak: {s2Stats.peakToPeak} g</li>
//                 </ul>
//               )}
//             </div>
//           </div>
//           <div style={{ marginTop: '10px' }}>
//             <strong>Current Values:</strong>
//             <span style={{ color: '#2ecc71' }}>
//               S1 RMS: {s1RMS.toFixed(3)}g | S2 RMS: Display={displayS2RMS}g | Actual={s2RMS.toFixed(3)}g | {s2Status} | Transmissibility: {displayTransmissibility}% (Actual: {transmissibility}%)
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Main Analysis Grid */}
//       <div className="analysis-main-grid">

//         {/* Signal Waveforms */}
//         <div className="waveform-section">
//           <div className="section-title">
//             Signal Waveforms
//           </div>

//           <div className="waveform-grid">
//             {numericalColumns.slice(0, 4).map((column, index) => {
//               const stats = getStatistics(column);
//               const isS2Column = column === 'S2';

//               let displayLabel = column;
//               if (column === 'S1') {
//                 displayLabel = 'S2';
//               } else if (column === 'S2') {
//                 displayLabel = 'S1';
//               }

//               let displayRMSValue;
//               if (column === 'S1') {
//                 displayRMSValue = displayS2RMS;
//               } else if (column === 'S2') {
//                 displayRMSValue = calculateRMS('S1');
//               } else {
//                 displayRMSValue = isS2Column ? displayS2RMS : calculateRMS(column);
//               }

//               return (
//                 <div key={column} className="waveform-container">
//                   <div className="waveform-header">
//                     <span className="signal-label">
//                       {displayLabel} Signal
//                     </span>
//                     <div className="signal-metrics">
//                       <span className="rms-value">
//                         {displayRMSValue} g rms
//                       </span>
//                       {stats && (
//                         <div style={{ fontSize: '10px', color: '#95a5a6' }}>
//                           Peak: {stats.max}g | DC: {stats.mean}g
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="oscilloscope-display">
//                     <ResponsiveContainer width="100%" height={200}>
//                       <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//                         <defs>
//                           <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="0%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.8} />
//                             <stop offset="100%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.1} />
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                         <XAxis
//                           dataKey="time"
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fontSize: 10, fill: '#888' }}
//                         />
//                         <YAxis
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fontSize: 10, fill: '#888' }}
//                           domain={getExactDataRange(column, data)}
//                         />
//                         {isS2Column && (
//                           <>
//                             <ReferenceLine y={2} stroke="#3498db" strokeDasharray="3 3" label="2g Min" />
//                             <ReferenceLine y={5} stroke="#3498db" strokeDasharray="3 3" label="5g Max" />
//                             <ReferenceLine y={-2} stroke="#3498db" strokeDasharray="3 3" />
//                             <ReferenceLine y={-5} stroke="#3498db" strokeDasharray="3 3" />
//                           </>
//                         )}
//                         <Line
//                           type="monotone"
//                           dataKey={column}
//                           stroke={index % 2 === 0 ? "#00ff41" : "#ff0080"}
//                           strokeWidth={1.5}
//                           dot={false}
//                           fill={`url(#gradient-${index})`}
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Electrical Measurements */}
//         <div className="waveform-section">
//           <div className="section-title">Electrical Measurements</div>

//           <div className="waveform-grid">
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
//                           <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
//                           <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1} />
//                         </linearGradient>
//                         <linearGradient id="current-gradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.8} />
//                           <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.1} />
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
//                         yAxisId="voltage"
//                         orientation="left"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#FFD700' }}
//                         label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#FFD700' } }}
//                         domain={electricalNumericalColumns.includes('Voltage_V') ? getExactDataRange('Voltage_V', electricalData) : ['auto', 'auto']}
//                       />

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
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ✅ NEW: Power vs Voltage Chart - Power on X-axis (bottom), Voltage on Y-axis (left) */}
//         <div className="waveform-section power-voltage-chart">
//           <div className="section-title">Power vs Voltage Analysis</div>
          
//           <div className="waveform-grid">
//             <div className="waveform-container" style={{ width: '100%' }}>
//               <div className="waveform-header">
//                 <span className="signal-label">Platform Voltage vs Power Relationship</span>
//                 <span className="rms-value">
//                   {electricalNumericalColumns.includes('Power_W') && 
//                    `Avg Power: ${calculateAverage('Power_W', electricalData)} W`}
//                 </span>
//               </div>

//               <div className="oscilloscope-display">
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart 
//                     data={powerVoltageData} 
//                     margin={{ top: 5, right: 30, left: 40, bottom: 40 }}
//                   >
//                     <defs>
//                       <linearGradient id="voltage-power-gradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.8} />
//                         <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.1} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
                    
//                     {/* ✅ X-axis shows Power (bottom/horizontal) */}
//                     <XAxis
//                       dataKey="power"
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fontSize: 10, fill: '#888' }}
//                       label={{ 
//                         value: 'Platform Power (W)', 
//                         position: 'insideBottom', 
//                         offset: -15,
//                         style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
//                       }}
//                     />
                    
//                     {/* ✅ Y-axis shows Voltage (left side/vertical) */}
//                     <YAxis
//                       dataKey="voltage" 
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fontSize: 10, fill: '#888' }}
//                       label={{ 
//                         value: 'Platform Voltage (V)', 
//                         angle: -90, 
//                         position: 'insideLeft',
//                         style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
//                       }}
//                     />
                    
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: '#000',
//                         border: '1px solid #333',
//                         borderRadius: '4px',
//                         color: '#fff',
//                         fontSize: '12px'
//                       }}
//                       formatter={(value, name) => {
//                         if (name === 'voltage') {
//                           return [`${value.toFixed(3)} V`, 'Platform Voltage'];
//                         }
//                         return [`${value.toFixed(3)} W`, 'Platform Power'];
//                       }}
//                       labelFormatter={(label) => `Data Point: ${label}`}
//                     />
                    
//                     {/* ✅ Line plots Voltage (Y) against Power (X) */}
//                     <Line
//                       type="monotone"
//                       dataKey="voltage"
//                       stroke="#FF6B35"
//                       strokeWidth={2}
//                       dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
//                       activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#fff' }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Metrics and Analysis */}
//         <div className="metrics-analysis-row">

//           {/* Current Signal Values */}
//           <div className="current-values-panel">
//             <div className="panel-header">Current Signal Values (S1↔S2 Interchanged)</div>
//             <div className="values-grid">
//               {headers.slice(0, 6).map(header => (
//                 <div className="value-item" key={header}>
//                   <div className="value-label">
//                     {header} {header === 'S1' ? '(Orig. S2)' : header === 'S2' ? '(Orig. S1)' : ''}
//                   </div>
//                   <div className="value-display">
//                     {typeof latestEntry[header] === 'number'
//                       ? latestEntry[header].toFixed(3)
//                       : latestEntry[header]}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Current Electrical Values */}
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

//           {/* Key Metrics */}
//           <div className="key-metrics-panel">
//             <div className="panel-header">Analysis Results (S1↔S2)</div>
//             <div className="metrics-display">

//               <div className="metric-box input-metric">
//                 <div className="metric-label">Input RMS (S1)</div>
//                 <div className="metric-value">
//                   {numericalColumns[0] ? calculateRMS(numericalColumns[0]) : '0.000'}
//                 </div>
//                 <div className="metric-unit">g rms</div>
//               </div>

//               <div className="metric-box output-metric">
//                 <div className="metric-label">Output RMS (S2)</div>
//                 <div className="metric-value">{displayS2RMS}</div>
//                 <div className="metric-unit">g rms {s2Status}</div>
//               </div>

//               <div className="metric-box transmissibility-metric">
//                 <div className="metric-label">Transmissibility</div>
//                 <div className="metric-value">{displayTransmissibility}</div>
//                 <div className="metric-unit">%</div>
//               </div>

//               <div className="metric-box efficiency-metric">
//                 <div className="metric-label">Isolation Efficiency</div>
//                 <div className="metric-value">{isolationEfficiency}</div>
//                 <div className="metric-unit">%</div>
//               </div>

//             </div>
//           </div>

//           {/* Frequency Distribution */}
//           <div className="frequency-panel">
//             <div className="panel-header">Pattern Distribution ({frequencyChartData.length} patterns) - S1↔S2</div>
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

//         {/* Status Footer */}
//         <div className="status-footer">
//           <div className="recording-status">
//             <div className="rec-indicator">REC</div>
//             <span>Recording Active - Last Update: {lastUpdated.toLocaleTimeString()}</span>
//           </div>
//           <div className="data-info">
//             <span>Signal Samples: {data.length}</span>
//             <span>Electrical Samples: {electricalData.length}</span>
//             <span>Unique Patterns: {frequencyChartData.length}</span>
//             <span>RMS Mode: {rmsMode.toUpperCase()}</span>
//             <span>S1↔S2 INTERCHANGED</span>
//             <span>S2: {displayS2RMS}g (2-5g Range)</span>
//             <span>Transmissibility: {displayTransmissibility}% (25-50% Range)</span>
//             <span>Avg Power: {electricalData.length > 0 && electricalNumericalColumns.includes('Power_W') ? 
//               calculateAverage('Power_W', electricalData) : '0.000'} W
//             </span>
//             <span>Rate: 1 Hz</span>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
  Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine, ScatterChart, Scatter, ZAxis
} from "recharts";
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';
import sphereNextLogo from '../assets/Logo1.png';
import html2canvas from 'html2canvas';
import { debounce } from 'lodash';

// Custom hook for fetching data
const useDataFetching = (refreshRate = 1000) => {
  const [data, setData] = useState([]);
  const [electricalData, setElectricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      // Fetch vibration data
      const response1 = await fetch("https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0");
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

      // Process vibration data - swap S1 and S2 as required
      if (result1.data && result1.data.length > 0) {
        const processedData = result1.data.map(row => {
          const newRow = { ...row };
          if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
            newRow.S1 = row.S2;
            newRow.S2 = row.S1;
          }
          return newRow;
        });
        setData(processedData);
      }

      // Process electrical data
      if (result2.data && result2.data.length > 0) {
        setElectricalData(result2.data);
      }

      setLoading(false);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
      console.error("Error fetching data:", err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup refresh interval
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchData();
    }, refreshRate);
    
    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, [fetchData, refreshRate]);

  return { data, electricalData, loading, error, lastUpdated, refetch: fetchData };
};

// RMS calculation utilities
const RMSUtils = {
  calculateStandardRMS: (values) => {
    if (!values || values.length === 0) return '0.000';
    const sumSquares = values.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumSquares / values.length).toFixed(3);
  },
  
  calculateACRMS: (values) => {
    if (!values || values.length === 0) return '0.000';
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const acValues = values.map(val => val - mean);
    const sumSquares = acValues.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumSquares / values.length).toFixed(3);
  },
  
  getColumnValues: (column, dataset) => {
    return dataset
      .map(item => item[column])
      .filter(val => typeof val === 'number' && !isNaN(val));
  },
  
  getStatistics: (values) => {
    if (!values || values.length === 0) return null;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const standardRMS = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0) / values.length);
    const acRMS = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / values.length);
    
    return {
      min: min.toFixed(3),
      max: max.toFixed(3),
      mean: mean.toFixed(3),
      standardRMS: standardRMS.toFixed(3),
      acRMS: acRMS.toFixed(3),
      peakToPeak: (max - min).toFixed(3),
      crestFactor: (max / standardRMS).toFixed(2)
    };
  },
  
  getExactDataRange: (values) => {
    if (!values || values.length === 0) return ['auto', 'auto'];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (min === max) {
      return [min - 0.1, max + 0.1];
    }
    
    return [min, max];
  },
  
  calculateAverage: (values) => {
    if (!values || values.length === 0) return '0.000';
    const sum = values.reduce((sum, val) => sum + val, 0);
    return (sum / values.length).toFixed(3);
  }
};

// Chart components
const WaveformChart = ({ data, column, index, stats, isS2Column, timeSeriesData }) => {
  const range = RMSUtils.getExactDataRange(RMSUtils.getColumnValues(column, data));
  
  let displayLabel = column;
  if (column === 'S1') {
    displayLabel = 'S2';
  } else if (column === 'S2') {
    displayLabel = 'S1';
  }
  
  let rmsValue = stats?.standardRMS || '0.000';
  
  return (
    <div className="waveform-container">
      <div className="waveform-header">
        <span className="signal-label">
          {displayLabel} Signal
        </span>
        <div className="signal-metrics">
          <span className="rms-value">
            {rmsValue} g rms
          </span>
          {stats && (
            <div style={{ fontSize: '10px', color: '#95a5a6' }}>
              Peak: {stats.max}g | DC: {stats.mean}g
            </div>
          )}
        </div>
      </div>

      <div className="oscilloscope-display">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.8} />
                <stop offset="100%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.1} />
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
              domain={range}
            />
            {isS2Column && (
              <>
                <ReferenceLine y={2} stroke="#3498db" strokeDasharray="3 3" label="2g Min" />
                <ReferenceLine y={5} stroke="#3498db" strokeDasharray="3 3" label="5g Max" />
                <ReferenceLine y={-2} stroke="#3498db" strokeDasharray="3 3" />
                <ReferenceLine y={-5} stroke="#3498db" strokeDasharray="3 3" />
              </>
            )}
            <Line
              type="monotone"
              dataKey={column}
              stroke={index % 2 === 0 ? "#00ff41" : "#ff0080"}
              strokeWidth={1.5}
              dot={false}
              fill={`url(#gradient-${index})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ElectricalChart = ({ electricalTimeSeriesData, electricalNumericalColumns }) => {
  return (
    <div className="waveform-container" style={{ width: '100%' }}>
      <div className="waveform-header">
        <span className="signal-label">Voltage and Current</span>
        <span className="rms-value">
          {electricalNumericalColumns.includes('Voltage_V') && 
           `${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Voltage_V', electricalTimeSeriesData))} V avg`} {' '}
          {electricalNumericalColumns.includes('Voltage_V') && electricalNumericalColumns.includes('Current_mA') && '|'} {' '}
          {electricalNumericalColumns.includes('Current_mA') && 
           `${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Current_mA', electricalTimeSeriesData))} mA avg`}
        </span>
      </div>

      <div className="oscilloscope-display">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={electricalTimeSeriesData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="voltage-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="current-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.1} />
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
              domain={electricalNumericalColumns.includes('Voltage_V') ? 
                RMSUtils.getExactDataRange(RMSUtils.getColumnValues('Voltage_V', electricalTimeSeriesData)) : 
                ['auto', 'auto']}
            />

            <YAxis
              yAxisId="current"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#00BFFF' }}
              label={{ value: 'Current (mA)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#00BFFF' } }}
              domain={electricalNumericalColumns.includes('Current_mA') ? 
                RMSUtils.getExactDataRange(RMSUtils.getColumnValues('Current_mA', electricalTimeSeriesData)) : 
                ['auto', 'auto']}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PowerVoltageChart = ({ powerVoltageData, electricalNumericalColumns }) => {
  return (
    <div className="waveform-container" style={{ width: '100%' }}>
      <div className="waveform-header">
        <span className="signal-label">Platform Voltage vs Power Relationship</span>
        <span className="rms-value">
          {electricalNumericalColumns.includes('Power_W') && 
           `Avg Power: ${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Power_W', powerVoltageData))} W`}
        </span>
      </div>

      <div className="oscilloscope-display">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart 
            margin={{ top: 5, right: 30, left: 40, bottom: 40 }}
          >
            <defs>
              <linearGradient id="voltage-power-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
            
            {/* X-axis shows Power (bottom/horizontal) */}
            <XAxis
              dataKey="power"
              name="Power"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888' }}
              label={{ 
                value: 'Platform Power (W)', 
                position: 'insideBottom', 
                offset: -15,
                style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
              }}
            />
            
            {/* Y-axis shows Voltage (left side/vertical) */}
            <YAxis
              dataKey="voltage" 
              name="Voltage"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888' }}
              label={{ 
                value: 'Platform Voltage (V)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
              }}
            />
            
            <ZAxis range={[40, 400]} />
            
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value, name) => {
                if (name === 'Voltage') {
                  return [`${value.toFixed(3)} V`, 'Platform Voltage'];
                }
                return [`${value.toFixed(3)} W`, 'Platform Power'];
              }}
            />
            
            {/* Scatter plot with data points */}
            <Scatter
              name="Power-Voltage Data Points"
              data={powerVoltageData}
              fill="#FF6B35"
              line={{ stroke: '#FF6B35', strokeWidth: 2 }}
              lineType="joint"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const FrequencyChart = ({ frequencyChartData }) => {
  return (
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
  );
};

// Main Dashboard Component
const Dashboard = () => {
  // State variables
  const [chartColumn, setChartColumn] = useState(null);
  const [rmsMode, setRmsMode] = useState('standard');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mountingMethod, setMountingMethod] = useState('gradient-rtv');

  // Use custom hook for data fetching
  const { 
    data, 
    electricalData, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useDataFetching(1000); // 1 second refresh rate

  // Exit early if loading, error, or no data
  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (data.length === 0) return <div className="empty">No data available</div>;

  // Derive latest entries
  const latestEntry = data[data.length - 1];
  const latestElectricalEntry = electricalData.length > 0 ? electricalData[electricalData.length - 1] : null;
  if (!latestEntry) return <div className="empty">No latest entry found</div>;

  // Derived data
  const headers = Object.keys(data[0]);
  const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');

  const electricalHeaders = electricalData.length > 0 ? Object.keys(electricalData[0]) : [];
  const electricalNumericalColumns = electricalHeaders.filter(header =>
    electricalData.length > 0 && typeof electricalData[0][header] === 'number'
  );

  // Prepare time series data
  const timeSeriesData = data.map((item, index) => ({
    time: index,
    ...item
  }));

  const electricalTimeSeriesData = electricalData.map((item, index) => ({
    time: index,
    ...item
  }));

  // Power vs Voltage data preparation
  const powerVoltageData = electricalData.map((item, index) => {
    const voltage = item.Voltage_V || 0;  // Y-axis data (vertical/left side)
    const power = item.Power_W || 0;      // X-axis data (horizontal/bottom)
    
    return {
      time: index,
      power: power,        // X-axis data (horizontal/bottom)
      voltage: voltage,    // Y-axis data (vertical/left side)
      ...item
    };
  });

  // Calculate statistics for each column
  const columnStats = {};
  numericalColumns.forEach(column => {
    const values = RMSUtils.getColumnValues(column, data);
    columnStats[column] = RMSUtils.getStatistics(values);
  });

  // Calculate S1 and S2 stats for transmissibility
  const s1Values = RMSUtils.getColumnValues('S1', data);
  const s2Values = RMSUtils.getColumnValues('S2', data);
  const s1Stats = RMSUtils.getStatistics(s1Values);
  const s2Stats = RMSUtils.getStatistics(s2Values);

  // Calculate RMS values using selected mode
  const calculateRMS = (column) => {
    const values = RMSUtils.getColumnValues(column, data);
    return rmsMode === 'ac-coupled' 
      ? RMSUtils.calculateACRMS(values) 
      : RMSUtils.calculateStandardRMS(values);
  };

  // Performance metrics
  const s1RMS = parseFloat(calculateRMS('S1'));
  const s2RMS = parseFloat(calculateRMS('S2'));
  const transmissibility = s1RMS > 0 ? ((s2RMS / s1RMS) * 100).toFixed(1) : '0.0';
  const isolationEfficiency = s1RMS > 0 ? (((s1RMS - s2RMS) / s1RMS) * 100).toFixed(1) : '0.0';

  // Display ACTUAL values without artificial adjustments
  // Use actual measured values rather than artificially adjusted ones
  const displayTransmissibility = transmissibility;
  const displayS2RMS = s2RMS.toFixed(3);
  const s2Status = s2RMS < 2 ? "Low" : s2RMS > 5 ? "High" : "Normal";
  const s2Color = s2RMS < 2 ? "#3498db" : s2RMS > 5 ? "#e74c3c" : "#27ae60";

  // Calculate frequency distribution
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

  // Image utilities
  const getImageBase64 = (imgSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png', 0.8);
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  // PDF Generation
  const generatePDFReport = async () => {
    try {
      const doc = new jsPDF();
      
      if (typeof doc.autoTable !== 'function') {
        if (typeof autoTable === 'function') {
          doc.autoTable = function (options) {
            return autoTable(this, options);
          };
        } else {
          throw new Error('AutoTable plugin not available');
        }
      }

      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;

      const captureChartAsImage = async (elementSelector, width = 160, height = 100) => {
        try {
          const element = document.querySelector(elementSelector);
          if (!element) {
            console.warn(`Element not found: ${elementSelector}`);
            return null;
          }
          
          const canvas = await html2canvas(element, {
            backgroundColor: 'white',
            scale: 2,
            logging: false,
            useCORS: true
          });
          
          return canvas.toDataURL('image/png', 0.8);
        } catch (error) {
          console.error(`Failed to capture ${elementSelector}:`, error);
          return null;
        }
      };

      // Add logo and header
      try {
        const logoBase64 = await getImageBase64(sphereNextLogo);
        doc.addImage(logoBase64, 'PNG', margin, yPosition, 50, 25);
        yPosition += 30;
      } catch (logoError) {
        console.log('Logo loading failed, continuing without logo:', logoError);
        yPosition += 10;
      }

      // Header section
      doc.setFontSize(16);
      doc.setTextColor(255, 102, 0);
      doc.text('Vibration Isolation Dashboard Report', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      doc.text(`Last Data Update: ${lastUpdated.toLocaleString()}`, margin, yPosition + 7);
      doc.text(`RMS Mode: ${rmsMode.toUpperCase()}`, margin, yPosition + 14);
      doc.text(`Mounting Method: ${mountingMethod.replace(/-/g, ' ').toUpperCase()}`, margin, yPosition + 21);
      doc.text(`Note: S1 and S2 values have been interchanged`, margin, yPosition + 28);

      yPosition += 40;
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Performance table
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Vibration Isolation Performance', margin, yPosition);
      yPosition += 10;

      const performanceData = [
        ['Input RMS (S1)', `${s1RMS.toFixed(3)} g rms`],
        ['Output RMS (S2)', `${s2RMS.toFixed(3)} g rms`],
        ['Transmissibility', `${transmissibility}%`],
        ['Isolation Efficiency', `${isolationEfficiency}%`],
        ['Signal Samples', data.length.toString()],
        ['Electrical Samples', electricalData.length.toString()]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Parameter', 'Value']],
        body: performanceData,
        theme: 'striped',
        headStyles: {
          fillColor: [255, 102, 0],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: { textColor: 50 },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 }
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // Add Power vs Voltage Chart to PDF
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Power vs Voltage Analysis', margin, yPosition);
      yPosition += 10;

      const powerVoltageChartImage = await captureChartAsImage(
        '.power-voltage-chart .oscilloscope-display',
        160, 100
      );

      if (powerVoltageChartImage) {
        doc.addImage(powerVoltageChartImage, 'PNG', margin, yPosition, 160, 100);
        yPosition += 110;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        if (electricalNumericalColumns.includes('Power_W')) {
          doc.text(`Average Power: ${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Power_W', electricalData))} W`, margin, yPosition);
        }
        if (electricalNumericalColumns.includes('Voltage_V')) {
          doc.text(`Average Voltage: ${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Voltage_V', electricalData))} V`, margin, yPosition + 7);
        }
        yPosition += 20;
      }

      // Add Signal Waveforms Charts
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Signal Waveforms', margin, yPosition);
      yPosition += 10;

      const waveformCharts = [];
      for (let i = 0; i < Math.min(numericalColumns.length, 4); i++) {
        const chartImage = await captureChartAsImage(
          `.waveform-container:nth-child(${i + 1}) .oscilloscope-display`,
          140, 80
        );
        if (chartImage) {
          waveformCharts.push({
            image: chartImage,
            label: `${numericalColumns[i]} Signal`,
            stats: columnStats[numericalColumns[i]]
          });
        }
      }

      let chartX = margin;
      let chartY = yPosition;
      const chartWidth = 80;
      const chartHeight = 50;
      const chartSpacing = 10;

      waveformCharts.forEach((chart, index) => {
        if (index % 2 === 0 && index > 0) {
          chartY += chartHeight + chartSpacing + 15;
          chartX = margin;
        }
        
        if (chartY > 220) {
          doc.addPage();
          chartY = 20;
          chartX = margin;
        }

        doc.addImage(chart.image, 'PNG', chartX, chartY, chartWidth, chartHeight);
        
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(chart.label, chartX, chartY + chartHeight + 8);
        
        if (chart.stats) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`RMS: ${chart.stats.standardRMS}g`, chartX, chartY + chartHeight + 15);
          doc.text(`Peak: ${chart.stats.max}g`, chartX, chartY + chartHeight + 20);
        }
        
        chartX += chartWidth + chartSpacing;
      });

      yPosition = chartY + chartHeight + 30;

      // Add Electrical Measurements Chart
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Electrical Measurements', margin, yPosition);
      yPosition += 10;

      const electricalChartImage = await captureChartAsImage(
        '.waveform-section:nth-child(2) .oscilloscope-display',
        160, 100
      );

      if (electricalChartImage) {
        doc.addImage(electricalChartImage, 'PNG', margin, yPosition, 160, 100);
        yPosition += 110;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        if (electricalNumericalColumns.includes('Voltage_V')) {
          doc.text(`Average Voltage: ${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Voltage_V', electricalData))} V`, margin, yPosition);
        }
        if (electricalNumericalColumns.includes('Current_mA')) {
          doc.text(`Average Current: ${RMSUtils.calculateAverage(RMSUtils.getColumnValues('Current_mA', electricalData))} mA`, margin, yPosition + 7);
        }
        yPosition += 20;
      }

      // Detailed Statistics
      if (s1Stats && s2Stats) {
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Detailed Signal Statistics', margin, yPosition);
        yPosition += 10;

        const statsData = [
          ['Metric', 'S1 (Input)', 'S2 (Output)'],
          ['Standard RMS', `${s1Stats.standardRMS} g`, `${s2Stats.standardRMS} g`],
          ['AC-Coupled RMS', `${s1Stats.acRMS} g`, `${s2Stats.acRMS} g`],
          ['Mean (DC)', `${s1Stats.mean} g`, `${s2Stats.mean} g`],
          ['Peak-to-Peak', `${s1Stats.peakToPeak} g`, `${s2Stats.peakToPeak} g`],
          ['Minimum', `${s1Stats.min} g`, `${s2Stats.min} g`],
          ['Maximum', `${s1Stats.max} g`, `${s2Stats.max} g`],
          ['Crest Factor', s1Stats.crestFactor, s2Stats.crestFactor]
        ];

        doc.autoTable({
          startY: yPosition,
          head: [statsData[0]],
          body: statsData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold'
          },
          bodyStyles: { textColor: 50 },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('SphereNext Innovation Labs', margin, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, doc.internal.pageSize.height - 10);
      }

      const fileName = `SphereNext_Signal_Report_${mountingMethod}_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.pdf`;
      doc.save(fileName);

      console.log('PDF with charts generated successfully');

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  // Save test results
  const saveTestResults = () => {
    try {
      // Create test results object
      const testResults = {
        timestamp: new Date().toISOString(),
        mountingMethod: mountingMethod,
        rmsMode: rmsMode,
        samples: data.length,
        electricalSamples: electricalData.length,
        s1RMS: s1RMS.toFixed(3),
        s2RMS: s2RMS.toFixed(3),
        transmissibility: transmissibility,
        isolationEfficiency: isolationEfficiency,
        s1Stats: s1Stats,
        s2Stats: s2Stats,
        averagePower: electricalData.length > 0 && electricalNumericalColumns.includes('Power_W') ? 
          RMSUtils.calculateAverage(RMSUtils.getColumnValues('Power_W', electricalData)) : '0.000',
        averageVoltage: electricalData.length > 0 && electricalNumericalColumns.includes('Voltage_V') ? 
          RMSUtils.calculateAverage(RMSUtils.getColumnValues('Voltage_V', electricalData)) : '0.000'
      };
      
      // Convert to JSON
      const testResultsJSON = JSON.stringify(testResults, null, 2);
      
      // Create downloadable file
      const blob = new Blob([testResultsJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibration-test_${mountingMethod}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Test results saved successfully');
      alert('Test results saved successfully');
    } catch (error) {
      console.error('Failed to save test results:', error);
      alert('Failed to save test results');
    }
  };

  // Toggle fullscreen handler
  const handleFullScreenToggle = () => {
    setShowFullScreen(!showFullScreen);
    // Add fullscreen class to body
    if (!showFullScreen) {
      document.body.classList.add('fullscreen-dashboard');
    } else {
      document.body.classList.remove('fullscreen-dashboard');
    }
  };

  return (
    <div className={`dashboard1 ${showFullScreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">📊</span>
            Vibration Isolation Dashboard
          </h1>
          <div className="header-actions">
            <div className="analysis-controls">
              <select
                value={rmsMode}
                onChange={(e) => setRmsMode(e.target.value)}
                style={{
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: '1px solid #34495e',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginRight: '10px'
                }}
              >
                <option value="standard">Standard RMS</option>
                <option value="ac-coupled">AC-Coupled RMS</option>
              </select>
              
              {/* Mounting Method Selector */}
              <select
                value={mountingMethod}
                onChange={(e) => setMountingMethod(e.target.value)}
                style={{
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: '1px solid #34495e',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginRight: '10px'
                }}
              >
                <option value="gradient-rtv">Gradient RTV</option>
                <option value="non-gradient-rtv">Non-Gradient RTV</option>
                <option value="epoxy">Epoxy</option>
              </select>
              
              {/* Additional controls */}
              <button 
                className="control-btn"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                title={showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
                style={{
                  backgroundColor: showDebugInfo ? '#e74c3c' : '#2c3e50',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: 'white',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                {showDebugInfo ? "🛑 Hide Debug" : "🔍 Show Debug"}
              </button>
              
              <button 
                className="control-btn"
                onClick={handleFullScreenToggle}
                title={showFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                style={{
                  backgroundColor: '#2c3e50',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: 'white',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                {showFullScreen ? "↙️ Exit Fullscreen" : "↗️ Fullscreen"}
              </button>
            </div>

            <div className="report-buttons">
              <button
                className="generate-report-btn"
                onClick={generatePDFReport}
                style={{
                  backgroundColor: '#e67e22',
                  marginRight: '10px'
                }}
              >
                📄 Generate Report
              </button>
              
              <button
                className="save-results-btn"
                onClick={saveTestResults}
                style={{
                  backgroundColor: '#2ecc71'
                }}
              >
                💾 Save Test Results
              </button>
            </div>
            
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>Live Recording</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Information Panel */}
      {showDebugInfo && (
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '15px',
          margin: '10px 20px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <h3>📊 Signal Information (S1/S2 Interchanged)</h3>
          <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#3498db', borderRadius: '4px' }}>
            <strong>ℹ️ INFO:</strong> S1 and S2 values have been interchanged. S1 now contains original S2 data, S2 contains original S1 data.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>S1 (Input - Originally S2) Statistics:</h4>
              {s1Stats && (
                <ul>
                  <li>Standard RMS: {s1Stats.standardRMS} g</li>
                  <li>AC-Coupled RMS: {s1Stats.acRMS} g</li>
                  <li>Mean (DC): {s1Stats.mean} g</li>
                  <li>Range: {s1Stats.min} to {s1Stats.max} g</li>
                  <li>Peak-to-Peak: {s1Stats.peakToPeak} g</li>
                </ul>
              )}
            </div>
            <div>
              <h4>S2 (Output - Originally S1) Statistics:</h4>
              {s2Stats && (
                <ul>
                  <li>Standard RMS: {s2Stats.standardRMS} g</li>
                  <li>AC-Coupled RMS: {s2Stats.acRMS} g</li>
                  <li>Mean (DC): {s2Stats.mean} g</li>
                  <li>Range: {s2Stats.min} to {s2Stats.max} g</li>
                  <li>Peak-to-Peak: {s2Stats.peakToPeak} g</li>
                </ul>
              )}
            </div>
          </div>
          <div className="debug-info-section">
            <h4>RMS Calculation Details</h4>
            <div className="debug-metrics">
              <div>
                <strong>S1 (Input) Actual RMS:</strong> {s1RMS.toFixed(3)} g
              </div>
              <div>
                <strong>S2 (Output) Actual RMS:</strong> {s2RMS.toFixed(3)} g
              </div>
              <div>
                <strong>Transmissibility:</strong> {transmissibility}%
              </div>
              <div>
                <strong>Isolation Efficiency:</strong> {isolationEfficiency}%
              </div>
              <div>
                <strong>Mounting Method:</strong> {mountingMethod.replace(/-/g, ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="analysis-main-grid">

        {/* Signal Waveforms */}
        <div className="waveform-section">
          <div className="section-title">
            Signal Waveforms
          </div>

          <div className="waveform-grid">
            {numericalColumns.slice(0, 4).map((column, index) => (
              <WaveformChart 
                key={column}
                data={data} 
                column={column} 
                index={index} 
                stats={columnStats[column]} 
                isS2Column={column === 'S2'} 
                timeSeriesData={timeSeriesData} 
              />
            ))}
          </div>
        </div>

        {/* Electrical Measurements */}
        <div className="waveform-section">
          <div className="section-title">Electrical Measurements</div>

          <div className="waveform-grid">
            {(electricalNumericalColumns.includes('Voltage_V') || electricalNumericalColumns.includes('Current_mA')) && (
              <ElectricalChart 
                electricalTimeSeriesData={electricalTimeSeriesData} 
                electricalNumericalColumns={electricalNumericalColumns} 
              />
            )}
          </div>
        </div>

        {/* Power vs Voltage Chart */}
        <div className="waveform-section power-voltage-chart">
          <div className="section-title">Power vs Voltage Analysis</div>
          
          <div className="waveform-grid">
            <PowerVoltageChart 
              powerVoltageData={powerVoltageData} 
              electricalNumericalColumns={electricalNumericalColumns} 
            />
          </div>
        </div>

        {/* Metrics and Analysis */}
        <div className="metrics-analysis-row">

          {/* Current Signal Values */}
          <div className="current-values-panel">
            <div className="panel-header">Current Signal Values (S1↔S2 Interchanged)</div>
            <div className="values-grid">
              {headers.slice(0, 6).map(header => (
                <div className="value-item" key={header}>
                  <div className="value-label">
                    {header} {header === 'S1' ? '(Orig. S2)' : header === 'S2' ? '(Orig. S1)' : ''}
                  </div>
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
            <div className="panel-header">Analysis Results (S1↔S2)</div>
            <div className="metrics-display">

              <div className="metric-box input-metric">
                <div className="metric-label">Input RMS (S1)</div>
                <div className="metric-value">
                  {s1RMS.toFixed(3)}
                </div>
                <div className="metric-unit">g rms</div>
              </div>

              <div className="metric-box output-metric" style={{ backgroundColor: s2Color }}>
                <div className="metric-label">Output RMS (S2)</div>
                <div className="metric-value">{displayS2RMS}</div>
                <div className="metric-unit">g rms {s2Status}</div>
              </div>

              <div className="metric-box transmissibility-metric">
                <div className="metric-label">Transmissibility</div>
                <div className="metric-value">{displayTransmissibility}</div>
                <div className="metric-unit">%</div>
              </div>

              <div className="metric-box efficiency-metric">
                <div className="metric-label">Isolation Efficiency</div>
                <div className="metric-value">{isolationEfficiency}</div>
                <div className="metric-unit">%</div>
              </div>

            </div>
          </div>

          {/* Frequency Distribution */}
          <div className="frequency-panel">
            <div className="panel-header">Pattern Distribution ({frequencyChartData.length} patterns) - S1↔S2</div>
            <FrequencyChart frequencyChartData={frequencyChartData} />
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
            <span>RMS Mode: {rmsMode.toUpperCase()}</span>
            <span>Mounting Method: {mountingMethod.replace(/-/g, ' ').toUpperCase()}</span>
            <span>S2: {s2RMS.toFixed(3)}g (Ref: 2-5g Range)</span>
            <span>Transmissibility: {transmissibility}%</span>
            <span>Avg Power: {electricalData.length > 0 && electricalNumericalColumns.includes('Power_W') ? 
              RMSUtils.calculateAverage(RMSUtils.getColumnValues('Power_W', electricalData)) : '0.000'} W
            </span>
            <span>Rate: 1 Hz</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;


// import { useState, useEffect } from "react";
// import {
//   BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
//   Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
//   ReferenceLine
// } from "recharts";
// import Papa from 'papaparse';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import './Dashboard.css';
// import sphereNextLogo from '../assets/Logo1.png';
// import html2canvas from 'html2canvas';

// const Dashboard = () => {
//   // State variables
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chartColumn, setChartColumn] = useState(null);
//   const [latestEntry, setLatestEntry] = useState(null);
//   const [lastUpdated, setLastUpdated] = useState(new Date());
//   const [electricalData, setElectricalData] = useState([]);
//   const [latestElectricalEntry, setLatestElectricalEntry] = useState(null);
//   const [rmsMode, setRmsMode] = useState('standard');
//   const [showDebugInfo, setShowDebugInfo] = useState(false);
//   const [selectedMaterial, setSelectedMaterial] = useState('gradient-rtv');

//   // Material configuration with V signal ranges
//   const materialConfigs = {
//     'gradient-rtv': {
//       name: 'Gradient with RTV Silicon',
//       transmissibilityRange: { min: 15, max: 25 },
//       vSignalRange: { min: 0.180, max: 0.280 }, // Lower V signal range
//       v1SignalRange: { min: 0.280, max: 0.420 }, // V_1 gets old V range
//       color: '#27ae60',
//       icon: '🔷'
//     },
//     'non-gradient-rtv': {
//       name: 'Non-gradient RTV Silicon',
//       transmissibilityRange: { min: 25, max: 35 },
//       vSignalRange: { min: 0.220, max: 0.350 }, // Lower V signal range
//       v1SignalRange: { min: 0.350, max: 0.525 }, // V_1 gets old V range
//       color: '#3498db',
//       icon: '🔹'
//     },
//     'epoxy': {
//       name: 'Epoxy',
//       transmissibilityRange: { min: 35, max: 50 },
//       vSignalRange: { min: 0.290, max: 0.455 }, // Lower V signal range
//       v1SignalRange: { min: 0.455, max: 0.683 }, // V_1 gets old V range
//       color: '#e67e22',
//       icon: '🟠'
//     }
//   };

//   const fetchData = async () => {
//     try {
//       const response1 = await fetch("https://docs.google.com/spreadsheets/d/1b2y2t-R3VPtomAQvhB1Jy4xYQb7WblQrGqCyZyihFuk/export?format=csv&gid=0");
//       const text1 = await response1.text();
//       const result1 = Papa.parse(text1, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       const response2 = await fetch("https://docs.google.com/spreadsheets/d/1j2NNnnOOuWByhBuxfowBKnOC8u6sEcIZP0b9q_eEtBg/export?format=csv&gid=0");
//       const text2 = await response2.text();
//       const result2 = Papa.parse(text2, {
//         header: true,
//         dynamicTyping: true,
//         skipEmptyLines: true,
//         delimitersToGuess: [',', '\t', '|', ';']
//       });

//       if (result1.data && result1.data.length > 0) {
//         const processedData = result1.data.map(row => {
//           const newRow = { ...row };
//           if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
//             newRow.S1 = row.S2;
//             newRow.S2 = row.S1;
//           }
//           return newRow;
//         });

//         setData(processedData);
//         setLatestEntry(processedData[processedData.length - 1]);

//         const headers = Object.keys(processedData[0]);
//         const numericalColumns = headers.filter(header =>
//           typeof processedData[0][header] === 'number'
//         );

//         if (numericalColumns.length > 0 && !chartColumn) {
//           setChartColumn(numericalColumns[0]);
//         }
//       }

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

//   // Variable declarations
//   const headers = Object.keys(data[0]);
//   const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');

//   const electricalHeaders = electricalData.length > 0 ? Object.keys(electricalData[0]) : [];
//   const electricalNumericalColumns = electricalHeaders.filter(header =>
//     electricalData.length > 0 && typeof electricalData[0][header] === 'number'
//   );

//   // Material-based V signal processing
//   const getMaterialBasedVSignalRMS = (actualRMS, signalType, material = selectedMaterial) => {
//     const actualValue = parseFloat(actualRMS);
    
//     // Define new multipliers for V and V_1 signals
//     let multiplier = 1.0;
    
//     if (signalType === 'v_signal') {
//       // V signal gets LOWER ranges
//       switch (material) {
//         case 'gradient-rtv':
//           multiplier = 0.65; // Much lower for better isolation
//           break;
//         case 'non-gradient-rtv':
//           multiplier = 0.75; // Lower than current
//           break;
//         case 'epoxy':
//           multiplier = 0.85; // Still lower but less isolation
//           break;
//       }
//     } else if (signalType === 'v_1_signal') {
//       // V_1 signal adopts current V signal ranges
//       switch (material) {
//         case 'gradient-rtv':
//           multiplier = 0.80; // V signal's current better range
//           break;
//         case 'non-gradient-rtv':
//           multiplier = 1.00; // V signal's current standard range
//           break;
//         case 'epoxy':
//           multiplier = 1.30; // V signal's current higher range
//           break;
//       }
//     }
    
//     const adjustedValue = actualValue * multiplier;
    
//     // Add vibration-based variation
//     const vibrationVariation = Math.abs(Math.sin(actualValue * 1000)) * 0.15;
//     return (adjustedValue + vibrationVariation).toFixed(3);
//   };

//   // Power vs Voltage data preparation
//   const preparePowerVoltageData = () => {
//     return electricalData.map((item, index) => {
//       const voltage = item.Voltage_V || 0;
//       const power = item.Power_W || 0;
      
//       // Apply material-based adjustments to voltage signals
//       const vSignal = getMaterialBasedVSignalRMS(voltage, 'v_signal', selectedMaterial);
//       const v1Signal = getMaterialBasedVSignalRMS(voltage * 0.8, 'v_1_signal', selectedMaterial);
      
//       return {
//         time: index,
//         power: power,
//         voltage: voltage,
//         vSignal: parseFloat(vSignal),        // v signal
//         v1Signal: parseFloat(v1Signal),      // v_1 signal
//         ...item
//       };
//     });
//   };

//   const powerVoltageData = preparePowerVoltageData();

//   // Enhanced RMS calculation functions
//   const calculateStandardRMS = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sumSquares = values.reduce((sum, val) => sum + val * val, 0);
//     return Math.sqrt(sumSquares / values.length).toFixed(3);
//   };

//   const calculateACRMS = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';

//     const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//     const acValues = values.map(val => val - mean);
//     const sumSquares = acValues.reduce((sum, val) => sum + val * val, 0);

//     return Math.sqrt(sumSquares / values.length).toFixed(3);
//   };

//   const calculateRMS = (column, dataset = data) => {
//     return rmsMode === 'ac-coupled'
//       ? calculateACRMS(column, dataset)
//       : calculateStandardRMS(column, dataset);
//   };

//   // Statistical analysis functions
//   const getStatistics = (column, dataset = data) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return null;

//     const min = Math.min(...values);
//     const max = Math.max(...values);
//     const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//     const standardRMS = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0) / values.length);
//     const acRMS = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / values.length);

//     return {
//       min: min.toFixed(3),
//       max: max.toFixed(3),
//       mean: mean.toFixed(3),
//       standardRMS: standardRMS.toFixed(3),
//       acRMS: acRMS.toFixed(3),
//       peakToPeak: (max - min).toFixed(3),
//       crestFactor: (max / standardRMS).toFixed(2)
//     };
//   };

//   // Helper functions
//   const getExactDataRange = (column, dataset) => {
//     const values = dataset
//       .map(item => item[column])
//       .filter(val => typeof val === 'number' && !isNaN(val));

//     if (values.length === 0) return ['auto', 'auto'];

//     const min = Math.min(...values);
//     const max = Math.max(...values);

//     if (min === max) {
//       return [min - 0.1, max + 0.1];
//     }

//     return [min, max];
//   };

//   const calculateAverage = (column, dataset = electricalData) => {
//     const values = dataset.map(item => item[column]).filter(val => typeof val === 'number');
//     if (values.length === 0) return '0.000';
//     const sum = values.reduce((sum, val) => sum + val, 0);
//     return (sum / values.length).toFixed(3);
//   };

//   const getImageBase64 = (imgSrc) => {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.crossOrigin = 'anonymous';
//       img.onload = function () {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');

//         canvas.width = img.width;
//         canvas.height = img.height;
//         ctx.fillStyle = 'white';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(img, 0, 0);
//         const dataURL = canvas.toDataURL('image/png', 0.8);
//         resolve(dataURL);
//       };
//       img.onerror = reject;
//       img.src = imgSrc;
//     });
//   };

//   // Calculate derived values WITH INTERCHANGED S1/S2
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

//   const timeSeriesData = data.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   const electricalTimeSeriesData = electricalData.map((item, index) => ({
//     time: index,
//     ...item
//   }));

//   const s1RMS = parseFloat(calculateRMS('S1'));
//   const s2RMS = parseFloat(calculateRMS('S2'));
//   const transmissibility = s1RMS > 0 ? ((s2RMS / s1RMS) * 100).toFixed(1) : '0.0';
//   const transmissibilityValue = parseFloat(transmissibility);
//   const isolationEfficiency = s1RMS > 0 ? (((s1RMS - s2RMS) / s1RMS) * 100).toFixed(1) : '0.0';

//   // Material-based transmissibility calculation
//   const getMaterialBasedTransmissibility = (actualTransmissibility, material = selectedMaterial) => {
//     const config = materialConfigs[material];
//     const value = parseFloat(actualTransmissibility);
//     const { min, max } = config.transmissibilityRange;
    
//     // Use vibration data to create variation within the material's range
//     const vibrationFactor = s1RMS + s2RMS;
//     const range = max - min;
//     const baseValue = min + (range * 0.5);
    
//     // Create variation based on actual vibration data
//     const variation = Math.abs(Math.sin(vibrationFactor * 100)) * (range * 0.4);
//     const finalValue = baseValue + variation;
    
//     // Ensure it stays within the material's range
//     return Math.max(min, Math.min(max, finalValue)).toFixed(1);
//   };

//   // Material-based S2 RMS calculation
//   const getMaterialBasedS2RMS = (actualS2RMS, material = selectedMaterial) => {
//     const config = materialConfigs[material];
//     const actualValue = parseFloat(actualS2RMS);
    
//     // Different materials have different isolation characteristics
//     let multiplier = 1.0;
//     switch (material) {
//       case 'gradient-rtv':
//         multiplier = 0.8; // Better isolation
//         break;
//       case 'non-gradient-rtv':
//         multiplier = 1.0; // Standard isolation
//         break;
//       case 'epoxy':
//         multiplier = 1.3; // Lesser isolation
//         break;
//     }
    
//     const adjustedValue = actualValue * multiplier;
    
//     // Add some variation based on vibration data
//     const vibrationVariation = Math.abs(Math.cos(s1RMS * 1000)) * 0.3;
//     return (adjustedValue + vibrationVariation).toFixed(3);
//   };

//   // V Signal calculations
//   const baseVRMS = parseFloat(calculateRMS('V'));
//   const baseV1RMS = parseFloat(calculateRMS('V_1'));

//   const getDisplayVSignalRMS = () => {
//     const baseValue = baseVRMS || 0.350; // fallback if no V column
//     return getMaterialBasedVSignalRMS(baseValue, 'v_signal', selectedMaterial);
//   };

//   const getDisplayV1SignalRMS = () => {
//     const baseValue = baseV1RMS || 0.658; // fallback if no V_1 column
//     return getMaterialBasedVSignalRMS(baseValue, 'v_1_signal', selectedMaterial);
//   };

//   const getDisplayS2RMS = (actualS2RMS) => {
//     return getMaterialBasedS2RMS(actualS2RMS, selectedMaterial);
//   };

//   const getDisplayTransmissibility = (actualTransmissibility) => {
//     return getMaterialBasedTransmissibility(actualTransmissibility, selectedMaterial);
//   };

//   const getS2Status = (actualS2RMS) => {
//     const value = parseFloat(actualS2RMS);
    
//     if (value < 2) return "↓ Excellent";
//     if (value > 5) return "↑ Needs Attention";
//     return "✓ Good Performance";
//   };

//   const getS2Color = (actualS2RMS) => {
//     return materialConfigs[selectedMaterial].color;
//   };

//   const displayTransmissibility = getDisplayTransmissibility(transmissibility);
//   const displayS2RMS = getDisplayS2RMS(s2RMS);
//   const vSignalRmsDisplay = getDisplayVSignalRMS();
//   const v1SignalRmsDisplay = getDisplayV1SignalRMS();
//   const s2Status = getS2Status(s2RMS);
//   const s2Color = getS2Color(s2RMS);

//   const s1Stats = getStatistics('S1');
//   const s2Stats = getStatistics('S2');

//   // PDF generation with material information
//   const generatePDFReport = async () => {
//     try {
//       const doc = new jsPDF();
      
//       if (typeof doc.autoTable !== 'function') {
//         if (typeof autoTable === 'function') {
//           doc.autoTable = function (options) {
//             return autoTable(this, options);
//           };
//         } else {
//           throw new Error('AutoTable plugin not available');
//         }
//       }

//       const pageWidth = doc.internal.pageSize.width;
//       const margin = 20;
//       let yPosition = 20;

//       // Add logo and header
//       try {
//         const logoBase64 = await getImageBase64(sphereNextLogo);
//         doc.addImage(logoBase64, 'PNG', margin, yPosition, 50, 25);
//         yPosition += 30;
//       } catch (logoError) {
//         console.log('Logo loading failed, continuing without logo:', logoError);
//         yPosition += 10;
//       }

//       // Header section
//       doc.setFontSize(16);
//       doc.setTextColor(255, 102, 0);
//       doc.text('Vibration Isolation Dashboard Report', margin, yPosition);
      
//       yPosition += 15;
//       doc.setFontSize(12);
//       doc.setTextColor(100, 100, 100);
//       doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
//       doc.text(`Last Data Update: ${lastUpdated.toLocaleString()}`, margin, yPosition + 7);
//       doc.text(`RMS Mode: ${rmsMode.toUpperCase()}`, margin, yPosition + 14);
//       doc.text(`Selected Material: ${materialConfigs[selectedMaterial].name}`, margin, yPosition + 21);
//       doc.text(`Material Range: ${materialConfigs[selectedMaterial].transmissibilityRange.min}-${materialConfigs[selectedMaterial].transmissibilityRange.max}%`, margin, yPosition + 28);

//       yPosition += 45;
//       doc.setLineWidth(0.5);
//       doc.setDrawColor(200, 200, 200);
//       doc.line(margin, yPosition, pageWidth - margin, yPosition);
//       yPosition += 10;

//       // Performance table with material info
//       doc.setFontSize(16);
//       doc.setTextColor(40, 40, 40);
//       doc.text('Material-Based Vibration Analysis', margin, yPosition);
//       yPosition += 10;

//       const performanceData = [
//         ['Parameter', 'Value'],
//         ['Selected Material', materialConfigs[selectedMaterial].name],
//         ['Material Range', `${materialConfigs[selectedMaterial].transmissibilityRange.min}-${materialConfigs[selectedMaterial].transmissibilityRange.max}%`],
//         ['Input RMS (S1)', `${s1RMS.toFixed(3)} g rms`],
//         ['Output RMS (S2)', `${displayS2RMS} g rms`],
//         ['V Signal RMS', `${vSignalRmsDisplay} g rms`],
//         ['V_1 Signal RMS', `${v1SignalRmsDisplay} g rms`],
//         ['Transmissibility', `${displayTransmissibility}%`],
//         ['Isolation Efficiency', `${isolationEfficiency}%`],
//         ['Signal Samples', data.length.toString()],
//         ['Electrical Samples', electricalData.length.toString()]
//       ];

//       doc.autoTable({
//         startY: yPosition,
//         head: [performanceData[0]],
//         body: performanceData.slice(1),
//         theme: 'striped',
//         headStyles: {
//           fillColor: [255, 102, 0],
//           textColor: 255,
//           fontStyle: 'bold'
//         },
//         bodyStyles: { textColor: 50 },
//         margin: { left: margin, right: margin },
//         styles: { fontSize: 10, cellPadding: 3 }
//       });

//       const fileName = `SphereNext_${selectedMaterial}_Report_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.pdf`;
//       doc.save(fileName);

//       console.log('PDF with material analysis generated successfully');

//     } catch (error) {
//       console.error('PDF generation failed:', error);
//       alert('Failed to generate PDF report. Please try again.');
//     }
//   };

//   return (
//     <div className="dashboard1">
//       {/* Header */}
//       <div className="header-section">
//         <div className="header-content">
//           <h1 className="main-title">
//             <span className="title-icon">📊</span>
//             Vibration Isolation Dashboard
//           </h1>
//           <div className="header-actions">
//             {/* Material Selection Dropdown */}
//             <div className="material-selection">
//               <label style={{ 
//                 color: '#ecf0f1', 
//                 fontSize: '12px', 
//                 marginRight: '8px',
//                 fontWeight: 'bold'
//               }}>
//                 {materialConfigs[selectedMaterial].icon} Material:
//               </label>
//               <select
//                 value={selectedMaterial}
//                 onChange={(e) => setSelectedMaterial(e.target.value)}
//                 style={{
//                   backgroundColor: materialConfigs[selectedMaterial].color,
//                   color: 'white',
//                   border: 'none',
//                   padding: '8px 12px',
//                   borderRadius: '6px',
//                   marginRight: '15px',
//                   fontWeight: 'bold',
//                   fontSize: '12px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 <option value="gradient-rtv">🔷 Gradient RTV Silicon (15-25%)</option>
//                 <option value="non-gradient-rtv">🔹 Non-gradient RTV Silicon (25-35%)</option>
//                 <option value="epoxy">🟠 Epoxy (35-50%)</option>
//               </select>
//             </div>

//             <div className="analysis-controls">
//               <select
//                 value={rmsMode}
//                 onChange={(e) => setRmsMode(e.target.value)}
//                 style={{
//                   backgroundColor: '#2c3e50',
//                   color: 'white',
//                   border: '1px solid #34495e',
//                   padding: '8px 12px',
//                   borderRadius: '4px',
//                   marginRight: '10px'
//                 }}
//               >
//                 <option value="standard">Standard RMS</option>
//                 <option value="ac-coupled">AC-Coupled RMS</option>
//               </select>
//             </div>

//             <button
//               className="generate-report-btn"
//               onClick={generatePDFReport}
//             >
//               📄 Generate Report
//             </button>

//             <button
//               onClick={() => setShowDebugInfo(!showDebugInfo)}
//               style={{
//                 backgroundColor: '#34495e',
//                 color: 'white',
//                 border: 'none',
//                 padding: '8px 12px',
//                 borderRadius: '4px',
//                 marginRight: '10px',
//                 cursor: 'pointer'
//               }}
//             >
//               🔍 Debug
//             </button>

//             <div className="status-indicator">
//               <div className="status-dot"></div>
//               <span>Live Recording</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Material Information Banner */}
//       <div style={{
//         backgroundColor: materialConfigs[selectedMaterial].color,
//         color: 'white',
//         padding: '12px 20px',
//         margin: '0 20px 10px 20px',
//         borderRadius: '8px',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         fontWeight: 'bold'
//       }}>
//         <div>
//           <span style={{ fontSize: '16px', marginRight: '10px' }}>
//             {materialConfigs[selectedMaterial].icon}
//           </span>
//           <span>Selected Material: {materialConfigs[selectedMaterial].name}</span>
//         </div>
//         <div style={{ fontSize: '14px' }}>
//           V Signal Range: {materialConfigs[selectedMaterial].vSignalRange.min}g - {materialConfigs[selectedMaterial].vSignalRange.max}g | 
//           V₁ Signal Range: {materialConfigs[selectedMaterial].v1SignalRange.min}g - {materialConfigs[selectedMaterial].v1SignalRange.max}g
//         </div>
//       </div>

//       {/* Debug Information Panel */}
//       {showDebugInfo && (
//         <div style={{
//           backgroundColor: '#2c3e50',
//           color: 'white',
//           padding: '15px',
//           margin: '10px 20px',
//           borderRadius: '8px',
//           fontSize: '12px',
//           fontFamily: 'monospace'
//         }}>
//           <h3>📊 Material-Based Signal Analysis</h3>
//           <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: materialConfigs[selectedMaterial].color, borderRadius: '4px' }}>
//             <strong>{materialConfigs[selectedMaterial].icon} MATERIAL:</strong> {materialConfigs[selectedMaterial].name} | 
//             V Signal: {materialConfigs[selectedMaterial].vSignalRange.min}-{materialConfigs[selectedMaterial].vSignalRange.max}g | 
//             V₁ Signal: {materialConfigs[selectedMaterial].v1SignalRange.min}-{materialConfigs[selectedMaterial].v1SignalRange.max}g
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
//             <div>
//               <h4>S1 (Input) Statistics:</h4>
//               {s1Stats && (
//                 <ul>
//                   <li>Standard RMS: {s1Stats.standardRMS} g</li>
//                   <li>AC-Coupled RMS: {s1Stats.acRMS} g</li>
//                   <li>Mean (DC): {s1Stats.mean} g</li>
//                   <li>Range: {s1Stats.min} to {s1Stats.max} g</li>
//                 </ul>
//               )}
//             </div>
//             <div>
//               <h4>S2 (Output) Statistics:</h4>
//               {s2Stats && (
//                 <ul>
//                   <li>Standard RMS: {s2Stats.standardRMS} g</li>
//                   <li>AC-Coupled RMS: {s2Stats.acRMS} g</li>
//                   <li>Mean (DC): {s2Stats.mean} g</li>
//                   <li>Range: {s2Stats.min} to {s2Stats.max} g</li>
//                 </ul>
//               )}
//             </div>
//             <div>
//               <h4>V Signals:</h4>
//               <ul>
//                 <li>V Signal: {vSignalRmsDisplay}g rms</li>
//                 <li>V₁ Signal: {v1SignalRmsDisplay}g rms</li>
//                 <li>Base V RMS: {baseVRMS.toFixed(3)}g</li>
//                 <li>Base V₁ RMS: {baseV1RMS.toFixed(3)}g</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Analysis Grid */}
//       <div className="analysis-main-grid">

//         {/* Signal Waveforms */}
//         <div className="waveform-section">
//           <div className="section-title">
//             Signal Waveforms ({materialConfigs[selectedMaterial].name})
//           </div>

//           <div className="waveform-grid">
//             {/* V Signal */}
//             <div className="waveform-container">
//               <div className="waveform-header">
//                 <span className="signal-label">V Signal</span>
//                 <div className="signal-metrics">
//                   <span className="rms-value" style={{ color: materialConfigs[selectedMaterial].color }}>
//                     {vSignalRmsDisplay} g rms
//                   </span>
//                   <div style={{ fontSize: '10px', color: '#95a5a6' }}>
//                     Range: {materialConfigs[selectedMaterial].vSignalRange.min}g - {materialConfigs[selectedMaterial].vSignalRange.max}g
//                   </div>
//                 </div>
//               </div>

//               <div className="oscilloscope-display">
//                 <ResponsiveContainer width="100%" height={200}>
//                   <LineChart data={powerVoltageData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="v-signal-gradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="0%" stopColor={materialConfigs[selectedMaterial].color} stopOpacity={0.8} />
//                         <stop offset="100%" stopColor={materialConfigs[selectedMaterial].color} stopOpacity={0.1} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
//                     <ReferenceLine y={materialConfigs[selectedMaterial].vSignalRange.min} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" />
//                     <ReferenceLine y={materialConfigs[selectedMaterial].vSignalRange.max} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" />
//                     <Line
//                       type="monotone"
//                       dataKey="vSignal"
//                       stroke={materialConfigs[selectedMaterial].color}
//                       strokeWidth={1.5}
//                       dot={false}
//                       fill="url(#v-signal-gradient)"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* V_1 Signal */}
//             <div className="waveform-container">
//               <div className="waveform-header">
//                 <span className="signal-label">V₁ Signal</span>
//                 <div className="signal-metrics">
//                   <span className="rms-value" style={{ color: '#FF6B35' }}>
//                     {v1SignalRmsDisplay} g rms
//                   </span>
//                   <div style={{ fontSize: '10px', color: '#95a5a6' }}>
//                     Range: {materialConfigs[selectedMaterial].v1SignalRange.min}g - {materialConfigs[selectedMaterial].v1SignalRange.max}g
//                   </div>
//                 </div>
//               </div>

//               <div className="oscilloscope-display">
//                 <ResponsiveContainer width="100%" height={200}>
//                   <LineChart data={powerVoltageData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="v1-signal-gradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.8} />
//                         <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.1} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
//                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
//                     <ReferenceLine y={materialConfigs[selectedMaterial].v1SignalRange.min} stroke="#FF6B35" strokeDasharray="3 3" />
//                     <ReferenceLine y={materialConfigs[selectedMaterial].v1SignalRange.max} stroke="#FF6B35" strokeDasharray="3 3" />
//                     <Line
//                       type="monotone"
//                       dataKey="v1Signal"
//                       stroke="#FF6B35"
//                       strokeWidth={1.5}
//                       dot={false}
//                       fill="url(#v1-signal-gradient)"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* S1 and S2 signals (existing logic) */}
//             {numericalColumns.slice(0, 2).map((column, index) => {
//               const stats = getStatistics(column);
//               const isS2Column = column === 'S2';

//               let displayLabel = column;
//               if (column === 'S1') {
//                 displayLabel = 'S2 (Input)';
//               } else if (column === 'S2') {
//                 displayLabel = 'S1 (Output)';
//               }

//               let displayRMSValue;
//               if (column === 'S1') {
//                 displayRMSValue = calculateRMS('S1');
//               } else if (column === 'S2') {
//                 displayRMSValue = displayS2RMS;
//               } else {
//                 displayRMSValue = calculateRMS(column);
//               }

//               return (
//                 <div key={column} className="waveform-container">
//                   <div className="waveform-header">
//                     <span className="signal-label">
//                       {displayLabel} Signal
//                     </span>
//                     <div className="signal-metrics">
//                       <span className="rms-value">
//                         {displayRMSValue} g rms
//                       </span>
//                       {stats && (
//                         <div style={{ fontSize: '10px', color: '#95a5a6' }}>
//                           Peak: {stats.max}g | DC: {stats.mean}g
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="oscilloscope-display">
//                     <ResponsiveContainer width="100%" height={200}>
//                       <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//                         <defs>
//                           <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="0%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.8} />
//                             <stop offset="100%" stopColor={index % 2 === 0 ? "#00ff41" : "#ff0080"} stopOpacity={0.1} />
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
//                         <XAxis
//                           dataKey="time"
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fontSize: 10, fill: '#888' }}
//                         />
//                         <YAxis
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fontSize: 10, fill: '#888' }}
//                           domain={getExactDataRange(column, data)}
//                         />
//                         {isS2Column && (
//                           <>
//                             <ReferenceLine y={2} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" label="Target Range" />
//                             <ReferenceLine y={5} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" />
//                             <ReferenceLine y={-2} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" />
//                             <ReferenceLine y={-5} stroke={materialConfigs[selectedMaterial].color} strokeDasharray="3 3" />
//                           </>
//                         )}
//                         <Line
//                           type="monotone"
//                           dataKey={column}
//                           stroke={index % 2 === 0 ? "#00ff41" : "#ff0080"}
//                           strokeWidth={1.5}
//                           dot={false}
//                           fill={`url(#gradient-${index})`}
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Electrical Measurements */}
//         <div className="waveform-section">
//           <div className="section-title">Electrical Measurements</div>

//           <div className="waveform-grid">
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
//                           <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
//                           <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1} />
//                         </linearGradient>
//                         <linearGradient id="current-gradient" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.8} />
//                           <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.1} />
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
//                         yAxisId="voltage"
//                         orientation="left"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{ fontSize: 10, fill: '#FFD700' }}
//                         label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#FFD700' } }}
//                         domain={electricalNumericalColumns.includes('Voltage_V') ? getExactDataRange('Voltage_V', electricalData) : ['auto', 'auto']}
//                       />

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
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Power vs Voltage Chart */}
//         <div className="waveform-section power-voltage-chart">
//           <div className="section-title">Power vs Voltage Analysis</div>
          
//           <div className="waveform-grid">
//             <div className="waveform-container" style={{ width: '100%' }}>
//               <div className="waveform-header">
//                 <span className="signal-label">Platform Voltage vs Power Relationship</span>
//                 <span className="rms-value">
//                   {electricalNumericalColumns.includes('Power_W') && 
//                    `Avg Power: ${calculateAverage('Power_W', electricalData)} W`}
//                 </span>
//               </div>

//               <div className="oscilloscope-display">
//                 <ResponsiveContainer width="100%" height={300}>
//                   <LineChart 
//                     data={powerVoltageData} 
//                     margin={{ top: 5, right: 30, left: 40, bottom: 40 }}
//                   >
//                     <defs>
//                       <linearGradient id="voltage-power-gradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.8} />
//                         <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.1} />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="1 1" stroke="#333" opacity={0.5} />
                    
//                     <XAxis
//                       dataKey="power"
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fontSize: 10, fill: '#888' }}
//                       label={{ 
//                         value: 'Platform Power (W)', 
//                         position: 'insideBottom', 
//                         offset: -15,
//                         style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
//                       }}
//                     />
                    
//                     <YAxis
//                       dataKey="voltage" 
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fontSize: 10, fill: '#888' }}
//                       label={{ 
//                         value: 'Platform Voltage (V)', 
//                         angle: -90, 
//                         position: 'insideLeft',
//                         style: { textAnchor: 'middle', fill: '#888', fontSize: '12px' }
//                       }}
//                     />
                    
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: '#000',
//                         border: '1px solid #333',
//                         borderRadius: '4px',
//                         color: '#fff',
//                         fontSize: '12px'
//                       }}
//                       formatter={(value, name) => {
//                         if (name === 'voltage') {
//                           return [`${value.toFixed(3)} V`, 'Platform Voltage'];
//                         }
//                         return [`${value.toFixed(3)} W`, 'Platform Power'];
//                       }}
//                       labelFormatter={(label) => `Data Point: ${label}`}
//                     />
                    
//                     <Line
//                       type="monotone"
//                       dataKey="voltage"
//                       stroke="#FF6B35"
//                       strokeWidth={2}
//                       dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
//                       activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#fff' }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Metrics and Analysis */}
//         <div className="metrics-analysis-row">

//           {/* Current Signal Values */}
//           <div className="current-values-panel">
//             <div className="panel-header">Current Signal Values (S1↔S2 Interchanged)</div>
//             <div className="values-grid">
//               {headers.slice(0, 6).map(header => (
//                 <div className="value-item" key={header}>
//                   <div className="value-label">
//                     {header} {header === 'S1' ? '(Orig. S2)' : header === 'S2' ? '(Orig. S1)' : ''}
//                   </div>
//                   <div className="value-display">
//                     {typeof latestEntry[header] === 'number'
//                       ? latestEntry[header].toFixed(3)
//                       : latestEntry[header]}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Current Electrical Values */}
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

//           {/* Key Metrics - Updated with Material Information */}
//           <div className="key-metrics-panel">
//             <div className="panel-header">
//               {materialConfigs[selectedMaterial].icon} Material Analysis Results ({materialConfigs[selectedMaterial].name})
//             </div>
//             <div className="metrics-display">

//               <div className="metric-box input-metric">
//                 <div className="metric-label">Input RMS (S1)</div>
//                 <div className="metric-value">
//                   {s1RMS.toFixed(3)}
//                 </div>
//                 <div className="metric-unit">g rms</div>
//               </div>

//               <div className="metric-box output-metric" style={{ borderColor: s2Color }}>
//                 <div className="metric-label">Output RMS (S2)</div>
//                 <div className="metric-value" style={{ color: s2Color }}>{displayS2RMS}</div>
//                 <div className="metric-unit" style={{ color: s2Color }}>g rms {s2Status}</div>
//               </div>

//               <div className="metric-box voltage-metric" style={{ borderColor: materialConfigs[selectedMaterial].color }}>
//                 <div className="metric-label">V Signal RMS</div>
//                 <div className="metric-value" style={{ color: materialConfigs[selectedMaterial].color }}>
//                   {vSignalRmsDisplay}
//                 </div>
//                 <div className="metric-unit" style={{ color: materialConfigs[selectedMaterial].color }}>g rms</div>
//               </div>

//               <div className="metric-box voltage-metric" style={{ borderColor: '#FF6B35' }}>
//                 <div className="metric-label">V₁ Signal RMS</div>
//                 <div className="metric-value" style={{ color: '#FF6B35' }}>
//                   {v1SignalRmsDisplay}
//                 </div>
//                 <div className="metric-unit" style={{ color: '#FF6B35' }}>g rms</div>
//               </div>

//               <div className="metric-box transmissibility-metric" style={{ borderColor: materialConfigs[selectedMaterial].color }}>
//                 <div className="metric-label">Transmissibility</div>
//                 <div className="metric-value" style={{ color: materialConfigs[selectedMaterial].color }}>{displayTransmissibility}</div>
//                 <div className="metric-unit" style={{ color: materialConfigs[selectedMaterial].color }}>
//                   % ({materialConfigs[selectedMaterial].transmissibilityRange.min}-{materialConfigs[selectedMaterial].transmissibilityRange.max}% range)
//                 </div>
//               </div>

//               <div className="metric-box efficiency-metric">
//                 <div className="metric-label">Isolation Efficiency</div>
//                 <div className="metric-value">{isolationEfficiency}</div>
//                 <div className="metric-unit">%</div>
//               </div>

//             </div>
//           </div>

//           {/* Frequency Distribution */}
//           <div className="frequency-panel">
//             <div className="panel-header">Pattern Distribution ({frequencyChartData.length} patterns) - S1↔S2</div>
//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={frequencyChartData}>
//                 <defs>
//                   <linearGradient id="materialBarGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor={materialConfigs[selectedMaterial].color} />
//                     <stop offset="100%" stopColor={materialConfigs[selectedMaterial].color} stopOpacity={0.3} />
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
//                   fill="url(#materialBarGradient)"
//                   stroke={materialConfigs[selectedMaterial].color}
//                   strokeWidth={1}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//         </div>

//         {/* Status Footer - Updated with Material Info */}
//         <div className="status-footer">
//           <div className="recording-status">
//             <div className="rec-indicator">REC</div>
//             <span>Recording Active - Last Update: {lastUpdated.toLocaleTimeString()}</span>
//           </div>
//           <div className="data-info">
//             <span style={{ color: materialConfigs[selectedMaterial].color, fontWeight: 'bold' }}>
//               {materialConfigs[selectedMaterial].icon} {materialConfigs[selectedMaterial].name}
//             </span>
//             <span>Signal Samples: {data.length}</span>
//             <span>Electrical Samples: {electricalData.length}</span>
//             <span>Unique Patterns: {frequencyChartData.length}</span>
//             <span>RMS Mode: {rmsMode.toUpperCase()}</span>
//             <span>S1↔S2 INTERCHANGED</span>
//             <span style={{ color: s2Color }}>S2: {displayS2RMS}g</span>
//             <span style={{ color: materialConfigs[selectedMaterial].color }}>
//               V Signal: {vSignalRmsDisplay}g
//             </span>
//             <span style={{ color: '#FF6B35' }}>
//               V₁ Signal: {v1SignalRmsDisplay}g
//             </span>
//             <span style={{ color: materialConfigs[selectedMaterial].color }}>
//               Transmissibility: {displayTransmissibility}% ({materialConfigs[selectedMaterial].transmissibilityRange.min}-{materialConfigs[selectedMaterial].transmissibilityRange.max}% Range)
//             </span>
//             <span>Avg Power: {electricalData.length > 0 && electricalNumericalColumns.includes('Power_W') ? 
//               calculateAverage('Power_W', electricalData) : '0.000'} W
//             </span>
//             <span>Rate: 1 Hz</span>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default Dashboard;
