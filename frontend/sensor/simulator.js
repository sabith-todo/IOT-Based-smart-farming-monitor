const axios = require('axios');

const API_URL = 'http://localhost:4000/api/readings';
const DEVICE_ID = 'FARM_001';

async function sendSensorData() {
// inside sensors/simulator.js
const soil = (20 + Math.random() * 40).toFixed(1);
const temp = (25 + Math.random() * 15).toFixed(1);

// inside sensors/simulator.js
const data = {
    deviceId: "FARM_001",
    ts: new Date().toLocaleTimeString(),
    temperature: (24 + Math.random() * 6).toFixed(1),
    humidity: (55 + Math.random() * 10).toFixed(1),
    soil_moisture: (40 + Math.random() * 15).toFixed(1),
    ph: (6.2 + Math.random() * 0.8).toFixed(1),
    light: (500 + Math.random() * 200).toFixed(0),
    air_moisture: (12 + Math.random() * 4).toFixed(1) // New Air Moisture Feature
};

    

    try {
        await axios.post(API_URL, data);
        console.log('📡 Data Pushed to SQLite:', data.ts);
    } catch (err) {
        console.error("❌ Backend Offline. Start server.js first!");
    }
}

setInterval(sendSensorData, 5000);