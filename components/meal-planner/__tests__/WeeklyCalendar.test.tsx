import { render, screen, fireEvent } from '@testing-library/react'
import WeeklyCalendar from '../WeeklyCalendar'
import { Meal, MealType } from '@/lib/types'

const mockMeals: Meal[] = [
  {
    id: 'm1',
    name: 'Scrambled Eggs',
    mealType: MealType.BREAKFAST,
    date: new Date('2024-11-10'),
    createdBy: 'John',
  },
  {
    id: 'm2',
    name: 'Spaghetti',
    mealType: MealType.DINNER,
    date: new Date('2024-11-10'),
    createdBy: 'Jane',
  },
]

const mockOnMealClick = jest.fn()
const mockOnEmptySlotClick = jest.fn()
const mockOnMealEdit = jest.fn()
const mockOnMealDelete = jest.fn()

describe('WeeklyCalendar', () => {
  beforeEach(() => {
    mockOnMealClick.mockClear()
    mockOnEmptySlotClick.mockClear()
    mockOnMealEdit.mockClear()
    mockOnMealDelete.mockClear()
  })

  it('renders 7 day columns', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    // Check for day headers (7 days + 1 for the meal type column)
    const dayHeaders = screen.getAllByRole('columnheader')
    expect(dayHeaders).toHaveLength(8)
  })

  it('renders 3 meal type rows (Breakfast, Lunch, Dinner)', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('displays meals in correct slots', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={mockMeals}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByText('Spaghetti')).toBeInTheDocument()
  })

  it('calls onEmptySlotClick when empty slot is clicked', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    const emptySlots = screen.getAllByRole('button', { name: /add meal/i })
    expect(emptySlots.length).toBeGreaterThan(0)

    fireEvent.click(emptySlots[0])
    expect(mockOnEmptySlotClick).toHaveBeenCalled()
  })

  it('shows add button on empty slots', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    const addButtons = screen.getAllByRole('button', { name: /add meal/i })
    // Should have 7 days × 3 meal types = 21 empty slots
    expect(addButtons.length).toBe(21)
  })

  it('highlights current day', () => {
    const today = new Date()
    render(
      <WeeklyCalendar
        startDate={today}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    // Should have a "Today" indicator or highlighted column
    const todayElement = screen.getByText('Today')
    expect(todayElement).toBeInTheDocument()
  })

  it('displays day names and dates', () => {
    render(
      <WeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onMealClick={mockOnMealClick}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealEdit={mockOnMealEdit}
        onMealDelete={mockOnMealDelete}
      />
    )

    // Should show day names (Sun, Mon, Tue, etc.)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const currentDate = new Date('2024-11-10')
    const dayOfWeek = currentDate.getDay()

    // Check that at least the first day is shown
    expect(screen.getByText(dayNames[dayOfWeek])).toBeInTheDocument()
  })
})
