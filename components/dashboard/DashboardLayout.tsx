'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'
import { GroceryList } from '@/lib/types'
import { UrgentItem, Suggestion, DashboardStats } from '@/lib/api/dashboard'
import { DashboardViewMode } from '@/lib/utils/contextDetection'
import UrgentActionItems from './UrgentActionItems'
import SmartSuggestions from './SmartSuggestions'
import InsightsDisplay from './InsightsDisplay'

interface DashboardLayoutProps {
  viewMode: DashboardViewMode
  urgentItems: UrgentItem[]
  suggestions: Suggestion[]
  groceryLists: GroceryList[]
  stats: DashboardStats | null
  getToken: () => Promise<string | null>
  onItemAdded?: () => void
  onItemDismissed?: (itemId: number) => void
  onSuggestionAccepted?: (suggestionId: string) => void
  onSuggestionDismissed?: (suggestionId: string) => void
}

export default function DashboardLayout({
  viewMode,
  urgentItems,
  suggestions,
  groceryLists,
  stats,
  getToken,
  onItemAdded,
  onItemDismissed,
  onSuggestionAccepted,
  onSuggestionDismissed,
}: DashboardLayoutProps) {
  const recentLists = groceryLists.slice(0, 3)

  // Get context-appropriate welcome message
  const getWelcomeMessage = () => {
    switch (viewMode) {
      case 'morning_planning':
        return "Good morning! Let's plan your day."
      case 'shopping':
        return "Happy shopping! Here's what you need."
      case 'routine_review':
        return "Here's your grocery overview."
      default:
        return "Welcome back! Here's what's happening with your grocery planning today."
    }
  }

  // Render sections based on view mode priority
  const renderPrimarySections = () => {
    // All view modes show urgent items and suggestions first
    return (
      <>
        <UrgentActionItems
          items={urgentItems}
          getToken={getToken}
          onItemAdded={onItemAdded}
          onItemDismissed={onItemDismissed}
        />

        <SmartSuggestions
          suggestions={suggestions}
          getToken={getToken}
          onSuggestionAccepted={onSuggestionAccepted}
          onSuggestionDismissed={onSuggestionDismissed}
        />
      </>
    )
  }


  const renderQuickActions = () => {
    return (
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
    )
  }

  const renderRecentLists = () => {
    return (
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
          {recentLists.length > 0 ? (
            recentLists.map((list) => (
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
            ))
          ) : (
            <Card>
              <div className="p-8 text-center">
                <p className="text-gray-600">No recent lists</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Tony! 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {getWelcomeMessage()}
        </p>
      </div>

      {/* Primary Sections - Always shown first */}
      {renderPrimarySections()}

      {/* Insights & Patterns Display */}
      {stats && <InsightsDisplay stats={stats} />}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Recent Lists */}
      {renderRecentLists()}
    </>
  )
}
