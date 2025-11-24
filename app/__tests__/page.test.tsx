import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../page'
import * as groceryApi from '@/lib/api/grocery'
import { useAuth } from '@clerk/nextjs'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

// Mock the grocery API
jest.mock('@/lib/api/grocery')

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
    expect(screen.getByText('Total Items')).toBeInTheDocument()

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

    render(<Home />)

    await waitFor(() => {
      expect(groceryApi.getGroceryListsWithItems).toHaveBeenCalledWith(
        mockToken
      )
    })
  })
})
