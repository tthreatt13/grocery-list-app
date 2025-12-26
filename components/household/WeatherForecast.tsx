'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  getMyWeatherForecast,
  WeatherForecastResponse,
} from '@/lib/api/weather'

interface WeatherForecastProps {
  householdId: number
  zipCode: string | null
  token: string
}

// Helper function to format date
function formatDate(dateString: string): string {
  // Parse YYYY-MM-DD as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Normalize dates for comparison (set to midnight)
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)

  // Check if it's today
  if (normalizedDate.getTime() === today.getTime()) {
    return 'Today'
  }

  // Check if it's tomorrow
  if (normalizedDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  }

  // Otherwise return day name
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

// Helper function to get weather icon based on condition
function getWeatherIcon(condition: string | null): string {
  if (!condition) return '🌤️'

  const lowerCondition = condition.toLowerCase()

  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return '🌧️'
  }
  if (lowerCondition.includes('snow')) {
    return '❄️'
  }
  if (lowerCondition.includes('cloud')) {
    return '☁️'
  }
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return '☀️'
  }
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return '⛈️'
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
    return '🌫️'
  }

  return '🌤️'
}

export default function WeatherForecast({
  householdId,
  zipCode,
  token,
}: WeatherForecastProps) {
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchForecast() {
      if (!zipCode) {
        setForecast(null)
        setError(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await getMyWeatherForecast(householdId, token)
        setForecast(data)
      } catch (err) {
        console.error('Error fetching weather forecast:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load weather forecast. Please try again later.'
        )
        setForecast(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchForecast()
  }, [householdId, zipCode, token])

  // Empty state - no zip code set
  if (!zipCode) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌤️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Zip Code Set
          </h3>
          <p className="text-sm text-gray-600">
            Add a zip code in your preferences to see weather forecasts
          </p>
        </div>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading weather forecast...</p>
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Forecast
          </h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </Card>
    )
  }

  // No forecast data
  if (!forecast || !forecast.forecasts || forecast.forecasts.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌤️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Forecast Available
          </h3>
          <p className="text-sm text-gray-600">
            Weather forecast data is not available at this time
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          7-Day Weather Forecast
        </h3>
        <p className="text-sm text-gray-600">Zip Code: {forecast.zip_code}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {forecast.forecasts.map((day, index) => (
          <div
            key={day.date || index}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-emerald-300 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">
                {getWeatherIcon(day.condition)}
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {formatDate(day.date)}
              </div>
              {day.condition && (
                <div className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {day.condition}
                </div>
              )}

              <div className="space-y-1">
                {day.high_temp !== null && (
                  <div className="text-lg font-semibold text-gray-900">
                    {day.high_temp}°F
                  </div>
                )}
                {day.low_temp !== null && (
                  <div className="text-sm text-gray-600">{day.low_temp}°F</div>
                )}
                {day.precipitation_chance !== null && (
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">
                      {day.precipitation_chance}%
                    </span>{' '}
                    chance of precipitation
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
