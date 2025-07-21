import { useState, useEffect } from "react";
import {
  BarChart, LineChart, XAxis, YAxis, Tooltip, Legend,
  Bar, Line, CartesianGrid, ResponsiveContainer
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

  // Calculate S1 - S2 difference for latest entry only
  let latestDifference = null;
  let latestFrequency = null;
  
  if (latestEntry && typeof latestEntry.S1 === 'number' && typeof latestEntry.S2 === 'number') {
    latestDifference = latestEntry.S1 - latestEntry.S2;
    
    // Calculate frequency count for this specific difference value across all data
    let frequencyCount = 0;
    data.forEach(row => {
      if (typeof row.S1 === 'number' && typeof row.S2 === 'number') {
        const diff = row.S1 - row.S2;
        if (diff === latestDifference) {
          frequencyCount++;
        }
      }
    });
    latestFrequency = frequencyCount;
  }

  return (
    <div className="dashboard">
      <h1>Google Sheets Dashboard</h1>

      <div className="tabs">
        <button
          className={activeTab === 'latest' ? 'active' : ''}
          onClick={() => setActiveTab('latest')}
        >
          Latest Data
        </button>
        {numericalColumns.length > 0 && (
          <button
            className={activeTab === 'charts' ? 'active' : ''}
            onClick={() => setActiveTab('charts')}
          >
            Charts
          </button>
        )}
      </div>

      {activeTab === 'latest' && (
        <div className="latest-data-container">
          <h2>Latest Data Entry</h2>
          <div className="latest-data-card">
            <div className="latest-card-header">
              <h3>Latest Update</h3>
              <span className="timestamp">
                Last updated: {lastUpdated.toLocaleTimeString()}
                <span className="pulse-dot"></span>
              </span>
            </div>
            <div className="latest-card-content">
              {headers.map(header => (
                <div className="latest-data-item" key={header}>
                  <div className="item-label">{header}</div>
                  <div className="item-value">
                    {typeof latestEntry[header] === 'number'
                      ? latestEntry[header].toLocaleString()
                      : latestEntry[header]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Display S1 - S2 Difference and Frequency for Latest Entry */}
          {latestDifference !== null && latestFrequency !== null && (
            <div className="frequency-section">
              <h2>Latest S1 - S2 Analysis</h2>
              <div className="frequency-display">
                <div className="frequency-row">
                  <div className="frequency-card difference-card">
                    <div className="card-header">Difference</div>
                    <div className="card-value">{latestDifference}</div>
                    <div className="card-unit">units</div>
                    <div className="card-calculation">
                      S1 ({latestEntry.S1}) - S2 ({latestEntry.S2})
                    </div>
                  </div>
                  
                  <div className="frequency-card frequency-main">
                    <div className="card-header">Frequency</div>
                    <div className="card-value">{latestFrequency}</div>
                    <div className="card-unit">Hz</div>
                    <div className="card-calculation">
                      Occurrences of difference "{latestDifference}"
                    </div>
                  </div>
                </div>
                
                <div className="frequency-details">
                  <div className="detail-item">
                    <span className="detail-label">Latest Difference Value:</span>
                    <span className="detail-value">{latestDifference} units</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Frequency of this difference:</span>
                    <span className="detail-value">{latestFrequency} Hz</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total dataset entries:</span>
                    <span className="detail-value">{data.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="auto-refresh-status">
            <div className="refresh-status">
              Auto-refreshing every second
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && numericalColumns.length > 0 && (
        <div className="charts-container">
          <div className="chart-controls">
            <div className="control-group">
              <label htmlFor="chart-type">Chart Type:</label>
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
              <label htmlFor="chart-column">Data Column:</label>
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
            <h2>{chartType === 'bar' ? 'Bar' : 'Line'} Chart: {chartColumn}</h2>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={data.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={categoryColumn} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={chartColumn} fill="#3498db" />
                </BarChart>
              ) : (
                <LineChart data={data.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={categoryColumn} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={chartColumn} stroke="#3498db" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="data-summary">
            <h2>Data Summary for {chartColumn}</h2>
            <div className="summary-stats">
              <div className="stat-box">
                <h3>Minimum</h3>
                <p>{Math.min(...data.map(item => item[chartColumn]))}</p>
              </div>
              <div className="stat-box">
                <h3>Maximum</h3>
                <p>{Math.max(...data.map(item => item[chartColumn]))}</p>
              </div>
              <div className="stat-box">
                <h3>Average</h3>
                <p>{(data.reduce((sum, item) => sum + item[chartColumn], 0) / data.length).toFixed(2)}</p>
              </div>
              <div className="stat-box">
                <h3>Total</h3>
                <p>{data.reduce((sum, item) => sum + item[chartColumn], 0).toFixed(2)}</p>
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f7fa;
          color: #333;
          line-height: 1.6;
        }
        
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
          font-size: 28px;
        }
        
        h2 {
          color: #34495e;
          margin: 15px 0;
          font-size: 20px;
        }
        
        h3 {
          font-size: 16px;
          margin-bottom: 5px;
          color: #7f8c8d;
        }
        
        .loading, .error, .empty {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .error {
          color: #e74c3c;
        }
        
        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .tabs button {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          padding: 10px 20px;
          margin: 0 5px;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.3s ease;
          font-size: 16px;
        }
        
        .tabs button.active {
          background-color: #3498db;
          color: white;
          border-color: #3498db;
        }
        
        .tabs button:hover:not(.active) {
          background-color: #e9ecef;
        }
        
        .charts-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }
        
        .chart-controls {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        
        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        label {
          font-weight: 600;
        }
        
        select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background-color: white;
          font-size: 14px;
        }
        
        .chart-box {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 20px;
          background-color: white;
        }
        
        .data-summary {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 20px;
          background-color: white;
        }
        
        .summary-stats {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .stat-box {
          flex: 1;
          min-width: 120px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid #3498db;
        }
        
        .stat-box p {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        /* Latest Data View Styles */
        .latest-data-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
        }
        
        .latest-data-card {
          width: 100%;
          max-width: 800px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin: 20px 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .latest-data-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
        }
        
        .latest-card-header {
          background-color: #3498db;
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .latest-card-header h3 {
          margin: 0;
          font-size: 22px;
          color: white;
        }
        
        .timestamp {
          font-size: 14px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #2ecc71;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
          }
          
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 5px rgba(46, 204, 113, 0);
          }
          
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
          }
        }
        
        .latest-card-content {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .latest-data-item {
          display: flex;
          flex-direction: column;
          padding: 10px;
          border-radius: 6px;
          background-color: #f8f9fa;
          transition: background-color 0.2s ease;
        }
        
        .latest-data-item:hover {
          background-color: #e9ecef;
        }
        
        .item-label {
          font-weight: 600;
          color: #7f8c8d;
          margin-bottom: 5px;
          font-size: 14px;
          text-transform: uppercase;
        }
        
        .item-value {
          color: #2c3e50;
          font-weight: 500;
          font-size: 18px;
        }
        
        /* Frequency Section Styles */
        .frequency-section {
          width: 100%;
          max-width: 800px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
          padding: 25px;
          margin: 20px 0;
        }
        
        .frequency-display {
          margin-top: 20px;
        }
        
        .frequency-row {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .frequency-card {
          flex: 1;
          text-align: center;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        
        .frequency-card:hover {
          transform: translateY(-3px);
        }
        
        .difference-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .frequency-main {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .card-header {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          opacity: 0.9;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .card-value {
          font-size: 42px;
          font-weight: bold;
          margin-bottom: 5px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .card-unit {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
          opacity: 0.8;
        }
        
        .card-calculation {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.4;
        }
        
        .frequency-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #7f8c8d;
        }
        
        .detail-value {
          font-weight: 600;
          color: #2c3e50;
          font-size: 16px;
        }
        
        .auto-refresh-status {
          margin-top: 20px;
          text-align: center;
        }
        
        .refresh-status {
          display: inline-block;
          color: #2ecc71;
          font-weight: 600;
          background-color: rgba(46, 204, 113, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .dashboard {
            padding: 10px;
          }
          
          .tabs button {
            padding: 8px 12px;
            font-size: 14px;
          }
          
          .summary-stats {
            flex-direction: column;
          }
          
          .stat-box {
            width: 100%;
          }
          
          .frequency-row {
            flex-direction: column;
            gap: 15px;
          }
          
          .card-value {
            font-size: 36px;
          }
          
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
