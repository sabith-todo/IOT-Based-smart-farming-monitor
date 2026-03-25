import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const StatCard = ({ title, value, sub, color = '#58a6ff' }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0d1117, #111827)',
      border: '1px solid #30363d',
      borderRadius: '18px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    }}
  >
    <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '10px', fontWeight: 700 }}>
      {title}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#6e7681', marginTop: '8px' }}>{sub}</div>
  </div>
);

const InsightCard = ({ title, text, color }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0b1220, #111827)',
      border: '1px solid #30363d',
      borderRadius: '16px',
      padding: '18px',
      borderLeft: `4px solid ${color}`,
    }}
  >
    <h3 style={{ margin: '0 0 10px 0', color }}>{title}</h3>
    <p style={{ margin: 0, color: '#c9d1d9', lineHeight: 1.7 }}>{text}</p>
  </div>
);

const Dashboard2 = ({ history = [], activeScan = {}, gps, autoMode }) => {
  const recent = history.slice(0, 10);

  const avg = (arr) =>
    arr.length ? (arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length).toFixed(1) : '0';

  const avgTemp = avg(recent.map((h) => h.temp));
  const avgHumidity = avg(recent.map((h) => h.humidity));
  const avgMoisture = avg(recent.map((h) => h.moisture));
  const avgPH = avg(recent.map((h) => h.ph));
  const avgRain = avg(recent.map((h) => h.rainChance || 0));

  const healthScore = useMemo(() => {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            Math.abs(Number(activeScan.temp || 0) - 28) * 2 -
            Math.abs(Number(activeScan.moisture || 0) - 55) * 0.8 -
            Math.abs(Number(activeScan.ph || 0) - 6.8) * 10
        )
      )
    );
  }, [activeScan]);

  const riskLevel = useMemo(() => {
    const rain = Number(activeScan.rainChance || 0);
    const moisture = Number(activeScan.moisture || 0);
    const temp = Number(activeScan.temp || 0);

    if (rain > 75 || temp > 38 || moisture < 30) return 'HIGH';
    if (rain > 50 || temp > 34 || moisture < 40) return 'MEDIUM';
    return 'LOW';
  }, [activeScan]);

  const trendLabels = recent.slice().reverse().map((h) => h.time || '--');
  const trendTemp = recent.slice().reverse().map((h) => Number(h.temp || 0));
  const trendMoisture = recent.slice().reverse().map((h) => Number(h.moisture || 0));
  const trendRain = recent.slice().reverse().map((h) => Number(h.rainChance || 0));
  const trendHumidity = recent.slice().reverse().map((h) => Number(h.humidity || 0));

  const cropDistribution = useMemo(() => {
    const counts = {};
    history.forEach((item) => {
      const crop = item.crop || 'Unknown';
      counts[crop] = (counts[crop] || 0) + 1;
    });

    return {
      labels: Object.keys(counts).length ? Object.keys(counts) : ['No Data'],
      datasets: [
        {
          data: Object.keys(counts).length ? Object.values(counts) : [1],
          backgroundColor: ['#22c55e', '#38bdf8', '#a855f7', '#f43f5e', '#fbbf24', '#14b8a6'],
          borderWidth: 1,
          borderColor: '#0d1117',
        },
      ],
    };
  }, [history]);

  const moistureStatusText =
    Number(activeScan.moisture || 0) < 35
      ? 'Soil moisture is low. Watering is recommended.'
      : Number(activeScan.moisture || 0) < 50
      ? 'Soil moisture is moderate. Observe before watering.'
      : 'Soil moisture is healthy. No urgent watering needed.';

  const rainInsightText =
    Number(activeScan.rainChance || 0) > 70
      ? 'Heavy rain probability detected. Stop irrigation and monitor field drainage.'
      : Number(activeScan.rainChance || 0) > 40
      ? 'Rain may occur. Use moderate irrigation planning.'
      : 'Low rain chance. Irrigation may continue based on soil condition.';

  const phInsightText =
    Number(activeScan.ph || 0) < 6
      ? 'Soil is acidic. Consider crops suitable for low pH or balancing treatment.'
      : Number(activeScan.ph || 0) > 7.5
      ? 'Soil is alkaline. Crop suitability may reduce for sensitive crops.'
      : 'Soil pH is in a good range for many crops.';

  const performanceBarData = {
    labels: ['Temperature', 'Humidity', 'Moisture', 'Rain', 'Health'],
    datasets: [
      {
        label: 'Farm Performance',
        data: [
          Number(avgTemp),
          Number(avgHumidity),
          Number(avgMoisture),
          Number(avgRain),
          Number(healthScore),
        ],
        backgroundColor: ['#f43f5e', '#38bdf8', '#22c55e', '#fbbf24', '#a855f7'],
        borderRadius: 8,
      },
    ],
  };

  const trendLineData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Temperature',
        data: trendTemp,
        borderColor: '#f43f5e',
        tension: 0.4,
      },
      {
        label: 'Moisture',
        data: trendMoisture,
        borderColor: '#22c55e',
        tension: 0.4,
      },
      {
        label: 'Rain Chance',
        data: trendRain,
        borderColor: '#38bdf8',
        tension: 0.4,
      },
      {
        label: 'Humidity',
        data: trendHumidity,
        borderColor: '#fbbf24',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#c9d1d9' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8b949e' },
        grid: { color: '#21262d' },
      },
      y: {
        ticks: { color: '#8b949e' },
        grid: { color: '#21262d' },
      },
    },
  };

  const riskColor =
    riskLevel === 'HIGH' ? '#f43f5e' : riskLevel === 'MEDIUM' ? '#fbbf24' : '#22c55e';

  return (
    <div style={styles.page}>
      <style>{`
        .d2-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .d2-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .d2-card {
          background: linear-gradient(135deg, #0d1117, #111827);
          border: 1px solid #30363d;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.24);
        }

        .d2-chart-box {
          height: 360px;
          margin-top: 18px;
          background: #0b1220;
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 18px;
        }

        @media (max-width: 768px) {
          .d2-topbar {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>

      <div
        className="d2-topbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '30px', color: '#fff' }}>🚀 Smart Farming Analytics Hub</h1>
          <p style={{ margin: '8px 0 0 0', color: '#8b949e' }}>
            Advanced monitoring, insights, performance analysis, and smart farming summary
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={styles.navBtn}>
            ← Main Dashboard
          </Link>
          <Link to="/dashboard/advanced" style={styles.navBtnGreen}>
            Open Advanced Route
          </Link>
        </div>
      </div>

      <div className="d2-grid" style={{ marginBottom: '22px' }}>
        <StatCard
          title="Farm Health Score"
          value={`${healthScore}%`}
          sub="Calculated overall condition"
          color="#22c55e"
        />
        <StatCard
          title="Risk Level"
          value={riskLevel}
          sub="Rain / heat / moisture combined"
          color={riskColor}
        />
        <StatCard
          title="Auto Irrigation"
          value={autoMode ? 'ENABLED' : 'DISABLED'}
          sub="Simulation control mode"
          color={autoMode ? '#22c55e' : '#f43f5e'}
        />
        <StatCard
          title="Active Crop"
          value={activeScan.crop || 'N/A'}
          sub="Current crop recommendation"
          color="#a855f7"
        />
        <StatCard
          title="GPS Position"
          value={gps ? 'LIVE' : 'WAITING'}
          sub={gps ? `${gps.lat}, ${gps.lon}` : 'Location not available'}
          color="#38bdf8"
        />
        <StatCard
          title="Scans Available"
          value={history.length}
          sub="Stored monitoring records"
          color="#fbbf24"
        />
      </div>

      <div className="d2-grid-2" style={{ marginBottom: '22px' }}>
        <div className="d2-card">
          <h2 style={styles.sectionTitle}>Current Scan Summary</h2>
          <div className="d2-grid">
            <StatCard title="Temperature" value={`${activeScan.temp || 0}°C`} sub="Live reading" color="#f43f5e" />
            <StatCard title="Humidity" value={`${activeScan.humidity || 0}%`} sub="Atmospheric moisture" color="#38bdf8" />
            <StatCard title="Soil Moisture" value={`${activeScan.moisture || 0}%`} sub="Ground water condition" color="#22c55e" />
            <StatCard title="pH Level" value={activeScan.ph || 0} sub="Soil acidity balance" color="#facc15" />
            <StatCard title="Rain Chance" value={`${activeScan.rainChance || 0}%`} sub="Predicted rainfall" color="#14b8a6" />
            <StatCard title="Irrigation" value={activeScan.irrigation || 'N/A'} sub="System advice" color="#fbbf24" />
          </div>
        </div>

        <div className="d2-card">
          <h2 style={styles.sectionTitle}>Average Performance</h2>
          <div className="d2-grid">
            <StatCard title="Avg Temperature" value={`${avgTemp}°C`} sub="Recent scans" color="#f43f5e" />
            <StatCard title="Avg Humidity" value={`${avgHumidity}%`} sub="Recent scans" color="#38bdf8" />
            <StatCard title="Avg Moisture" value={`${avgMoisture}%`} sub="Recent scans" color="#22c55e" />
            <StatCard title="Avg pH" value={avgPH} sub="Recent scans" color="#facc15" />
            <StatCard title="Avg Rain" value={`${avgRain}%`} sub="Recent scans" color="#14b8a6" />
            <StatCard title="Status" value={activeScan.status || 'SYSTEM READY'} sub="Latest field condition" color="#a855f7" />
          </div>
        </div>
      </div>

      <div className="d2-card" style={{ marginBottom: '22px' }}>
        <h2 style={styles.sectionTitle}>Trend Analysis</h2>
        <div className="d2-chart-box">
          <Line data={trendLineData} options={chartOptions} />
        </div>
      </div>

      <div className="d2-grid-2" style={{ marginBottom: '22px' }}>
        <div className="d2-card">
          <h2 style={styles.sectionTitle}>Farm Performance Comparison</h2>
          <div className="d2-chart-box" style={{ height: '320px' }}>
            <Bar data={performanceBarData} options={chartOptions} />
          </div>
        </div>

        <div className="d2-card">
          <h2 style={styles.sectionTitle}>Crop Distribution</h2>
          <div className="d2-chart-box" style={{ height: '320px' }}>
            <Doughnut
              data={cropDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#c9d1d9' } },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="d2-grid-2">
        <InsightCard
          title="Soil Insight"
          text={moistureStatusText}
          color="#22c55e"
        />
        <InsightCard
          title="Rain Insight"
          text={rainInsightText}
          color="#38bdf8"
        />
        <InsightCard
          title="pH Insight"
          text={phInsightText}
          color="#facc15"
        />
        <InsightCard
          title="Automation Insight"
          text={
            autoMode
              ? 'Automatic irrigation mode is enabled. The system can respond based on moisture and rain condition.'
              : 'Automatic irrigation mode is disabled. Manual observation and control are active.'
          }
          color="#a855f7"
        />
      </div>

      <div className="d2-card" style={{ marginTop: '22px' }}>
        <h2 style={styles.sectionTitle}>Recent Records</h2>
        {history.length === 0 ? (
          <p style={{ color: '#8b949e' }}>No monitoring records available.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '14px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>TIME</th>
                  <th style={styles.th}>TEMP</th>
                  <th style={styles.th}>HUMIDITY</th>
                  <th style={styles.th}>MOISTURE</th>
                  <th style={styles.th}>pH</th>
                  <th style={styles.th}>RAIN</th>
                  <th style={styles.th}>CROP</th>
                  <th style={styles.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((item, index) => (
                  <tr key={item._id || `${item.time}-${index}`}>
                    <td style={styles.td}>{item.time}</td>
                    <td style={styles.td}>{item.temp}°C</td>
                    <td style={styles.td}>{item.humidity}%</td>
                    <td style={styles.td}>{item.moisture}%</td>
                    <td style={styles.td}>{item.ph}</td>
                    <td style={styles.td}>{item.rainChance || 0}%</td>
                    <td style={styles.td}>{item.crop}</td>
                    <td style={styles.td}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#010409',
    color: '#c9d1d9',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '28px',
  },
  sectionTitle: {
    margin: 0,
    marginBottom: '6px',
    color: '#fff',
    fontSize: '24px',
  },
  navBtn: {
    background: '#1e293b',
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontWeight: 700,
    display: 'inline-block',
  },
  navBtnGreen: {
    background: '#238636',
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontWeight: 700,
    display: 'inline-block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #30363d',
    color: '#58a6ff',
    fontSize: '13px',
  },
  td: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #21262d',
    color: '#c9d1d9',
    fontSize: '14px',
  },
};

export default Dashboard2;