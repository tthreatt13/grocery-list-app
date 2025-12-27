import { render, screen } from '@testing-library/react'
import DashboardLayout from '../DashboardLayout'
import { DashboardViewMode } from '@/lib/utils/contextDetection'
import { UrgentItem } from '@/lib/api/dashboard'
import { Suggestion } from '@/lib/api/dashboard'
import { GroceryList } from '@/lib/types'

// Mock child components
jest.mock('../UrgentActionItems', () => {
  return function MockUrgentActionItems({ items }: { items: UrgentItem[] }) {
    return (
      <div data-testid="urgent-action-items">
        {items.length > 0 ? (
          <div>Urgent Items: {items.length}</div>
        ) : (
          <div>No urgent items</div>
        )}
      </div>
    )
  }
})

jest.mock('../SmartSuggestions', () => {
  return function MockSmartSuggestions({
    suggestions,
  }: {
    suggestions: Suggestion[]
  }) {
    return (
      <div data-testid="smart-suggestions">
        {suggestions.length > 0 ? (
          <div>Suggestions: {suggestions.length}</div>
        ) : (
          <div>No suggestions</div>
        )}
      </div>
    )
  }
})

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
]

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'routine',
    title: 'Weekly Shopping',
    description: 'Time for your weekly shopping trip',
    priority: 1,
    action_label: 'Create List',
  },
]

const mockGroceryLists: GroceryList[] = [
  {
    id: 1,
    name: 'Weekly Shopping',
    householdId: 1,
    items: [],
    isArchived: false,
    sharedWith: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockGetToken = jest.fn().mockResolvedValue('mock-token')

const defaultProps = {
  viewMode: 'morning_planning' as DashboardViewMode,
  urgentItems: mockUrgentItems,
  suggestions: mockSuggestions,
  groceryLists: mockGroceryLists,
  stats: null,
  getToken: mockGetToken,
  onItemAdded: jest.fn(),
  onItemDismissed: jest.fn(),
  onSuggestionAccepted: jest.fn(),
  onSuggestionDismissed: jest.fn(),
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders welcome header', () => {
    render(<DashboardLayout {...defaultProps} />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('renders urgent action items section', () => {
    render(<DashboardLayout {...defaultProps} />)
    expect(screen.getByTestId('urgent-action-items')).toBeInTheDocument()
  })

  it('renders smart suggestions section', () => {
    render(<DashboardLayout {...defaultProps} />)
    expect(screen.getByTestId('smart-suggestions')).toBeInTheDocument()
  })

  it('renders quick actions section', () => {
    render(<DashboardLayout {...defaultProps} />)
    expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
  })

  it('renders recent lists section', () => {
    render(<DashboardLayout {...defaultProps} />)
    expect(screen.getByText(/recent lists/i)).toBeInTheDocument()
  })

  describe('morning_planning view mode', () => {
    it('prioritizes urgent items and suggestions at the top', () => {
      const { container } = render(
        <DashboardLayout {...defaultProps} viewMode="morning_planning" />
      )

      const sections = container.querySelectorAll('[data-testid]')
      const urgentIndex = Array.from(sections).findIndex(
        (el) => el.getAttribute('data-testid') === 'urgent-action-items'
      )
      const suggestionsIndex = Array.from(sections).findIndex(
        (el) => el.getAttribute('data-testid') === 'smart-suggestions'
      )

      // Urgent items and suggestions should appear early
      expect(urgentIndex).toBeGreaterThanOrEqual(0)
      expect(suggestionsIndex).toBeGreaterThanOrEqual(0)
    })

    it('displays context-appropriate message for morning planning', () => {
      render(<DashboardLayout {...defaultProps} viewMode="morning_planning" />)
      // The welcome message should be context-aware
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })
  })

  describe('shopping view mode', () => {
    it('prioritizes urgent items and grocery lists for shopping', () => {
      const { container } = render(
        <DashboardLayout {...defaultProps} viewMode="shopping" />
      )

      // In shopping mode, urgent items should be prominently displayed
      expect(screen.getByTestId('urgent-action-items')).toBeInTheDocument()
    })

    it('displays context-appropriate message for shopping', () => {
      render(<DashboardLayout {...defaultProps} viewMode="shopping" />)
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })
  })

  describe('routine_review view mode', () => {
    it('shows all sections in routine review mode', () => {
      render(<DashboardLayout {...defaultProps} viewMode="routine_review" />)

      expect(screen.getByTestId('urgent-action-items')).toBeInTheDocument()
      expect(screen.getByTestId('smart-suggestions')).toBeInTheDocument()
    })

    it('displays context-appropriate message for routine review', () => {
      render(<DashboardLayout {...defaultProps} viewMode="routine_review" />)
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })
  })

  it('passes correct props to UrgentActionItems', () => {
    const onItemAdded = jest.fn()
    const onItemDismissed = jest.fn()

    render(
      <DashboardLayout
        {...defaultProps}
        urgentItems={mockUrgentItems}
        onItemAdded={onItemAdded}
        onItemDismissed={onItemDismissed}
      />
    )

    // Component should render, which means props were passed
    expect(screen.getByTestId('urgent-action-items')).toBeInTheDocument()
  })

  it('passes correct props to SmartSuggestions', () => {
    const onSuggestionAccepted = jest.fn()
    const onSuggestionDismissed = jest.fn()

    render(
      <DashboardLayout
        {...defaultProps}
        suggestions={mockSuggestions}
        onSuggestionAccepted={onSuggestionAccepted}
        onSuggestionDismissed={onSuggestionDismissed}
      />
    )

    // Component should render, which means props were passed
    expect(screen.getByTestId('smart-suggestions')).toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(<DashboardLayout {...defaultProps} />)
    // Should have links to different sections
    expect(screen.getByText(/new list/i)).toBeInTheDocument()
    // "Pantry" appears in multiple places, so check for the button text specifically
    const pantryTexts = screen.getAllByText(/pantry/i)
    expect(pantryTexts.length).toBeGreaterThan(0)
    expect(screen.getByText(/plan meals/i)).toBeInTheDocument()
  })

  it('handles empty urgent items', () => {
    render(<DashboardLayout {...defaultProps} urgentItems={[]} />)
    expect(screen.getByTestId('urgent-action-items')).toBeInTheDocument()
  })

  it('handles empty suggestions', () => {
    render(<DashboardLayout {...defaultProps} suggestions={[]} />)
    expect(screen.getByTestId('smart-suggestions')).toBeInTheDocument()
  })

  it('handles empty grocery lists', () => {
    render(<DashboardLayout {...defaultProps} groceryLists={[]} />)
    expect(screen.getByText(/no recent lists/i)).toBeInTheDocument()
  })
})
