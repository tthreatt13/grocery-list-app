import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { useAuth } from '@clerk/nextjs'
import GroceryListsPage from '../page'
import * as groceryApi from '@/lib/api/grocery'
import * as householdApi from '@/lib/api/household'

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api/grocery')
jest.mock('@/lib/api/household')

const mockGetToken = jest.fn()

const mockHouseholds: householdApi.HouseholdResponse[] = [
  {
    id: 1,
    name: 'Test Household',
    created_by: 1,
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-10T10:00:00Z',
    members: [],
  },
]

const mockGroceryLists: groceryApi.GroceryListWithItems[] = [
  {
    id: 1,
    household_id: 1,
    name: 'Weekly Shopping',
    created_by: 1,
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-10T12:00:00Z',
    items: [
      {
        id: 1,
        list_id: 1,
        name: 'Bananas',
        quantity: '6 pcs',
        category: 'Produce',
        notes: 'Get ripe ones',
        checked: false,
        created_at: '2024-11-10T10:00:00Z',
      },
      {
        id: 2,
        list_id: 1,
        name: 'Milk',
        quantity: '2 gallons',
        category: 'Dairy',
        notes: undefined,
        checked: false,
        created_at: '2024-11-10T10:05:00Z',
      },
    ],
  },
  {
    id: 2,
    household_id: 1,
    name: 'Party Supplies',
    created_by: 1,
    created_at: '2024-11-09T10:00:00Z',
    updated_at: '2024-11-09T15:00:00Z',
    items: [],
  },
]

describe('GroceryListsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken })
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should render page title and description', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      expect(
        screen.getByText('Manage your shopping lists and track items')
      ).toBeInTheDocument()
    })
  })

  it('should display New List button in header', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
    })

    const newListButton = screen.getByRole('button', { name: /new list/i })
    expect(newListButton).toBeInTheDocument()
    expect(newListButton).not.toBeDisabled()
  })

  it('should display grocery list cards when lists exist', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })

    expect(screen.getByText('Party Supplies')).toBeInTheDocument()
  })

  it('should show empty state when no lists exist', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('No lists yet')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Create your first grocery list to get started')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create list/i })
    ).toBeInTheDocument()
  })

  it('should show no household message when no households exist', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue([])
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue([])

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('No Household Found')).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        'Create or join a household to start managing grocery lists'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /go to household/i })
    ).toBeInTheDocument()

    // New List button should be disabled
    const newListButton = screen.getByRole('button', { name: /new list/i })
    expect(newListButton).toBeDisabled()
  })

  it('should open create list modal when New List button is clicked', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
    })

    const newListButton = screen.getByRole('button', { name: /new list/i })
    fireEvent.click(newListButton)

    await waitFor(() => {
      expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('List Name')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create list/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should handle loading state', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    ) // Never resolves
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )

    render(<GroceryListsPage />)

    expect(
      screen.getByText('Loading your grocery lists...')
    ).toBeInTheDocument()
    // Check for loading spinner by class instead of role
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should handle error state', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch households')
    )
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch lists')
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to fetch households')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument()
  })

  it('should create new list when form is submitted', async () => {
    const newList: groceryApi.GroceryListWithItems = {
      id: 3,
      household_id: 1,
      name: 'New Test List',
      created_by: 1,
      created_at: '2024-11-10T14:00:00Z',
      updated_at: '2024-11-10T14:00:00Z',
      items: [],
    }

    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )
    ;(groceryApi.createGroceryList as jest.Mock).mockResolvedValue(newList)

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
    })

    // Open modal
    const newListButton = screen.getByRole('button', { name: /new list/i })
    fireEvent.click(newListButton)

    await waitFor(() => {
      expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText('List Name')
    fireEvent.change(nameInput, { target: { value: 'New Test List' } })

    // Submit form
    const createButton = screen.getByRole('button', { name: /create list/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(groceryApi.createGroceryList).toHaveBeenCalledWith(
        {
          name: 'New Test List',
          household_id: 1,
        },
        'mock-token'
      )
    })
  })

  it('should display lists in grid layout', async () => {
    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(mockHouseholds)
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })

    // Check that lists are displayed in a grid
    const gridContainer = screen.getByText('Weekly Shopping').closest('.grid')
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3'
    )
  })

  it('should show household selector when multiple households exist', async () => {
    const multipleHouseholds = [
      ...mockHouseholds,
      {
        id: 2,
        name: 'Second Household',
        created_by: 1,
        created_at: '2024-11-09T10:00:00Z',
        updated_at: '2024-11-09T10:00:00Z',
        members: [],
      },
    ]

    ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
      multipleHouseholds
    )
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
      mockGroceryLists
    )

    render(<GroceryListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
    })

    // Open modal
    const newListButton = screen.getByRole('button', { name: /new list/i })
    fireEvent.click(newListButton)

    await waitFor(() => {
      expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    // Should show household selector
    expect(screen.getByLabelText('Household')).toBeInTheDocument()
    expect(screen.getByText('Test Household')).toBeInTheDocument()
    expect(screen.getByText('Second Household')).toBeInTheDocument()
  })

  describe('Delete functionality', () => {
    it('should show delete buttons on grocery list cards', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Should show delete buttons for each list
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      expect(deleteButtons).toHaveLength(2)
    })

    it('should open confirmation modal when delete button is clicked', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Click delete button for first list
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      fireEvent.click(deleteButtons[0])

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Delete Grocery List')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument()
      // Check for the list name in the modal specifically
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveTextContent('Weekly Shopping')
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
      // Look for the delete button specifically in the modal
      const deleteButton = within(modal).getByRole('button', {
        name: /^delete$/i,
      })
      expect(deleteButton).toBeInTheDocument()
    })

    it('should close confirmation modal when cancel is clicked', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Open confirmation modal
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Grocery List')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      // Modal should be closed
      await waitFor(() => {
        expect(
          screen.queryByText('Delete Grocery List')
        ).not.toBeInTheDocument()
      })
    })

    it('should delete list when confirmed', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )
      ;(groceryApi.deleteGroceryList as jest.Mock).mockResolvedValue(undefined)

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Open confirmation modal
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Grocery List')).toBeInTheDocument()
      })

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      fireEvent.click(deleteButton)

      // Should call API
      await waitFor(() => {
        expect(groceryApi.deleteGroceryList).toHaveBeenCalledWith(
          1,
          'mock-token'
        )
      })

      // List should be removed from UI
      await waitFor(() => {
        expect(screen.queryByText('Weekly Shopping')).not.toBeInTheDocument()
      })

      // Should still show other list
      expect(screen.getByText('Party Supplies')).toBeInTheDocument()
    })

    it('should handle delete error', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )
      ;(groceryApi.deleteGroceryList as jest.Mock).mockRejectedValue(
        new Error('Failed to delete list')
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Open confirmation modal
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Grocery List')).toBeInTheDocument()
      })

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      fireEvent.click(deleteButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to delete list')).toBeInTheDocument()
      })

      // List should still be in UI (check by heading in card)
      const listCards = screen.getAllByText('Weekly Shopping')
      expect(listCards.length).toBeGreaterThan(0)
    })

    it('should show loading state during deletion', async () => {
      let resolveDelete: (value?: unknown) => void
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve
      })

      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )
      ;(groceryApi.deleteGroceryList as jest.Mock).mockReturnValue(
        deletePromise
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Open confirmation modal
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete list/i,
      })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Grocery List')).toBeInTheDocument()
      })

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      fireEvent.click(deleteButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument()
      })

      // Resolve the promise
      resolveDelete!()

      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument()
      })
    })
  })
})
