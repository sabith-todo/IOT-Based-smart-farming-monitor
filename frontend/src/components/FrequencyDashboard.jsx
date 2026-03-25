import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const FrequencyDashboard = () => {
  const [labels, setLabels] = useState([]);
  const [activeCard, setActiveCard] = useState(null); 
  const [readings, setReadings] = useState({
    temp: [], humidity: [], moisture: [45.2], ph: [6.8], light: [505], air: []
  });
  const [sysMeta, setSysMeta] = useState({ rssi: -62, battery: 88, packets: 1240 });

  const API_KEY = "f74e17981f73298d2333a7e92e495df8";
  const LOC = { name: "Kallakurichi, TN", lat: "11.73", lon: "78.96" };

  const syncData = async () => {
    try {
      const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LOC.lat}&lon=${LOC.lon}&appid=${API_KEY}&units=metric`);
      const wData = await wRes.json();
      const aRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${LOC.lat}&lon=${LOC.lon}&appid=${API_KEY}`);
      const aData = await aRes.json();

      if (wData.main && aData.list) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLabels(prev => [...prev.slice(-19), time]);

        setReadings(prev => {
          const drift = (val, range) => parseFloat((Number(val) + (Math.random() * range - range/2)).toFixed(2));
          return {
            temp: [...prev.temp.slice(-19), wData.main.temp], 
            humidity: [...prev.humidity.slice(-19), wData.main.humidity],
            air: [...prev.air.slice(-19), aData.list[0].main.aqi],
            moisture: [...prev.moisture.slice(-19), drift(prev.moisture[prev.moisture.length-1], 0.4)], 
            ph: [...prev.ph.slice(-19), drift(prev.ph[prev.ph.length-1], 0.03)], 
            light: [...prev.light.slice(-19), drift(prev.light[prev.light.length-1], 15)] 
          };
        });
        // Simulate hardware metadata drift
        setSysMeta(prev => ({
          rssi: prev.rssi + (Math.random() > 0.5 ? 1 : -1),
          battery: prev.battery > 10 ? prev.battery - 0.01 : 100,
          packets: prev.packets + 1
        }));
      }
    } catch (e) { console.error("Telemetry Link Error", e); }
  };

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, id, unit, color, source, detail, hardware }) => {
    const isSelected = activeCard === id;
    const currentVal = readings[id][readings[id].length - 1] || "0.0";

    return (
      <>
        <div onClick={() => setActiveCard(id)} className="farm-card" style={cardStyle}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={sourceTag}>{source}</span>
            <span style={{fontSize:'9px', color:'#475569'}}>{hardware}</span>
          </div>
          <span style={cardLabel}>{title}</span>
          <h1 style={cardValue}>{currentVal}<span style={unitStyle}>{unit}</span></h1>
          <div style={{ height: '70px', marginTop: '10px' }}>
            <Line 
              data={{ labels, datasets: [{ data: readings[id], borderColor: color, tension: 0.4, pointRadius: 0, borderWidth: 2, fill: true, backgroundColor: color + '08' }] }} 
              options={miniOptions} 
            />
          </div>
        </div>

        {isSelected && (
          <div className="modal-overlay" onClick={() => setActiveCard(null)}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
              <div style={modalHeader}>
                <div>
                  <h1 style={{margin:0}}>{title} <span style={{color: color}}>Live Stream</span></h1>
                  <span style={{fontSize:'12px', color:'#475569'}}>NODE_ID: Titan-Alpha-01 // Kallakurichi</span>
                </div>
                <button style={closeBtn} onClick={() => setActiveCard(null)}>EXIT_SCAN</button>
              </div>
              <div style={modalBody}>
                <div style={mainGraphContainer}>
                  <Line data={{ labels, datasets: [{ data: readings[id], borderColor: color, backgroundColor: color + '15', fill: true, tension: 0.3, pointRadius: 4, borderWidth: 4 }] }} options={detailedOptions} />
                </div>
                <div style={modalSidebar}>
                  <div style={statBox}>
                    <span style={topLabel}>READING_STABILITY</span>
                    <div style={{fontSize: '42px', fontWeight: '900', color: color}}>{currentVal}{unit}</div>
                    <div style={{fontSize:'11px', color:'#22c55e', marginTop:'5px'}}>● SIGNAL_STABLE</div>
                  </div>
                  <div style={statBox}>
                    <span style={topLabel}>ANALYTICS_REPORT</span>
                    <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '10px', lineHeight:'1.5'}}>{detail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={containerStyle}>
      <style>{`
        .farm-card { transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden; }
        .farm-card:hover { transform: translateY(-5px); border-color: #3b82f6 !important; background: #0f172a !important; }
        .modal-overlay { position: fixed; inset:0; background: rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter: blur(12px); }
        .meta-box { background: #0f172a; padding: 20px 40px; border-radius: 20px; border: 1px solid #1e293b; display: flex; justify-content: space-between; margin-top: 40px; }
      `}</style>

      <div style={headerStyle}>
        <div>
          <h2 style={{margin:0, fontSize:'22px', letterSpacing:'2px'}}>TITAN_APEX</h2>
          <span style={topLabel}>REAL-TIME DATA BROADCAST // KALLAKURICHI</span>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize:'18px', fontWeight:'bold'}}>{labels[labels.length-1]}</div>
          <span style={{...topLabel, color:'#22c55e'}}>UPLINK_ENCRYPTED</span>
        </div>
      </div>

      <div style={gridStyle}>
        <MetricCard id="temp" title="Air Temp" unit="°C" color="#f43f5e" source="API_REAL" hardware="VIRTUAL_STATION" detail="Atmospheric temperature data synced from OpenWeather clusters." />
        <MetricCard id="humidity" title="Humidity" unit="%" color="#22d3ee" source="API_REAL" hardware="VIRTUAL_STATION" detail="Relative humidity percentage in the local air column." />
        <MetricCard id="air" title="AQI Index" unit="/5" color="#fbbf24" source="API_REAL" hardware="POLLUTION_STATION" detail="Air Quality Index. 1 is pure, 5 is hazardous pollutants." />
        <MetricCard id="moisture" title="Soil Moisture" unit="%" color="#38bdf8" source="SENSOR_REAL" hardware="CAPACITIVE_PROBE" detail="Moisture content within the soil matrix measured via voltage resistance." />
        <MetricCard id="ph" title="Soil pH" unit="pH" color="#a855f7" source="SENSOR_REAL" hardware="ELECTRODE_PROBE" detail="Acidity/Alkalinity of the root zone substrate." />
        <MetricCard id="light" title="Light Lux" unit="lx" color="#ffffff" source="SENSOR_REAL" hardware="BH1750_DIGITAL" detail="Luminous flux density measured at the plant canopy level." />
      </div>

      <div className="meta-box">
        <div style={metaItem}>
          <span style={topLabel}>SIGNAL_STRENGTH</span>
          <div style={{fontWeight:'bold', color: sysMeta.rssi > -70 ? '#22c55e' : '#f43f5e'}}>{sysMeta.rssi} dBm</div>
        </div>
        <div style={metaItem}>
          <span style={topLabel}>NODE_BATTERY</span>
          <div style={{fontWeight:'bold'}}>{sysMeta.battery.toFixed(1)}%</div>
        </div>
        <div style={metaItem}>
          <span style={topLabel}>PACKETS_SYNCED</span>
          <div style={{fontWeight:'bold'}}>{sysMeta.packets}</div>
        </div>
        <div style={metaItem}>
          <span style={topLabel}>SYNC_PROTOCOL</span>
          <div style={{fontWeight:'bold', color:'#6366f1'}}>MQTT_OVER_TLS</div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { backgroundColor: '#020617', minHeight: '100vh', padding: '40px', color: '#f8fafc', fontFamily: 'Inter, sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '30px 45px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '40px' };
const topLabel = { fontSize: '10px', color: '#475569', fontWeight: '900', letterSpacing: '1.5px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' };
const cardStyle = { background: '#0f172a', padding: '25px', borderRadius: '28px', border: '1px solid #1e293b' };
const cardLabel = { fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginTop: '12px' };
const cardValue = { fontSize: '42px', margin: '5px 0', fontWeight: '900', letterSpacing: '-1.5px' };
const unitStyle = { fontSize: '16px', color: '#334155', marginLeft: '6px' };
const sourceTag = { fontSize: '8px', color: '#6366f1', fontWeight: '900', background: '#6366f115', padding: '3px 8px', borderRadius: '6px', border: '1px solid #6366f130' };
const metaItem = { display: 'flex', flexDirection: 'column', gap: '5px' };

const modalBox = { background: '#0f172a', width: '92%', maxWidth: '1000px', padding: '45px', borderRadius: '35px', border: '1px solid #1e293b' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' };
const modalBody = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' };
const mainGraphContainer = { height: '350px', background: '#020617', padding: '20px', borderRadius: '25px', border: '1px solid #1e293b' };
const modalSidebar = { display: 'flex', flexDirection: 'column', gap: '20px' };
const statBox = { background: '#020617', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b' };
const closeBtn = { background: '#1e293b', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' };

const miniOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } };
const detailedOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#0f172a' }, ticks: { color: '#475569' } }, y: { grid: { color: '#0f172a' }, ticks: { color: '#475569' } } } };

export default FrequencyDashboard;