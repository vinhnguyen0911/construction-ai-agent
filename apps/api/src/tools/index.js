// Tool registry — khai báo declarations + map executors

import {
  getCurrentWeatherDeclaration,
  getWeatherForecastDeclaration,
  getCurrentWeather,
  getWeatherForecast,
} from './weather.js';

// ─── Gemini Function Declarations ─────────────────────────────────────
// Mảng này được truyền vào Gemini model config
export const declarations = [
  getCurrentWeatherDeclaration,
  getWeatherForecastDeclaration,
];

// ─── Executor Map ─────────────────────────────────────────────────────
// Map function name → executor function
const executors = {
  get_current_weather: getCurrentWeather,
  get_weather_forecast: getWeatherForecast,
};

/**
 * Execute a tool by name with given args.
 * @param {string} name - Function name từ Gemini response
 * @param {object} args - Arguments cho function
 * @returns {Promise<object>} - Kết quả thực thi
 */
export async function executeTool(name, args) {
  const executor = executors[name];
  if (!executor) {
    throw new Error(`Unknown tool: ${name}`);
  }
  console.log(`🔧 Executing tool: ${name}`, args);
  const result = await executor(args);
  console.log(`✅ Tool ${name} completed`);
  return result;
}
