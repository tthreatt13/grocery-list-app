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
import AIMealPlanningAssistant from '@/components/meal-planner/AIMealPlanningAssistant'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
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
import { MealSuggestion } from '@/lib/types'
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
  mealDate.setHours(0, 0, 0, 0) // Normalize to midnight for consistent date comparison

  return {
    id: meal.id.toString(),
    name: meal.name || undefined,
    mealType: (meal.meal_type.charAt(0).toUpperCase() +
      meal.meal_type.slice(1)) as MealType,
    date: mealDate,
    ingredients: meal.ingredients
      ? meal.ingredients.split(',').map((i) => i.trim())
      : [],
    notes: meal.notes,
    createdBy: 'User',
    mealCategory: meal.meal_category || 'normal',
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [userSynced, setUserSynced] = useState(false)

  // State for the current week's start date (initialized client-side only to avoid hydration mismatch)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null)

  // State for meals
  const [meals, setMeals] = useState<Meal[]>([])

  // State for add/edit meal modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    MealType.DINNER
  )
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  // State for generate grocery list modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [groceryLists, setGroceryLists] = useState<GroceryListResponse[]>([])
  const [isCreatingList, setIsCreatingList] = useState(false)

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [mealToDelete, setMealToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for AI assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isApplyingAIMeals, setIsApplyingAIMeals] = useState(false)

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

  // Initialize dates client-side only to avoid hydration mismatch
  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Convert to Monday-based week (0=Monday, 6=Sunday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysSinceMonday) // Start on Monday
    // Normalize to start of day (midnight) to avoid time comparison issues
    startDate.setHours(0, 0, 0, 0)
    setCurrentWeekStart(startDate)
    setSelectedDate(new Date())
  }, [])

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
      if (!selectedHouseholdId || !currentWeekStart) return

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

  // Show loading state while dates are being initialized
  if (!currentWeekStart || !selectedDate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal planner...</p>
        </div>
      </div>
    )
  }

  // Navigate to previous week
  const handlePreviousWeek = () => {
    if (!currentWeekStart) return
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  // Navigate to next week
  const handleNextWeek = () => {
    if (!currentWeekStart) return
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
    name?: string
    notes?: string
    ingredients?: string
    mealCategory?: 'normal' | 'quick_meal' | 'eat_out'
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
          name: mealData.name || undefined,
          notes: mealData.notes || '',
          ingredients: mealData.ingredients || '',
          meal_category: mealData.mealCategory || 'normal',
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
          name: mealData.name || undefined,
          meal_type: selectedMealType.toLowerCase() as
            | 'breakfast'
            | 'lunch'
            | 'dinner'
            | 'snack',
          day_of_week: dayOfWeek,
          week_start_date: formatDateForAPI(currentWeekStart),
          notes: mealData.notes,
          ingredients: mealData.ingredients || '',
          meal_category: mealData.mealCategory || 'normal',
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

  // Handle meal delete - show confirmation modal
  const handleMealDelete = async (mealId: string): Promise<void> => {
    setMealToDelete(mealId)
    setIsDeleteModalOpen(true)
    // Return resolved promise to satisfy AddMealModal's interface
    return Promise.resolve()
  }

  // Handle meal delete directly - show confirmation modal (for calendar view)
  const handleMealDeleteDirect = (mealId: string) => {
    setMealToDelete(mealId)
    setIsDeleteModalOpen(true)
  }

  // Handle confirmed delete - performs actual deletion
  const handleConfirmDelete = async () => {
    if (!mealToDelete) return

    try {
      setIsDeleting(true)
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      await deleteMealAPI(parseInt(mealToDelete), token)
      setMeals(meals.filter((m) => m.id !== mealToDelete))

      // Clear editing state and close modals if this meal was being edited
      if (editingMeal?.id === mealToDelete) {
        setEditingMeal(null)
        setIsAddModalOpen(false)
      }

      // Close delete confirmation modal
      setIsDeleteModalOpen(false)
      setMealToDelete(null)

      // Show success message
      setSuccessMessage('Meal deleted successfully')
      setError(null)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal')
      setSuccessMessage(null)
      // Close delete confirmation modal on error so user can see the error message
      setIsDeleteModalOpen(false)
      setMealToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle cancel delete - close modal without deleting
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setMealToDelete(null)
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

    // Filter out "eat_out" meals - they don't need ingredients
    const mealsForGroceryList = weekMeals.filter(
      (meal) => meal.mealCategory !== 'eat_out'
    )

    // Filter to only meals that have ingredients
    const mealsWithIngredients = mealsForGroceryList.filter(
      (meal) => meal.ingredients && meal.ingredients.length > 0
    )
    if (mealsWithIngredients.length === 0) {
      return []
    }

    const ingredientsWithMealType = mealsWithIngredients
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
      // Ensure currentWeekStart is valid before formatting
      if (!currentWeekStart || isNaN(currentWeekStart.getTime())) {
        throw new Error('Invalid week start date')
      }
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

  // Handle applying meals from AI assistant
  const handleAIMealsApplied = async (suggestions: MealSuggestion[]) => {
    if (!selectedHouseholdId) {
      setError('No household selected')
      return
    }

    if (!currentWeekStart) {
      setError('Week start date is not set. Please refresh the page.')
      console.error('handleAIMealsApplied: currentWeekStart is null')
      return
    }

    try {
      setIsApplyingAIMeals(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      console.warn('handleAIMealsApplied: Starting meal creation', {
        suggestionsCount: suggestions.length,
        selectedHouseholdId,
        currentWeekStart: currentWeekStart.toISOString(),
        weekStartDateFormatted: formatDateForAPI(currentWeekStart),
      })

      // Create meals from suggestions
      // Note: suggestion.day_of_week is already in backend format (0=Monday, 6=Sunday)
      const createdMeals: Meal[] = []
      const failedMeals: Array<{ mealName: string; error: string }> = []

      for (const suggestion of suggestions) {
        try {
          // Handle ingredients: check for null/undefined, handle empty arrays, format as comma-separated string
          const ingredientsString =
            suggestion.ingredients && suggestion.ingredients.length > 0
              ? suggestion.ingredients.join(', ')
              : ''

          const weekStartDateFormatted = formatDateForAPI(currentWeekStart)
          console.warn('handleAIMealsApplied: Creating meal', {
            mealName: suggestion.meal_name,
            mealType: suggestion.meal_type,
            dayOfWeek: suggestion.day_of_week,
            weekStartDate: weekStartDateFormatted,
            ingredientsCount: suggestion.ingredients?.length || 0,
          })

          const newMealResponse = await createMeal(
            {
              household_id: selectedHouseholdId,
              name: suggestion.meal_name,
              meal_type: suggestion.meal_type,
              day_of_week: suggestion.day_of_week,
              week_start_date: weekStartDateFormatted,
              notes: suggestion.notes,
              ingredients: ingredientsString,
              meal_category: 'normal',
            },
            token
          )
          const convertedMeal = convertMealResponse(newMealResponse)
          createdMeals.push(convertedMeal)
          console.warn('handleAIMealsApplied: Meal created successfully', {
            mealId: newMealResponse.id,
            mealName: suggestion.meal_name,
            convertedMealDate: convertedMeal.date.toISOString(),
          })
        } catch (err) {
          // Collect error information for each failed meal
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Unknown error occurred while creating meal'
          const mealName = suggestion.meal_name || 'Unnamed meal'

          // Log error with full context
          console.error(`Failed to create meal "${mealName}":`, {
            error: err,
            mealName: suggestion.meal_name,
            mealType: suggestion.meal_type,
            dayOfWeek: suggestion.day_of_week,
            errorMessage,
          })

          // Store failed meal information
          failedMeals.push({
            mealName,
            error: errorMessage,
          })

          // Continue with other meals
        }
      }

      // Refetch meals from API to ensure UI consistency
      if (createdMeals.length > 0) {
        try {
          // Small delay to ensure backend has committed the meals
          await new Promise((resolve) => setTimeout(resolve, 100))

          const weekDate = formatDateForAPI(currentWeekStart)
          const createdMealIds = new Set(
            createdMeals.map((m) => parseInt(m.id))
          )

          console.warn('handleAIMealsApplied: Refetching meals', {
            weekDate,
            selectedHouseholdId,
            createdMealsCount: createdMeals.length,
            createdMealIds: Array.from(createdMealIds),
          })

          const response = await getWeeklyMeals(
            weekDate,
            selectedHouseholdId,
            token
          )
          console.warn('handleAIMealsApplied: Meals refetched', {
            mealsCount: response.meals.length,
            mealIds: response.meals.map((m) => m.id),
          })

          // Verify that refetched meals include the created meals
          const refetchedMealIds = new Set(response.meals.map((m) => m.id))
          const missingMealIds = Array.from(createdMealIds).filter(
            (id) => !refetchedMealIds.has(id)
          )

          if (missingMealIds.length > 0) {
            console.warn(
              'handleAIMealsApplied: Some created meals not found in refetch, retrying',
              {
                missingMealIds,
              }
            )
            // Retry once after a longer delay
            await new Promise((resolve) => setTimeout(resolve, 500))
            const retryResponse = await getWeeklyMeals(
              weekDate,
              selectedHouseholdId,
              token
            )
            const retryMealIds = new Set(retryResponse.meals.map((m) => m.id))
            const stillMissing = Array.from(createdMealIds).filter(
              (id) => !retryMealIds.has(id)
            )

            if (stillMissing.length > 0) {
              console.warn(
                'handleAIMealsApplied: Some meals still missing after retry, using fallback',
                {
                  stillMissing,
                }
              )
              // Use fallback: merge created meals with refetched meals
              const convertedMeals =
                retryResponse.meals.map(convertMealResponse)
              const existingMealIds = new Set(convertedMeals.map((m) => m.id))
              const newMeals = createdMeals.filter(
                (m) => !existingMealIds.has(m.id)
              )
              setMeals([...convertedMeals, ...newMeals])
            } else {
              const convertedMeals =
                retryResponse.meals.map(convertMealResponse)
              setMeals(convertedMeals)
            }
          } else {
            const convertedMeals = response.meals.map(convertMealResponse)
            console.warn('handleAIMealsApplied: Updating meals state', {
              convertedMealsCount: convertedMeals.length,
              convertedMealDates: convertedMeals.map((m) =>
                m.date.toISOString()
              ),
            })
            setMeals(convertedMeals)
          }
        } catch (refetchError) {
          console.error('handleAIMealsApplied: Refetch failed', {
            error: refetchError,
            weekDate: formatDateForAPI(currentWeekStart),
            selectedHouseholdId,
          })

          // Fallback: Use the created meals directly if refetch fails
          console.warn(
            'handleAIMealsApplied: Falling back to using created meals directly',
            {
              createdMealsCount: createdMeals.length,
            }
          )
          // Merge created meals with existing meals, avoiding duplicates
          setMeals((prevMeals) => {
            const existingMealIds = new Set(prevMeals.map((m) => m.id))
            const newMeals = createdMeals.filter(
              (m) => !existingMealIds.has(m.id)
            )
            return [...prevMeals, ...newMeals]
          })

          // Show warning about refetch failure
          setError(
            'Meals were created but could not refresh the list. Please refresh the page to see all meals.'
          )
        }
      }

      // Show success message with detailed error information if any meals failed
      if (createdMeals.length > 0) {
        const hasIngredients = createdMeals.some(
          (m) => m.ingredients && m.ingredients.length > 0
        )
        const failedCount = failedMeals.length
        let message = `Successfully added ${createdMeals.length} meal${
          createdMeals.length !== 1 ? 's' : ''
        } to your meal plan!`

        if (failedCount > 0) {
          // Build detailed error message for failed meals
          const failedMealNames = failedMeals.map((f) => f.mealName).join(', ')
          message += ` (${failedCount} meal${failedCount !== 1 ? 's' : ''} failed: ${failedMealNames})`

          // Show error details if there are failures
          if (failedMeals.length > 0) {
            // Format error details for single-line display
            const errorDetails = failedMeals
              .map((f) => {
                // Simplify error messages for display
                let displayError = f.error
                if (
                  displayError.includes('401') ||
                  displayError.includes('Unauthorized')
                ) {
                  displayError = 'Authentication error'
                } else if (
                  displayError.includes('403') ||
                  displayError.includes('Forbidden')
                ) {
                  displayError = 'Permission denied'
                } else if (
                  displayError.includes('500') ||
                  displayError.includes('Internal Server Error')
                ) {
                  displayError = 'Server error'
                } else if (
                  displayError.includes('Network') ||
                  displayError.includes('fetch')
                ) {
                  displayError = 'Network error'
                }
                return `${f.mealName} (${displayError})`
              })
              .join('; ')
            setError(`Some meals failed to create: ${errorDetails}`)
          }
        }

        if (hasIngredients) {
          message += ' Would you like to generate a grocery list?'
        }

        setSuccessMessage(message)
        setTimeout(() => {
          setSuccessMessage(null)
        }, 8000)
      } else {
        // All meals failed - show detailed error message
        let errorMessage = 'Failed to create any meals. '

        if (failedMeals.length > 0) {
          // Format error details for single-line display
          const errorDetails = failedMeals
            .map((f) => {
              // Simplify error messages for display
              let displayError = f.error
              if (
                displayError.includes('401') ||
                displayError.includes('Unauthorized')
              ) {
                displayError = 'Authentication error'
              } else if (
                displayError.includes('403') ||
                displayError.includes('Forbidden')
              ) {
                displayError = 'Permission denied'
              } else if (
                displayError.includes('500') ||
                displayError.includes('Internal Server Error')
              ) {
                displayError = 'Server error'
              } else if (
                displayError.includes('Network') ||
                displayError.includes('fetch')
              ) {
                displayError = 'Network error'
              }
              return `${f.mealName} (${displayError})`
            })
            .join('; ')
          errorMessage += `Errors: ${errorDetails}`
        } else {
          errorMessage += 'Please check your connection and try again.'
        }

        setError(errorMessage)
        setSuccessMessage(null)
      }
    } catch (err) {
      // Log the error with full context
      console.error('Error applying AI meals:', {
        error: err,
        suggestionsCount: suggestions.length,
        selectedHouseholdId,
      })

      let errorMessage = 'Failed to apply meals. '
      if (err instanceof Error) {
        if (
          err.message.includes('401') ||
          err.message.includes('Unauthorized')
        ) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (
          err.message.includes('403') ||
          err.message.includes('Forbidden')
        ) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (
          err.message.includes('500') ||
          err.message.includes('Internal Server Error')
        ) {
          errorMessage = 'Server error. Please try again later.'
        } else if (
          err.message.includes('Network') ||
          err.message.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.'
        } else {
          errorMessage += err.message
        }
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.'
      }
      setError(errorMessage)
      setSuccessMessage(null)
    } finally {
      setIsApplyingAIMeals(false)
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

        {/* Success message banner */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">{successMessage}</p>
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

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="flex items-center"
                  disabled={isApplyingAIMeals}
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  {showAIAssistant ? 'Hide AI Assistant' : 'AI Assistant'}
                </Button>
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
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="flex-shrink-0"
                disabled={isApplyingAIMeals}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
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

        {/* AI Assistant - Desktop View */}
        {households.length > 0 && showAIAssistant && (
          <div className="hidden md:block mb-6">
            <AIMealPlanningAssistant
              householdId={selectedHouseholdId!}
              weekStartDate={currentWeekStart}
              getToken={getToken}
              onMealsApplied={handleAIMealsApplied}
            />
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
              onMealDelete={handleMealDeleteDirect}
            />
          </div>
        )}

        {/* AI Assistant - Mobile View */}
        {households.length > 0 && showAIAssistant && (
          <div className="md:hidden px-4 mb-4">
            <AIMealPlanningAssistant
              householdId={selectedHouseholdId!}
              weekStartDate={currentWeekStart}
              getToken={getToken}
              onMealsApplied={handleAIMealsApplied}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Meal?"
        message="Are you sure you want to delete this meal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  )
}
