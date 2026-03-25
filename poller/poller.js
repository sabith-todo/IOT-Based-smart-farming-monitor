const axios = require('axios');

const SERVER = 'http://localhost:4000';
const MY_KEY = 'f74e17981f73298d2333a7e92e495df8';

function rand(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function estimatePH(baseline, rain, actuator) {
  let ph = baseline || 6.5;

  if (rain > 3) ph += 0.1;
  if (actuator === 'ON') ph -= 0.2;

  return Math.max(4.5, Math.min(8.5, +ph.toFixed(2)));
}

async function poll() {
  try {
    console.log(`📡 Fetching devices from ${SERVER}/api/devices...`);

    const devResponse = await axios.get(`${SERVER}/api/devices`);
    const devices = devResponse.data;

    // ✅ FIX 1: check empty devices
    if (!devices || devices.length === 0) {
      console.log("⚠️ No devices found");
      return;
    }

    for (const dev of devices) {

      // ✅ FIX 2: check lat/lon
      if (!dev.lat || !dev.lon) {
        console.log(`⚠️ Skipping device ${dev.id} (missing location)`);
        continue;
      }

      // WEATHER API
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${dev.lat}&lon=${dev.lon}&appid=${MY_KEY}&units=metric`;

      const weatherRes = await axios.get(weatherUrl);
      const weather = weatherRes.data;

      const rain = weather.rain ? (weather.rain['1h'] || 0) : 0;
      const now = new Date().toISOString();

      // CREATE PAYLOAD
      const payload = {
        deviceId: dev.id,
        ts: now,
        temperature: weather.main?.temp || 0,
        humidity: weather.main?.humidity || 0,
        soil_moisture: rand(30, 60) + (dev.actuator === 'ON' ? 10 : 0),
        light: 1000 - (weather.clouds?.all || 0) * 10,
        ph: estimatePH(dev.ph_baseline, rain, dev.actuator)
      };

      // SEND DATA
      await axios.post(`${SERVER}/api/readings`, payload);

      console.log(`✅ Posted: ${dev.id} | Temp: ${payload.temperature}°C`);
    }

  } catch (error) {
    // ✅ FIX 3: better error handling
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Cannot connect to backend (${SERVER})`);
    } else if (error.response) {
      console.error(`❌ Server Error:`, error.response.data);
    } else {
      console.error(`❌ Error:`, error.message);
    }
  }
}

// RUN LOOP
setInterval(poll, 15000);
poll();

console.log('🚀 Poller started...');