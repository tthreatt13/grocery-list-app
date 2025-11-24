'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Meal, MealType } from '@/lib/types'
import WeeklyCalendar, {
  WeeklyCalendarRef,
} from '@/components/meal-planner/WeeklyCalendar'
import MobileWeeklyCalendar, {
  MobileWeeklyCalendarRef,
} from '@/components/meal-planner/MobileWeeklyCalendar'
import AddMealModal from '@/components/meal-planner/AddMealModal'
import GenerateGroceryListFromMealsModal from '@/components/meal-planner/GenerateGroceryListFromMealsModal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import {
  getWeeklyMeals,
  createMeal,
  updateMeal,
  deleteMeal as deleteMealAPI,
  formatDateForAPI,
  generateGroceryList,
  MealResponse,
} from '@/lib/api/meals'
import { getHouseholds, HouseholdResponse } from '@/lib/api/household'
import { syncUser } from '@/lib/api/client'
import {
  getGroceryLists,
  addGroceryItem,
  GroceryListResponse,
} from '@/lib/api/grocery'

// Helper to convert API response to Meal type
function convertMealResponse(meal: MealResponse): Meal {
  // Calculate the actual date by adding day_of_week to week_start_date
  // Backend: day_of_week 0=Monday, 1=Tuesday, ..., 6=Sunday
  // Parse date string in local timezone to avoid UTC conversion issues
  const [year, month, day] = meal.week_start_date.split('-').map(Number)
  const weekStart = new Date(year, month - 1, day) // month is 0-indexed in JS
  const mealDate = new Date(weekStart)
  mealDate.setDate(weekStart.getDate() + meal.day_of_week)

  return {
    id: meal.id.toString(),
    name: meal.name,
    mealType: (meal.meal_type.charAt(0).toUpperCase() +
      meal.meal_type.slice(1)) as MealType,
    date: mealDate,
    ingredients: meal.ingredients
      ? meal.ingredients.split(',').map((i) => i.trim())
      : [],
    notes: meal.notes,
    createdBy: 'User',
  }
}

export default function MealPlannerPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [households, setHouseholds] = useState<HouseholdResponse[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userSynced, setUserSynced] = useState(false)

  // State for the current week's start date
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Convert to Monday-based week (0=Monday, 6=Sunday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday) // Start on Monday
    // Normalize to start of day (midnight) to avoid time comparison issues
    startDate.setHours(0, 0, 0, 0)
    return startDate
  })

  // State for meals
  const [meals, setMeals] = useState<Meal[]>([])

  // State for add/edit meal modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    MealType.DINNER
  )
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  // State for meal details modal
  const [isMealDetailsOpen, setIsMealDetailsOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)

  // State for generate grocery list modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [groceryLists, setGroceryLists] = useState<GroceryListResponse[]>([])
  const [isCreatingList, setIsCreatingList] = useState(false)

  // Refs for calendar components to trigger scroll
  const desktopCalendarRef = useRef<WeeklyCalendarRef>(null)
  const mobileCalendarRef = useRef<MobileWeeklyCalendarRef>(null)

  // Sync user to backend on mount
  useEffect(() => {
    async function syncUserToBackend() {
      if (!user) return

      try {
        const email = user.primaryEmailAddress?.emailAddress
        const name =
          user.fullName ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim()

        if (!email) {
          console.error('No email found for user')
          return
        }

        await syncUser({
          clerk_user_id: user.id,
          email: email,
          name: name || undefined,
        })

        setUserSynced(true)
      } catch (err) {
        console.error('Error syncing user:', err)
        // Don't set error here, just log it
      }
    }

    syncUserToBackend()
  }, [user])

  // Fetch households after user is synced
  useEffect(() => {
    async function fetchHouseholds() {
      if (!userSynced) return

      try {
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          setIsLoading(false)
          return
        }

        const householdsData = await getHouseholds(token)
        setHouseholds(householdsData)

        if (householdsData.length > 0) {
          setSelectedHouseholdId(householdsData[0].id)
        }
      } catch (err) {
        console.error('Error fetching households:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load households'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholds()
  }, [getToken, userSynced])

  // Fetch meals when household or week changes
  useEffect(() => {
    async function fetchMeals() {
      if (!selectedHouseholdId) return

      try {
        setError(null)
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          return
        }

        // currentWeekStart is now Monday-based, matching the backend
        const weekDate = formatDateForAPI(currentWeekStart)
        const response = await getWeeklyMeals(
          weekDate,
          selectedHouseholdId,
          token
        )

        const convertedMeals = response.meals.map(convertMealResponse)
        setMeals(convertedMeals)
      } catch (err) {
        console.error('Error fetching meals:', err)
        setError(err instanceof Error ? err.message : 'Failed to load meals')
      }
    }

    fetchMeals()
  }, [selectedHouseholdId, currentWeekStart, getToken])

  // Fetch grocery lists when household changes
  useEffect(() => {
    async function fetchGroceryLists() {
      if (!selectedHouseholdId) return

      try {
        const token = await getToken()
        if (!token) return

        const lists = await getGroceryLists(token)
        setGroceryLists(lists)
      } catch (err) {
        console.error('Error fetching grocery lists:', err)
      }
    }

    fetchGroceryLists()
  }, [selectedHouseholdId, getToken])

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

  // Jump to current week and scroll to today
  const handleToday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Convert to Monday-based week (0=Monday, 6=Sunday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday) // Start on Monday
    setCurrentWeekStart(startDate)

    // Scroll to today's date after a brief delay to allow the calendar to update
    setTimeout(() => {
      desktopCalendarRef.current?.scrollToToday()
      mobileCalendarRef.current?.scrollToToday()
    }, 100)
  }

  // Handle clicking on empty slot
  const handleEmptySlotClick = (date: Date, mealType: MealType) => {
    setEditingMeal(null) // Clear any editing state
    setSelectedDate(date)
    setSelectedMealType(mealType)
    setIsAddModalOpen(true)
  }

  // Handle adding or updating a meal
  const handleAddMeal = async (mealData: {
    name: string
    notes?: string
    ingredients?: string
  }) => {
    if (!selectedHouseholdId) {
      throw new Error('No household selected')
    }

    const token = await getToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    // If editing an existing meal
    if (editingMeal) {
      const updatedMealResponse = await updateMeal(
        parseInt(editingMeal.id),
        {
          name: mealData.name,
          notes: mealData.notes || '',
          ingredients: mealData.ingredients || '',
        },
        token
      )

      const convertedMeal = convertMealResponse(updatedMealResponse)
      setMeals(meals.map((m) => (m.id === editingMeal.id ? convertedMeal : m)))
      setEditingMeal(null)
    } else {
      // Creating a new meal
      // Calculate day of week (0=Monday in backend)
      const dayOfWeek =
        selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1

      // currentWeekStart is now Monday-based, matching the backend
      const newMealResponse = await createMeal(
        {
          household_id: selectedHouseholdId,
          name: mealData.name,
          meal_type: selectedMealType.toLowerCase() as
            | 'breakfast'
            | 'lunch'
            | 'dinner'
            | 'snack',
          day_of_week: dayOfWeek,
          week_start_date: formatDateForAPI(currentWeekStart),
          notes: mealData.notes,
          ingredients: mealData.ingredients || '',
        },
        token
      )

      const convertedMeal = convertMealResponse(newMealResponse)
      setMeals([...meals, convertedMeal])
    }
  }

  // Handle meal click - opens edit modal directly (both mobile and desktop)
  const handleMealClick = (meal: Meal) => {
    setEditingMeal(meal)
    setSelectedDate(new Date(meal.date))
    setSelectedMealType(meal.mealType)
    setIsAddModalOpen(true)
  }

  // Handle meal edit
  const handleMealEdit = (meal: Meal) => {
    setEditingMeal(meal)
    setSelectedDate(new Date(meal.date))
    setSelectedMealType(meal.mealType)
    setIsAddModalOpen(true)
  }

  // Handle meal delete
  const handleMealDelete = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return

    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await deleteMealAPI(parseInt(mealId), token)
      setMeals(meals.filter((m) => m.id !== mealId))
    } catch (err) {
      console.error('Error deleting meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete meal')
    }
  }

  // Generate grocery list from week's meals
  const handleGenerateGroceryList = () => {
    setIsGenerateModalOpen(true)
  }

  // Get ingredients from current week's meals with meal type information
  const getCurrentWeekIngredients = () => {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.date)
      // Normalize meal date to start of day for comparison
      mealDate.setHours(0, 0, 0, 0)
      return mealDate >= currentWeekStart && mealDate < weekEnd
    })

    // Return empty array if no meals found for the week
    if (weekMeals.length === 0) {
      return []
    }

    // Filter to only meals that have ingredients
    const mealsWithIngredients = weekMeals.filter(
      (meal) => meal.ingredients && meal.ingredients.length > 0
    )
    if (mealsWithIngredients.length === 0) {
      return []
    }

    const ingredientsWithMealType = weekMeals
      .flatMap((meal) =>
        (meal.ingredients || []).map((ingredient) => ({
          ingredient,
          mealType: meal.mealType.toLowerCase(),
        }))
      )
      // Remove duplicates by ingredient name (keep first occurrence)
      .filter(
        (item, index, self) =>
          self.findIndex((other) => other.ingredient === item.ingredient) ===
          index
      )

    return ingredientsWithMealType
  }

  // Handle creating new grocery list from meal ingredients
  const handleCreateGroceryList = async (data: {
    listName: string
    ingredients: { ingredient: string; mealType: string }[]
  }) => {
    if (!selectedHouseholdId) return

    try {
      setIsCreatingList(true)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Use the backend API to generate grocery list from meals with meal type preservation
      const weekStartDate = formatDateForAPI(currentWeekStart)
      const result = await generateGroceryList(
        {
          week_start_date: weekStartDate,
          household_id: selectedHouseholdId,
          grocery_list_name: data.listName,
        },
        token
      )

      // Refresh grocery lists
      const lists = await getGroceryLists(token)
      setGroceryLists(lists)

      // Close modal
      setIsGenerateModalOpen(false)
      setIsCreatingList(false)

      // Show success message
      alert(`${result.message}`)
    } catch (err) {
      console.error('Error creating grocery list:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create grocery list'
      )
      setIsCreatingList(false)
    }
  }

  // Handle adding ingredients to existing grocery list
  const handleAddToGroceryList = async (data: {
    listId: number
    ingredients: { ingredient: string; mealType: string }[]
  }) => {
    if (!data.ingredients || data.ingredients.length === 0) {
      setError('No ingredients selected to add')
      return
    }

    try {
      setIsCreatingList(true)
      setError(null) // Clear any previous errors

      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Add each ingredient as an item with meal type information
      let successCount = 0
      for (const item of data.ingredients) {
        try {
          await addGroceryItem(
            data.listId,
            {
              name: item.ingredient,
              meal_type: item.mealType,
              checked: false,
            },
            token
          )
          successCount++
        } catch (itemError) {
          console.error(
            `Failed to add ingredient "${item.ingredient}":`,
            itemError
          )
          // Continue with other ingredients
        }
      }

      // Close modal
      setIsGenerateModalOpen(false)
      setIsCreatingList(false)

      // Show success message
      if (successCount > 0) {
        alert(
          `Successfully added ${successCount} of ${data.ingredients.length} ingredients to grocery list!`
        )
      } else {
        setError('Failed to add any ingredients to the grocery list')
      }
    } catch (err) {
      console.error('Error adding to grocery list:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to add to grocery list'
      )
      setIsCreatingList(false)
    }
  }

  // Get date range for current week
  const getWeekRange = () => {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal planner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* No household message */}
        {households.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Household Found
            </h3>
            <p className="text-gray-600 mb-4">
              Create or join a household to start planning meals
            </p>
            <Button onClick={() => (window.location.href = '/household')}>
              Go to Household
            </Button>
          </div>
        )}

        {/* Header - Desktop */}
        {households.length > 0 && (
          <div className="hidden md:block mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meal Planner
            </h1>
            <p className="text-gray-600">
              Plan your meals for the week and generate grocery lists
            </p>
          </div>
        )}

        {/* Header - Mobile */}
        {households.length > 0 && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900">Meal Planner</h1>
          </div>
        )}

        {/* Week Navigation - Desktop */}
        {households.length > 0 && (
          <div className="hidden md:flex bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 w-full">
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
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getWeekRange()}
                  </h2>
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
        )}

        {/* Week Navigation - Mobile (Compact) */}
        {households.length > 0 && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors"
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

              <div className="text-center flex-1">
                <h2 className="text-base font-semibold text-gray-900">
                  {getWeekRange()}
                </h2>
              </div>

              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors"
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
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="flex-shrink-0"
              >
                Today
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateGroceryList}
                className="flex-1 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
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
                Generate List
              </Button>
            </div>
          </div>
        )}

        {/* Weekly Calendar - Desktop View */}
        {households.length > 0 && (
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <WeeklyCalendar
              ref={desktopCalendarRef}
              startDate={currentWeekStart}
              meals={meals}
              onMealClick={handleMealClick}
              onEmptySlotClick={handleEmptySlotClick}
              onMealEdit={handleMealEdit}
              onMealDelete={handleMealDelete}
            />
          </div>
        )}

        {/* Mobile Weekly Calendar - Mobile View */}
        {households.length > 0 && (
          <div className="md:hidden px-4 pb-20">
            <MobileWeeklyCalendar
              ref={mobileCalendarRef}
              startDate={currentWeekStart}
              meals={meals}
              onEmptySlotClick={handleEmptySlotClick}
              onMealClick={handleMealClick}
            />
          </div>
        )}

        {/* Quick Stats - Desktop Only */}
        {households.length > 0 && (
          <div className="hidden md:grid mt-6 grid-cols-1 md:grid-cols-3 gap-4">
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
                        .filter(
                          (ingredient, index, self) =>
                            self.indexOf(ingredient) === index
                        ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Meal Modal */}
      <AddMealModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingMeal(null)
        }}
        onAdd={handleAddMeal}
        onDelete={handleMealDelete}
        mealType={selectedMealType}
        date={selectedDate}
        meal={editingMeal}
      />

      {/* Generate Grocery List Modal */}
      <GenerateGroceryListFromMealsModal
        open={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        ingredients={getCurrentWeekIngredients()}
        onCreateList={handleCreateGroceryList}
        onAddToList={handleAddToGroceryList}
        existingLists={groceryLists}
        isCreating={isCreatingList}
      />
    </div>
  )
}
