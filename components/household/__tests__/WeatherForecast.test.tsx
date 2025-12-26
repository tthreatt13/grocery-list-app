import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import WeatherForecast from '../WeatherForecast'
import * as weatherApi from '@/lib/api/weather'

// Mock the weather API
jest.mock('@/lib/api/weather', () => ({
  getMyWeatherForecast: jest.fn(),
}))

const mockGetMyWeatherForecast =
  weatherApi.getMyWeatherForecast as jest.MockedFunction<
    typeof weatherApi.getMyWeatherForecast
  >

const mockForecastData = {
  zip_code: '12345',
  forecasts: [
    {
      date: '2025-01-15',
      high_temp: 72,
      low_temp: 55,
      precipitation_chance: 20,
      condition: 'Partly Cloudy',
    },
    {
      date: '2025-01-16',
      high_temp: 68,
      low_temp: 52,
      precipitation_chance: 60,
      condition: 'Rainy',
    },
    {
      date: '2025-01-17',
      high_temp: 75,
      low_temp: 58,
      precipitation_chance: 0,
      condition: 'Sunny',
    },
  ],
}

describe('WeatherForecast', () => {
  const mockToken = 'test-token'
  const mockHouseholdId = 1

  beforeEach(() => {
    mockGetMyWeatherForecast.mockClear()
  })

  it('renders empty state when no zip code is provided', () => {
    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode={null}
        token={mockToken}
      />
    )

    expect(screen.getByText('No Zip Code Set')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Add a zip code in your preferences to see weather forecasts/i
      )
    ).toBeInTheDocument()
    expect(mockGetMyWeatherForecast).not.toHaveBeenCalled()
  })

  it('renders loading state while fetching forecast', () => {
    mockGetMyWeatherForecast.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockForecastData), 100)
        })
    )

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    expect(screen.getByText(/Loading weather forecast/i)).toBeInTheDocument()
    expect(mockGetMyWeatherForecast).toHaveBeenCalledWith(
      mockHouseholdId,
      mockToken
    )
  })

  it('renders error state when API call fails', async () => {
    const errorMessage = 'Failed to retrieve weather forecast'
    mockGetMyWeatherForecast.mockRejectedValue(new Error(errorMessage))

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Forecast')).toBeInTheDocument()
    })

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('renders error state with generic message for unknown errors', async () => {
    mockGetMyWeatherForecast.mockRejectedValue('Unknown error')

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Forecast')).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        /Failed to load weather forecast. Please try again later/i
      )
    ).toBeInTheDocument()
  })

  it('renders forecast data when successfully loaded', async () => {
    mockGetMyWeatherForecast.mockResolvedValue(mockForecastData)

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('7-Day Weather Forecast')).toBeInTheDocument()
    })

    expect(screen.getByText(/Zip Code: 12345/i)).toBeInTheDocument()

    // Check that forecast days are displayed
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument()
    expect(screen.getByText('Rainy')).toBeInTheDocument()
    expect(screen.getByText('Sunny')).toBeInTheDocument()

    // Check temperatures
    expect(screen.getByText('72°F')).toBeInTheDocument()
    expect(screen.getByText('55°F')).toBeInTheDocument()
    expect(screen.getByText('68°F')).toBeInTheDocument()

    // Check precipitation chances - use getAllByText for multiple matches
    expect(screen.getByText(/20%/i)).toBeInTheDocument()
    expect(screen.getByText(/60%/i)).toBeInTheDocument()
    const zeroPercentElements = screen.getAllByText(/0%/i)
    expect(zeroPercentElements.length).toBeGreaterThan(0)
  })

  it('renders empty forecast state when no forecast data is available', async () => {
    mockGetMyWeatherForecast.mockResolvedValue({
      zip_code: '12345',
      forecasts: [],
    })

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No Forecast Available')).toBeInTheDocument()
    })
  })

  it('refetches forecast when zip code changes', async () => {
    mockGetMyWeatherForecast.mockResolvedValue(mockForecastData)

    const { rerender } = render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(mockGetMyWeatherForecast).toHaveBeenCalledTimes(1)
    })

    // Change zip code
    rerender(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="90210"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(mockGetMyWeatherForecast).toHaveBeenCalledTimes(2)
    })
  })

  it('refetches forecast when household ID changes', async () => {
    mockGetMyWeatherForecast.mockResolvedValue(mockForecastData)

    const { rerender } = render(
      <WeatherForecast householdId={1} zipCode="12345" token={mockToken} />
    )

    await waitFor(() => {
      expect(mockGetMyWeatherForecast).toHaveBeenCalledWith(1, mockToken)
    })

    // Change household ID
    rerender(
      <WeatherForecast householdId={2} zipCode="12345" token={mockToken} />
    )

    await waitFor(() => {
      expect(mockGetMyWeatherForecast).toHaveBeenCalledWith(2, mockToken)
    })
  })

  it('handles null temperature values gracefully', async () => {
    const forecastWithNulls = {
      zip_code: '12345',
      forecasts: [
        {
          date: '2025-01-15',
          high_temp: null,
          low_temp: null,
          precipitation_chance: null,
          condition: null,
        },
      ],
    }

    mockGetMyWeatherForecast.mockResolvedValue(forecastWithNulls)

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('7-Day Weather Forecast')).toBeInTheDocument()
    })

    // Should not crash and should render the formatted date (day name)
    // The date will be formatted as a day name, not the raw date string
    const dateElement = screen.getByText(/Tue|Wed|Thu|Fri|Sat|Sun|Mon/i)
    expect(dateElement).toBeInTheDocument()
  })

  it('displays "Today" and "Tomorrow" labels correctly', async () => {
    // Create dates in local timezone to avoid timezone issues
    const today = new Date()
    today.setHours(12, 0, 0, 0) // Set to noon to avoid timezone edge cases
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Format dates as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayStr = formatLocalDate(today)
    const tomorrowStr = formatLocalDate(tomorrow)

    const forecastWithToday = {
      zip_code: '12345',
      forecasts: [
        {
          date: todayStr,
          high_temp: 72,
          low_temp: 55,
          precipitation_chance: 20,
          condition: 'Partly Cloudy',
        },
        {
          date: tomorrowStr,
          high_temp: 68,
          low_temp: 52,
          precipitation_chance: 60,
          condition: 'Rainy',
        },
      ],
    }

    mockGetMyWeatherForecast.mockResolvedValue(forecastWithToday)

    render(
      <WeatherForecast
        householdId={mockHouseholdId}
        zipCode="12345"
        token={mockToken}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    // Check for Tomorrow - it should be in the document
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
  })
})
