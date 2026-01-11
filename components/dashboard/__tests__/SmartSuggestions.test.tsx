import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SmartSuggestions from '../SmartSuggestions'
import { Suggestion } from '@/lib/api/dashboard'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the API functions
jest.mock('@/lib/api/grocery', () => ({
  getGroceryLists: jest.fn(),
  createGroceryList: jest.fn(),
  addGroceryItem: jest.fn(),
}))

jest.mock('@/lib/api/household', () => ({
  getHouseholds: jest.fn(),
}))

const mockSuggestions: Suggestion[] = [
  {
    id: 'restock_low_stock',
    type: 'restock',
    title: 'Restock Low Stock Items',
    description:
      'You have 3 item(s) running low. Consider adding them to your shopping list.',
    action_label: 'View Items',
    priority: 2,
  },
  {
    id: 'use_expiring_items',
    type: 'meal_planning',
    title: 'Items Expiring Soon',
    description:
      'You have 2 item(s) expiring within 5 days. Plan meals to use them!',
    action_label: 'View Items',
    priority: 3,
  },
  {
    id: 'create_weekly_list',
    type: 'routine',
    title: 'Create Your Weekly Shopping List',
    description: 'Start planning your week by creating a new grocery list.',
    action_label: 'Create List',
    priority: 1,
  },
]

describe('SmartSuggestions', () => {
  const mockGetToken = jest.fn()
  const mockOnSuggestionAccepted = jest.fn()
  const mockOnSuggestionDismissed = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders suggestions section with title', () => {
    render(
      <SmartSuggestions
        suggestions={mockSuggestions}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
  })

  it('displays all suggestions', () => {
    render(
      <SmartSuggestions
        suggestions={mockSuggestions}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    expect(screen.getByText('Restock Low Stock Items')).toBeInTheDocument()
    expect(screen.getByText('Items Expiring Soon')).toBeInTheDocument()
    expect(
      screen.getByText('Create Your Weekly Shopping List')
    ).toBeInTheDocument()
  })

  it('shows empty state when no suggestions', () => {
    render(
      <SmartSuggestions
        suggestions={[]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    expect(screen.getByText(/no suggestions at this time/i)).toBeInTheDocument()
  })

  it('displays suggestion descriptions', () => {
    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[0]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    expect(
      screen.getByText(/you have 3 item\(s\) running low/i)
    ).toBeInTheDocument()
  })

  it('renders Accept button with correct label for each suggestion', () => {
    render(
      <SmartSuggestions
        suggestions={mockSuggestions}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    // Buttons have aria-labels, so we need to check by aria-label or text content
    expect(
      screen.getByRole('button', {
        name: /accept suggestion: restock low stock items/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /accept suggestion: create your weekly shopping list/i,
      })
    ).toBeInTheDocument()
    // Check that buttons contain the action label text (multiple instances are fine)
    expect(screen.getAllByText('View Items').length).toBeGreaterThan(0)
    expect(screen.getByText('Create List')).toBeInTheDocument()
  })

  it('renders Dismiss button for each suggestion', () => {
    render(
      <SmartSuggestions
        suggestions={mockSuggestions}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
    expect(dismissButtons).toHaveLength(3)
  })

  it('calls onSuggestionDismissed when dismiss button is clicked', () => {
    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[0]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)

    expect(mockOnSuggestionDismissed).toHaveBeenCalledWith(
      mockSuggestions[0].id
    )
  })

  it('navigates to pantry when restock suggestion is accepted', () => {
    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[0]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: restock low stock items/i,
    })
    fireEvent.click(acceptButton)

    expect(mockPush).toHaveBeenCalledWith('/pantry')
    expect(mockOnSuggestionAccepted).toHaveBeenCalledWith(mockSuggestions[0].id)
  })

  it('navigates to meal planner when meal_planning suggestion is accepted', () => {
    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[1]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: items expiring soon/i,
    })
    fireEvent.click(acceptButton)

    expect(mockPush).toHaveBeenCalledWith('/meal-planner')
    expect(mockOnSuggestionAccepted).toHaveBeenCalledWith(mockSuggestions[1].id)
  })

  it('opens create list modal when routine suggestion is accepted', async () => {
    const { getHouseholds } = require('@/lib/api/household')
    getHouseholds.mockResolvedValue([
      {
        id: 1,
        name: 'My Household',
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
      },
    ])

    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[2]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: create your weekly shopping list/i,
    })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      // Check for modal title specifically
      expect(
        screen.getByRole('heading', { name: /create a new grocery list/i })
      ).toBeInTheDocument()
    })
  })

  it('creates grocery list when routine suggestion is accepted and form is submitted', async () => {
    const { getHouseholds } = require('@/lib/api/household')
    const { createGroceryList } = require('@/lib/api/grocery')
    getHouseholds.mockResolvedValue([
      {
        id: 1,
        name: 'My Household',
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
      },
    ])
    createGroceryList.mockResolvedValue({
      id: 2,
      household_id: 1,
      name: 'New Weekly List',
      created_by: 1,
      created_at: '2024-11-15T00:00:00Z',
      updated_at: '2024-11-15T00:00:00Z',
      is_archived: false,
    })

    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[2]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: create your weekly shopping list/i,
    })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      // Check for modal title specifically
      expect(
        screen.getByRole('heading', { name: /create a new grocery list/i })
      ).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'New Weekly List' } })

    // Household should already be selected (auto-selected first one)
    const submitButton = screen.getByRole('button', { name: /^create list$/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(createGroceryList).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Weekly List',
          household_id: 1,
        }),
        'mock-token'
      )
      expect(mockOnSuggestionAccepted).toHaveBeenCalledWith(
        mockSuggestions[2].id
      )
    })
  })

  it('displays suggestion type badge', () => {
    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[0]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    // Check for type badge - should be "Restock" for restock type
    expect(screen.getByText('Restock')).toBeInTheDocument()
  })

  it('sorts suggestions by priority (higher priority first)', () => {
    const { container } = render(
      <SmartSuggestions
        suggestions={mockSuggestions}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const cards = container.querySelectorAll('[class*="space-y-4"] > div')
    // First card should be highest priority (priority 3 - expiring items)
    expect(cards[0]).toHaveTextContent('Items Expiring Soon')
    // Second card should be priority 2 (restock)
    expect(cards[1]).toHaveTextContent('Restock Low Stock Items')
    // Third card should be priority 1 (routine)
    expect(cards[2]).toHaveTextContent('Create Your Weekly Shopping List')
  })

  it('handles error when creating grocery list', async () => {
    const { getHouseholds } = require('@/lib/api/household')
    const { createGroceryList } = require('@/lib/api/grocery')
    getHouseholds.mockResolvedValue([
      {
        id: 1,
        name: 'My Household',
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
      },
    ])
    createGroceryList.mockRejectedValue(new Error('Failed to create list'))

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[2]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: create your weekly shopping list/i,
    })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      // Check for modal title specifically
      expect(
        screen.getByRole('heading', { name: /create a new grocery list/i })
      ).toBeInTheDocument()
    })

    // Wait for households to load (input should be available)
    await waitFor(() => {
      expect(screen.getByLabelText(/list name/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/list name/i)
    fireEvent.change(nameInput, { target: { value: 'New List' } })

    // Household should already be selected (auto-selected first one)
    const submitButton = screen.getByRole('button', { name: /^create list$/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('closes create list modal when cancel button is clicked', async () => {
    const { getHouseholds } = require('@/lib/api/household')
    getHouseholds.mockResolvedValue([
      {
        id: 1,
        name: 'My Household',
        created_by: 1,
        created_at: '2024-11-10T00:00:00Z',
      },
    ])

    render(
      <SmartSuggestions
        suggestions={[mockSuggestions[2]]}
        getToken={mockGetToken}
        onSuggestionAccepted={mockOnSuggestionAccepted}
        onSuggestionDismissed={mockOnSuggestionDismissed}
      />
    )

    const acceptButton = screen.getByRole('button', {
      name: /accept suggestion: create your weekly shopping list/i,
    })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      // Check for modal title specifically
      expect(
        screen.getByRole('heading', { name: /create a new grocery list/i })
      ).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /create a new grocery list/i })
      ).not.toBeInTheDocument()
    })
  })
})
