/**
 * Pantry Inventory API functions
 */

import { get, post, put, del } from './client'

// API Response Types (matching backend schemas)
export interface PantryItemResponse {
  id: number
  household_id: number
  name: string
  quantity?: string
  category?: string
  expiration_date?: string
  low_stock_threshold?: number
  created_at: string
  updated_at: string
}

// Request Types
export interface CreatePantryItemRequest {
  household_id: number
  name: string
  quantity?: string
  category?: string
  expiration_date?: string
  low_stock_threshold?: number
}

export interface UpdatePantryItemRequest {
  name?: string
  quantity?: string
  category?: string
  expiration_date?: string
  low_stock_threshold?: number
}

// API Functions

/**
 * Get all pantry items for a household
 */
export async function getPantryItems(
  householdId: number,
  token: string,
  params?: {
    category?: string
    search?: string
  }
): Promise<PantryItemResponse[]> {
  const queryParams = new URLSearchParams()
  if (params?.category) queryParams.append('category', params.category)
  if (params?.search) queryParams.append('search', params.search)
  
  const query = queryParams.toString()
  const endpoint = query 
    ? `/api/pantry?household_id=${householdId}&${query}`
    : `/api/pantry?household_id=${householdId}`
    
  return get<PantryItemResponse[]>(endpoint, token)
}

/**
 * Get a single pantry item by ID
 */
export async function getPantryItem(
  itemId: number,
  token: string
): Promise<PantryItemResponse> {
  return get<PantryItemResponse>(`/api/pantry/${itemId}`, token)
}

/**
 * Create a new pantry item
 */
export async function createPantryItem(
  data: CreatePantryItemRequest,
  token: string
): Promise<PantryItemResponse> {
  return post<PantryItemResponse>('/api/pantry', data, token)
}

/**
 * Update a pantry item
 */
export async function updatePantryItem(
  itemId: number,
  data: UpdatePantryItemRequest,
  token: string
): Promise<PantryItemResponse> {
  return put<PantryItemResponse>(`/api/pantry/${itemId}`, data, token)
}

/**
 * Delete a pantry item
 */
export async function deletePantryItem(
  itemId: number,
  token: string
): Promise<void> {
  return del<void>(`/api/pantry/${itemId}`, token)
}

/**
 * Get items expiring within the next 7 days
 */
export async function getExpiringItems(
  householdId: number,
  token: string,
  days: number = 7
): Promise<PantryItemResponse[]> {
  return get<PantryItemResponse[]>(
    `/api/pantry/expiring?household_id=${householdId}&days=${days}`,
    token
  )
}

/**
 * Get items that are running low on stock
 */
export async function getLowStockItems(
  householdId: number,
  token: string
): Promise<PantryItemResponse[]> {
  return get<PantryItemResponse[]>(
    `/api/pantry/low-stock?household_id=${householdId}`,
    token
  )
}

