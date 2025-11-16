import { render, screen, fireEvent } from '@testing-library/react'
import MobileWeeklyCalendar from '../MobileWeeklyCalendar'
import { Meal, MealType } from '@/lib/types'

const mockMeals: Meal[] = [
  {
    id: 'm1',
    name: 'Scrambled Eggs',
    mealType: MealType.BREAKFAST,
    date: new Date('2024-11-10'),
    createdBy: 'John',
    ingredients: ['eggs', 'butter', 'salt'],
    notes: 'Quick breakfast'
  },
  {
    id: 'm2',
    name: 'Spaghetti',
    mealType: MealType.DINNER,
    date: new Date('2024-11-10'),
    createdBy: 'Jane',
    ingredients: ['pasta', 'tomato sauce'],
    notes: 'Family dinner'
  },
]

const mockOnMealClick = jest.fn()
const mockOnEmptySlotClick = jest.fn()

describe('MobileWeeklyCalendar - Meal Delete Flow', () => {
  beforeEach(() => {
    mockOnMealClick.mockClear()
    mockOnEmptySlotClick.mockClear()
  })

  it('renders meals with correct information', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={mockMeals}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument()
    expect(screen.getByText('Spaghetti')).toBeInTheDocument()
    expect(screen.getByText('Quick breakfast')).toBeInTheDocument()
    expect(screen.getByText('Family dinner')).toBeInTheDocument()
  })

  it('calls onMealClick when meal is clicked', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={mockMeals}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    const mealButton = screen.getByText('Scrambled Eggs').closest('button')
    expect(mealButton).toBeInTheDocument()
    
    fireEvent.click(mealButton!)
    expect(mockOnMealClick).toHaveBeenCalledWith(mockMeals[0])
  })

  it('calls onMealClick with correct meal data', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={mockMeals}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    const spaghettiButton = screen.getByText('Spaghetti').closest('button')
    fireEvent.click(spaghettiButton!)
    
    expect(mockOnMealClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'm2',
        name: 'Spaghetti',
        mealType: MealType.DINNER,
        notes: 'Family dinner'
      })
    )
  })

  it('displays ingredient count correctly', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={mockMeals}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    expect(screen.getByText('3 ingredients')).toBeInTheDocument() // Scrambled Eggs
    expect(screen.getByText('2 ingredients')).toBeInTheDocument() // Spaghetti
  })

  it('shows empty slots for meals not planned', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]} // No meals
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    const addButtons = screen.getAllByText(/add/i)
    expect(addButtons.length).toBeGreaterThan(0)
    
    // Should have "Add breakfast", "Add lunch", "Add dinner" for each day
    expect(screen.getByText('Add breakfast')).toBeInTheDocument()
    expect(screen.getByText('Add lunch')).toBeInTheDocument()
    expect(screen.getByText('Add dinner')).toBeInTheDocument()
  })

  it('calls onEmptySlotClick when empty slot is clicked', () => {
    render(
      <MobileWeeklyCalendar
        startDate={new Date('2024-11-10')}
        meals={[]}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    const addBreakfastButton = screen.getByText('Add breakfast')
    fireEvent.click(addBreakfastButton)
    
    expect(mockOnEmptySlotClick).toHaveBeenCalledWith(
      expect.any(Date),
      MealType.BREAKFAST
    )
  })

  it('highlights today correctly', () => {
    const today = new Date()
    render(
      <MobileWeeklyCalendar
        startDate={today}
        meals={[]}
        onEmptySlotClick={mockOnEmptySlotClick}
        onMealClick={mockOnMealClick}
      />
    )
    
    // Should show "Today" indicator
    expect(screen.getByText('Today')).toBeInTheDocument()
  })
})
