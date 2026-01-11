'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { getGroceryListsWithItems } from '@/lib/api/grocery'
import { transformGroceryLists } from '@/lib/adapters/groceryAdapters'
import { GroceryList } from '@/lib/types'
import {
  getDashboardInsights,
  UrgentItem,
  Suggestion,
  DashboardStats,
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
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
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

        // Fetch dashboard insights (urgent items, suggestions, and stats)
        try {
          const insights = await getDashboardInsights(token)
          setUrgentItems(insights.urgent_items)
          setSuggestions(insights.suggestions)
          setStats(insights.stats)
        } catch (err) {
          console.error('Error fetching dashboard insights:', err)
          // Don't fail the whole dashboard if insights fail
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
          stats={stats}
          getToken={getToken}
          onItemAdded={async () => {
            // Refresh dashboard data when item is added
            const token = await getToken()
            if (token) {
              try {
                const insights = await getDashboardInsights(token)
                setUrgentItems(insights.urgent_items)
                setSuggestions(insights.suggestions)
                setStats(insights.stats)
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
          onSuggestionAccepted={async (_suggestionId: string) => {
            // Refresh dashboard data when suggestion is accepted
            const token = await getToken()
            if (token) {
              try {
                const insights = await getDashboardInsights(token)
                setSuggestions(insights.suggestions)
                setStats(insights.stats)
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
