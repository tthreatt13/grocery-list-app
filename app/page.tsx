'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'
import { getGroceryListsWithItems } from '@/lib/api/grocery'
import { transformGroceryLists } from '@/lib/adapters/groceryAdapters'
import { GroceryList } from '@/lib/types'
import { getPantryItems, PantryItemResponse } from '@/lib/api/pantry'
import { getWeeklyMeals, getWeekStartDate, MealResponse } from '@/lib/api/meals'
import { getHouseholds } from '@/lib/api/household'
import { getDashboardInsights, UrgentItem } from '@/lib/api/dashboard'
import UrgentActionItems from '@/components/dashboard/UrgentActionItems'

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItemResponse[]>([])
  const [weeklyMeals, setWeeklyMeals] = useState<MealResponse[]>([])
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        // Fetch dashboard insights (urgent items)
        try {
          const insights = await getDashboardInsights(token)
          setUrgentItems(insights.urgent_items)
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

  // Calculate stats from real data
  const totalLists = groceryLists.filter((list) => !list.isArchived).length
  const totalItems = groceryLists.reduce(
    (acc, list) => acc + list.items.length,
    0
  )
  const completedItems = groceryLists.reduce(
    (acc, list) => acc + list.items.filter((item) => item.checked).length,
    0
  )
  const recentLists = groceryLists.slice(0, 3)

  // Calculate pantry stats
  const totalPantryItems = pantryItems.length
  const lowStockItems = pantryItems.filter(
    (item) =>
      item.low_stock_threshold &&
      parseInt(item.quantity || '0') <= item.low_stock_threshold
  ).length
  // Calculate expiring soon items client-side only to avoid hydration mismatch
  const expiringSoonItems = useMemo(() => {
    if (typeof window === 'undefined') return 0
    return pantryItems.filter((item) => {
      if (!item.expiration_date) return false
      const daysUntilExpiration = Math.ceil(
        (new Date(item.expiration_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiration >= 0 && daysUntilExpiration <= 5
    }).length
  }, [pantryItems])

  // Calculate meal planner stats
  const mealsThisWeek = weeklyMeals.length

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Tony! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Here&apos;s what&apos;s happening with your grocery planning today.
          </p>
        </div>

        {/* Urgent Action Items */}
        <UrgentActionItems
          items={urgentItems}
          getToken={getToken}
          onItemAdded={async () => {
            // Refresh dashboard data when item is added
            const token = await getToken()
            if (token) {
              try {
                const insights = await getDashboardInsights(token)
                setUrgentItems(insights.urgent_items)
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
            // Remove dismissed item from the list
            setUrgentItems((prev) => prev.filter((item) => item.id !== itemId))
          }}
        />

        {/* Stats Grid - Grocery Lists */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Grocery Lists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Lists
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {totalLists}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Items
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {totalItems}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {completedItems}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Grid - Pantry */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Pantry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Items
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {totalPantryItems}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Low Stock
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {lowStockItems}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Expiring Soon
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {expiringSoonItems}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Grid - Meal Planner */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Meal Planner
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Meals This Week
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {mealsThisWeek}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Planned Days
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {new Set(weeklyMeals.map((m) => m.day_of_week)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link href="/grocery-lists">
              <Button
                variant="outline"
                className="w-full min-h-[80px] flex flex-col items-center justify-center space-y-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-xs sm:text-sm">New List</span>
              </Button>
            </Link>
            <Link href="/pantry">
              <Button
                variant="outline"
                className="w-full min-h-[80px] flex flex-col items-center justify-center space-y-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span className="text-xs sm:text-sm">Pantry</span>
              </Button>
            </Link>
            <Link href="/meal-planner">
              <Button
                variant="outline"
                className="w-full min-h-[80px] flex flex-col items-center justify-center space-y-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs sm:text-sm">Plan Meals</span>
              </Button>
            </Link>
            <Link href="/household">
              <Button
                variant="outline"
                className="w-full min-h-[80px] flex flex-col items-center justify-center space-y-2"
              >
                <svg
                  className="w-6 h-6"
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
                <span className="text-xs sm:text-sm">Family</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Lists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Recent Lists
            </h2>
            <Link href="/grocery-lists">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentLists.map((list) => (
              <Link key={list.id} href={`/grocery-lists/${list.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {list.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {list.items.length} items •{' '}
                          {list.items.filter((i) => i.checked).length} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatRelativeTime(list.updatedAt)}
                        </p>
                        {list.sharedWith.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">Shared</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
