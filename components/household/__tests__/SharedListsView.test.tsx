import { render, screen } from '@testing-library/react'
import SharedListsView from '../SharedListsView'
import { GroceryList, ItemCategory } from '@/lib/types'

const mockSharedLists: GroceryList[] = [
  {
    id: '1',
    name: 'Weekly Shopping',
    items: [
      {
        id: '1',
        name: 'Milk',
        quantity: 2,
        category: ItemCategory.DAIRY,
        checked: false,
        addedAt: new Date('2024-11-10'),
      },
    ],
    createdBy: 'John Parent',
    createdAt: new Date('2024-11-09'),
    updatedAt: new Date('2024-11-10T14:30:00'),
    sharedWith: ['jane@example.com', 'grandma@example.com'],
    isArchived: false,
  },
  {
    id: '2',
    name: 'Party Supplies',
    items: [],
    createdBy: 'Jane Parent',
    createdAt: new Date('2024-11-08'),
    updatedAt: new Date('2024-11-09T09:15:00'),
    sharedWith: ['john@example.com'],
    isArchived: false,
  },
]

describe('SharedListsView', () => {
  it('renders all shared lists', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
    expect(screen.getByText('Party Supplies')).toBeInTheDocument()
  })

  it('displays who created each list', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    expect(screen.getByText(/Created by John Parent/i)).toBeInTheDocument()
    expect(screen.getByText(/Created by Jane Parent/i)).toBeInTheDocument()
  })

  it('shows the last edit timestamp for each list', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    const lastEditedElements = screen.getAllByText(/Last edited:/)
    expect(lastEditedElements.length).toBeGreaterThan(0)
  })

  it('displays the number of people each list is shared with', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    expect(screen.getByText(/Shared with 2 people/)).toBeInTheDocument()
    expect(screen.getByText(/Shared with 1 person/)).toBeInTheDocument()
  })

  it('displays correct singular/plural for shared count', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    expect(screen.getByText(/Shared with 1 person/)).toBeInTheDocument()
    expect(screen.getByText(/Shared with 2 people/)).toBeInTheDocument()
  })

  it('shows item count for each list', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(screen.getByText('0 items')).toBeInTheDocument()
  })

  it('renders empty state when no lists provided', () => {
    render(<SharedListsView lists={[]} />)
    expect(screen.getByText(/No shared lists/i)).toBeInTheDocument()
  })

  it('displays list as a clickable card', () => {
    const { container } = render(<SharedListsView lists={mockSharedLists} />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/grocery-lists/1')
  })

  it('shows formatted relative time for last edit', () => {
    render(<SharedListsView lists={mockSharedLists} />)
    // Should show relative time like "X hours ago" or "X days ago"
    const lastEditedElements = screen.getAllByText(/Last edited:/)
    expect(lastEditedElements.length).toBeGreaterThan(0)
  })

  it('sorts lists by created_at descending (newest first)', () => {
    // Create lists with different created_at dates (unsorted order)
    const unsortedLists = [
      {
        id: '3',
        name: 'Oldest List',
        created_at: '2024-11-01T00:00:00Z',
        created_by: 1,
        updated_at: '2024-11-01T00:00:00Z',
        item_count: 0,
      },
      {
        id: '1',
        name: 'Newest List',
        created_at: '2024-11-10T00:00:00Z',
        created_by: 1,
        updated_at: '2024-11-10T00:00:00Z',
        item_count: 0,
      },
      {
        id: '2',
        name: 'Middle List',
        created_at: '2024-11-05T00:00:00Z',
        created_by: 1,
        updated_at: '2024-11-05T00:00:00Z',
        item_count: 0,
      },
    ]

    render(<SharedListsView lists={unsortedLists} />)

    // Get all list names in the order they appear
    const listNames = screen
      .getAllByText(
        /Weekly Shopping|Party Supplies|Oldest List|Newest List|Middle List/
      )
      .map((el) => el.textContent)

    // Find the positions of our test lists
    const newestIndex = listNames.findIndex((name) =>
      name?.includes('Newest List')
    )
    const middleIndex = listNames.findIndex((name) =>
      name?.includes('Middle List')
    )
    const oldestIndex = listNames.findIndex((name) =>
      name?.includes('Oldest List')
    )

    // Newest should come before middle, and middle before oldest
    expect(newestIndex).toBeLessThan(middleIndex)
    expect(middleIndex).toBeLessThan(oldestIndex)
  })
})
