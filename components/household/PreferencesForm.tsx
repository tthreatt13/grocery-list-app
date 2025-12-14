'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import {
  HouseholdPreferences,
  HouseholdPreferencesUpdate,
} from '@/lib/api/household'

interface PreferencesFormProps {
  preferences: HouseholdPreferences | null
  onSubmit: (data: HouseholdPreferencesUpdate) => Promise<void>
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

// Weekly weather options
const WEATHER_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'hot', label: 'Hot' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'rainy', label: 'Rainy' },
  { value: 'sunny', label: 'Sunny' },
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
  const [dietTypes, setDietTypes] = useState<string[]>([])
  const [weeklyWeather, setWeeklyWeather] = useState<string>('')
  const [cookingApparatus, setCookingApparatus] = useState<string[]>([])
  const [previousMeals, setPreviousMeals] = useState<string>('')

  // Initialize form with preferences when they load
  useEffect(() => {
    if (preferences) {
      setDietTypes(preferences.diet_types || [])
      setWeeklyWeather(preferences.weekly_weather || '')
      setCookingApparatus(preferences.cooking_apparatus || [])
      setPreviousMeals(
        preferences.previous_meals ? preferences.previous_meals.join(', ') : ''
      )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Parse previous meals from comma-separated string
    const previousMealsArray = previousMeals
      .split(',')
      .map((meal) => meal.trim())
      .filter((meal) => meal.length > 0)

    const data: HouseholdPreferencesUpdate = {
      diet_types: dietTypes.length > 0 ? dietTypes : null,
      weekly_weather: weeklyWeather || null,
      cooking_apparatus: cookingApparatus.length > 0 ? cookingApparatus : null,
      previous_meals: previousMealsArray.length > 0 ? previousMealsArray : null,
    }

    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Diet Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
        <p className="mt-2 text-xs text-gray-500">
          Select all that apply. Select "None" if you don't follow any specific
          diet.
        </p>
      </div>

      {/* Weekly Weather */}
      <div>
        <Select
          label="Weekly Weather"
          options={WEATHER_OPTIONS}
          value={weeklyWeather}
          onChange={(e) => setWeeklyWeather(e.target.value)}
          placeholder="Select weather for this week"
        />
      </div>

      {/* Cooking Apparatus */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
        <p className="mt-2 text-xs text-gray-500">
          Select all cooking equipment you have available.
        </p>
      </div>

      {/* Previous Meals */}
      <div>
        <Input
          label="Previous Meals Made This Week"
          type="text"
          value={previousMeals}
          onChange={(e) => setPreviousMeals(e.target.value)}
          placeholder="e.g., Chicken Stir Fry, Pasta Carbonara, Grilled Salmon"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter meals you've already made this week, separated by commas.
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
