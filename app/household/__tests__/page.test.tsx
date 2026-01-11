import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import HouseholdPage from '../page'
import * as householdApi from '@/lib/api/household'
import { useAuth, useUser } from '@clerk/nextjs'
import { syncUser } from '@/lib/api/client'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}))

// Mock the household API
jest.mock('@/lib/api/household')

// Mock the weather API
jest.mock('@/lib/api/weather')

// Mock the client API
jest.mock('@/lib/api/client', () => ({
  syncUser: jest.fn(),
}))

// Mock WeatherForecast component
jest.mock('@/components/household/WeatherForecast', () => {
  return function MockWeatherForecast({
    householdId,
    zipCode,
    token: _token,
  }: {
    householdId: number
    zipCode: string | null
    token: string
  }) {
    if (!zipCode) {
      return <div>No Zip Code Set</div>
    }
    return (
      <div data-testid="weather-forecast">
        Weather Forecast for {zipCode} in household {householdId}
      </div>
    )
  }
})

const mockGetToken = jest.fn()
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockSyncUser = syncUser as jest.MockedFunction<typeof syncUser>

const mockGetHouseholds = householdApi.getHouseholds as jest.MockedFunction<
  typeof householdApi.getHouseholds
>
const mockGetHousehold = householdApi.getHousehold as jest.MockedFunction<
  typeof householdApi.getHousehold
>
const mockGetSharedLists = householdApi.getSharedLists as jest.MockedFunction<
  typeof householdApi.getSharedLists
>
const mockGetHouseholdPreferences =
  householdApi.getHouseholdPreferences as jest.MockedFunction<
    typeof householdApi.getHouseholdPreferences
  >
const mockUpdateHouseholdPreferences =
  householdApi.updateHouseholdPreferences as jest.MockedFunction<
    typeof householdApi.updateHouseholdPreferences
  >

describe('HouseholdPage', () => {
  const mockUser = {
    id: 'user_123',
    primaryEmailAddress: {
      emailAddress: 'test@example.com',
    },
    fullName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
  }

  const mockHouseholds = [
    {
      id: 1,
      name: 'Test Household',
      created_by: 1,
      created_at: '2025-01-01T00:00:00Z',
    },
  ]

  const mockHouseholdWithMembers = {
    id: 1,
    name: 'Test Household',
    created_by: 1,
    created_at: '2025-01-01T00:00:00Z',
    members: [
      {
        id: 1,
        household_id: 1,
        user_id: 1,
        role: 'admin' as const,
        joined_at: '2025-01-01T00:00:00Z',
        user_email: 'test@example.com',
        user_name: 'Test User',
      },
    ],
  }

  const mockSharedLists = {
    household_id: 1,
    household_name: 'Test Household',
    lists: [],
  }

  const mockPreferences = {
    household_id: 1,
    user_id: 1,
    diet_types: ['paleo'],
    weekly_weather: null,
    cooking_apparatus: ['oven'],
    previous_meals: [],
    zip_code: '12345',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
      getToken: mockGetToken,
    } as ReturnType<typeof useAuth>)
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: mockUser,
    } as ReturnType<typeof useUser>)
    mockSyncUser.mockResolvedValue(undefined)
    mockGetHouseholds.mockResolvedValue(mockHouseholds)
    mockGetHousehold.mockResolvedValue(mockHouseholdWithMembers)
    mockGetSharedLists.mockResolvedValue(mockSharedLists)
    mockGetHouseholdPreferences.mockResolvedValue(mockPreferences)
  })

  it('should render loading state initially', () => {
    mockGetHouseholds.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<HouseholdPage />)
    expect(screen.getByText(/loading household/i)).toBeInTheDocument()
  })

  it('should display household members after loading', async () => {
    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('Household Members')).toBeInTheDocument()
    })

    // Wait for members to load - check for member count in stats (should show 1)
    await waitFor(
      () => {
        // Check that the member count shows 1 in the stats section
        const totalMembersElements = screen.getAllByText('1')
        // Should have at least one "1" for total members
        expect(totalMembersElements.length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )
  })

  it('should display preferences section', async () => {
    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('My Preferences')).toBeInTheDocument()
    })
  })

  it('should display weather forecast when zip code is set', async () => {
    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByTestId('weather-forecast')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Weather Forecast for 12345 in household 1/i)
    ).toBeInTheDocument()
  })

  it('should not display weather forecast when zip code is not set', async () => {
    const preferencesWithoutZip = {
      ...mockPreferences,
      zip_code: null,
    }
    mockGetHouseholdPreferences.mockResolvedValue(preferencesWithoutZip)

    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('My Preferences')).toBeInTheDocument()
    })

    // Wait for preferences and token to load, then WeatherForecast should render
    // When zipCode is null, WeatherForecast shows "No Zip Code Set"
    await waitFor(
      () => {
        expect(screen.getByText('No Zip Code Set')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should refresh weather forecast when preferences are updated with new zip code', async () => {
    const user = userEvent.setup()

    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('My Preferences')).toBeInTheDocument()
    })

    // Wait for preferences to load
    await waitFor(() => {
      expect(screen.getByText(/Edit Preferences/i)).toBeInTheDocument()
    })

    // Click edit button - use more specific selector
    const editButtons = screen.getAllByText(/Edit Preferences/i)
    await user.click(editButtons[0])

    // Update zip code
    const zipCodeInput = screen.getByLabelText(/zip code/i)
    await user.clear(zipCodeInput)
    await user.type(zipCodeInput, '90210')

    // Mock the updated preferences response
    const updatedPreferences = {
      ...mockPreferences,
      zip_code: '90210',
    }
    mockUpdateHouseholdPreferences.mockResolvedValue(updatedPreferences)

    // Submit form
    const saveButton = screen.getByText(/save/i)
    await user.click(saveButton)

    // Wait for preferences to update
    await waitFor(() => {
      expect(mockUpdateHouseholdPreferences).toHaveBeenCalled()
    })

    // Weather forecast should refresh with new zip code
    await waitFor(() => {
      expect(
        screen.getByText(/Weather Forecast for 90210 in household 1/i)
      ).toBeInTheDocument()
    })
  })

  it('should handle error when fetching preferences', async () => {
    mockGetHouseholdPreferences.mockRejectedValue(
      new Error('Failed to fetch preferences')
    )

    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('Household Members')).toBeInTheDocument()
    })

    // Preferences section should still render, just without data
    expect(screen.getByText('My Preferences')).toBeInTheDocument()
  })

  it('should display shared lists section', async () => {
    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('Shared Grocery Lists')).toBeInTheDocument()
    })
  })

  it('should handle no households state', async () => {
    mockGetHouseholds.mockResolvedValue([])

    render(<HouseholdPage />)

    await waitFor(() => {
      expect(screen.getByText('No Household Found')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Create your first household to start managing/i)
    ).toBeInTheDocument()
  })

  it('should sync user to backend on mount', async () => {
    render(<HouseholdPage />)

    await waitFor(() => {
      expect(mockSyncUser).toHaveBeenCalledWith({
        clerk_user_id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
      })
    })
  })
})
