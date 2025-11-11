'use client'

import { useState } from 'react'
import { Meal, MealType } from '@/lib/types'
import { mockMeals } from '@/lib/mockData'
import WeeklyCalendar from '@/components/meal-planner/WeeklyCalendar'
import AddMealModal from '@/components/meal-planner/AddMealModal'
import { Button } from '@/components/ui/Button'
import { formatDate, generateId } from '@/lib/utils'

export default function MealPlannerPage() {
  // State for the current week's start date
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek) // Start on Sunday
    return startDate
  })

  // State for meals
  const [meals, setMeals] = useState<Meal[]>(mockMeals)

  // State for add meal modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.DINNER)

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  // Navigate to next week
  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  // Jump to current week
  const handleToday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek)
    setCurrentWeekStart(startDate)
  }

  // Handle clicking on empty slot
  const handleEmptySlotClick = (date: Date, mealType: MealType) => {
    setSelectedDate(date)
    setSelectedMealType(mealType)
    setIsAddModalOpen(true)
  }

  // Handle adding a new meal
  const handleAddMeal = (mealData: { name: string; notes?: string }) => {
    const newMeal: Meal = {
      id: generateId(),
      name: mealData.name,
      mealType: selectedMealType,
      date: selectedDate,
      notes: mealData.notes,
      createdBy: 'Current User',
    }
    setMeals([...meals, newMeal])
    setIsAddModalOpen(false)
  }

  // Handle meal click (currently just logs)
  const handleMealClick = (meal: Meal) => {
    console.log('Meal clicked:', meal)
  }

  // Handle meal edit
  const handleMealEdit = (meal: Meal) => {
    // For now, just open the modal with the meal data
    // In a real app, you'd populate the form with existing data
    setSelectedDate(new Date(meal.date))
    setSelectedMealType(meal.mealType)
    setIsAddModalOpen(true)
  }

  // Handle meal delete
  const handleMealDelete = (mealId: string) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      setMeals(meals.filter((m) => m.id !== mealId))
    }
  }

  // Generate grocery list from week's meals
  const handleGenerateGroceryList = () => {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.date)
      return mealDate >= currentWeekStart && mealDate < weekEnd
    })

    const allIngredients = weekMeals
      .flatMap((meal) => meal.ingredients || [])
      .filter((ingredient, index, self) => self.indexOf(ingredient) === index)

    alert(
      `Grocery List Generated!\n\nIngredients needed:\n${
        allIngredients.length > 0
          ? allIngredients.join('\n')
          : 'No ingredients found'
      }\n\n(This would create a new grocery list in a real app)`
    )
  }

  // Get date range for current week
  const getWeekRange = () => {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planner</h1>
          <p className="text-gray-600">Plan your meals for the week and generate grocery lists</p>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Previous week"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">{getWeekRange()}</h2>
              </div>

              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Next week"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateGroceryList}
              className="flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Generate Grocery List
            </Button>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <WeeklyCalendar
            startDate={currentWeekStart}
            meals={meals}
            onMealClick={handleMealClick}
            onEmptySlotClick={handleEmptySlotClick}
            onMealEdit={handleMealEdit}
            onMealDelete={handleMealDelete}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Meals Planned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    meals.filter((m) => {
                      const date = new Date(m.date)
                      const weekEnd = new Date(currentWeekStart)
                      weekEnd.setDate(weekEnd.getDate() + 7)
                      return date >= currentWeekStart && date < weekEnd
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Empty Slots</p>
                <p className="text-2xl font-bold text-gray-900">
                  {21 -
                    meals.filter((m) => {
                      const date = new Date(m.date)
                      const weekEnd = new Date(currentWeekStart)
                      weekEnd.setDate(weekEnd.getDate() + 7)
                      return date >= currentWeekStart && date < weekEnd
                    }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Unique Ingredients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    meals
                      .filter((m) => {
                        const date = new Date(m.date)
                        const weekEnd = new Date(currentWeekStart)
                        weekEnd.setDate(weekEnd.getDate() + 7)
                        return date >= currentWeekStart && date < weekEnd
                      })
                      .flatMap((m) => m.ingredients || [])
                      .filter((ingredient, index, self) => self.indexOf(ingredient) === index)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMeal}
        mealType={selectedMealType}
        date={selectedDate}
      />
    </div>
  )
}

