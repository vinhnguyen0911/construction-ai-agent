// Tool registry — declarations + executor map

import {
  getCurrentWeatherDeclaration,
  getWeatherForecastDeclaration,
  getCurrentWeather,
  getWeatherForecast,
} from './weather.js';

// ─── Gemini Function Declarations ─────────────────────────────────────
// This array is passed to Gemini model config
export const declarations = [
  getCurrentWeatherDeclaration,
  getWeatherForecastDeclaration,
];

// ─── Executor Map ─────────────────────────────────────────────────────
const executors = {
  get_current_weather: getCurrentWeather,
  get_weather_forecast: getWeatherForecast,
};

/**
 * Execute a tool by name with given args.
 * @param {string} name - Function name from Gemini response
 * @param {object} args - Arguments for the function
 * @returns {Promise<object>} - Execution result
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
