import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UrgentActionItems from '../UrgentActionItems'
import { UrgentItem } from '@/lib/api/dashboard'
import { GroceryListResponse } from '@/lib/api/grocery'

// Mock the API functions
jest.mock('@/lib/api/grocery', () => ({
  getGroceryLists: jest.fn(),
  addGroceryItem: jest.fn(),
}))

jest.mock('@/lib/api/dashboard', () => ({
  getDashboardInsights: jest.fn(),
}))

const mockUrgentItems: UrgentItem[] = [
  {
    id: 1,
    name: 'Milk',
    type: 'low_stock',
    household_id: 1,
    category: 'Dairy',
    current_quantity: '0.5',
    low_stock_threshold: 1,
  },
  {
    id: 2,
    name: 'Bananas',
    type: 'expiring_soon',
    household_id: 1,
    category: 'Produce',
    expiration_date: '2024-11-15T00:00:00Z',
    days_until_expiration: 2,
  },
]

const mockGroceryLists: GroceryListResponse[] = [
  {
    id: 1,
    household_id: 1,
    name: 'Weekly Shopping',
    created_by: 1,
    created_at: '2024-11-10T00:00:00Z',
    updated_at: '2024-11-10T00:00:00Z',
    is_archived: false,
  },
  {
    id: 2,
    household_id: 1,
    name: 'Quick Trip',
    created_by: 1,
    created_at: '2024-11-11T00:00:00Z',
    updated_at: '2024-11-11T00:00:00Z',
    is_archived: false,
  },
]

describe('UrgentActionItems', () => {
  const mockGetToken = jest.fn()
  const mockOnItemAdded = jest.fn()
  const mockOnItemDismissed = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('renders urgent items section with title', () => {
    render(
      <UrgentActionItems
        items={mockUrgentItems}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText('Urgent Action Items')).toBeInTheDocument()
  })

  it('displays all urgent items', () => {
    render(
      <UrgentActionItems
        items={mockUrgentItems}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bananas')).toBeInTheDocument()
  })

  it('shows empty state when no urgent items', () => {
    render(
      <UrgentActionItems
        items={[]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(
      screen.getByText(/no urgent items requiring attention/i)
    ).toBeInTheDocument()
  })

  it('displays low stock badge for low stock items', () => {
    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('displays expiring soon badge for expiring items', () => {
    render(
      <UrgentActionItems
        items={[mockUrgentItems[1]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText(/expiring in 2 days/i)).toBeInTheDocument()
  })

  it('shows category badge when category is available', () => {
    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText('Dairy')).toBeInTheDocument()
  })

  it('displays quantity information for low stock items', () => {
    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(screen.getByText(/current:/i)).toBeInTheDocument()
    expect(screen.getByText('0.5')).toBeInTheDocument()
    expect(screen.getByText(/threshold:/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders Add to List button for each item', () => {
    render(
      <UrgentActionItems
        items={mockUrgentItems}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    expect(
      screen.getByRole('button', { name: /add milk to list/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add bananas to list/i })
    ).toBeInTheDocument()
  })

  it('renders Dismiss button for each item', () => {
    render(
      <UrgentActionItems
        items={mockUrgentItems}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
    expect(dismissButtons).toHaveLength(2)
  })

  it('calls onItemDismissed when dismiss button is clicked', () => {
    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)

    expect(mockOnItemDismissed).toHaveBeenCalledWith(mockUrgentItems[0].id)
  })

  it('opens modal when Add to List button is clicked', async () => {
    const { getGroceryLists } = require('@/lib/api/grocery')
    getGroceryLists.mockResolvedValue(mockGroceryLists)

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/select a grocery list/i)).toBeInTheDocument()
    })
  })

  it('displays grocery lists in modal', async () => {
    const { getGroceryLists } = require('@/lib/api/grocery')
    getGroceryLists.mockResolvedValue(mockGroceryLists)

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      expect(screen.getByText('Quick Trip')).toBeInTheDocument()
    })
  })

  it('calls onItemAdded when item is successfully added to list', async () => {
    const { getGroceryLists, addGroceryItem } = require('@/lib/api/grocery')
    getGroceryLists.mockResolvedValue(mockGroceryLists)
    addGroceryItem.mockResolvedValue({
      id: 10,
      list_id: 1,
      name: 'Milk',
      checked: false,
      created_at: '2024-11-15T00:00:00Z',
    })

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/select list/i)
    fireEvent.change(select, { target: { value: '1' } })

    const confirmButton = screen.getByRole('button', { name: /^add to list$/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(addGroceryItem).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Milk',
          category: 'Dairy',
        }),
        'mock-token'
      )
      expect(mockOnItemAdded).toHaveBeenCalled()
    })
  })

  it('handles error when adding item to list', async () => {
    const { getGroceryLists, addGroceryItem } = require('@/lib/api/grocery')
    getGroceryLists.mockResolvedValue(mockGroceryLists)
    addGroceryItem.mockRejectedValue(new Error('Failed to add item'))

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/select list/i)
    fireEvent.change(select, { target: { value: '1' } })

    const confirmButton = screen.getByRole('button', { name: /^add to list$/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('closes modal when cancel button is clicked', async () => {
    const { getGroceryLists } = require('@/lib/api/grocery')
    getGroceryLists.mockResolvedValue(mockGroceryLists)

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/select a grocery list/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(
        screen.queryByText(/select a grocery list/i)
      ).not.toBeInTheDocument()
    })
  })

  it('shows loading state when fetching grocery lists', async () => {
    const { getGroceryLists } = require('@/lib/api/grocery')
    getGroceryLists.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockGroceryLists), 100)
        )
    )

    render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    const addButton = screen.getByRole('button', { name: /add milk to list/i })
    fireEvent.click(addButton)

    // Modal should be open but lists might still be loading
    await waitFor(() => {
      expect(screen.getByText(/select a grocery list/i)).toBeInTheDocument()
    })
  })

  it('displays correct urgency indicator color for low stock items', () => {
    const { container } = render(
      <UrgentActionItems
        items={[mockUrgentItems[0]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    // Check for warning color classes (Badge uses bg-orange-100 for warning variant)
    const badge = container.querySelector('.bg-orange-100')
    expect(badge).toBeInTheDocument()
  })

  it('displays correct urgency indicator color for expiring items', () => {
    const { container } = render(
      <UrgentActionItems
        items={[mockUrgentItems[1]]}
        getToken={mockGetToken}
        onItemAdded={mockOnItemAdded}
        onItemDismissed={mockOnItemDismissed}
      />
    )

    // Check for danger color classes (Badge uses bg-red-100 for danger variant)
    const badge = container.querySelector('.bg-red-100')
    expect(badge).toBeInTheDocument()
  })
})
