import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../page'
import * as groceryApi from '@/lib/api/grocery'
import * as dashboardApi from '@/lib/api/dashboard'
import { useAuth } from '@clerk/nextjs'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

// Mock the grocery API
jest.mock('@/lib/api/grocery')

// Mock the dashboard API
jest.mock('@/lib/api/dashboard')

describe('Dashboard Page', () => {
  const mockGetToken = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
      getToken: mockGetToken,
    })
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should render loading state initially', () => {
    ;(groceryApi.getGroceryLists as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<Home />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should fetch and display grocery list stats from API', async () => {
    const mockLists = [
      {
        id: 1,
        name: 'Weekly Shopping',
        household_id: 1,
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
        updated_at: '2024-11-10T00:00:00Z',
        items: [
          {
            id: 1,
            list_id: 1,
            name: 'Bananas',
            quantity: '6',
            category: 'Produce',
            checked: false,
            created_at: '2024-11-10T00:00:00Z',
          },
          {
            id: 2,
            list_id: 1,
            name: 'Milk',
            quantity: '2',
            category: 'Dairy',
            checked: false,
            created_at: '2024-11-10T00:00:00Z',
          },
          {
            id: 3,
            list_id: 1,
            name: 'Eggs',
            quantity: '1',
            category: 'Dairy',
            checked: true,
            created_at: '2024-11-10T00:00:00Z',
          },
        ],
      },
      {
        id: 2,
        name: 'Party Supplies',
        household_id: 1,
        created_by: 1,
        created_at: '2024-11-11T00:00:00Z',
        updated_at: '2024-11-11T00:00:00Z',
        items: [
          {
            id: 4,
            list_id: 2,
            name: 'Chips',
            quantity: '3',
            category: 'Snacks',
            checked: false,
            created_at: '2024-11-11T00:00:00Z',
          },
        ],
      },
    ]

    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockLists
    )

    render(<Home />)

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Check stats are calculated correctly
    // 2 active lists
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Active Lists')).toBeInTheDocument()

    // 4 total items (3 from first list, 1 from second)
    expect(screen.getByText('4')).toBeInTheDocument()
    // There are multiple "Total Items" (grocery lists and pantry), so use getAllByText
    const totalItemsElements = screen.getAllByText('Total Items')
    expect(totalItemsElements.length).toBeGreaterThan(0)

    // 1 completed item
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should display recent lists from API', async () => {
    const mockLists = [
      {
        id: 1,
        name: 'Weekly Shopping',
        household_id: 1,
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
        updated_at: '2024-11-10T00:00:00Z',
        items: [
          {
            id: 1,
            list_id: 1,
            name: 'Bananas',
            quantity: '6',
            category: 'Produce',
            checked: false,
            created_at: '2024-11-10T00:00:00Z',
          },
        ],
      },
    ]

    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockLists
    )

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })

    expect(screen.getByText(/1 items/)).toBeInTheDocument()
    expect(screen.getByText(/0 completed/)).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockRejectedValue(
      new Error('API Error')
    )

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument()
    })
  })

  it('should handle empty grocery lists', async () => {
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])

    render(<Home />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Should show 0 stats
    const zeroElements = screen.getAllByText('0')
    expect(zeroElements.length).toBeGreaterThan(0)
  })

  it('should call the API with authentication token', async () => {
    const mockToken = 'test-auth-token'
    mockGetToken.mockResolvedValue(mockToken)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
    ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
      urgent_items: [],
      suggestions: [],
      stats: {
        total_lists: 0,
        total_items: 0,
        completed_items: 0,
        low_stock_count: 0,
        expiring_soon_count: 0,
        meals_this_week: 0,
        planned_days: 0,
      },
    })

    render(<Home />)

    await waitFor(() => {
      expect(groceryApi.getGroceryListsWithItems).toHaveBeenCalledWith(
        mockToken
      )
    })
  })

  describe('Urgent Action Items Integration', () => {
    const mockUrgentItems = [
      {
        id: 1,
        name: 'Milk',
        type: 'low_stock' as const,
        household_id: 1,
        category: 'Dairy',
        current_quantity: '0.5',
        low_stock_threshold: 1,
      },
      {
        id: 2,
        name: 'Bananas',
        type: 'expiring_soon' as const,
        household_id: 1,
        category: 'Produce',
        expiration_date: '2024-11-15T00:00:00Z',
        days_until_expiration: 2,
      },
    ]

    beforeEach(() => {
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: mockUrgentItems,
        suggestions: [],
        stats: {
          total_lists: 0,
          total_items: 0,
          completed_items: 0,
          low_stock_count: 1,
          expiring_soon_count: 1,
          meals_this_week: 0,
          planned_days: 0,
        },
      })
    })

    it('should fetch and display urgent items', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Urgent Action Items')).toBeInTheDocument()
      })

      expect(screen.getByText('Milk')).toBeInTheDocument()
      expect(screen.getByText('Bananas')).toBeInTheDocument()
    })

    it('should call getDashboardInsights with token', async () => {
      const mockToken = 'test-auth-token'
      mockGetToken.mockResolvedValue(mockToken)

      render(<Home />)

      await waitFor(() => {
        expect(dashboardApi.getDashboardInsights).toHaveBeenCalledWith(
          mockToken
        )
      })
    })

    it('should display empty state when no urgent items', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
        stats: {
          total_lists: 0,
          total_items: 0,
          completed_items: 0,
          low_stock_count: 0,
          expiring_soon_count: 0,
          meals_this_week: 0,
          planned_days: 0,
        },
      })

      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText(/no urgent items requiring attention/i)
        ).toBeInTheDocument()
      })
    })

    it('should handle dashboard insights API errors gracefully', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      render(<Home />)

      // Should still render the page without urgent items section failing
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Urgent items section should show empty state when there's an error
      // (component initializes with empty array, so it shows empty state)
      await waitFor(() => {
        expect(
          screen.getByText(/no urgent items requiring attention/i)
        ).toBeInTheDocument()
      })
    })

    it('should refresh urgent items when item is dismissed', async () => {
      ;(groceryApi.getGroceryLists as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: 'Weekly Shopping',
          household_id: 1,
          created_by: 1,
          created_at: '2024-11-10T00:00:00Z',
          updated_at: '2024-11-10T00:00:00Z',
          is_archived: false,
        },
      ])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', {
        name: /dismiss milk/i,
      })
      fireEvent.click(dismissButton)

      // Item should be removed from the list
      await waitFor(() => {
        expect(screen.queryByText('Milk')).not.toBeInTheDocument()
      })

      // Bananas should still be visible
      expect(screen.getByText('Bananas')).toBeInTheDocument()
    })
  })
})
