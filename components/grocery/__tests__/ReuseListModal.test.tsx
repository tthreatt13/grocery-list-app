import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ReuseListModal from '../ReuseListModal'
import { GroceryList, GroceryItem, ItemCategory, MealType } from '@/lib/types'

const mockItem1: GroceryItem = {
  id: '1',
  name: 'Apples',
  quantity: 2,
  unit: 'pcs',
  category: ItemCategory.PRODUCE,
  checked: false,
  notes: 'Get red ones',
  addedAt: new Date('2024-01-01'),
}

const mockItem2: GroceryItem = {
  id: '2',
  name: 'Milk',
  quantity: 1,
  unit: 'gallon',
  category: ItemCategory.DAIRY,
  mealType: MealType.BREAKFAST,
  checked: false,
  notes: '',
  addedAt: new Date('2024-01-01'),
}

const mockItem3: GroceryItem = {
  id: '3',
  name: 'Bread',
  quantity: 1,
  unit: 'loaf',
  category: ItemCategory.BAKERY,
  mealType: MealType.LUNCH,
  checked: true,
  notes: 'Whole wheat',
  addedAt: new Date('2024-01-01'),
}

const mockPreviousList1: GroceryList = {
  id: '10',
  name: 'Previous Week List',
  items: [mockItem1, mockItem2, mockItem3],
  createdBy: '1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sharedWith: [],
  isArchived: false,
}

const mockPreviousList2: GroceryList = {
  id: '20',
  name: 'Another List',
  items: [mockItem1],
  createdBy: '1',
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
  sharedWith: [],
  isArchived: false,
}

const mockEmptyList: GroceryList = {
  id: '30',
  name: 'Empty List',
  items: [],
  createdBy: '1',
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
  sharedWith: [],
  isArchived: false,
}

const mockOnAddItems = jest.fn()
const mockOnClose = jest.fn()

describe('ReuseListModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAddItems.mockResolvedValue(undefined)
  })

  it('renders list selection dropdown', () => {
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1, mockPreviousList2]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByLabelText(/select previous list/i)).toBeInTheDocument()
  })

  it('shows "No previous lists available" when no lists', () => {
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/no previous lists available/i)).toBeInTheDocument()
  })

  it('filters out current list from available lists', () => {
    const currentList: GroceryList = {
      id: '5',
      name: 'Current List',
      items: [],
      createdBy: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      sharedWith: [],
      isArchived: false,
    }

    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[currentList, mockPreviousList1, mockPreviousList2]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(
      /select previous list/i
    ) as HTMLSelectElement
    const options = Array.from(select.options).map((opt) => opt.text)

    expect(options).not.toContain('Current List (0 items)')
    expect(options).toContain('Previous Week List (3 items)')
    expect(options).toContain('Another List (1 items)')
  })

  it('displays items when a list is selected', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
      expect(screen.getByText('Bread')).toBeInTheDocument()
    })
  })

  it('pre-selects all items when list is selected', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      // All item checkboxes should be checked (plus the select all checkbox if present)
      const itemCheckboxes = checkboxes.filter((cb) => {
        const id = cb.getAttribute('id')
        return id && id.startsWith('reuse-item-')
      })
      expect(itemCheckboxes).toHaveLength(3)
      itemCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked()
      })
    })
  })

  it('allows toggling individual checkboxes', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const appleCheckbox = checkboxes.find((cb) => {
      const id = cb.getAttribute('id')
      return id === 'reuse-item-1'
    })

    expect(appleCheckbox).toBeChecked()

    if (appleCheckbox) {
      await user.click(appleCheckbox)
      await waitFor(() => {
        expect(appleCheckbox).not.toBeChecked()
      })

      // Click again to verify it toggles back
      await user.click(appleCheckbox)
      await waitFor(() => {
        expect(appleCheckbox).toBeChecked()
      })
    }
  })

  it('allows toggling checkbox by clicking the label', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const appleCheckbox = checkboxes.find((cb) => {
      const id = cb.getAttribute('id')
      return id === 'reuse-item-1'
    })

    expect(appleCheckbox).toBeChecked()

    // Click the label instead of the checkbox
    const appleLabel = screen.getByText('Apples')
    await user.click(appleLabel)

    await waitFor(() => {
      expect(appleCheckbox).not.toBeChecked()
    })
  })

  it('shows "Select All" button when not all items are selected', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    // Uncheck one item
    const checkboxes = screen.getAllByRole('checkbox')
    const appleCheckbox = checkboxes.find((cb) => {
      const id = cb.getAttribute('id')
      return id === 'reuse-item-1'
    })

    if (appleCheckbox) {
      await user.click(appleCheckbox)
    }

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /select all/i })
      ).toBeInTheDocument()
    })
  })

  it('shows "Deselect All" button when all items are selected', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /deselect all/i })
      ).toBeInTheDocument()
    })
  })

  it('"Select All" button selects all items', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    // Uncheck all items first
    const checkboxes = screen.getAllByRole('checkbox')
    const itemCheckboxes = checkboxes.filter((cb) => {
      const id = cb.getAttribute('id')
      return id && id.startsWith('reuse-item-')
    })

    for (const checkbox of itemCheckboxes) {
      if (checkbox instanceof HTMLInputElement && checkbox.checked) {
        await user.click(checkbox)
      }
    }

    // Click Select All
    const selectAllButton = screen.getByRole('button', { name: /select all/i })
    await user.click(selectAllButton)

    await waitFor(() => {
      itemCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked()
      })
    })
  })

  it('"Deselect All" button deselects all items', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    // Click Deselect All
    const deselectAllButton = screen.getByRole('button', {
      name: /deselect all/i,
    })
    await user.click(deselectAllButton)

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      const itemCheckboxes = checkboxes.filter((cb) => {
        const id = cb.getAttribute('id')
        return id && id.startsWith('reuse-item-')
      })
      itemCheckboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })
    })
  })

  it('shows correct count of selected items', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText(/3 of 3 selected/i)).toBeInTheDocument()
    })

    // Uncheck one item
    const checkboxes = screen.getAllByRole('checkbox')
    const appleCheckbox = checkboxes.find((cb) => {
      const id = cb.getAttribute('id')
      return id === 'reuse-item-1'
    })

    if (appleCheckbox) {
      await user.click(appleCheckbox)
    }

    await waitFor(() => {
      expect(screen.getByText(/2 of 3 selected/i)).toBeInTheDocument()
    })
  })

  it('disables "Add Selected Items" when no items selected', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    // Deselect all items
    const deselectAllButton = screen.getByRole('button', {
      name: /deselect all/i,
    })
    await user.click(deselectAllButton)

    await waitFor(() => {
      const addButton = screen.getByRole('button', {
        name: /add selected items/i,
      })
      expect(addButton).toBeDisabled()
    })
  })

  it('calls onAddItems with selected items when submitted', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    // Uncheck one item (only add 2 items)
    const checkboxes = screen.getAllByRole('checkbox')
    const appleCheckbox = checkboxes.find((cb) => {
      const id = cb.getAttribute('id')
      return id === 'reuse-item-1'
    })

    if (appleCheckbox) {
      await user.click(appleCheckbox)
    }

    // Click Add Selected Items
    const addButton = screen.getByRole('button', {
      name: /add selected items/i,
    })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockOnAddItems).toHaveBeenCalledTimes(1)
      expect(mockOnAddItems).toHaveBeenCalledWith([mockItem2, mockItem3])
    })
  })

  it('handles errors during item addition', async () => {
    const errorMessage = 'Failed to add items'
    mockOnAddItems.mockRejectedValueOnce(new Error(errorMessage))

    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', {
      name: /add selected items/i,
    })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Modal should not close on error
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('resets state when modal closes after successful add', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', {
      name: /add selected items/i,
    })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockOnAddItems).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })

    // Re-render with same list selected - should be reset
    rerender(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    // List selection should be reset
    const selectAfter = screen.getByLabelText(
      /select previous list/i
    ) as HTMLSelectElement
    expect(selectAfter.value).toBe('')
  })

  it('shows loading state during item addition', async () => {
    let resolveAddItems: () => void
    const addItemsPromise = new Promise<void>((resolve) => {
      resolveAddItems = resolve
    })
    mockOnAddItems.mockReturnValueOnce(addItemsPromise)

    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', {
      name: /add selected items/i,
    })
    await user.click(addButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /adding items/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /adding items/i })
      ).toBeDisabled()
    })

    // Resolve the promise
    resolveAddItems!()

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows message when selected list has no items', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockEmptyList]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '30')

    await waitFor(() => {
      expect(screen.getByText(/this list has no items/i)).toBeInTheDocument()
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('displays item details correctly', async () => {
    const user = userEvent.setup()
    render(
      <ReuseListModal
        currentListId="5"
        availableLists={[mockPreviousList1]}
        onAddItems={mockOnAddItems}
        onClose={mockOnClose}
      />
    )

    const select = screen.getByLabelText(/select previous list/i)
    await user.selectOptions(select, '10')

    await waitFor(() => {
      // Check item names
      expect(screen.getByText('Apples')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
      expect(screen.getByText('Bread')).toBeInTheDocument()

      // Check quantities
      expect(screen.getByText('2 pcs')).toBeInTheDocument()
      expect(screen.getByText('1 gallon')).toBeInTheDocument()
      expect(screen.getByText('1 loaf')).toBeInTheDocument()

      // Check notes
      expect(screen.getByText('Get red ones')).toBeInTheDocument()
      expect(screen.getByText('Whole wheat')).toBeInTheDocument()

      // Check categories
      expect(screen.getByText('Produce')).toBeInTheDocument()
      expect(screen.getByText('Dairy')).toBeInTheDocument()
      expect(screen.getByText('Bakery')).toBeInTheDocument()
    })
  })
})
