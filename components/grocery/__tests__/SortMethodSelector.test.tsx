import { render, screen, fireEvent } from '@testing-library/react'
import SortMethodSelector from '../SortMethodSelector'
import { SortMethod } from '@/lib/types'

describe('SortMethodSelector', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with correct label', () => {
    render(
      <SortMethodSelector
        value={SortMethod.ENTRY_ORDER}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Sort by')).toBeInTheDocument()
  })

  it('displays all sort method options', () => {
    render(
      <SortMethodSelector
        value={SortMethod.ENTRY_ORDER}
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.click(select)

    expect(screen.getByText('Entry Order')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Meal Time')).toBeInTheDocument()
  })

  it('shows current value as selected', () => {
    render(
      <SortMethodSelector
        value={SortMethod.CATEGORY}
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe(SortMethod.CATEGORY)
  })

  it('calls onChange when selection changes', () => {
    render(
      <SortMethodSelector
        value={SortMethod.ENTRY_ORDER}
        onChange={mockOnChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: SortMethod.MEAL_TIME } })

    expect(mockOnChange).toHaveBeenCalledWith(SortMethod.MEAL_TIME)
  })

  it('applies custom className', () => {
    const { container } = render(
      <SortMethodSelector
        value={SortMethod.ENTRY_ORDER}
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles all sort method values correctly', () => {
    const sortMethods = [SortMethod.ENTRY_ORDER, SortMethod.CATEGORY, SortMethod.MEAL_TIME]

    sortMethods.forEach((sortMethod) => {
      const { unmount } = render(
        <SortMethodSelector
          value={sortMethod}
          onChange={mockOnChange}
        />
      )

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe(sortMethod)

      unmount()
    })
  })
})
