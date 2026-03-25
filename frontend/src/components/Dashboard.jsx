import React, { useEffect, useState, useMemo, useRef } from 'react';
import Dashboard2 from './Dashboard2';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  FeatureGroup,
} from 'react-leaflet';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import L from 'leaflet';
import FrequencyDashboard from './FrequencyDashboard';

import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

ChartJS.register(...registerables);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_SCAN = {
  temp: 0,
  humidity: 0,
  moisture: 0,
  depthTemp: 0,
  ph: 0,
  crop: 'N/A',
  lat: '0.00',
  lng: '0.00',
  time: 'STANDBY',
  status: 'SYSTEM READY',
  rainChance: 0,
  irrigation: 'Not Required',
  autoIrrigation: 'OFF',
};

const downloadSessionData = (history) => {
  if (history.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers =
    'Time,Latitude,Longitude,Temperature(C),Humidity(%),Moisture(%),RootTemp(C),pH,Crop,RainChance(%),Irrigation,AutoIrrigation,Status\n';

  const csvContent = history
    .map((h) =>
      [
        h.time,
        h.lat,
        h.lng,
        h.temp,
        h.humidity,
        h.moisture,
        h.depthTemp || '',
        h.ph,
        h.crop,
        h.rainChance || 0,
        h.irrigation || '',
        h.autoIrrigation || '',
        h.status || '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `SMART_FARM_LOG_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const MapController = ({ onMark, isLocked, gps, drawnItemsRef, mapInstanceRef }) => {
  const map = useMap();

  useEffect(() => {
    mapInstanceRef.current = map;
  }, [map, mapInstanceRef]);

  useEffect(() => {
    if (gps && isLocked) {
      map.flyTo([gps.lat, gps.lon], 16, { animate: true });
    }
  }, [gps, isLocked, map]);

  useEffect(() => {
    if (!map.pm) return;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    const handleCreate = (e) => {
      if (drawnItemsRef.current) {
        drawnItemsRef.current.addLayer(e.layer);
      }
    };

    map.on('pm:create', handleCreate);

    return () => {
      map.off('pm:create', handleCreate);
      if (map.pm) {
        map.pm.disableDraw();
        map.pm.disableGlobalEditMode();
        map.pm.disableGlobalDragMode();
        map.pm.disableGlobalRemovalMode();
        map.pm.removeControls();
      }
    };
  }, [map, drawnItemsRef]);

  useMapEvents({
    click(e) {
      onMark(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const StatCard = ({ title, value, sub, color = '#58a6ff' }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0d1117, #111827)',
      border: '1px solid #30363d',
      borderRadius: '16px',
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

const DataTile = ({ title, val, unit, color, history }) => {
  const chartData = useMemo(
    () => ({
      labels: history.length > 0 ? history.map((_, i) => i + 1) : [1, 2, 3, 4, 5],
      datasets: [
        {
          data: history.length > 0 ? history : [0, 0, 0, 0, 0],
          borderColor: color,
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
      ],
    }),
    [history, color]
  );

  return (
    <div className="metric-card">
      <div
        style={{
          fontSize: '11px',
          color: '#8b949e',
          fontWeight: 'bold',
          marginBottom: '10px',
        }}
      >
        {title}
      </div>

      <div style={{ fontSize: '28px', fontWeight: 'bold', wordBreak: 'break-word' }}>
        {val}
        <span style={{ fontSize: '14px', color: '#6e7681', marginLeft: '5px' }}>{unit}</span>
      </div>

      <div style={{ height: '45px', marginTop: '10px' }}>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: false },
              y: { display: false },
            },
          }}
        />
      </div>
    </div>
  );
};

const OverviewPage = ({
  gps,
  isLocked,
  setIsLocked,
  loading,
  alertMsg,
  mapType,
  setMapType,
  history,
  activeScan,
  handleMark,
  getTileLayer,
  clearAllHistory,
  removeLastHistory,
  drawnItemsRef,
  clearDrawTools,
  mapInstanceRef,
  farmHealthScore,
}) => {
  return (
    <>
      <div className="top-nav">
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>SMART FARMING CONTROL CENTER</h1>
          <span
            className="badge"
            style={{
              color:
                alertMsg === 'THERMAL CRITICAL'
                  ? '#f43f5e'
                  : alertMsg === 'LOW SOIL MOISTURE'
                  ? '#fbbf24'
                  : alertMsg === 'RAIN EXPECTED - STOP WATERING'
                  ? '#38bdf8'
                  : '#22c55e',
              borderColor:
                alertMsg === 'THERMAL CRITICAL'
                  ? '#f43f5e'
                  : alertMsg === 'LOW SOIL MOISTURE'
                  ? '#fbbf24'
                  : alertMsg === 'RAIN EXPECTED - STOP WATERING'
                  ? '#38bdf8'
                  : '#22c55e',
            }}
          >
            {alertMsg}
          </span>

          {loading && (
            <div style={{ marginTop: '8px', color: '#58a6ff', fontWeight: 'bold' }}>
              ⏳ Fetching live field intelligence...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-main"
            style={{ background: '#21262d', border: '1px solid #30363d' }}
            onClick={() => setMapType(mapType === 'satellite' ? 'normal' : 'satellite')}
          >
            {mapType === 'satellite' ? 'NORMAL MAP' : 'SATELLITE MAP'}
          </button>

          <button
            className="btn-main"
            style={{ background: '#21262d', border: '1px solid #30363d' }}
            onClick={() => downloadSessionData(history)}
          >
            EXPORT CSV
          </button>

          <button
            className="btn-main"
            onClick={() => {
              if (gps) {
                handleMark(gps.lat, gps.lon);
              } else {
                alert('GPS location not available yet.');
              }
            }}
          >
            LIVE SCAN
          </button>

          <button className="btn-main" style={{ background: '#b45309' }} onClick={removeLastHistory}>
            REMOVE LAST
          </button>

          <button className="btn-main" style={{ background: '#dc2626' }} onClick={clearAllHistory}>
            CLEAR MARKS
          </button>

          <button className="btn-main" style={{ background: '#7c3aed' }} onClick={clearDrawTools}>
            CLEAR TOOLS
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          marginBottom: '20px',
        }}
      >
        <StatCard title="Farm Status" value={activeScan.status || 'READY'} sub="Current system health" color="#22c55e" />
        <StatCard
          title="Rain Prediction"
          value={`${activeScan.rainChance || 0}%`}
          sub="Estimated rainfall probability"
          color="#38bdf8"
        />
        <StatCard
          title="Irrigation Plan"
          value={activeScan.irrigation || 'Pending'}
          sub="Generated watering schedule"
          color="#fbbf24"
        />
        <StatCard
          title="Auto Irrigation"
          value={activeScan.autoIrrigation || 'OFF'}
          sub="Simulation controller state"
          color={activeScan.autoIrrigation === 'ON' ? '#22c55e' : '#f43f5e'}
        />
        <StatCard title="Detected Crop" value={activeScan.crop || 'N/A'} sub="AI crop suitability" color="#a855f7" />
        <StatCard title="Farm Health" value={`${farmHealthScore}%`} sub="Calculated health score" color="#22c55e" />
      </div>

      <div className="map-container">
        {gps && (
          <MapContainer center={[gps.lat, gps.lon]} zoom={16} zoomControl={false} style={{ height: '100%' }}>
            <TileLayer url={getTileLayer()} />
            <FeatureGroup ref={drawnItemsRef} />

            <Marker position={[gps.lat, gps.lon]}>
              <Popup>
                <div>
                  <strong>Live GPS Position</strong>
                  <br />
                  Latitude: {gps.lat}
                  <br />
                  Longitude: {gps.lon}
                </div>
              </Popup>
            </Marker>

            {history.map((pt, i) => (
              <Marker key={pt._id || `${pt.lat}-${pt.lng}-${i}`} position={[parseFloat(pt.lat), parseFloat(pt.lng)]}>
                <Popup>
                  <div>
                    <strong>Scan Record</strong>
                    <br />
                    Time: {pt.time}
                    <br />
                    Temp: {pt.temp}°C
                    <br />
                    Humidity: {pt.humidity}%
                    <br />
                    Moisture: {pt.moisture}%
                    <br />
                    pH: {pt.ph}
                    <br />
                    Crop: {pt.crop}
                    <br />
                    Rain Chance: {pt.rainChance || 0}%
                    <br />
                    Irrigation: {pt.irrigation || 'N/A'}
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapController
              onMark={handleMark}
              isLocked={isLocked}
              gps={gps}
              drawnItemsRef={drawnItemsRef}
              mapInstanceRef={mapInstanceRef}
            />
          </MapContainer>
        )}

        <button
          onClick={() => setIsLocked(!isLocked)}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            background: '#0d1117',
            color: '#fff',
            border: '1px solid #30363d',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {isLocked ? '🔒 GPS LOCKED' : '🔓 MANUAL PAN'}
        </button>
      </div>

      <div className="metric-grid">
        <DataTile title="AIR TEMP" val={activeScan.temp} unit="°C" color="#f43f5e" history={history.map((h) => Number(h.temp))} />
        <DataTile title="HUMIDITY" val={activeScan.humidity} unit="%" color="#38bdf8" history={history.map((h) => Number(h.humidity))} />
        <DataTile title="SOIL MOISTURE" val={activeScan.moisture} unit="%" color="#00f2ff" history={history.map((h) => Number(h.moisture))} />
        <DataTile title="ROOT TEMP" val={activeScan.depthTemp} unit="°C" color="#a855f7" history={history.map((h) => Number(h.depthTemp || 0))} />
        <DataTile title="SOIL pH" val={activeScan.ph} unit="" color="#facc15" history={history.map((h) => Number(h.ph))} />
        <DataTile title="RAIN CHANCE" val={activeScan.rainChance || 0} unit="%" color="#22c55e" history={history.map((h) => Number(h.rainChance || 0))} />
      </div>
    </>
  );
};

const IrrigationPage = ({ activeScan, autoMode, setAutoMode }) => {
  const recommendationColor =
    activeScan.irrigation === 'Stop Watering'
      ? '#38bdf8'
      : activeScan.irrigation === 'Water Now'
      ? '#f43f5e'
      : activeScan.irrigation === 'Moderate Watering'
      ? '#fbbf24'
      : '#22c55e';

  return (
    <div className="page-card">
      <h2>Auto Irrigation Simulation</h2>

      <div className="card-grid-2">
        <StatCard
          title="Current Soil Moisture"
          value={`${activeScan.moisture}%`}
          sub="Simulated soil condition"
          color="#38bdf8"
        />
        <StatCard
          title="Recommendation"
          value={activeScan.irrigation}
          sub="System-generated watering decision"
          color={recommendationColor}
        />
        <StatCard
          title="Rain Prediction"
          value={`${activeScan.rainChance || 0}%`}
          sub="Rain logic affects irrigation"
          color="#22c55e"
        />
        <StatCard
          title="Auto Mode"
          value={autoMode ? 'ENABLED' : 'DISABLED'}
          sub="Simulation control"
          color={autoMode ? '#22c55e' : '#f43f5e'}
        />
      </div>

      <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn-main" onClick={() => setAutoMode(true)}>
          ENABLE AUTO IRRIGATION
        </button>
        <button className="btn-main" style={{ background: '#dc2626' }} onClick={() => setAutoMode(false)}>
          DISABLE AUTO IRRIGATION
        </button>
      </div>

      <div className="insight-box">
        <h3>Irrigation Logic</h3>
        <p>
          Rain has highest priority. Very dry soil triggers immediate watering. Moderate moisture with
          high temperature triggers moderate watering. Wet soil or high rain chance stops irrigation.
        </p>
      </div>
    </div>
  );
};

const WeatherIntelligencePage = ({ history }) => {
  const labels = history.slice(0, 7).map((h) => h.time).reverse();
  const temps = history.slice(0, 7).map((h) => Number(h.temp)).reverse();
  const humidity = history.slice(0, 7).map((h) => Number(h.humidity)).reverse();
  const rain = history.slice(0, 7).map((h) => Number(h.rainChance || 0)).reverse();

  return (
    <div className="page-card">
      <h2>Weather Intelligence</h2>
      <div className="chart-box">
        <Line
          data={{
            labels,
            datasets: [
              { label: 'Temperature', data: temps, borderColor: '#f43f5e', tension: 0.4 },
              { label: 'Humidity', data: humidity, borderColor: '#38bdf8', tension: 0.4 },
              { label: 'Rain Chance', data: rain, borderColor: '#22c55e', tension: 0.4 },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#c9d1d9' } } },
            scales: {
              x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
              y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
            },
          }}
        />
      </div>
    </div>
  );
};

const WeeklyReportPage = ({ history }) => {
  const recent = history.slice(0, 7);

  const avg = (arr) =>
    arr.length ? (arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length).toFixed(1) : 0;

  const avgTemp = avg(recent.map((h) => h.temp));
  const avgHumidity = avg(recent.map((h) => h.humidity));
  const avgMoisture = avg(recent.map((h) => h.moisture));
  const avgRain = avg(recent.map((h) => h.rainChance || 0));

  return (
    <div className="page-card">
      <h2>Weekly Farming Report</h2>

      <div className="card-grid-2">
        <StatCard title="Average Temperature" value={`${avgTemp}°C`} sub="Last 7 scans" color="#f43f5e" />
        <StatCard title="Average Humidity" value={`${avgHumidity}%`} sub="Last 7 scans" color="#38bdf8" />
        <StatCard title="Average Moisture" value={`${avgMoisture}%`} sub="Last 7 scans" color="#22c55e" />
        <StatCard title="Average Rain Chance" value={`${avgRain}%`} sub="Last 7 scans" color="#fbbf24" />
      </div>

      <div className="chart-box" style={{ marginTop: '20px' }}>
        <Bar
          data={{
            labels: ['Temperature', 'Humidity', 'Moisture', 'Rain'],
            datasets: [
              {
                label: 'Weekly Average',
                data: [Number(avgTemp), Number(avgHumidity), Number(avgMoisture), Number(avgRain)],
                backgroundColor: ['#f43f5e', '#38bdf8', '#22c55e', '#fbbf24'],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#c9d1d9' } } },
            scales: {
              x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
              y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
            },
          }}
        />
      </div>
    </div>
  );
};

const ArchiveView = ({ history, deleteRecord, archiveSearch, setArchiveSearch }) => {
  const filteredHistory = history.filter((h) => {
    const q = archiveSearch.toLowerCase();
    return (
      h.time?.toLowerCase().includes(q) ||
      h.crop?.toLowerCase().includes(q) ||
      h.status?.toLowerCase().includes(q) ||
      h.irrigation?.toLowerCase().includes(q) ||
      String(h.lat).toLowerCase().includes(q) ||
      String(h.lng).toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-card">
      <h2>Session Data Archive</h2>

      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search by time, crop, status, irrigation..."
          value={archiveSearch}
          onChange={(e) => setArchiveSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #30363d',
            background: '#0b1220',
            color: '#fff',
            outline: 'none',
          }}
        />
      </div>

      {filteredHistory.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#484f58' }}>No records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>TIME</th>
              <th>COORDINATES</th>
              <th>TEMP</th>
              <th>HUMIDITY</th>
              <th>MOISTURE</th>
              <th>RAIN</th>
              <th>IRRIGATION</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((h, i) => (
              <tr key={h._id || `${h.lat}-${h.lng}-${i}`}>
                <td>{h.time}</td>
                <td style={{ fontSize: '12px' }}>
                  {h.lat}, {h.lng}
                </td>
                <td>{h.temp}°C</td>
                <td>{h.humidity}%</td>
                <td>{h.moisture}%</td>
                <td>{h.rainChance || 0}%</td>
                <td>{h.irrigation || 'N/A'}</td>
                <td>
                  {h._id ? (
                    <button className="delete-btn" onClick={() => deleteRecord(h._id)}>
                      Delete
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AdvancedAnalyticsPage = ({ history, activeScan, autoMode, gps }) => {
  const recent = history.slice(0, 10);

  const avg = (arr) =>
    arr.length ? (arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length).toFixed(1) : '0';

  const avgTemp = avg(recent.map((h) => h.temp));
  const avgHumidity = avg(recent.map((h) => h.humidity));
  const avgMoisture = avg(recent.map((h) => h.moisture));
  const avgPH = avg(recent.map((h) => h.ph));
  const avgRain = avg(recent.map((h) => h.rainChance || 0));

  const healthScore = Math.max(
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

  return (
    <div className="page-card">
      <h2>Advanced Farm Analytics</h2>

      <div className="card-grid-2">
        <StatCard title="Farm Health Score" value={`${healthScore}%`} sub="AI-based field health" color="#22c55e" />
        <StatCard title="Average Temperature" value={`${avgTemp}°C`} sub="Based on recent scans" color="#f43f5e" />
        <StatCard title="Average Moisture" value={`${avgMoisture}%`} sub="Soil condition trend" color="#38bdf8" />
        <StatCard title="Average pH" value={avgPH} sub="Soil acidity balance" color="#facc15" />
      </div>

      <div className="chart-box" style={{ marginTop: '20px' }}>
        <Line
          data={{
            labels: recent.slice().reverse().map((h) => h.time),
            datasets: [
              {
                label: 'Temperature',
                data: recent.slice().reverse().map((h) => Number(h.temp)),
                borderColor: '#f43f5e',
                tension: 0.4,
              },
              {
                label: 'Moisture',
                data: recent.slice().reverse().map((h) => Number(h.moisture)),
                borderColor: '#38bdf8',
                tension: 0.4,
              },
              {
                label: 'Rain Chance',
                data: recent.slice().reverse().map((h) => Number(h.rainChance || 0)),
                borderColor: '#22c55e',
                tension: 0.4,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#c9d1d9' } } },
            scales: {
              x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
              y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
            },
          }}
        />
      </div>

      <div className="insight-box">
        <h3>Smart Insights</h3>
        <p><strong>Current Crop Suggestion:</strong> {activeScan.crop}</p>
        <p><strong>Avg Humidity:</strong> {avgHumidity}%</p>
        <p><strong>Avg Rain Chance:</strong> {avgRain}%</p>
        <p><strong>Auto Irrigation:</strong> {autoMode ? 'Enabled' : 'Disabled'}</p>
        <p><strong>GPS:</strong> {gps ? `${gps.lat}, ${gps.lon}` : 'Location not ready'}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const drawnItemsRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [gps, setGps] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('SYSTEM READY');
  const [mapType, setMapType] = useState('satellite');
  const [history, setHistory] = useState([]);
  const [activeScan, setActiveScan] = useState(DEFAULT_SCAN);
  const [autoMode, setAutoMode] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [autoScan, setAutoScan] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('--');

  const farmHealthScore = useMemo(() => {
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

  const systemModeLabel = autoMode ? 'AUTO CONTROL ACTIVE' : 'MANUAL CONTROL';

  const logoutUser = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberEmail');
    navigate('/login');
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const loadFarmData = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (!token || !user?.email) return;

        const response = await fetch(`http://localhost:4000/farm-data/${user.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          const formatted = data.records.map((record) => ({
            _id: record._id,
            lat: record.lat,
            lng: record.lng,
            time: record.time,
            temp: record.temp,
            humidity: record.humidity,
            moisture: record.moisture,
            depthTemp: record.depthTemp || 0,
            ph: record.ph,
            crop: record.crop,
            status: record.status,
            rainChance: record.rainChance || 0,
            irrigation: record.irrigation || 'Not Required',
            autoIrrigation: record.autoIrrigation || 'OFF',
          }));

          setHistory(formatted);

          if (formatted.length > 0) {
            setActiveScan(formatted[0]);
            setAlertMsg(formatted[0].status || 'SYSTEM READY');
            setAutoMode(formatted[0].autoIrrigation === 'ON');
            setLastUpdated(new Date().toLocaleTimeString());
          }
        }
      } catch (error) {
        console.error('Load farm data error:', error);
      }
    };

    loadFarmData();
  }, []);

  const handleMark = async (lat, lng) => {
    const API_KEY = 'e957f7926b1e1b118a8d38e686ca308a';
    setLoading(true);

    try {
      const res = await fetch(
        `https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}`
      );
      const data = await res.json();

      if (!data || !data.main) throw new Error('Invalid API response');

      const tempC = data.main.temp - 273.15;
      const humidity = data.main.humidity;

      const moisture = (humidity * 0.55 + Math.random() * 12).toFixed(1);
      const ph = (Math.random() * 2 + 5.5).toFixed(1);
      const depthTemp = (tempC - 4).toFixed(1);

      const rainChance = Math.min(
        100,
        Math.max(
          0,
          Math.round((humidity * 0.6 + (data.clouds?.all || 0) * 0.4 + Math.random() * 10) / 1.2)
        )
      );

      let crop = 'Vegetables';
      if (tempC > 30 && Number(moisture) < 40) crop = 'Millets';
      else if (tempC < 25 && Number(moisture) > 50) crop = 'Rice';
      else if (Number(ph) < 6) crop = 'Potato';
      else if (Number(ph) > 7.5) crop = 'Cotton';

      let irrigation = 'Not Required';

      if (rainChance > 75) {
        irrigation = 'Stop Watering';
      } else if (Number(moisture) < 30) {
        irrigation = 'Water Now';
      } else if (Number(moisture) < 45 && tempC > 30) {
        irrigation = 'Moderate Watering';
      } else if (Number(moisture) >= 45 && Number(moisture) <= 65) {
        irrigation = 'Light Watering';
      } else if (Number(moisture) > 65) {
        irrigation = 'Not Required';
      }

      let alert = 'OPTIMAL PARAMETERS';
      if (rainChance > 75) alert = 'RAIN EXPECTED - STOP WATERING';
      else if (tempC > 38) alert = 'THERMAL CRITICAL';
      else if (Number(moisture) < 30) alert = 'LOW SOIL MOISTURE';
      else if (Number(moisture) < 45 && tempC > 30) alert = 'MODERATE IRRIGATION REQUIRED';

      let autoIrrigation = 'OFF';
      if (autoMode) {
        if (irrigation === 'Water Now' || irrigation === 'Moderate Watering') {
          autoIrrigation = 'ON';
        } else {
          autoIrrigation = 'OFF';
        }
      }

      console.log('🌱 Moisture:', moisture);
      console.log('🌡 Temp:', tempC.toFixed(1));
      console.log('🌧 Rain:', rainChance);
      console.log('💧 Irrigation Decision:', irrigation);

      setAlertMsg(alert);

      const scan = {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        time: new Date().toLocaleTimeString(),
        temp: tempC.toFixed(1),
        humidity,
        moisture,
        depthTemp,
        ph,
        crop,
        status: alert,
        rainChance,
        irrigation,
        autoIrrigation,
      };

      setActiveScan(scan);
      setLastUpdated(new Date().toLocaleTimeString());

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');

      if (token && user?.email) {
        const saveResponse = await fetch('http://localhost:4000/farm-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userEmail: user.email,
            lat: scan.lat,
            lng: scan.lng,
            temp: scan.temp,
            humidity: String(scan.humidity),
            moisture: String(scan.moisture),
            ph: String(scan.ph),
            crop: scan.crop,
            status: scan.status,
            time: scan.time,
            depthTemp: String(scan.depthTemp),
            rainChance: String(scan.rainChance),
            irrigation: scan.irrigation,
            autoIrrigation: scan.autoIrrigation,
          }),
        });

        const savedData = await saveResponse.json();
        if (savedData.success && savedData.record) {
          setHistory((prev) => [{ _id: savedData.record._id, ...scan }, ...prev]);
        } else {
          setHistory((prev) => [scan, ...prev]);
        }
      } else {
        setHistory((prev) => [scan, ...prev]);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      alert('Failed to fetch weather data. Check API key or internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoScan || !gps) return;

    const interval = setInterval(() => {
      handleMark(gps.lat, gps.lon);
    }, 20000);

    return () => clearInterval(interval);
  }, [autoScan, gps, autoMode]);

  const deleteRecord = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/farm-data/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        const updated = history.filter((item) => item._id !== id);
        setHistory(updated);

        if (updated.length > 0) {
          setActiveScan(updated[0]);
          setAlertMsg(updated[0].status || 'SYSTEM READY');
        } else {
          setActiveScan(DEFAULT_SCAN);
          setAlertMsg('SYSTEM READY');
        }
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete record');
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    setActiveScan(DEFAULT_SCAN);
    setAlertMsg('SYSTEM READY');
  };

  const removeLastHistory = () => {
    if (history.length === 0) return;

    const updated = history.slice(1);
    setHistory(updated);

    if (updated.length > 0) {
      setActiveScan(updated[0]);
      setAlertMsg(updated[0].status || 'SYSTEM READY');
    } else {
      setActiveScan(DEFAULT_SCAN);
      setAlertMsg('SYSTEM READY');
    }
  };

  const clearDrawTools = () => {
    if (mapInstanceRef.current?.pm) {
      mapInstanceRef.current.pm.disableDraw();
      mapInstanceRef.current.pm.disableGlobalEditMode();
      mapInstanceRef.current.pm.disableGlobalDragMode();
      mapInstanceRef.current.pm.disableGlobalRemovalMode();
    }

    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
  };

  const getTileLayer = () => {
    if (mapType === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  };

  return (
    <div className="titan-v18">
      <style>{`
        .titan-v18 {
          display: flex;
          background: #010409;
          min-height: 100vh;
          color: #c9d1d9;
          font-family: 'Segoe UI', sans-serif;
        }

        .side-panel {
          width: 290px;
          background: linear-gradient(180deg, #0d1117, #111827);
          border-right: 1px solid #30363d;
          padding: 32px 18px;
          display: flex;
          flex-direction: column;
        }

        .brand-box {
          background: linear-gradient(135deg, rgba(88,166,255,0.15), rgba(34,197,94,0.12));
          border: 1px solid #30363d;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 24px;
        }

        .nav-btn {
          padding: 12px 14px;
          color: #c9d1d9;
          text-decoration: none;
          border-radius: 10px;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: 0.3s;
          border: 1px solid transparent;
          display: block;
        }

        .nav-btn:hover {
          background: #161b22;
          color: #58a6ff;
          border-color: #30363d;
        }

        .viewport {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
        }

        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          gap: 10px;
          flex-wrap: wrap;
        }

        .map-container {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid #30363d;
          height: 460px;
          position: relative;
          box-shadow: 0 10px 32px rgba(0,0,0,0.35);
          margin-bottom: 20px;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .metric-card {
          background: linear-gradient(135deg, #0d1117, #111827);
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 20px;
          position: relative;
          min-height: 120px;
        }

        .badge {
          font-size: 10px;
          font-weight: bold;
          border: 1px solid;
          padding: 4px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          display: inline-block;
          margin-top: 10px;
        }

        .btn-main {
          background: #238636;
          border: none;
          color: #fff;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
        }

        .btn-main:hover {
          opacity: 0.92;
        }

        .delete-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .page-card {
          background: linear-gradient(135deg, #0d1117, #111827);
          padding: 28px;
          border: 1px solid #30363d;
          border-radius: 18px;
        }

        .card-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .insight-box {
          margin-top: 24px;
          padding: 20px;
          border-radius: 16px;
          background: #0b1220;
          border: 1px solid #30363d;
        }

        .chart-box {
          height: 360px;
          margin-top: 20px;
          background: #0b1220;
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #21262d;
        }

        thead {
          border-bottom: 2px solid #30363d;
          color: #58a6ff;
        }

        input::placeholder {
          color: #6e7681;
        }

        @media (max-width: 900px) {
          .titan-v18 {
            flex-direction: column;
          }

          .side-panel {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #30363d;
          }

          .viewport {
            padding: 18px;
          }
        }
      `}</style>

      <aside className="side-panel">
        <div className="brand-box">
          <h2 style={{ color: '#58a6ff', margin: '0 0 10px 0' }}>🛰️ SMART_FARM PRO</h2>
          <div style={{ fontSize: '12px', color: '#8b949e' }}>
            Real-time monitoring, irrigation simulation, rain intelligence, weekly reporting, and advanced analytics.
          </div>
        </div>

        <Link to="/dashboard" className="nav-btn">📊 Overview</Link>
        <Link to="/dashboard/irrigation" className="nav-btn">💧 Irrigation Control</Link>
        <Link to="/dashboard/weather" className="nav-btn">🌦 Weather Intelligence</Link>
        <Link to="/dashboard/report" className="nav-btn">📝 Weekly Report</Link>
        <Link to="/dashboard/archive" className="nav-btn">📂 Data Archive</Link>
        <Link to="/dashboard/frequency" className="nav-btn">📶 Frequency Dashboard</Link>
        <Link to="/dashboard/advanced" className="nav-btn">🚀 Advanced Analytics</Link>
        <Link to="/dashboard/dashboard2" className="nav-btn">🧠 Dashboard 2</Link>

        <button
          className="btn-main"
          style={{ marginTop: '20px', background: '#dc2626' }}
          onClick={logoutUser}
        >
          Logout
        </button>

        <div style={{ marginTop: 'auto', fontSize: '11px', color: '#6e7681' }}>
          MAP: {mapType.toUpperCase()}
          <br />
          VERSION: 7.2
        </div>
      </aside>

      <main className="viewport">
        {alertMsg !== 'SYSTEM READY' && (
          <div
            style={{
              background: '#1f2937',
              padding: '10px 15px',
              borderRadius: '8px',
              marginBottom: '15px',
              color: '#fff',
              border: '1px solid #30363d',
            }}
          >
            🚨 {alertMsg}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '20px',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>● Live</span>
            <span
              style={{
                color: farmHealthScore > 70 ? '#22c55e' : farmHealthScore > 40 ? '#fbbf24' : '#f43f5e',
                fontWeight: 700,
              }}
            >
              Health: {farmHealthScore}%
            </span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{systemModeLabel}</span>
            <span style={{ color: autoScan ? '#22c55e' : '#6b7280', fontWeight: 700 }}>
              Auto Scan: {autoScan ? 'ON' : 'OFF'}
            </span>
            <span style={{ color: '#c9d1d9', fontWeight: 700 }}>Updated: {lastUpdated}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              style={{
                background: autoScan ? '#16a34a' : '#1e293b',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => setAutoScan((prev) => !prev)}
            >
              {autoScan ? 'Auto Scan ON' : 'Auto Scan OFF'}
            </button>

            <button
              style={{
                background: '#1e293b',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>

            <button
              style={{
                background: '#1e293b',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={logoutUser}
            >
              Logout
            </button>
          </div>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage
                gps={gps}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
                loading={loading}
                alertMsg={alertMsg}
                mapType={mapType}
                setMapType={setMapType}
                history={history}
                activeScan={activeScan}
                handleMark={handleMark}
                getTileLayer={getTileLayer}
                clearAllHistory={clearAllHistory}
                removeLastHistory={removeLastHistory}
                drawnItemsRef={drawnItemsRef}
                clearDrawTools={clearDrawTools}
                mapInstanceRef={mapInstanceRef}
                farmHealthScore={farmHealthScore}
              />
            }
          />
          <Route
            path="/irrigation"
            element={<IrrigationPage activeScan={activeScan} autoMode={autoMode} setAutoMode={setAutoMode} />}
          />
          <Route path="/weather" element={<WeatherIntelligencePage history={history} />} />
          <Route path="/report" element={<WeeklyReportPage history={history} />} />
          <Route
            path="/archive"
            element={
              <ArchiveView
                history={history}
                deleteRecord={deleteRecord}
                archiveSearch={archiveSearch}
                setArchiveSearch={setArchiveSearch}
              />
            }
          />
          <Route path="/frequency" element={<FrequencyDashboard />} />
          <Route
            path="/advanced"
            element={<AdvancedAnalyticsPage history={history} activeScan={activeScan} autoMode={autoMode} gps={gps} />}
          />
          <Route
            path="/dashboard2"
            element={<Dashboard2 history={history} activeScan={activeScan} gps={gps} autoMode={autoMode} />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;