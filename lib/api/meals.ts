/**
 * Meal Planner API functions
 */

import { get, post, put, del } from './client'

// API Response Types (matching backend schemas)
export interface MealResponse {
  id: number
  household_id: number
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  day_of_week: number // 0=Monday, 6=Sunday
  week_start_date: string // ISO date string
  ingredients?: string
  notes?: string
  created_at: string
}

export interface WeeklyPlanResponse {
  week_start_date: string // ISO date string
  household_id: number
  meals: MealResponse[]
}

export interface GenerateGroceryListResponse {
  grocery_list_id: number
  items_count: number
  message: string
}

// Request Types
export interface CreateMealRequest {
  household_id: number
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  day_of_week: number // 0=Monday, 6=Sunday
  week_start_date: string // ISO date string (YYYY-MM-DD)
  ingredients?: string
  notes?: string
}

export interface UpdateMealRequest {
  name?: string
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  day_of_week?: number
  week_start_date?: string
  ingredients?: string
  notes?: string
}

export interface GenerateGroceryListRequest {
  week_start_date: string // ISO date string (YYYY-MM-DD)
  household_id: number
  grocery_list_name?: string
}

// API Functions

/**
 * Get all meals for a specific week
 * @param date - Any date within the target week (YYYY-MM-DD)
 * @param householdId - Household ID
 * @param token - Auth token
 */
export async function getWeeklyMeals(
  date: string,
  householdId: number,
  token: string
): Promise<WeeklyPlanResponse> {
  return get<WeeklyPlanResponse>(
    `/api/meals/week?date=${date}&household_id=${householdId}`,
    token
  )
}

/**
 * Get a single meal by ID
 */
export async function getMeal(
  mealId: number,
  token: string
): Promise<MealResponse> {
  return get<MealResponse>(`/api/meals/${mealId}`, token)
}

/**
 * Create a new meal
 */
export async function createMeal(
  data: CreateMealRequest,
  token: string
): Promise<MealResponse> {
  return post<MealResponse>('/api/meals', data, token)
}

/**
 * Update a meal
 */
export async function updateMeal(
  mealId: number,
  data: UpdateMealRequest,
  token: string
): Promise<MealResponse> {
  return put<MealResponse>(`/api/meals/${mealId}`, data, token)
}

/**
 * Delete a meal
 */
export async function deleteMeal(mealId: number, token: string): Promise<void> {
  return del<void>(`/api/meals/${mealId}`, token)
}

/**
 * Generate a grocery list from a week's meals
 */
export async function generateGroceryList(
  data: GenerateGroceryListRequest,
  token: string
): Promise<GenerateGroceryListResponse> {
  return post<GenerateGroceryListResponse>(
    '/api/meals/generate-grocery-list',
    data,
    token
  )
}

/**
 * Helper function to get the Monday of the week for a given date
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const dayOfWeek = date.getDay()
  // Convert Sunday (0) to 7 for easier calculation
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek
  // Calculate days since Monday (1)
  const daysSinceMonday = adjustedDay - 1
  const monday = new Date(date)
  monday.setDate(date.getDate() - daysSinceMonday)
  return monday.toISOString().split('T')[0] // Return YYYY-MM-DD
}

/**
 * Helper function to format date as YYYY-MM-DD
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]
}
