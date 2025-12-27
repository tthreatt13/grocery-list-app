'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { DashboardStats } from '@/lib/api/dashboard'

interface InsightsDisplayProps {
  stats: DashboardStats
}

export default function InsightsDisplay({ stats }: InsightsDisplayProps) {
  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (stats.total_items === 0) return 0
    return Math.round((stats.completed_items / stats.total_items) * 100)
  }, [stats.total_items, stats.completed_items])

  // Calculate meal planning coverage (planned days out of 7)
  const mealPlanningCoverage = useMemo(() => {
    return Math.round((stats.planned_days / 7) * 100)
  }, [stats.planned_days])

  // Calculate pantry health score (lower is better)
  // Score is based on low stock and expiring items
  const pantryHealthScore = useMemo(() => {
    // Simple scoring: fewer issues = better health
    // We'll display this as a status rather than a percentage
    const totalIssues = stats.low_stock_count + stats.expiring_soon_count
    if (totalIssues === 0) return 'excellent'
    if (totalIssues <= 2) return 'good'
    if (totalIssues <= 5) return 'fair'
    return 'needs_attention'
  }, [stats.low_stock_count, stats.expiring_soon_count])

  // Get shopping efficiency message
  const getShoppingEfficiencyMessage = () => {
    if (completionRate >= 80) {
      return "Excellent! You're staying on top of your shopping list."
    }
    if (completionRate >= 60) {
      return 'Good progress! Keep up the momentum.'
    }
    if (completionRate >= 40) {
      return "You're making progress. Every item checked off counts!"
    }
    if (stats.total_items === 0) {
      return 'Start adding items to your grocery lists to track your progress.'
    }
    return 'Getting started! Check off items as you shop to see your progress.'
  }

  // Get meal planning message
  const getMealPlanningMessage = () => {
    if (mealPlanningCoverage === 100) {
      return 'Perfect! You have meals planned for the entire week.'
    }
    if (mealPlanningCoverage >= 70) {
      return 'Great planning! Most of your week is covered.'
    }
    if (mealPlanningCoverage >= 50) {
      return 'Good start! Consider planning a few more meals this week.'
    }
    if (stats.meals_this_week === 0) {
      return 'Start planning meals to make grocery shopping easier.'
    }
    return 'Plan more meals to reduce last-minute decisions.'
  }

  // Get pantry health message
  const getPantryHealthMessage = () => {
    switch (pantryHealthScore) {
      case 'excellent':
        return 'Your pantry is well-stocked and organized!'
      case 'good':
        return 'Your pantry looks good. Keep an eye on a few items.'
      case 'fair':
        return 'Some items need attention. Consider restocking soon.'
      case 'needs_attention':
        return 'Several items need attention. Time for a pantry check!'
      default:
        return 'Monitor your pantry regularly to avoid running out.'
    }
  }

  // Get color for completion rate
  const getCompletionRateColor = () => {
    if (completionRate >= 80) return 'text-green-600'
    if (completionRate >= 60) return 'text-blue-600'
    if (completionRate >= 40) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Get color for meal planning coverage
  const getMealPlanningColor = () => {
    if (mealPlanningCoverage >= 80) return 'text-green-600'
    if (mealPlanningCoverage >= 60) return 'text-blue-600'
    if (mealPlanningCoverage >= 40) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Get color for pantry health
  const getPantryHealthColor = () => {
    switch (pantryHealthScore) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'fair':
        return 'text-yellow-600'
      case 'needs_attention':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  // Get background color for pantry health badge
  const getPantryHealthBadgeColor = () => {
    switch (pantryHealthScore) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'needs_attention':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Insights & Patterns
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shopping Efficiency Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Shopping Efficiency
                </h3>
                <p className="text-sm text-gray-600">
                  {getShoppingEfficiencyMessage()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
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
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Completion Rate
                </span>
                <span
                  className={`text-2xl font-bold ${getCompletionRateColor()}`}
                >
                  {completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    completionRate >= 80
                      ? 'bg-green-500'
                      : completionRate >= 60
                        ? 'bg-blue-500'
                        : completionRate >= 40
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                  role="progressbar"
                  aria-valuenow={completionRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.completed_items} of {stats.total_items} items completed
              </p>
            </div>
          </div>
        </Card>

        {/* Meal Planning Coverage Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Meal Planning Coverage
                </h3>
                <p className="text-sm text-gray-600">
                  {getMealPlanningMessage()}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
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
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Week Coverage
                </span>
                <span
                  className={`text-2xl font-bold ${getMealPlanningColor()}`}
                >
                  {mealPlanningCoverage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    mealPlanningCoverage >= 80
                      ? 'bg-green-500'
                      : mealPlanningCoverage >= 60
                        ? 'bg-blue-500'
                        : mealPlanningCoverage >= 40
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                  }`}
                  style={{ width: `${mealPlanningCoverage}%` }}
                  role="progressbar"
                  aria-valuenow={mealPlanningCoverage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.planned_days} of 7 days planned • {stats.meals_this_week}{' '}
                meals this week
              </p>
            </div>
          </div>
        </Card>

        {/* Pantry Health Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Pantry Health
                </h3>
                <p className="text-sm text-gray-600">
                  {getPantryHealthMessage()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Status
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getPantryHealthBadgeColor()}`}
                >
                  {pantryHealthScore === 'excellent'
                    ? 'Excellent'
                    : pantryHealthScore === 'good'
                      ? 'Good'
                      : pantryHealthScore === 'fair'
                        ? 'Fair'
                        : 'Needs Attention'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Low Stock</p>
                  <p className={`text-xl font-bold ${getPantryHealthColor()}`}>
                    {stats.low_stock_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expiring Soon</p>
                  <p className={`text-xl font-bold ${getPantryHealthColor()}`}>
                    {stats.expiring_soon_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Lists Summary Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Active Lists
                </h3>
                <p className="text-sm text-gray-600">
                  {stats.total_lists === 0
                    ? 'Create your first grocery list to get started.'
                    : stats.total_lists === 1
                      ? 'You have 1 active grocery list.'
                      : `You have ${stats.total_lists} active grocery lists.`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
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
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total Lists
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.total_lists}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
