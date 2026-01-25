'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import {
  HouseholdPreferences,
  HouseholdPreferencesUpdate,
} from '@/lib/api/household'
import { getWeeklyMeals, getWeekStartDate } from '@/lib/api/meals'

interface PreferencesFormProps {
  preferences: HouseholdPreferences | null
  onSubmit: (_data: HouseholdPreferencesUpdate) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// Available diet types
const DIET_TYPES = [
  { value: 'paleo', label: 'Paleo' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'keto', label: 'Keto' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'dairy_free', label: 'Dairy-Free' },
  { value: 'none', label: 'None' },
]

// Cooking apparatus options
const COOKING_APPARATUS_OPTIONS = [
  { value: 'oven', label: 'Oven' },
  { value: 'stovetop', label: 'Stovetop' },
  { value: 'grill', label: 'Grill' },
  { value: 'slow_cooker', label: 'Slow Cooker' },
  { value: 'instant_pot', label: 'Instant Pot' },
  { value: 'air_fryer', label: 'Air Fryer' },
  { value: 'microwave', label: 'Microwave' },
]

export default function PreferencesForm({
  preferences,
  onSubmit,
  onCancel,
  isLoading = false,
}: PreferencesFormProps) {
  const prevPreferencesIdRef = useRef<number | null>(
    preferences?.household_id || null
  )

  // Initialize state from props
  const [dietTypes, setDietTypes] = useState<string[]>(
    () => preferences?.diet_types || []
  )
  const [cookingApparatus, setCookingApparatus] = useState<string[]>(
    () => preferences?.cooking_apparatus || []
  )
  const [previousMeals, setPreviousMeals] = useState<string>(() =>
    preferences?.previous_meals ? preferences.previous_meals.join(', ') : ''
  )
  const [zipCode, setZipCode] = useState<string>(
    () => preferences?.zip_code || ''
  )
  const [zipCodeError, setZipCodeError] = useState<string>('')

  // Meal fetching state
  const [isLoadingMeals, setIsLoadingMeals] = useState<boolean>(false)
  const [_mealsError, setMealsError] = useState<string | null>(null)
  const [fetchedMeals, setFetchedMeals] = useState<string[] | null>(null)
  const hasFetchedMealsRef = useRef<boolean>(false)
  const mealPlannerDataAppliedRef = useRef<boolean>(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  // Store initial preferences value to avoid hydration issues
  const initialPreviousMealsRef = useRef<string>(
    preferences?.previous_meals ? preferences.previous_meals.join(', ') : ''
  )

  const { getToken } = useAuth()

  // Track mount state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch meals from previous week when form loads in edit mode
  useEffect(() => {
    // Only fetch after component has mounted to avoid hydration issues
    if (!isMounted) {
      return
    }

    const fetchPreviousWeekMeals = async () => {
      // Check if we should fetch meals
      if (!preferences?.household_id || hasFetchedMealsRef.current) {
        return
      }

      // Determine if form is in edit mode (preferences exist)
      const isEditMode = !!preferences

      if (!isEditMode) {
        return
      }

      try {
        setIsLoadingMeals(true)
        setMealsError(null)

        const token = await getToken()
        if (!token) {
          setMealsError('No authentication token available')
          setIsLoadingMeals(false)
          return
        }

        // Calculate previous week's Monday (inside useEffect to avoid hydration issues)
        const getPreviousWeekMonday = (): string => {
          const currentWeekMonday = getWeekStartDate()
          const currentWeekMondayDate = new Date(currentWeekMonday)
          const previousWeekMondayDate = new Date(currentWeekMondayDate)
          previousWeekMondayDate.setDate(currentWeekMondayDate.getDate() - 7)
          return previousWeekMondayDate.toISOString().split('T')[0]
        }

        const previousWeekMonday = getPreviousWeekMonday()
        console.warn(
          '[PreferencesForm] Fetching meals for previous week Monday:',
          previousWeekMonday
        )

        // Fetch meals from previous week
        const response = await getWeeklyMeals(
          previousWeekMonday,
          preferences.household_id,
          token
        )
        console.warn(
          '[PreferencesForm] Received meals response:',
          response.meals.length,
          'meals'
        )

        // Extract meal names from response
        const mealNames = response.meals
          .map((meal) => meal.name)
          .filter(
            (name): name is string =>
              name !== null && name !== undefined && name.trim().length > 0
          )

        // Deduplicate meal names (preserve original capitalization)
        const uniqueMealNames = Array.from(
          new Set(mealNames.map((name) => name.trim()))
        ).sort()

        setFetchedMeals(uniqueMealNames)
        hasFetchedMealsRef.current = true

        console.warn(
          '[PreferencesForm] Extracted meal names:',
          uniqueMealNames,
          'Existing previous_meals:',
          preferences.previous_meals
        )

        // Merge fetched meals with existing meals (append, don't override)
        // Read from ref to avoid hydration issues - ref stores initial value from props
        // This ensures consistent behavior between server and client
        const existingMealsString = initialPreviousMealsRef.current
        const existingMeals = existingMealsString
          .split(',')
          .map((meal) => meal.trim())
          .filter((meal) => meal.length > 0)

        // Create a Set of lowercase meal names for case-insensitive deduplication
        const existingMealsLowercase = new Set(
          existingMeals.map((meal) => meal.toLowerCase())
        )

        // Filter out duplicates from fetched meals (case-insensitive)
        const newUniqueMeals = uniqueMealNames.filter(
          (meal) => !existingMealsLowercase.has(meal.toLowerCase())
        )

        // Combine: existing meals first, then new unique meals
        const mergedMeals = [...existingMeals, ...newUniqueMeals]

        if (newUniqueMeals.length > 0) {
          console.warn(
            '[PreferencesForm] Merging meal planner data with existing meals. Added:',
            newUniqueMeals.join(', '),
            'Total meals:',
            mergedMeals.length
          )
          setPreviousMeals(mergedMeals.join(', '))
          mealPlannerDataAppliedRef.current = true
        } else if (uniqueMealNames.length > 0) {
          console.warn(
            '[PreferencesForm] All fetched meals already exist in previous_meals (case-insensitive match)'
          )
          mealPlannerDataAppliedRef.current = true
        } else {
          console.warn(
            '[PreferencesForm] No meals found in meal planner for previous week'
          )
        }
      } catch (error) {
        // Silent failure - log for debugging but don't show to user
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch meals'
        setMealsError(errorMessage)
        console.error('Failed to fetch previous week meals:', error)
      } finally {
        setIsLoadingMeals(false)
      }
    }

    fetchPreviousWeekMeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.household_id, getToken, isMounted])

  // Reset meal fetching flag when preferences change (different household)
  useEffect(() => {
    const currentId = preferences?.household_id || null
    if (prevPreferencesIdRef.current !== currentId) {
      hasFetchedMealsRef.current = false
      mealPlannerDataAppliedRef.current = false
      setFetchedMeals(null)
      setMealsError(null)
    }
  }, [preferences?.household_id])

  // Update form state when preferences change (different household or preferences updated)
  // Using ref to track previous household_id avoids setState-in-effect for same preferences
  // Note: This effect is necessary to sync props to form state when preferences load/change
  useEffect(() => {
    const currentId = preferences?.household_id || null
    if (preferences && prevPreferencesIdRef.current !== currentId) {
      prevPreferencesIdRef.current = currentId
      setDietTypes(preferences.diet_types || [])

      setCookingApparatus(preferences.cooking_apparatus || [])

      // Only sync previousMeals from preferences if meal planner data hasn't been applied yet
      // Meal planner is the source of truth and should take precedence
      const previousMealsString = preferences.previous_meals
        ? preferences.previous_meals.join(', ')
        : ''
      initialPreviousMealsRef.current = previousMealsString
      if (!mealPlannerDataAppliedRef.current) {
        setPreviousMeals(previousMealsString)
      }

      setZipCode(preferences.zip_code || '')

      setZipCodeError('')
    } else if (!preferences && prevPreferencesIdRef.current !== null) {
      // Preferences cleared - reset form
      prevPreferencesIdRef.current = null

      setDietTypes([])

      setCookingApparatus([])

      setPreviousMeals('')

      setZipCode('')

      setZipCodeError('')
    }
  }, [preferences])

  const handleDietTypeToggle = (dietType: string) => {
    setDietTypes((prev) => {
      if (prev.includes(dietType)) {
        return prev.filter((d) => d !== dietType)
      } else {
        // If "none" is selected, clear all others
        if (dietType === 'none') {
          return ['none']
        }
        // If selecting anything else, remove "none"
        return [...prev.filter((d) => d !== 'none'), dietType]
      }
    })
  }

  const handleCookingApparatusToggle = (apparatus: string) => {
    setCookingApparatus((prev) => {
      if (prev.includes(apparatus)) {
        return prev.filter((a) => a !== apparatus)
      } else {
        return [...prev, apparatus]
      }
    })
  }

  // Validate US zip code format: 5 digits or 5+4 format (e.g., 12345 or 12345-6789)
  const validateZipCode = (zip: string): boolean => {
    if (!zip.trim()) {
      return true // Empty is valid (optional field)
    }
    // Match 5 digits or 5 digits + hyphen + 4 digits
    const zipCodeRegex = /^\d{5}(-\d{4})?$/
    return zipCodeRegex.test(zip.trim())
  }

  const handleZipCodeChange = (value: string) => {
    setZipCode(value)
    // Clear error when user starts typing
    if (zipCodeError) {
      setZipCodeError('')
    }
  }

  const handleZipCodeBlur = () => {
    if (zipCode.trim() && !validateZipCode(zipCode)) {
      setZipCodeError(
        'Please enter a valid US zip code (e.g., 12345 or 12345-6789)'
      )
    } else {
      setZipCodeError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate zip code before submission
    const trimmedZipCode = zipCode.trim()
    if (trimmedZipCode && !validateZipCode(trimmedZipCode)) {
      setZipCodeError(
        'Please enter a valid US zip code (e.g., 12345 or 12345-6789)'
      )
      return
    }

    // Parse previous meals from comma-separated string
    const previousMealsArray = previousMeals
      .split(',')
      .map((meal) => meal.trim())
      .filter((meal) => meal.length > 0)

    const data: HouseholdPreferencesUpdate = {
      diet_types: dietTypes.length > 0 ? dietTypes : null,
      cooking_apparatus: cookingApparatus.length > 0 ? cookingApparatus : null,
      previous_meals: previousMealsArray.length > 0 ? previousMealsArray : null,
      zip_code: trimmedZipCode || null,
    }

    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Diet Types */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Diet Types
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DIET_TYPES.map((diet) => (
            <Checkbox
              key={diet.value}
              label={diet.label}
              checked={dietTypes.includes(diet.value)}
              onChange={() => handleDietTypeToggle(diet.value)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          Select all that apply. Select &quot;None&quot; if you don&apos;t
          follow any specific diet.
        </p>
      </div>

      {/* Cooking Apparatus */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Available Cooking Apparatus
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COOKING_APPARATUS_OPTIONS.map((apparatus) => (
            <Checkbox
              key={apparatus.value}
              label={apparatus.label}
              checked={cookingApparatus.includes(apparatus.value)}
              onChange={() => handleCookingApparatusToggle(apparatus.value)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-text-tertiary">
          Select all cooking equipment you have available.
        </p>
      </div>

      {/* Previous Meals */}
      <div>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Input
                label="Previous Meals Made This Week"
                type="text"
                value={previousMeals}
                onChange={(e) => setPreviousMeals(e.target.value)}
                placeholder="e.g., Chicken Stir Fry, Pasta Carbonara, Grilled Salmon"
                disabled={isLoadingMeals}
              />
              {isLoadingMeals && (
                <div className="mt-6" role="status" aria-label="Loading meals">
                  <svg
                    className="animate-spin h-5 w-5 text-warm-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 mt-1">
          <p className="text-xs text-text-tertiary">
            Meals from last week&apos;s meal planner will be auto-populated.
            Enter meals you&apos;ve already made this week, separated by commas.
          </p>
          {fetchedMeals && fetchedMeals.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap"
              title="Auto-populated from meal planner"
            >
              Auto-populated
            </span>
          )}
        </div>
      </div>

      {/* Zip Code */}
      <div>
        <Input
          label="Zip Code"
          type="text"
          value={zipCode}
          onChange={(e) => handleZipCodeChange(e.target.value)}
          onBlur={handleZipCodeBlur}
          placeholder="e.g., 12345 or 12345-6789"
          error={zipCodeError}
          maxLength={10}
        />
        <p className="mt-1 text-xs text-text-tertiary">
          Enter your zip code to receive weather forecasts for meal planning.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
