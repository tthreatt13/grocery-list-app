/**
 * Weather API functions
 */

import { get } from './client'

// API Response Types (matching backend schemas)
export interface DailyForecast {
  date: string // ISO date string (YYYY-MM-DD)
  high_temp: number | null // High temperature in Fahrenheit
  low_temp: number | null // Low temperature in Fahrenheit
  precipitation_chance: number | null // Precipitation chance percentage (0-100)
  condition: string | null // Weather condition description
}

export interface WeatherForecastResponse {
  zip_code: string
  forecasts: DailyForecast[]
}

/**
 * Get 7-day weather forecast for a zip code
 */
export async function getWeatherForecast(
  zipCode: string,
  token: string
): Promise<WeatherForecastResponse> {
  return get<WeatherForecastResponse>(`/api/weather/forecast/${zipCode}`, token)
}

/**
 * Get 7-day weather forecast for current user's saved zip code
 */
export async function getMyWeatherForecast(
  householdId: number,
  token: string
): Promise<WeatherForecastResponse> {
  return get<WeatherForecastResponse>(
    `/api/weather/forecast/me?household_id=${householdId}`,
    token
  )
}
