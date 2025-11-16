// Note: This is a simplified version for API integration
// The full meal planner UI has been temporarily simplified to focus on API integration
// TODO: Restore full WeeklyCalendar UI from previous version after testing API integration

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getWeeklyMeals, MealResponse, getWeekStartDate } from '@/lib/api/meals'
import { getHouseholds } from '@/lib/api/household'

export default function MealPlannerPage() {
  const { getToken } = useAuth()
  const [meals, setMeals] = useState<MealResponse[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null)
  const [currentWeekStart] = useState(getWeekStartDate())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const token = await getToken()
        if (!token) return

        const householdsData = await getHouseholds(token)
        
        if (householdsData.length > 0) {
          const householdId = selectedHouseholdId || householdsData[0].id
          setSelectedHouseholdId(householdId)
          
          const weeklyPlan = await getWeeklyMeals(currentWeekStart, householdId, token)
          setMeals(weeklyPlan.meals)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [getToken, currentWeekStart, selectedHouseholdId])

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Meal Planner</h1>
      <p className="text-gray-600 mb-8">Week of {currentWeekStart}</p>
      
      {error && <div className="bg-red-50 p-4 rounded mb-4 text-red-700">{error}</div>}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p className="text-yellow-800">
          <strong>Note:</strong> The full meal planner calendar UI is temporarily simplified for API integration.
          The complete weekly calendar view will be restored after testing.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Meals This Week ({meals.length})</h2>
        {meals.length === 0 ? (
          <p className="text-gray-500">No meals planned for this week</p>
        ) : (
          <ul className="space-y-2">
            {meals.map(meal => (
              <li key={meal.id} className="p-3 border rounded">
                <div className="font-medium">{meal.name}</div>
                <div className="text-sm text-gray-600">{meal.meal_type} - Day {meal.day_of_week}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

