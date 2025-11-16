import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GenerateGroceryListModal from '../GenerateGroceryListModal'
import { PantryItem, ItemCategory } from '@/lib/types'
import { GroceryListResponse } from '@/lib/api/grocery'

// Mock the Modal component
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, onClose, title, children }: any) => {
    if (!open) return null
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    )
  },
}))

describe('GenerateGroceryListModal', () => {
  const mockLowStockItems: PantryItem[] = [
    {
      id: '1',
      name: 'Milk',
      quantity: 0.5,
      unit: 'gallon',
      category: ItemCategory.DAIRY,
      lowStockThreshold: 1,
      addedAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Eggs',
      quantity: 3,
      unit: 'count',
      category: ItemCategory.DAIRY,
      lowStockThreshold: 6,
      addedAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Bread',
      quantity: 0,
      unit: 'loaf',
      category: ItemCategory.BAKERY,
      lowStockThreshold: 1,
      addedAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockExistingLists: GroceryListResponse[] = [
    {
      id: 1,
      household_id: 1,
      name: 'Weekly Shopping',
      created_by: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      household_id: 1,
      name: 'Party Supplies',
      created_by: 1,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockOnClose = jest.fn()
  const mockOnCreateList = jest.fn()
  const mockOnAddToList = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when open is false', () => {
    render(
      <GenerateGroceryListModal
        open={false}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should render when open is true', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Generate Grocery List')
  })

  it('should display all low stock items', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('should show quantities and units for items', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.getByText(/0\.5 gallon/)).toBeInTheDocument()
    expect(screen.getByText(/3 count/)).toBeInTheDocument()
  })

  it('should show empty state when no low stock items', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={[]}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.getByText(/no low stock items/i)).toBeInTheDocument()
  })

  it('should allow users to select/deselect items', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)

    // All should be checked by default
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })

    // Uncheck first item
    fireEvent.click(checkboxes[0])
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('should have a list name input field', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const listNameInput = screen.getByLabelText(/list name/i)
    expect(listNameInput).toBeInTheDocument()
    expect(listNameInput).toHaveValue('Weekly Shopping List')
  })

  it('should allow editing the list name', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const listNameInput = screen.getByLabelText(/list name/i) as HTMLInputElement
    fireEvent.change(listNameInput, { target: { value: 'My Custom List' } })
    expect(listNameInput.value).toBe('My Custom List')
  })

  it('should call onCreateList with selected items when create button is clicked', async () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const createButton = screen.getByRole('button', { name: /create grocery list/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockOnCreateList).toHaveBeenCalledWith({
        listName: 'Weekly Shopping List',
        items: mockLowStockItems,
      })
    })
  })

  it('should call onCreateList with only selected items', async () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    // Uncheck the second item (Eggs)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])

    const createButton = screen.getByRole('button', { name: /create grocery list/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockOnCreateList).toHaveBeenCalledWith({
        listName: 'Weekly Shopping List',
        items: [mockLowStockItems[0], mockLowStockItems[2]], // Only Milk and Bread
      })
    })
  })

  it('should disable create button when no items are selected', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    // Uncheck all items
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => fireEvent.click(checkbox))

    const createButton = screen.getByRole('button', { name: /create grocery list/i })
    expect(createButton).toBeDisabled()
  })

  it('should disable create button when list name is empty', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const listNameInput = screen.getByLabelText(/list name/i) as HTMLInputElement
    fireEvent.change(listNameInput, { target: { value: '' } })

    const createButton = screen.getByRole('button', { name: /create grocery list/i })
    expect(createButton).toBeDisabled()
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should display loading state when creating list', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
        isCreating={true}
      />
    )

    const createButton = screen.getByRole('button', { name: /creating/i })
    expect(createButton).toBeDisabled()
  })

  it('should show count of selected items', () => {
    render(
      <GenerateGroceryListModal
        open={true}
        onClose={mockOnClose}
        lowStockItems={mockLowStockItems}
        onCreateList={mockOnCreateList}
      />
    )

    expect(screen.getByText(/3 items selected/i)).toBeInTheDocument()

    // Uncheck one item
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    expect(screen.getByText(/2 items selected/i)).toBeInTheDocument()
  })

  // Tests for existing list functionality
  describe('Adding to Existing Lists', () => {
    it('should display option to choose between create new or add to existing', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      expect(screen.getByLabelText(/create new list/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/add to existing list/i)).toBeInTheDocument()
    })

    it('should default to "create new" option', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      const createNewRadio = screen.getByLabelText(/create new list/i) as HTMLInputElement
      expect(createNewRadio).toBeChecked()
    })

    it('should show list name input when "create new" is selected', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      expect(screen.getByLabelText(/list name/i)).toBeInTheDocument()
    })

    it('should show dropdown of existing lists when "add to existing" is selected', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      expect(screen.getByLabelText(/select list/i)).toBeInTheDocument()
      expect(screen.getByText('Weekly Shopping')).toBeInTheDocument()
      expect(screen.getByText('Party Supplies')).toBeInTheDocument()
    })

    it('should not show list name input when "add to existing" is selected', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      expect(screen.queryByLabelText(/list name/i)).not.toBeInTheDocument()
    })

    it('should call onAddToList when adding to existing list', async () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      // Switch to "add to existing"
      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      // Select a list
      const selectList = screen.getByLabelText(/select list/i)
      fireEvent.change(selectList, { target: { value: '1' } })

      // Click add button
      const addButton = screen.getByRole('button', { name: /add to list/i })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnAddToList).toHaveBeenCalledWith({
          listId: 1,
          items: mockLowStockItems,
        })
      })
    })

    it('should call onCreateList when creating new list', async () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      // "Create new" is default, just click create
      const createButton = screen.getByRole('button', { name: /create grocery list/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(mockOnCreateList).toHaveBeenCalledWith({
          listName: 'Weekly Shopping List',
          items: mockLowStockItems,
        })
      })
      expect(mockOnAddToList).not.toHaveBeenCalled()
    })

    it('should disable add button when no list is selected', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      // Switch to "add to existing"
      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      // Button should be disabled when no list selected
      const addButton = screen.getByRole('button', { name: /add to list/i })
      expect(addButton).toBeDisabled()
    })

    it('should show "Create New" option when no existing lists are available', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={[]}
        />
      )

      // Should only show create new option
      expect(screen.getByLabelText(/list name/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/add to existing list/i)).not.toBeInTheDocument()
    })

    it('should change button text based on mode', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      // Default is "Create Grocery List"
      expect(screen.getByRole('button', { name: /create grocery list/i })).toBeInTheDocument()

      // Switch to add to existing
      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      // Should now be "Add to List"
      expect(screen.getByRole('button', { name: /add to list/i })).toBeInTheDocument()
    })

    it('should maintain item selections when switching between modes', () => {
      render(
        <GenerateGroceryListModal
          open={true}
          onClose={mockOnClose}
          lowStockItems={mockLowStockItems}
          onCreateList={mockOnCreateList}
          onAddToList={mockOnAddToList}
          existingLists={mockExistingLists}
        />
      )

      // Uncheck one item
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[2]) // Uncheck first item checkbox (skipping radio buttons)

      // Switch to add to existing
      const addToExistingRadio = screen.getByLabelText(/add to existing list/i)
      fireEvent.click(addToExistingRadio)

      // Switch back to create new
      const createNewRadio = screen.getByLabelText(/create new list/i)
      fireEvent.click(createNewRadio)

      // Item should still be unchecked
      const checkboxesAfter = screen.getAllByRole('checkbox')
      expect(checkboxesAfter[2]).not.toBeChecked()
    })
  })
})

