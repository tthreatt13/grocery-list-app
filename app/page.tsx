'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getGroceryListsWithItems } from '@/lib/api/grocery'
import { transformGroceryLists } from '@/lib/adapters/groceryAdapters'
import { GroceryList } from '@/lib/types'
import { getPantryItems, PantryItemResponse } from '@/lib/api/pantry'
import { getWeeklyMeals, getWeekStartDate, MealResponse } from '@/lib/api/meals'
import { getHouseholds } from '@/lib/api/household'
import {
  getDashboardInsights,
  UrgentItem,
  Suggestion,
} from '@/lib/api/dashboard'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  getDismissedSuggestions,
  getDismissedUrgentItems,
  dismissSuggestion,
  dismissUrgentItem,
} from '@/lib/utils/dismissedItems'
import { getUserContext } from '@/lib/utils/contextDetection'

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItemResponse[]>([])
  const [weeklyMeals, setWeeklyMeals] = useState<MealResponse[]>([])
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    () => getDismissedSuggestions()
  )
  const [dismissedUrgentItems, setDismissedUrgentItems] = useState<Set<number>>(
    () => getDismissedUrgentItems()
  )

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken()
        if (!token) {
          throw new Error('No authentication token available')
        }

        // Fetch grocery lists
        const apiLists = await getGroceryListsWithItems(token)
        const transformedLists = transformGroceryLists(apiLists)
        setGroceryLists(transformedLists)

        // Fetch dashboard insights (urgent items and suggestions)
        try {
          const insights = await getDashboardInsights(token)
          setUrgentItems(insights.urgent_items)
          setSuggestions(insights.suggestions)
        } catch (err) {
          console.error('Error fetching dashboard insights:', err)
          // Don't fail the whole dashboard if insights fail
        }

        // Fetch households to get pantry and meal data
        try {
          const households = await getHouseholds(token)

          // Fetch pantry items for all households
          if (households.length > 0) {
            const allPantryItems: PantryItemResponse[] = []
            for (const household of households) {
              try {
                const items = await getPantryItems(household.id, token)
                allPantryItems.push(...items)
              } catch (err) {
                console.error(
                  `Error fetching pantry for household ${household.id}:`,
                  err
                )
              }
            }
            setPantryItems(allPantryItems)

            // Fetch meals for current week for all households
            const weekStart = getWeekStartDate()
            const allMeals: MealResponse[] = []
            for (const household of households) {
              try {
                const weeklyPlan = await getWeeklyMeals(
                  weekStart,
                  household.id,
                  token
                )
                allMeals.push(...weeklyPlan.meals)
              } catch (err) {
                console.error(
                  `Error fetching meals for household ${household.id}:`,
                  err
                )
              }
            }
            setWeeklyMeals(allMeals)
          }
        } catch (err) {
          console.error('Error fetching household data:', err)
          // Don't fail the whole dashboard if pantry/meals fail
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isLoaded, isSignedIn, getToken])

  // Filter out dismissed items before displaying
  const filteredUrgentItems = useMemo(() => {
    return urgentItems.filter((item) => !dismissedUrgentItems.has(item.id))
  }, [urgentItems, dismissedUrgentItems])

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(
      (suggestion) => !dismissedSuggestions.has(suggestion.id)
    )
  }, [suggestions, dismissedSuggestions])

  // Get user context for context-aware layout
  const userContext = useMemo(() => getUserContext(), [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your grocery data...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardLayout
          viewMode={userContext.viewMode}
          urgentItems={filteredUrgentItems}
          suggestions={filteredSuggestions}
          groceryLists={groceryLists}
          pantryItems={pantryItems}
          weeklyMeals={weeklyMeals}
          getToken={getToken}
          onItemAdded={async () => {
            // Refresh dashboard data when item is added
            const token = await getToken()
            if (token) {
              try {
                const insights = await getDashboardInsights(token)
                setUrgentItems(insights.urgent_items)
                setSuggestions(insights.suggestions)
                // Also refresh grocery lists to show the new item
                const apiLists = await getGroceryListsWithItems(token)
                const transformedLists = transformGroceryLists(apiLists)
                setGroceryLists(transformedLists)
              } catch (err) {
                console.error('Error refreshing dashboard:', err)
              }
            }
          }}
          onItemDismissed={async (itemId: number) => {
            // Save to sessionStorage and update state
            dismissUrgentItem(itemId)
            setDismissedUrgentItems((prev) => {
              const updated = new Set(prev)
              updated.add(itemId)
              return updated
            })
            setUrgentItems((prev) => prev.filter((item) => item.id !== itemId))
          }}
          onSuggestionAccepted={async (suggestionId: string) => {
            // Refresh dashboard data when suggestion is accepted
            const token = await getToken()
            if (token) {
              try {
                const insights = await getDashboardInsights(token)
                setSuggestions(insights.suggestions)
                // Also refresh grocery lists if a list was created
                const apiLists = await getGroceryListsWithItems(token)
                const transformedLists = transformGroceryLists(apiLists)
                setGroceryLists(transformedLists)
              } catch (err) {
                console.error('Error refreshing dashboard:', err)
              }
            }
          }}
          onSuggestionDismissed={async (suggestionId: string) => {
            // Save to sessionStorage and update state
            dismissSuggestion(suggestionId)
            setDismissedSuggestions((prev) => {
              const updated = new Set(prev)
              updated.add(suggestionId)
              return updated
            })
            setSuggestions((prev) =>
              prev.filter((suggestion) => suggestion.id !== suggestionId)
            )
          }}
        />
      </div>
    </main>
  )
}
