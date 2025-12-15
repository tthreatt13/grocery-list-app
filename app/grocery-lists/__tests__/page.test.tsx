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
    is_archived: false,
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
    is_archived: false,
    items: [],
  },
]

describe('GroceryListsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations to ensure they don't leak from previous tests
    ;(householdApi.getHouseholds as jest.Mock).mockReset()
    ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockReset()
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

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(
          screen.queryByText('Loading your grocery lists...')
        ).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

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

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(
          screen.queryByText('Loading your grocery lists...')
        ).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

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
      expect(screen.getByText('No current lists yet')).toBeInTheDocument()
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

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(
          screen.queryByText('Loading your grocery lists...')
        ).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

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
    // Suppress console.error for this test since we're testing error states
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

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

    consoleSpy.mockRestore()
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

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(
          screen.queryByText('Loading your grocery lists...')
        ).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

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

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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
      // Suppress console.error for this test since we're testing error states
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

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

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

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

      consoleSpy.mockRestore()
    })

    it('should show loading state during deletion', async () => {
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
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

  describe('Tabs functionality', () => {
    it('should render Current and Archived tabs with counts', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      })

      expect(screen.getByText(/Current \(2\)/)).toBeInTheDocument()
      expect(screen.getByText(/Archived \(0\)/)).toBeInTheDocument()
    })

    it('should show Current tab as active by default', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      })

      const currentTab = screen.getByText(/Current \(2\)/)
      expect(currentTab).toHaveClass('border-emerald-500', 'text-emerald-600')
    })

    it('should filter lists by archive status', async () => {
      const listsWithArchived: groceryApi.GroceryListWithItems[] = [
        ...mockGroceryLists,
        {
          id: 3,
          household_id: 1,
          name: 'Archived List',
          created_by: 1,
          created_at: '2024-11-08T10:00:00Z',
          updated_at: '2024-11-08T10:00:00Z',
          is_archived: true,
          items: [],
        },
      ]

      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        listsWithArchived
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      })

      // Should show current lists by default
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      expect(screen.getByText('Party Supplies')).toBeInTheDocument()
      expect(screen.queryByText('Archived List')).not.toBeInTheDocument()

      // Click Archived tab
      const archivedTab = screen.getByText(/Archived \(1\)/)
      fireEvent.click(archivedTab)

      await waitFor(() => {
        expect(screen.getByText('Archived List')).toBeInTheDocument()
      })

      // Current lists should not be visible
      expect(screen.queryByText('Weekly Shopping')).not.toBeInTheDocument()
      expect(screen.queryByText('Party Supplies')).not.toBeInTheDocument()
    })

    it('should show correct empty state for Current tab', async () => {
      const archivedLists: groceryApi.GroceryListWithItems[] = [
        {
          id: 1,
          household_id: 1,
          name: 'Archived List',
          created_by: 1,
          created_at: '2024-11-10T10:00:00Z',
          updated_at: '2024-11-10T12:00:00Z',
          is_archived: true,
          items: [],
        },
      ]

      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        archivedLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('No current lists yet')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Create your first grocery list to get started')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create list/i })
      ).toBeInTheDocument()
    })

    it('should show correct empty state for Archived tab', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      })

      // Click Archived tab
      const archivedTab = screen.getByText(/Archived \(0\)/)
      fireEvent.click(archivedTab)

      await waitFor(() => {
        expect(screen.getByText('No archived lists yet')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          /Archive lists from the Current tab to organize your completed shopping lists/
        )
      ).toBeInTheDocument()
    })
  })

  describe('Archive/Unarchive functionality', () => {
    it('should archive a list when archive button is clicked', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )
      ;(groceryApi.archiveGroceryList as jest.Mock).mockResolvedValue({
        ...mockGroceryLists[0],
        is_archived: true,
      })

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Find and click archive button
      const archiveButtons = screen.getAllByLabelText(/archive list/i)
      fireEvent.click(archiveButtons[0])

      await waitFor(() => {
        expect(groceryApi.archiveGroceryList).toHaveBeenCalledWith(
          1,
          'mock-token'
        )
      })

      // List should move to archived tab
      await waitFor(() => {
        expect(screen.queryByText('Weekly Shopping')).not.toBeInTheDocument()
      })
    })

    it('should unarchive a list when unarchive button is clicked', async () => {
      const archivedList: groceryApi.GroceryListWithItems[] = [
        {
          ...mockGroceryLists[0],
          is_archived: true,
        },
      ]

      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        archivedList
      )
      ;(groceryApi.unarchiveGroceryList as jest.Mock).mockResolvedValue({
        ...mockGroceryLists[0],
        is_archived: false,
      })

      render(<GroceryListsPage />)

      await waitFor(() => {
        expect(screen.getByText('Grocery Lists')).toBeInTheDocument()
      })

      // Switch to Archived tab
      const archivedTab = screen.getByText(/Archived \(1\)/)
      fireEvent.click(archivedTab)

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Find and click unarchive button
      const unarchiveButtons = screen.getAllByLabelText(/unarchive list/i)
      fireEvent.click(unarchiveButtons[0])

      await waitFor(() => {
        expect(groceryApi.unarchiveGroceryList).toHaveBeenCalledWith(
          1,
          'mock-token'
        )
      })
    })

    it('should handle archive error gracefully', async () => {
      ;(householdApi.getHouseholds as jest.Mock).mockResolvedValue(
        mockHouseholds
      )
      ;(groceryApi.getGroceryListsWithItems as jest.Mock).mockResolvedValue(
        mockGroceryLists
      )
      ;(groceryApi.archiveGroceryList as jest.Mock).mockRejectedValue(
        new Error('Failed to archive list')
      )

      render(<GroceryListsPage />)

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Loading your grocery lists...')
          ).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      await waitFor(() => {
        expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      })

      // Wait for archive buttons to be available
      const archiveButtons = await screen.findAllByLabelText(/archive list/i)
      fireEvent.click(archiveButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Failed to archive list')).toBeInTheDocument()
      })

      // List should still be visible (not archived)
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })
  })
})
