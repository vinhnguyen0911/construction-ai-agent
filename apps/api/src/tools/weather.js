// Weather tools — OpenWeatherMap integration

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

// ─── Function Declarations (Gemini schema) ────────────────────────────

export const getCurrentWeatherDeclaration = {
  name: 'get_current_weather',
  description:
    'Get current weather information for a city. Returns temperature, humidity, wind speed, weather description.',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name (e.g. "Ho Chi Minh City", "Bien Hoa", "Thu Dau Mot")',
      },
    },
    required: ['city'],
  },
};

export const getWeatherForecastDeclaration = {
  name: 'get_weather_forecast',
  description:
    'Get weather forecast for 1 to 5 days ahead for a city. Returns aggregated daily forecast.',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name',
      },
      days: {
        type: 'number',
        description: 'Number of forecast days (1-5, default 3)',
      },
    },
    required: ['city'],
  },
};

// ─── Executors ────────────────────────────────────────────────────────

export async function getCurrentWeather({ city }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenWeatherMap error ${res.status}: ${body}`);
  }

  const data = await res.json();

  return {
    city: data.name,
    country: data.sys.country,
    temperature: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    wind_speed: data.wind.speed,
    wind_deg: data.wind.deg,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    clouds: data.clouds.all,
    visibility: data.visibility,
    rain_1h: data.rain?.['1h'] ?? 0,
    timestamp: new Date(data.dt * 1000).toISOString(),
  };
}

export async function getWeatherForecast({ city, days = 3 }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `${OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi&cnt=${days * 8}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenWeatherMap error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // Aggregate 3-hour intervals into daily summaries
  const dailyMap = new Map();

  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        temps: [],
        humidity: [],
        wind_speeds: [],
        rain: 0,
        descriptions: [],
      });
    }

    const day = dailyMap.get(date);
    day.temps.push(item.main.temp);
    day.humidity.push(item.main.humidity);
    day.wind_speeds.push(item.wind.speed);
    day.rain += item.rain?.['3h'] ?? 0;
    day.descriptions.push(item.weather[0].description);
  }

  const forecast = [...dailyMap.values()].slice(0, days).map((day) => ({
    date: day.date,
    temp_min: Math.min(...day.temps),
    temp_max: Math.max(...day.temps),
    temp_avg: +(day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1),
    humidity_avg: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    wind_speed_max: Math.max(...day.wind_speeds),
    total_rain_mm: +day.rain.toFixed(1),
    main_description: mostFrequent(day.descriptions),
  }));

  return {
    city: data.city.name,
    country: data.city.country,
    forecast,
  };
}

// Helper: find most frequently occurring element
function mostFrequent(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
