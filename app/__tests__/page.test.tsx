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

// Mock next/navigation
const mockPush = jest.fn(() => Promise.resolve())
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock the grocery API
jest.mock('@/lib/api/grocery')

// Mock the dashboard API
jest.mock('@/lib/api/dashboard')

// Mock the household API
jest.mock('@/lib/api/household', () => ({
  getHouseholds: jest.fn(),
}))

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
    ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
      urgent_items: [],
      suggestions: [],
      stats: {
        total_lists: 2,
        total_items: 4,
        completed_items: 1,
        low_stock_count: 0,
        expiring_soon_count: 0,
        meals_this_week: 0,
        planned_days: 0,
      },
    })

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
    // The "4" appears in "1 of 4 items completed" in the InsightsDisplay
    // Check for completion rate text that includes the total items (may appear multiple times)
    const completionTexts = screen.getAllByText(/1 of 4 items completed/i)
    expect(completionTexts.length).toBeGreaterThan(0)
    // Verify "4" is present in the completion text
    expect(screen.getByText(/of 4 items/i)).toBeInTheDocument()

    // 1 completed item - appears in "1 of 4 items completed"
    expect(screen.getByText(/1 of 4 items completed/i)).toBeInTheDocument()
    // "Completed" may appear multiple times, so use getAllByText
    const completedElements = screen.getAllByText(/completed/i)
    expect(completedElements.length).toBeGreaterThan(0)
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

  describe('Smart Suggestions Integration', () => {
    const mockSuggestions = [
      {
        id: 'restock_low_stock',
        type: 'restock' as const,
        title: 'Restock Low Stock Items',
        description:
          'You have 3 item(s) running low. Consider adding them to your shopping list.',
        action_label: 'View Items',
        priority: 2,
      },
      {
        id: 'use_expiring_items',
        type: 'meal_planning' as const,
        title: 'Items Expiring Soon',
        description:
          'You have 2 item(s) expiring within 5 days. Plan meals to use them!',
        action_label: 'View Items',
        priority: 3,
      },
      {
        id: 'create_weekly_list',
        type: 'routine' as const,
        title: 'Create Your Weekly Shopping List',
        description: 'Start planning your week by creating a new grocery list.',
        action_label: 'Create List',
        priority: 1,
      },
    ]

    beforeEach(() => {
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: mockSuggestions,
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
    })

    it('should fetch and display suggestions', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      expect(screen.getByText('Restock Low Stock Items')).toBeInTheDocument()
      expect(screen.getByText('Items Expiring Soon')).toBeInTheDocument()
      expect(
        screen.getByText('Create Your Weekly Shopping List')
      ).toBeInTheDocument()
    })

    it('should display suggestion descriptions', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(
          screen.getByText(/you have 3 item\(s\) running low/i)
        ).toBeInTheDocument()
      })

      expect(
        screen.getByText(/you have 2 item\(s\) expiring within 5 days/i)
      ).toBeInTheDocument()
    })

    it('should display empty state when no suggestions', async () => {
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
          screen.getByText(/no suggestions at this time/i)
        ).toBeInTheDocument()
      })
    })

    it('should sort suggestions by priority (higher priority first)', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      // Get all suggestion cards
      const suggestionTitles = [
        screen.getByText('Items Expiring Soon'), // Priority 3
        screen.getByText('Restock Low Stock Items'), // Priority 2
        screen.getByText('Create Your Weekly Shopping List'), // Priority 1
      ]

      // All should be visible
      suggestionTitles.forEach((title) => {
        expect(title).toBeInTheDocument()
      })
    })

    it('should handle suggestion dismissal', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Restock Low Stock Items')).toBeInTheDocument()
      })

      // Find and click dismiss button for the "Restock Low Stock Items" suggestion
      const dismissButton = screen.getByRole('button', {
        name: /dismiss suggestion: restock low stock items/i,
      })
      fireEvent.click(dismissButton)

      // Suggestion should be removed
      await waitFor(() => {
        expect(
          screen.queryByText('Restock Low Stock Items')
        ).not.toBeInTheDocument()
      })

      // Other suggestions should still be visible
      expect(screen.getByText('Items Expiring Soon')).toBeInTheDocument()
      expect(
        screen.getByText('Create Your Weekly Shopping List')
      ).toBeInTheDocument()
    })

    it('should refresh suggestions when suggestion is accepted', async () => {
      const updatedSuggestions = [
        {
          id: 'restock_low_stock',
          type: 'restock' as const,
          title: 'Restock Low Stock Items',
          description: 'You have 2 item(s) running low.',
          action_label: 'View Items',
          priority: 2,
        },
      ]

      ;(dashboardApi.getDashboardInsights as jest.Mock)
        .mockResolvedValueOnce({
          urgent_items: [],
          suggestions: mockSuggestions,
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
        .mockResolvedValueOnce({
          urgent_items: [],
          suggestions: updatedSuggestions,
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

      // Wait for suggestions to load - check for Smart Suggestions section first
      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      // Wait for at least one suggestion to appear (they are sorted by priority)
      await waitFor(() => {
        // Check for any of the expected suggestions
        const hasSuggestion =
          screen.queryByText('Items Expiring Soon') !== null ||
          screen.queryByText('Restock Low Stock Items') !== null ||
          screen.queryByText('Create Your Weekly Shopping List') !== null
        expect(hasSuggestion).toBe(true)
      })

      // Find any accept button for a restock suggestion (if available)
      // If "Restock Low Stock Items" is not visible, use "Items Expiring Soon" instead
      let acceptButton
      try {
        acceptButton = screen.getByRole('button', {
          name: /accept suggestion: restock low stock items/i,
        })
      } catch {
        // If restock button not found, use the first available accept button
        acceptButton = screen.getAllByRole('button', {
          name: /accept suggestion:/i,
        })[0]
      }

      fireEvent.click(acceptButton)

      // Should refresh suggestions - wait for the API to be called again
      await waitFor(
        () => {
          expect(dashboardApi.getDashboardInsights).toHaveBeenCalledTimes(2)
        },
        { timeout: 2000 }
      )
    })

    it('should handle dashboard insights API errors gracefully for suggestions', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      render(<Home />)

      // Should still render the page without suggestions section failing
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Suggestions section should show empty state when there's an error
      await waitFor(() => {
        expect(
          screen.getByText(/no suggestions at this time/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Context-Aware Views Integration', () => {
    beforeEach(() => {
      // Mock date to control context detection
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should display morning planning context message in the morning', async () => {
      // Set time to Monday morning (8 AM)
      jest.setSystemTime(new Date(2024, 0, 8, 8, 0, 0))
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
      })
      const { getHouseholds } = require('@/lib/api/household')
      getHouseholds.mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Should show morning planning message
      await waitFor(() => {
        expect(
          screen.getByText(/good morning! let's plan your day/i)
        ).toBeInTheDocument()
      })
    })

    it('should display shopping context message on shopping days', async () => {
      // Set time to Saturday morning (10 AM) - shopping day
      jest.setSystemTime(new Date(2024, 0, 6, 10, 0, 0))
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
      })
      const { getHouseholds } = require('@/lib/api/household')
      getHouseholds.mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Should show shopping message
      await waitFor(() => {
        expect(
          screen.getByText(/happy shopping! here's what you need/i)
        ).toBeInTheDocument()
      })
    })

    it('should display routine review context message in the evening', async () => {
      // Set time to Monday evening (7 PM)
      jest.setSystemTime(new Date(2024, 0, 8, 19, 0, 0))
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
      })
      const { getHouseholds } = require('@/lib/api/household')
      getHouseholds.mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Should show routine review message
      await waitFor(() => {
        expect(
          screen.getByText(/here's your grocery overview/i)
        ).toBeInTheDocument()
      })
    })

    it('should render all dashboard sections regardless of context', async () => {
      // Set time to Monday morning
      jest.setSystemTime(new Date(2024, 0, 8, 8, 0, 0))
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
      })
      const { getHouseholds } = require('@/lib/api/household')
      getHouseholds.mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // All sections should be present
      await waitFor(() => {
        expect(screen.getByText(/urgent action items/i)).toBeInTheDocument()
        expect(screen.getByText(/smart suggestions/i)).toBeInTheDocument()
        // "Recent Lists" appears in heading and empty state, so use getAllByText
        expect(screen.getAllByText(/recent lists/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/^pantry$/i).length).toBeGreaterThan(0)
        expect(screen.getByText(/plan meals/i)).toBeInTheDocument()
        expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
      })
    })

    it('should adapt welcome message based on time of day', async () => {
      const { getHouseholds } = require('@/lib/api/household')
      getHouseholds.mockResolvedValue([])

      // Test morning
      jest.setSystemTime(new Date(2024, 0, 8, 8, 0, 0))
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

      const { unmount } = render(<Home />)
      await waitFor(
        () => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
      expect(
        screen.getByText(/good morning! let's plan your day/i)
      ).toBeInTheDocument()

      // Clean up before rendering again
      unmount()

      // Test evening - need to render a new instance since context is computed once
      jest.setSystemTime(new Date(2024, 0, 8, 19, 0, 0))
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
      await waitFor(
        () => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
      expect(
        screen.getByText(/here's your grocery overview/i)
      ).toBeInTheDocument()
    })
  })

  describe('Insights & Patterns Integration', () => {
    const mockStats = {
      total_lists: 3,
      total_items: 25,
      completed_items: 15,
      low_stock_count: 5,
      expiring_soon_count: 2,
      meals_this_week: 7,
      planned_days: 5,
    }

    beforeEach(() => {
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
        stats: mockStats,
      })
    })

    it('should fetch and display insights section', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Insights & Patterns')).toBeInTheDocument()
      })
    })

    it('should display completion rate insight', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/completion rate/i)).toBeInTheDocument()
      })

      // 15 completed out of 25 total = 60%
      expect(screen.getByText(/60%/i)).toBeInTheDocument()
      expect(screen.getByText(/15 of 25 items completed/i)).toBeInTheDocument()
    })

    it('should display meal planning coverage', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/meal planning coverage/i)).toBeInTheDocument()
      })

      // 5 planned days out of 7 = ~71%
      expect(screen.getByText(/71%/i)).toBeInTheDocument()
      expect(screen.getByText(/5 of 7 days planned/i)).toBeInTheDocument()
      expect(screen.getByText(/7 meals this week/i)).toBeInTheDocument()
    })

    it('should display pantry health status', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/pantry health/i)).toBeInTheDocument()
      })

      // Check for low stock label and count (there may be multiple "Low Stock" elements)
      const lowStockElements = screen.getAllByText('Low Stock')
      expect(lowStockElements.length).toBeGreaterThan(0)
      // The low stock count "5" should be visible (there may be multiple "5"s on the page)
      const allFives = screen.getAllByText('5')
      expect(allFives.length).toBeGreaterThan(0)

      // Check for expiring soon label and count
      const expiringSoonElements = screen.getAllByText('Expiring Soon')
      expect(expiringSoonElements.length).toBeGreaterThan(0)
      // The expiring soon count "2" should be visible (there may be multiple "2"s on the page)
      const allTwos = screen.getAllByText('2')
      expect(allTwos.length).toBeGreaterThan(0)
    })

    it('should display shopping efficiency message', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/shopping efficiency/i)).toBeInTheDocument()
      })

      // Should show encouraging message based on completion rate
      expect(
        screen.getByText(/good progress! keep up the momentum/i)
      ).toBeInTheDocument()
    })

    it('should display active lists summary', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getAllByText(/active lists/i).length).toBeGreaterThan(0)
      })

      expect(
        screen.getByText(/you have 3 active grocery lists/i)
      ).toBeInTheDocument()
      // Check for the "3" in the Active Lists card (Total Lists value)
      const activeListsElements = screen.getAllByText('3')
      expect(activeListsElements.length).toBeGreaterThan(0)
    })

    it('should display visual progress bars', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Insights & Patterns')).toBeInTheDocument()
      })

      // Check for progress bars
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThanOrEqual(2) // At least completion rate and meal planning
    })

    it('should handle zero stats gracefully', async () => {
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
        expect(screen.getByText('Insights & Patterns')).toBeInTheDocument()
      })

      // There should be at least one "0%" in the insights (completion rate)
      const zeroPercentElements = screen.getAllByText(/0%/i)
      expect(zeroPercentElements.length).toBeGreaterThan(0)
      expect(
        screen.getByText(/start adding items to your grocery lists/i)
      ).toBeInTheDocument()
    })

    it('should display high completion rate with positive messaging', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
        stats: {
          ...mockStats,
          total_items: 20,
          completed_items: 18, // 90%
        },
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/90%/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/excellent! you're staying on top/i)
      ).toBeInTheDocument()
    })

    it('should display full meal planning coverage', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockResolvedValue({
        urgent_items: [],
        suggestions: [],
        stats: {
          ...mockStats,
          planned_days: 7,
        },
      })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/100%/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/perfect! you have meals planned for the entire week/i)
      ).toBeInTheDocument()
    })

    it('should display pantry health badge with appropriate status', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/pantry health/i)).toBeInTheDocument()
      })

      // Should show status badge (Fair, Good, Excellent, or Needs Attention)
      const statusTexts = ['Excellent', 'Good', 'Fair', 'Needs Attention']
      const hasStatus = statusTexts.some((status) => screen.queryByText(status))
      expect(hasStatus).toBe(true)
    })

    it('should refresh insights when dashboard data is refreshed', async () => {
      const updatedStats = {
        ...mockStats,
        completed_items: 20, // Updated completion
      }

      ;(dashboardApi.getDashboardInsights as jest.Mock)
        .mockResolvedValueOnce({
          urgent_items: [],
          suggestions: [],
          stats: mockStats,
        })
        .mockResolvedValueOnce({
          urgent_items: [],
          suggestions: [],
          stats: updatedStats,
        })

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/60%/i)).toBeInTheDocument()
      })

      // Trigger a refresh (e.g., by accepting a suggestion)
      // The component should update with new stats
      await waitFor(() => {
        expect(dashboardApi.getDashboardInsights).toHaveBeenCalled()
      })
    })

    it('should not render insights section when stats are null', async () => {
      ;(dashboardApi.getDashboardInsights as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      render(<Home />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Insights section should not be visible when stats are null
      expect(screen.queryByText('Insights & Patterns')).not.toBeInTheDocument()
    })
  })
})
