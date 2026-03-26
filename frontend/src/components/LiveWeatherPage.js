import React, { useEffect, useMemo, useState } from 'react';
import './LiveWeatherPage.css';

const LiveWeatherPage = ({ gps }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = 'f74e17981f73298d2333a7e92e495df8';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getIcon = (condition) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('thunder')) return '⛈️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('clear')) return '☀️';
    if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '🌫️';
    return '🌤️';
  };

  const toCelsius = (k) => (k !== undefined ? (k - 273.15).toFixed(1) : '--');

  const formatUnixTime = (t) =>
    new Date(t * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const fetchWeather = async () => {
    if (!gps) return;

    setLoading(true);
    setError('');

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${gps.lat}&lon=${gps.lon}&appid=${API_KEY}`
      );
      const currentData = await currentRes.json();

      if (!currentRes.ok || !currentData.main) {
        throw new Error(currentData?.message || 'Failed to load current weather');
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${gps.lat}&lon=${gps.lon}&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();

      if (!forecastRes.ok || !forecastData.list) {
        throw new Error(forecastData?.message || 'Failed to load forecast');
      }

      setWeather({
        city: currentData.name,
        country: currentData.sys?.country || '',
        temp: toCelsius(currentData.main.temp),
        feels: toCelsius(currentData.main.feels_like),
        min: toCelsius(currentData.main.temp_min),
        max: toCelsius(currentData.main.temp_max),
        humidity: currentData.main.humidity,
        wind: currentData.wind.speed,
        pressure: currentData.main.pressure,
        sunrise: formatUnixTime(currentData.sys.sunrise),
        sunset: formatUnixTime(currentData.sys.sunset),
        condition: currentData.weather[0].main,
        description: currentData.weather[0].description,
      });

      setForecast(
        forecastData.list.slice(0, 5).map((item) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          temp: toCelsius(item.main.temp),
          condition: item.weather[0].main,
          icon: getIcon(item.weather[0].main),
        }))
      );
    } catch (err) {
      setError(err.message || 'Unable to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [gps]);

  useEffect(() => {
    if (!gps) return;
    const interval = setInterval(fetchWeather, 30000);
    return () => clearInterval(interval);
  }, [gps]);

  const alertMessage = useMemo(() => {
    if (!weather) return 'No weather data';
    if (Number(weather.temp) > 38) return '🔥 High temperature alert';
    if (Number(weather.wind) > 10) return '💨 Strong wind alert';
    if ((weather.condition || '').toLowerCase().includes('rain')) return '🌧️ Rain alert';
    return '✅ Weather is stable';
  }, [weather]);

  const farmingAdvice = useMemo(() => {
    if (!weather) return 'No farming insight';
    const condition = (weather.condition || '').toLowerCase();
    const temp = Number(weather.temp);
    const humidity = Number(weather.humidity);

    if (condition.includes('rain')) return 'Stop irrigation and monitor waterlogging risk.';
    if (temp > 35) return 'High heat detected. Increase irrigation frequency carefully.';
    if (humidity < 35) return 'Low humidity may dry soil faster. Monitor soil moisture closely.';
    return 'Weather conditions are suitable for normal farming operations.';
  }, [weather]);

  const rainChance = useMemo(() => {
    if (!weather) return '--';
    const condition = (weather.condition || '').toLowerCase();
    if (condition.includes('rain')) return 80;
    if (condition.includes('cloud')) return 50;
    return 15;
  }, [weather]);

  const currentDate = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="lw-page">
      <div className="lw-shell">
        <div className="lw-hero">
          <div className="lw-hero-left">
            <div className="lw-location">
              📍 {weather?.city || 'Detecting location...'}
              {weather?.country ? `, ${weather.country}` : ''}
            </div>
            <div className="lw-date">{currentDate}</div>
            <div className="lw-time">{time.toLocaleTimeString()}</div>

            <div className="lw-temp-row">
              <div className="lw-main-icon">{getIcon(weather?.condition)}</div>
              <div>
                <div className="lw-temp">{weather?.temp || '--'}°C</div>
                <div className="lw-desc">
                  {weather?.condition || '--'} • {weather?.description || '--'}
                </div>
                <div className="lw-sub">
                  Feels like {weather?.feels || '--'}°C | Min {weather?.min || '--'}°C | Max {weather?.max || '--'}°C
                </div>
              </div>
            </div>
          </div>

          <div className="lw-hero-right">
            <div className="lw-status-card">
              <div className="lw-status-title">Weather Status</div>
              <div className="lw-status-message">{alertMessage}</div>
            </div>

            <div className="lw-status-card farming">
              <div className="lw-status-title">🌱 Farming Insight</div>
              <div className="lw-status-message">Rain Chance: {rainChance}%</div>
              <div className="lw-advice">{farmingAdvice}</div>
            </div>

            <button className="lw-refresh-btn" onClick={fetchWeather}>
              🔄 Refresh Weather
            </button>
          </div>
        </div>

        {loading && <div className="lw-banner">⏳ Loading weather...</div>}
        {error && <div className="lw-banner error">{error}</div>}

        <div className="lw-metrics-grid">
          <div className="lw-metric-card">
            <span>Humidity</span>
            <strong>{weather?.humidity || '--'}%</strong>
          </div>
          <div className="lw-metric-card">
            <span>Wind</span>
            <strong>{weather?.wind || '--'} m/s</strong>
          </div>
          <div className="lw-metric-card">
            <span>Pressure</span>
            <strong>{weather?.pressure || '--'} hPa</strong>
          </div>
          <div className="lw-metric-card">
            <span>Condition</span>
            <strong>{weather?.condition || '--'}</strong>
          </div>
          <div className="lw-metric-card">
            <span>Sunrise</span>
            <strong>{weather?.sunrise || '--'}</strong>
          </div>
          <div className="lw-metric-card">
            <span>Sunset</span>
            <strong>{weather?.sunset || '--'}</strong>
          </div>
        </div>

        <div className="lw-forecast-section">
          <div className="lw-section-title">Forecast</div>
          <div className="lw-forecast-grid">
            {forecast.length === 0 ? (
              <div className="lw-empty">No forecast data</div>
            ) : (
              forecast.map((item, index) => (
                <div key={`${item.time}-${index}`} className="lw-forecast-card">
                  <div className="lw-forecast-time">{item.time}</div>
                  <div className="lw-forecast-icon">{item.icon}</div>
                  <div className="lw-forecast-temp">{item.temp}°C</div>
                  <div className="lw-forecast-cond">{item.condition}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWeatherPage;