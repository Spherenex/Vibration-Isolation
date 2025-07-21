import { useState, useEffect } from "react";
import {
  BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
  Bar, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import Papa from 'papaparse';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [chartColumn, setChartColumn] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [latestEntry, setLatestEntry] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const response = await fetch("https://docs.google.com/spreadsheets/d/1Y9fZBlN63R2SJN02754nlEv6NmsoygK98oh7jEViiWw/export?format=csv&gid=0");
      const text = await response.text();
      const result = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      if (result.data && result.data.length > 0) {
        setData(result.data);
        setLatestEntry(result.data[result.data.length - 1]);

        const headers = Object.keys(result.data[0]);
        const numericalColumns = headers.filter(header =>
          typeof result.data[0][header] === 'number'
        );

        if (numericalColumns.length > 0 && !chartColumn) {
          setChartColumn(numericalColumns[0]);
        }
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

  const headers = Object.keys(data[0]);
  const numericalColumns = headers.filter(header => typeof data[0][header] === 'number');
  const categoryColumn = headers.find(header => !numericalColumns.includes(header)) || headers[0];

  // Calculate S1 - S2 difference for latest entry and its occurrence count
  let latestDifference = null;
  let occurrenceCount = null;
  let occurrencePercentage = null;
  
  if (latestEntry && typeof latestEntry.S1 === 'number' && typeof latestEntry.S2 === 'number') {
    // Round to 2 decimal places
    latestDifference = parseFloat((latestEntry.S1 - latestEntry.S2).toFixed(2));
    
    // Calculate occurrence count for this specific difference value across all data
    let count = 0;
    data.forEach(row => {
      if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
        const diff = parseFloat((row.S1 - row.S2).toFixed(2));
        if (diff === latestDifference) {
          count++;
        }
      }
    });
    occurrenceCount = count;
    occurrencePercentage = ((count / data.length) * 100).toFixed(1);
  }

  // Calculate complete occurrence distribution for chart
  let occurrenceMap = {};
  if (headers.includes("S1") && headers.includes("S2")) {
    data.forEach(row => {
      if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
        const diff = parseFloat((row.S1 - row.S2).toFixed(2));
        occurrenceMap[diff] = (occurrenceMap[diff] || 0) + 1;
      }
    });
  }

  const occurrenceChartData = Object.entries(occurrenceMap)
    .map(([diff, count]) => ({
      difference: `${diff}`,
      count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }))
    .sort((a, b) => Number(a.difference) - Number(b.difference));

  const COLORS = ['#00C9FF', '#92FE9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  return (
    <div className="dashboard">
      <div className="header-section">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">🧠</span>
            ML Analytics Dashboard
          </h1>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Live Data Stream</span>
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
            <h2>Latest Data Stream</h2>
            <div className="update-timestamp">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <div className="pulse-indicator"></div>
            </div>
          </div>

          <div className="data-grid">
            <div className="latest-data-card">
              <div className="card-header">
                <h3>Current Data Point</h3>
                <div className="header-accent"></div>
              </div>
              <div className="card-content">
                {headers.map(header => (
                  <div className="data-item" key={header}>
                    <div className="item-label">{header}</div>
                    <div className="item-value">
                      {typeof latestEntry[header] === 'number'
                        ? latestEntry[header].toLocaleString()
                        : latestEntry[header]}
                    </div>
                    <div className="item-indicator"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ML-Style Analysis Section */}
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
                    S1({latestEntry.S1}) - S2({latestEntry.S2})
                  </div>
                  <div className="metric-trend">
                    <div className="trend-line"></div>
                  </div>
                </div>
                
                <div className="metric-card occurrence-metric">
                  <div className="metric-header">
                    <div className="metric-icon">🔢</div>
                    <div className="metric-title">Pattern Occurrences</div>
                  </div>
                  <div className="metric-value">{occurrenceCount}</div>
                  <div className="metric-unit">times</div>
                  <div className="metric-formula">
                    {occurrencePercentage}% of dataset
                  </div>
                  <div className="metric-trend">
                    <div className="trend-line occurrence-trend"></div>
                  </div>
                </div>
              </div>

              {/* Occurrence Distribution Graph */}
              {occurrenceChartData.length > 0 && (
                <div className="chart-section">
                  <div className="chart-header">
                    <h3>📊 Pattern Occurrence Distribution</h3>
                    <div className="chart-subtitle">How often each difference pattern appears in the dataset</div>
                  </div>
                  
                  <div className="charts-row">
                    <div className="chart-container">
                      <h4>Bar Chart Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={occurrenceChartData}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00C9FF" />
                              <stop offset="100%" stopColor="#92FE9D" />
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
                            label={{ value: 'Occurrences', angle: -90, position: 'insideLeft', fill: '#888' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => [value, 'Occurrences']}
                            labelFormatter={(label) => `Difference: ${label} units`}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            stroke="#00C9FF"
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-container">
                      <h4>Distribution Overview</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={occurrenceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            dataKey="count"
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
                              `${value} occurrences (${props.payload.percentage}%)`, 
                              `Difference: ${props.payload.difference}`
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
                    <div className="detail-label">Pattern Occurrences</div>
                    <div className="detail-value">{occurrenceCount} times</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Pattern Prevalence</div>
                    <div className="detail-value">{occurrencePercentage}%</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Dataset Size</div>
                    <div className="detail-value">{data.length} samples</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Unique Patterns</div>
                    <div className="detail-value">{occurrenceChartData.length}</div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-label">Most Common Pattern</div>
                    <div className="detail-value">
                      {occurrenceChartData.length > 0 
                        ? `${occurrenceChartData.reduce((max, item) => 
                            item.count > max.count ? item : max
                          ).difference} units`
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
              <span>Auto-refreshing every second</span>
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
                <BarChart data={data.slice(0, 20)}>
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
                <LineChart data={data.slice(0, 20)}>
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

          <div className="data-summary">
            <h2>📊 Statistical Summary: {chartColumn}</h2>
            <div className="summary-grid">
              <div className="stat-card">
                <div className="stat-icon">📉</div>
                <div className="stat-label">Minimum</div>
                <div className="stat-value">{Math.min(...data.map(item => item[chartColumn]))}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-label">Maximum</div>
                <div className="stat-value">{Math.max(...data.map(item => item[chartColumn]))}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-label">Average</div>
                <div className="stat-value">{(data.reduce((sum, item) => sum + item[chartColumn], 0) / data.length).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">∑</div>
                <div className="stat-label">Total</div>
                <div className="stat-value">{data.reduce((sum, item) => sum + item[chartColumn], 0).toFixed(2)}</div>
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
          gap: 8px;
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
          animation: pulse 2s infinite;
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
          animation: pulse 1s infinite;
        }
        
        /* Data Grid */
        .data-grid {
          display: grid;
          gap: 20px;
        }
        
        .latest-data-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease;
        }
        
        .latest-data-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        .card-header {
          background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
          color: #000;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .card-header h3 {
          font-size: 20px;
          font-weight: 600;
        }
        
        .header-accent {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transform: translate(30px, -30px);
        }
        
        .card-content {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .data-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border-left: 3px solid #00C9FF;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .data-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-left-color: #92FE9D;
        }
        
        .item-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .item-value {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
        }
        
        .item-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 6px;
          height: 6px;
          background: #00C9FF;
          border-radius: 50%;
          animation: pulse 2s infinite;
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
        
        .occurrence-metric {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
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
        
        .metric-unit {
          font-size: 18px;
          font-weight: 600;
          color: #00C9FF;
          margin-bottom: 10px;
        }
        
        .occurrence-metric .metric-unit {
          color: #FFC107;
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
          animation: pulse 2s infinite;
        }
        
        .occurrence-trend {
          background: linear-gradient(90deg, #FFC107, #FF9800);
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
          border-color: #00C9FF;
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
          animation: pulse 1s infinite;
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
        
        /* Animations */
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
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
          
          .chart-controls {
            flex-direction: column;
            align-items: center;
          }
          
          .metric-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
