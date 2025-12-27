/**
 * Dashboard Insights API functions
 */

import { get } from './client'

// API Response Types (matching backend schemas)
export interface UrgentItem {
  id: number
  name: string
  type: 'expiring_soon' | 'low_stock'
  household_id: number
  category?: string
  quantity?: string
  expiration_date?: string
  days_until_expiration?: number
  low_stock_threshold?: number
  current_quantity?: string
}

export interface Suggestion {
  id: string
  type: 'restock' | 'meal_planning' | 'routine'
  title: string
  description: string
  action_label: string
  action_data?: Record<string, unknown>
  priority: number
}

export interface DashboardStats {
  total_lists: number
  total_items: number
  completed_items: number
  low_stock_count: number
  expiring_soon_count: number
  meals_this_week: number
  planned_days: number
}

export interface DashboardInsightsResponse {
  urgent_items: UrgentItem[]
  suggestions: Suggestion[]
  stats: DashboardStats
}

/**
 * Get dashboard insights including urgent items, suggestions, and stats
 */
export async function getDashboardInsights(
  token: string
): Promise<DashboardInsightsResponse> {
  return get<DashboardInsightsResponse>('/api/dashboard/insights', token)
}
