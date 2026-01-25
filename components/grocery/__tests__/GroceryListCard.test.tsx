import { render, screen, fireEvent } from '@testing-library/react'
import GroceryListCard from '../GroceryListCard'
import { GroceryList, ItemCategory } from '@/lib/types'

const mockList: GroceryList = {
  id: '1',
  name: 'Weekly Shopping',
  items: [
    {
      id: '1',
      name: 'Bananas',
      quantity: 6,
      category: ItemCategory.PRODUCE,
      checked: false,
      addedAt: new Date('2024-11-10'),
    },
    {
      id: '2',
      name: 'Milk',
      quantity: 2,
      category: ItemCategory.DAIRY,
      checked: true,
      addedAt: new Date('2024-11-10'),
    },
  ],
  createdBy: 'John',
  createdAt: new Date('2024-11-09'),
  updatedAt: new Date('2024-11-10'),
  sharedWith: ['jane@example.com'],
  isArchived: false,
}

describe('GroceryListCard', () => {
  it('renders list name', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
  })

  it('displays item count correctly', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('shows shared badge when list is shared', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('Shared')).toBeInTheDocument()
  })

  it('does not show shared badge when list is not shared', () => {
    const unsharedList = { ...mockList, sharedWith: [] }
    render(<GroceryListCard list={unsharedList} />)
    expect(screen.queryByText('Shared')).not.toBeInTheDocument()
  })

  it('displays member count when shared', () => {
    render(<GroceryListCard list={mockList} />)
    expect(screen.getByText('2 members')).toBeInTheDocument()
  })

  it('calculates completion percentage correctly', () => {
    const { container } = render(<GroceryListCard list={mockList} />)
    const progressBar = container.querySelector('.bg-warm-green')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('handles empty list', () => {
    const emptyList = { ...mockList, items: [] }
    render(<GroceryListCard list={emptyList} />)
    expect(screen.getByText('0 / 0')).toBeInTheDocument()
  })

  it('links to the correct detail page', () => {
    const { container } = render(<GroceryListCard list={mockList} />)
    const link = container.querySelector('a')
    expect(link).toHaveAttribute('href', '/grocery-lists/1')
  })

  describe('Delete functionality', () => {
    it('renders delete button when onDelete prop is provided', () => {
      const mockOnDelete = jest.fn()
      render(<GroceryListCard list={mockList} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: /delete list/i })
      expect(deleteButton).toBeInTheDocument()
    })

    it('does not render delete button when onDelete prop is not provided', () => {
      render(<GroceryListCard list={mockList} />)

      const deleteButton = screen.queryByRole('button', {
        name: /delete list/i,
      })
      expect(deleteButton).not.toBeInTheDocument()
    })

    it('calls onDelete with list id when delete button is clicked', () => {
      const mockOnDelete = jest.fn()
      render(<GroceryListCard list={mockList} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: /delete list/i })
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('1')
    })

    it('prevents navigation when delete button is clicked', () => {
      const mockOnDelete = jest.fn()
      render(<GroceryListCard list={mockList} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: /delete list/i })
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalled()
    })

    it('has proper accessibility attributes for delete button', () => {
      const mockOnDelete = jest.fn()
      render(<GroceryListCard list={mockList} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: /delete list/i })
      expect(deleteButton).toHaveAttribute(
        'aria-label',
        'Delete list Weekly Shopping'
      )
    })

    it('shows delete button with trash icon', () => {
      const mockOnDelete = jest.fn()
      render(<GroceryListCard list={mockList} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByRole('button', { name: /delete list/i })
      const trashIcon = deleteButton.querySelector('svg')
      expect(trashIcon).toBeInTheDocument()
    })
  })

  describe('Archive/Unarchive functionality', () => {
    it('renders archive button when list is not archived and onArchive is provided', () => {
      const mockOnArchive = jest.fn()
      render(<GroceryListCard list={mockList} onArchive={mockOnArchive} />)

      const archiveButton = screen.getByRole('button', {
        name: /archive list/i,
      })
      expect(archiveButton).toBeInTheDocument()
    })

    it('does not render archive button when list is archived', () => {
      const archivedList = { ...mockList, isArchived: true }
      const mockOnArchive = jest.fn()
      render(<GroceryListCard list={archivedList} onArchive={mockOnArchive} />)

      const archiveButton = screen.queryByRole('button', {
        name: /archive list/i,
      })
      expect(archiveButton).not.toBeInTheDocument()
    })

    it('renders unarchive button when list is archived and onUnarchive is provided', () => {
      const archivedList = { ...mockList, isArchived: true }
      const mockOnUnarchive = jest.fn()
      render(
        <GroceryListCard list={archivedList} onUnarchive={mockOnUnarchive} />
      )

      const unarchiveButton = screen.getByRole('button', {
        name: /unarchive list/i,
      })
      expect(unarchiveButton).toBeInTheDocument()
    })

    it('shows Archived badge when list is archived', () => {
      const archivedList = { ...mockList, isArchived: true }
      render(<GroceryListCard list={archivedList} />)

      expect(screen.getByText('Archived')).toBeInTheDocument()
    })

    it('calls onArchive with list id when archive button is clicked', () => {
      const mockOnArchive = jest.fn()
      render(<GroceryListCard list={mockList} onArchive={mockOnArchive} />)

      const archiveButton = screen.getByRole('button', {
        name: /archive list/i,
      })
      fireEvent.click(archiveButton)

      expect(mockOnArchive).toHaveBeenCalledWith('1')
    })

    it('calls onUnarchive with list id when unarchive button is clicked', () => {
      const archivedList = { ...mockList, isArchived: true }
      const mockOnUnarchive = jest.fn()
      render(
        <GroceryListCard list={archivedList} onUnarchive={mockOnUnarchive} />
      )

      const unarchiveButton = screen.getByRole('button', {
        name: /unarchive list/i,
      })
      fireEvent.click(unarchiveButton)

      expect(mockOnUnarchive).toHaveBeenCalledWith('1')
    })

    it('prevents navigation when archive button is clicked', () => {
      const mockOnArchive = jest.fn()
      render(<GroceryListCard list={mockList} onArchive={mockOnArchive} />)

      const archiveButton = screen.getByRole('button', {
        name: /archive list/i,
      })
      fireEvent.click(archiveButton)

      expect(mockOnArchive).toHaveBeenCalled()
    })

    it('has proper accessibility attributes for archive button', () => {
      const mockOnArchive = jest.fn()
      render(<GroceryListCard list={mockList} onArchive={mockOnArchive} />)

      const archiveButton = screen.getByRole('button', {
        name: /archive list/i,
      })
      expect(archiveButton).toHaveAttribute(
        'aria-label',
        'Archive list Weekly Shopping'
      )
    })

    it('has proper accessibility attributes for unarchive button', () => {
      const archivedList = { ...mockList, isArchived: true }
      const mockOnUnarchive = jest.fn()
      render(
        <GroceryListCard list={archivedList} onUnarchive={mockOnUnarchive} />
      )

      const unarchiveButton = screen.getByRole('button', {
        name: /unarchive list/i,
      })
      expect(unarchiveButton).toHaveAttribute(
        'aria-label',
        'Unarchive list Weekly Shopping'
      )
    })
  })
})
