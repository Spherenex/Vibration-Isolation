import { useState, useEffect } from "react";
import {
  BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
  Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import Papa from 'papaparse';

const Dashboard = () => {
  const [s1Data, setS1Data] = useState([]);
  const [s2Data, setS2Data] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [chartColumn, setChartColumn] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [latestS1, setLatestS1] = useState(null);
  const [latestS2, setLatestS2] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async (isInitialLoad = false) => {
    try {
      // Only show loading spinner on initial page load
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // URLs for both sheets
      const s1Url = "https://docs.google.com/spreadsheets/d/1hstTSpMl15sw0NfqQF4-1-tgd7slMPz1FLBJJq6VlTA/export?format=csv&gid=0";
      const s2Url = "https://docs.google.com/spreadsheets/d/1A2cJEhIxEtO4f63rdtxRONr_KEqLsAYBjxoi8CX14VU/export?format=csv&gid=0";

      // Fetch both sheets simultaneously
      const [s1Response, s2Response] = await Promise.all([
        fetch(s1Url),
        fetch(s2Url)
      ]);

      const [s1Text, s2Text] = await Promise.all([
        s1Response.text(),
        s2Response.text()
      ]);

      // Parse both CSV files
      const s1Result = Papa.parse(s1Text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      const s2Result = Papa.parse(s2Text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      if (s1Result.data && s1Result.data.length > 0) {
        setS1Data(s1Result.data);
        setLatestS1(s1Result.data[s1Result.data.length - 1]);
      }

      if (s2Result.data && s2Result.data.length > 0) {
        setS2Data(s2Result.data);
        setLatestS2(s2Result.data[s2Result.data.length - 1]);
      }

      // Create combined dataset for analysis
      const combined = createCombinedDataset(s1Result.data, s2Result.data);
      setCombinedData(combined);

      // Set chart column if not already set
      if (combined.length > 0 && !chartColumn) {
        const headers = Object.keys(combined[0]);
        const numericalColumns = headers.filter(header => 
          typeof combined[0][header] === 'number'
        );
        if (numericalColumns.length > 0) {
          setChartColumn(numericalColumns[0]);
        }
      }

      // Only hide loading on initial load
      if (isInitialLoad) {
        setLoading(false);
      }
      
      // Always update timestamp
      setLastUpdated(new Date());
      
    } catch (err) {
      setError("Failed to fetch data from one or both sensors. Please try again later.");
      if (isInitialLoad) {
        setLoading(false);
      }
      console.error("Error fetching data:", err);
    }
  };

  // Function to create combined dataset from both sensors
  const createCombinedDataset = (s1Array, s2Array) => {
    const combined = [];
    const maxLength = Math.max(s1Array.length, s2Array.length);

    for (let i = 0; i < maxLength; i++) {
      const s1Entry = s1Array[i] || {};
      const s2Entry = s2Array[i] || {};
      
      const combinedEntry = {
        index: i + 1,
        Date: s1Entry.Date || s2Entry.Date || `Entry ${i + 1}`,
        Time: s1Entry.Time || s2Entry.Time || '00:00:00',
        S1: typeof s1Entry.S1 === 'number' ? s1Entry.S1 : null,
        V1: typeof s1Entry.V1 === 'number' ? s1Entry.V1 : null,
        S2: typeof s2Entry.S2 === 'number' ? s2Entry.S2 : null,
        V2: typeof s2Entry.V2 === 'number' ? s2Entry.V2 : null,
      };

      // Calculate difference if both sensors have data
      if (typeof combinedEntry.S1 === 'number' && typeof combinedEntry.S2 === 'number') {
        combinedEntry.Difference = parseFloat((combinedEntry.S1 - combinedEntry.S2).toFixed(2));
      }

      combined.push(combinedEntry);
    }

    return combined;
  };

  // Initial load with loading screen
  useEffect(() => {
    fetchData(true); // Show loading spinner only on first load
  }, []);

  // Background auto-refresh without loading screen
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchData(false); // Background refresh - no loading spinner
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) return <div className="loading">Loading sensor data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!latestS1 && !latestS2) return <div className="empty">No sensor data available</div>;

  const headers = combinedData.length > 0 ? Object.keys(combinedData[0]) : [];
  const numericalColumns = headers.filter(header => 
    combinedData.length > 0 && typeof combinedData[0][header] === 'number'
  );
  const categoryColumn = headers.find(header => !numericalColumns.includes(header)) || headers[0];

  // Calculate latest difference and frequency analysis
  let latestDifference = null;
  let occurrenceCount = null;
  let occurrencePercentage = null;

  if (latestS1 && latestS2 && typeof latestS1.S1 === 'number' && typeof latestS2.S2 === 'number') {
    latestDifference = parseFloat((latestS1.S1 - latestS2.S2).toFixed(2));
    
    // Calculate occurrence count for this specific difference value
    let count = 0;
    combinedData.forEach(row => {
      if (typeof row.Difference === 'number' && row.Difference === latestDifference) {
        count++;
      }
    });
    occurrenceCount = count;
    occurrencePercentage = combinedData.length > 0 ? ((count / combinedData.length) * 100).toFixed(1) : '0.0';
  }

  // Calculate complete occurrence distribution for chart
  let occurrenceMap = {};
  combinedData.forEach(row => {
    if (typeof row.Difference === 'number') {
      const diff = row.Difference;
      occurrenceMap[diff] = (occurrenceMap[diff] || 0) + 1;
    }
  });

  const occurrenceChartData = Object.entries(occurrenceMap)
    .map(([diff, count]) => ({
      difference: `${diff}`,
      count,
      percentage: combinedData.length > 0 ? ((count / combinedData.length) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => Number(a.difference) - Number(b.difference));

  const COLORS = ['#00C9FF', '#92FE9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  return (
    <div className="dashboard">
      <div className="header-section">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">🧠</span>
            Dual Sensor Vibration Dashboard
          </h1>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Live Data Stream</span>
            <div className="refresh-status">
              Auto-refresh: ON
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={activeTab === 'latest' ? 'active' : ''}
            onClick={() => setActiveTab('latest')}
          >
            <span className="tab-icon">📊</span>
            Real-time Analysis
          </button>
          <button
            className={activeTab === 'sensors' ? 'active' : ''}
            onClick={() => setActiveTab('sensors')}
          >
            <span className="tab-icon">📡</span>
            Sensor Details
          </button>
          {numericalColumns.length > 0 && (
            <button
              className={activeTab === 'charts' ? 'active' : ''}
              onClick={() => setActiveTab('charts')}
            >
              <span className="tab-icon">📈</span>
              Data Visualization
            </button>
          )}
        </div>
      </div>

      {activeTab === 'latest' && (
        <div className="latest-data-container">
          <div className="section-header">
            <h2>Latest Sensor Analysis</h2>
            <div className="update-timestamp">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <div className="pulse-indicator"></div>
            </div>
          </div>

          {/* Current Sensor Values */}
          <div className="sensors-grid">
            <div className="sensor-card s1-card">
              <div className="sensor-header">
                <h3>🔴 Sensor S1</h3>
                <div className="sensor-status active"></div>
              </div>
              <div className="sensor-content">
                {latestS1 ? (
                  <>
                    <div className="sensor-value">
                      <div className="value-label">Current Reading</div>
                      <div className="value-number">{latestS1.S1}</div>
                      <div className="value-unit">units</div>
                    </div>
                    <div className="sensor-details">
                      <div className="detail-item">
                        <span>Date:</span>
                        <span>{latestS1.Date}</span>
                      </div>
                      <div className="detail-item">
                        <span>Time:</span>
                        <span>{latestS1.Time}</span>
                      </div>
                      {latestS1.V1 && (
                        <div className="detail-item">
                          <span>V1:</span>
                          <span>{latestS1.V1}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="sensor-offline">S1 Offline</div>
                )}
              </div>
            </div>

            <div className="sensor-card s2-card">
              <div className="sensor-header">
                <h3>🔵 Sensor S2</h3>
                <div className="sensor-status active"></div>
              </div>
              <div className="sensor-content">
                {latestS2 ? (
                  <>
                    <div className="sensor-value">
                      <div className="value-label">Current Reading</div>
                      <div className="value-number">{latestS2.S2}</div>
                      <div className="value-unit">units</div>
                    </div>
                    <div className="sensor-details">
                      <div className="detail-item">
                        <span>Date:</span>
                        <span>{latestS2.Date}</span>
                      </div>
                      <div className="detail-item">
                        <span>Time:</span>
                        <span>{latestS2.Time}</span>
                      </div>
                      {latestS2.V2 && (
                        <div className="detail-item">
                          <span>V2:</span>
                          <span>{latestS2.V2}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="sensor-offline">S2 Offline</div>
                )}
              </div>
            </div>
          </div>

          {/* ML Analysis Section */}
          {latestDifference !== null && occurrenceCount !== null && (
            <div className="ml-analysis-section">
              <div className="section-header">
                <h2>🤖 ML Pattern Analysis</h2>
              </div>
              
              <div className="analysis-grid">
                <div className="metric-card difference-metric">
                  <div className="metric-header">
                    <div className="metric-icon">⚡</div>
                    <div className="metric-title">Signal Difference</div>
                  </div>
                  <div className="metric-value">{latestDifference}</div>
                  <div className="metric-unit">units</div>
                  <div className="metric-formula">
                    S1({latestS1?.S1}) - S2({latestS2?.S2})
                  </div>
                  <div className="metric-trend">
                    <div className="trend-line"></div>
                  </div>
                </div>
                
                <div className="metric-card frequency-metric">
                  <div className="metric-header">
                    <div className="metric-icon">📈</div>
                    <div className="metric-title">Pattern Frequency</div>
                  </div>
                  <div className="metric-value">{occurrencePercentage}</div>
                  <div className="metric-unit">%</div>
                  <div className="metric-formula">
                    {occurrenceCount} occurrences in dataset
                  </div>
                  <div className="metric-trend">
                    <div className="trend-line frequency-trend"></div>
                  </div>
                </div>
              </div>

              {/* Occurrence Distribution Graph */}
              {occurrenceChartData.length > 0 && (
                <div className="chart-section">
                  <div className="chart-header">
                    <h3>📊 Pattern Frequency Distribution</h3>
                    <div className="chart-subtitle">Frequency of each difference pattern in the dataset</div>
                  </div>
                  
                  <div className="charts-row">
                    <div className="chart-container">
                      <h4>Frequency Bar Chart</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={occurrenceChartData}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6C63FF" />
                              <stop offset="100%" stopColor="#FF6384" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                          <XAxis 
                            dataKey="difference" 
                            stroke="#888"
                            fontSize={12}
                            axisLine={{stroke: '#888'}}
                            label={{ value: 'Signal Difference (units)', position: 'insideBottom', offset: -5, fill: '#888' }}
                          />
                          <YAxis 
                            stroke="#888"
                            fontSize={12}
                            axisLine={{stroke: '#888'}}
                            label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name, props) => [
                              `Frequency: ${props.payload.percentage}%`,
                              `Count: ${value}`
                            ]}
                            labelFormatter={(label) => `Difference: ${label} units`}
                          />
                          <Bar 
                            dataKey="percentage" 
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            stroke="#6C63FF"
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-container">
                      <h4>Frequency Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={occurrenceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            dataKey="percentage"
                            stroke="#1a1a1a"
                            strokeWidth={2}
                            label={({ difference, percentage }) => `${difference}: ${percentage}%`}
                          >
                            {occurrenceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name, props) => [
                              `Frequency: ${value}% (${props.payload.count} occurrences)`, 
                              `Pattern: ${props.payload.difference} units`
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Details */}
              <div className="analysis-details">
                <div className="details-header">
                  <h4>🔬 Statistical Analysis</h4>
                </div>
                <div className="details-grid">
                  <div className="detail-card">
                    <div className="detail-label">Current Pattern</div>
                    <div className="detail-value">{latestDifference} units</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Pattern Frequency</div>
                    <div className="detail-value">{occurrencePercentage}%</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Occurrence Count</div>
                    <div className="detail-value">{occurrenceCount} times</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">S1 Dataset Size</div>
                    <div className="detail-value">{s1Data.length} samples</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">S2 Dataset Size</div>
                    <div className="detail-value">{s2Data.length} samples</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Highest Frequency</div>
                    <div className="detail-value">
                      {occurrenceChartData.length > 0 
                        ? `${occurrenceChartData.reduce((max, item) => 
                            parseFloat(item.percentage) > parseFloat(max.percentage) ? item : max
                          ).difference} units (${occurrenceChartData.reduce((max, item) => 
                            parseFloat(item.percentage) > parseFloat(max.percentage) ? item : max
                          ).percentage}%)`
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="auto-refresh-section">
            <div className="refresh-indicator">
              <div className="refresh-dot"></div>
              <span>Auto-refreshing every 5 seconds</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sensors' && (
        <div className="sensors-detail-container">
          <div className="section-header">
            <h2>Detailed Sensor Information</h2>
          </div>

          <div className="sensor-tables-grid">
            <div className="sensor-table-section">
              <div className="table-header">
                <h3>🔴 Sensor S1 - Recent Data</h3>
                <div className="data-count">{s1Data.length} total records</div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {s1Data.length > 0 && Object.keys(s1Data[0]).map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s1Data.slice(-10).reverse().map((row, index) => (
                      <tr key={index} className={index === 0 ? 'latest-row' : ''}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sensor-table-section">
              <div className="table-header">
                <h3>🔵 Sensor S2 - Recent Data</h3>
                <div className="data-count">{s2Data.length} total records</div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {s2Data.length > 0 && Object.keys(s2Data[0]).map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s2Data.slice(-10).reverse().map((row, index) => (
                      <tr key={index} className={index === 0 ? 'latest-row' : ''}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && numericalColumns.length > 0 && (
        <div className="charts-container">
          <div className="chart-controls">
            <div className="control-group">
              <label htmlFor="chart-type">Visualization Type:</label>
              <select
                id="chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="chart-column">Data Feature:</label>
              <select
                id="chart-column"
                value={chartColumn}
                onChange={(e) => setChartColumn(e.target.value)}
              >
                {numericalColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-box">
            <h2>📈 {chartType === 'bar' ? 'Bar' : 'Line'} Analysis: {chartColumn}</h2>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={combinedData.slice(0, 20)}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00C9FF" />
                      <stop offset="100%" stopColor="#92FE9D" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey={categoryColumn} stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey={chartColumn} fill="url(#chartGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={combinedData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey={categoryColumn} stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={chartColumn} 
                    stroke="#00C9FF" 
                    strokeWidth={3}
                    dot={{ fill: '#00C9FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#00C9FF', strokeWidth: 2, fill: '#92FE9D' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Multi-sensor comparison chart */}
          {combinedData.length > 0 && (
            <div className="chart-box">
              <h2>📊 Dual Sensor Comparison</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={combinedData.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="index" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="S1" 
                    stroke="#FF6B6B" 
                    strokeWidth={3}
                    name="Sensor S1"
                    dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="S2" 
                    stroke="#4ECDC4" 
                    strokeWidth={3}
                    name="Sensor S2"
                    dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  {combinedData.some(item => typeof item.Difference === 'number') && (
                    <Line 
                      type="monotone" 
                      dataKey="Difference" 
                      stroke="#FFC107" 
                      strokeWidth={2}
                      name="Difference (S1-S2)"
                      dot={{ fill: '#FFC107', strokeWidth: 1, r: 3 }}
                      connectNulls={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="data-summary">
            <h2>📊 Statistical Summary: {chartColumn}</h2>
            <div className="summary-grid">
              <div className="stat-card">
                <div className="stat-icon">📉</div>
                <div className="stat-label">Minimum</div>
                <div className="stat-value">
                  {Math.min(...combinedData
                    .filter(item => typeof item[chartColumn] === 'number')
                    .map(item => item[chartColumn])
                  ) || 'N/A'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-label">Maximum</div>
                <div className="stat-value">
                  {Math.max(...combinedData
                    .filter(item => typeof item[chartColumn] === 'number')
                    .map(item => item[chartColumn])
                  ) || 'N/A'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-label">Average</div>
                <div className="stat-value">
                  {(() => {
                    const validValues = combinedData
                      .filter(item => typeof item[chartColumn] === 'number')
                      .map(item => item[chartColumn]);
                    return validValues.length > 0 
                      ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(2)
                      : 'N/A';
                  })()}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">∑</div>
                <div className="stat-label">Total</div>
                <div className="stat-value">
                  {(() => {
                    const validValues = combinedData
                      .filter(item => typeof item[chartColumn] === 'number')
                      .map(item => item[chartColumn]);
                    return validValues.length > 0 
                      ? validValues.reduce((sum, val) => sum + val, 0).toFixed(2)
                      : 'N/A';
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
          color: #ffffff;
          line-height: 1.6;
          min-height: 100vh;
        }
        
        .dashboard {
          max-width: 1700px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        /* Header Styles */
        .header-section {
          margin-bottom: 30px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
        }
        
        .main-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .title-icon {
          font-size: 36px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(0, 201, 255, 0.1);
          border: 1px solid rgba(0, 201, 255, 0.3);
          border-radius: 20px;
          font-size: 14px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #00C9FF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 201, 255, 0.6);
        }
        
        .refresh-status {
          font-size: 12px;
          color: #2ecc71;
          background: rgba(46, 204, 113, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px solid rgba(46, 204, 113, 0.3);
        }
        
        /* Tabs */
        .tabs-container {
          margin-bottom: 30px;
        }
        
        .tabs {
          display: flex;
          justify-content: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.05);
          padding: 5px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        
        .tabs button {
          background: transparent;
          border: none;
          padding: 12px 24px;
          margin: 0;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-size: 16px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tabs button.active {
          background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
          color: #000;
          box-shadow: 0 4px 15px rgba(0, 201, 255, 0.4);
        }
        
        .tabs button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .tab-icon {
          font-size: 18px;
        }
        
        /* Loading, Error, Empty States */
        .loading, .error, .empty {
          text-align: center;
          padding: 60px;
          font-size: 18px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .error {
          color: #ff6b6b;
          border-color: rgba(255, 107, 107, 0.3);
        }
        
        /* Sensors Grid */
        .sensors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .sensor-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease;
        }
        
        .sensor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        .s1-card .sensor-header {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
        }
        
        .s2-card .sensor-header {
          background: linear-gradient(135deg, #4ECDC4 0%, #6EE2D9 100%);
        }
        
        .sensor-header {
          color: #000;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sensor-header h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        
        .sensor-status {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #2ecc71;
          box-shadow: 0 0 10px rgba(46, 204, 113, 0.6);
        }
        
        .sensor-content {
          padding: 25px;
        }
        
        .sensor-value {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .value-label {
          font-size: 14px;
          color: #888;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .value-number {
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        
        .value-unit {
          font-size: 16px;
          color: #888;
          margin-top: 5px;
        }
        
        .sensor-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 14px;
        }
        
        .detail-item span:first-child {
          color: #888;
          font-weight: 600;
        }
        
        .detail-item span:last-child {
          color: #fff;
        }
        
        .sensor-offline {
          text-align: center;
          color: #ff6b6b;
          font-size: 18px;
          font-weight: 600;
          padding: 40px;
        }
        
        /* Sensor Tables */
        .sensors-detail-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .sensor-tables-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        
        .sensor-table-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .table-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
        }
        
        .data-count {
          font-size: 14px;
          color: #888;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 12px;
          border-radius: 12px;
        }
        
        .table-container {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .data-table th {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .data-table td {
          padding: 10px 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #ccc;
        }
        
        .data-table tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .latest-row {
          background: rgba(0, 201, 255, 0.1) !important;
        }
        
        .latest-row td {
          color: #fff !important;
          font-weight: 600;
        }
        
        /* Latest Data Container */
        .latest-data-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
        }
        
        .update-timestamp {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #888;
        }
        
        .pulse-indicator {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(46, 204, 113, 0.6);
        }
        
        /* ML Analysis Section */
        .ml-analysis-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }
        
        .difference-metric {
          background: linear-gradient(135deg, rgba(0, 201, 255, 0.1) 0%, rgba(146, 254, 157, 0.1) 100%);
        }
        
        .frequency-metric {
          background: linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 99, 132, 0.1) 100%);
        }
        
        .metric-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .metric-icon {
          font-size: 24px;
        }
        
        .metric-title {
          font-size: 16px;
          font-weight: 600;
          color: #888;
        }
        
        .metric-value {
          font-size: 48px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 5px;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        
        .frequency-metric .metric-value {
          color: #6C63FF;
          text-shadow: 0 0 20px rgba(108, 99, 255, 0.4);
        }
        
        .metric-unit {
          font-size: 18px;
          font-weight: 600;
          color: #00C9FF;
          margin-bottom: 10px;
        }
        
        .frequency-metric .metric-unit {
          color: #6C63FF;
        }
        
        .metric-formula {
          font-size: 14px;
          color: #888;
          margin-bottom: 15px;
        }
        
        .metric-trend {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .trend-line {
          height: 100%;
          width: 70%;
          background: linear-gradient(90deg, #00C9FF, #92FE9D);
          border-radius: 2px;
        }
        
        .frequency-trend {
          background: linear-gradient(90deg, #6C63FF, #FF6384);
        }
        
        /* Chart Section */
        .chart-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-header {
          margin-bottom: 20px;
        }
        
        .chart-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 5px;
        }
        
        .chart-subtitle {
          font-size: 14px;
          color: #888;
        }
        
        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }
        
        .chart-container {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-container h4 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }
        
        /* Analysis Details */
        .analysis-details {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .details-header h4 {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 15px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
        }
        
        .detail-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .detail-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #6C63FF;
        }
        
        .detail-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .detail-value {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }
        
        /* Auto Refresh */
        .auto-refresh-section {
          text-align: center;
        }
        
        .refresh-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(46, 204, 113, 0.1);
          border: 1px solid rgba(46, 204, 113, 0.3);
          border-radius: 20px;
          font-size: 14px;
          color: #2ecc71;
        }
        
        .refresh-dot {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(46, 204, 113, 0.6);
        }
        
        /* Charts Container */
        .charts-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .chart-controls {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        
        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .control-group label {
          font-weight: 600;
          color: #888;
        }

        .control-group select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .chart-box {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-box h2 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 20px;
        }
        
        .data-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .data-summary h2 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 20px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .stat-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #888;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard {
            padding: 15px;
          }
          
          .main-title {
            font-size: 24px;
          }
          
          .header-content {
            flex-direction: column;
            gap: 15px;
          }
          
          .tabs {
            flex-direction: column;
          }
          
          .charts-row {
            grid-template-columns: 1fr;
          }
          
          .analysis-grid {
            grid-template-columns: 1fr;
          }
          
          .sensors-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-controls {
            flex-direction: column;
            align-items: center;
          }
          
          .metric-value {
            font-size: 36px;
          }
          
          .value-number {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
