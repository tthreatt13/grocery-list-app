/**
 * Grocery List API functions
 */

import { get, post, put, del } from './client'

// API Response Types (matching backend schemas)
export interface GroceryItemResponse {
  id: number
  list_id: number
  name: string
  quantity?: string
  category?: string
  meal_type?: string
  notes?: string
  checked: boolean
  created_at: string
}

export interface GroceryListResponse {
  id: number
  household_id: number
  name: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface GroceryListWithItems extends GroceryListResponse {
  items: GroceryItemResponse[]
}

// Request Types
export interface CreateGroceryListRequest {
  name: string
  household_id: number
}

export interface UpdateGroceryListRequest {
  name?: string
}

export interface CreateGroceryItemRequest {
  name: string
  quantity?: string
  category?: string
  meal_type?: string
  notes?: string
  checked?: boolean
}

export interface UpdateGroceryItemRequest {
  name?: string
  quantity?: string
  category?: string
  meal_type?: string
  notes?: string
  checked?: boolean
}

// API Functions

/**
 * Get all grocery lists for user's households
 */
export async function getGroceryLists(
  token: string
): Promise<GroceryListResponse[]> {
  return get<GroceryListResponse[]>('/api/grocery-lists', token)
}

/**
 * Get all grocery lists with their items for user's households
 */
export async function getGroceryListsWithItems(
  token: string
): Promise<GroceryListWithItems[]> {
  return get<GroceryListWithItems[]>('/api/grocery-lists?include_items=true', token)
}

/**
 * Get a single grocery list with items
 */
export async function getGroceryList(
  listId: number,
  token: string
): Promise<GroceryListWithItems> {
  return get<GroceryListWithItems>(`/api/grocery-lists/${listId}`, token)
}

/**
 * Create a new grocery list
 */
export async function createGroceryList(
  data: CreateGroceryListRequest,
  token: string
): Promise<GroceryListResponse> {
  return post<GroceryListResponse>('/api/grocery-lists', data, token)
}

/**
 * Update a grocery list
 */
export async function updateGroceryList(
  listId: number,
  data: UpdateGroceryListRequest,
  token: string
): Promise<GroceryListResponse> {
  return put<GroceryListResponse>(`/api/grocery-lists/${listId}`, data, token)
}

/**
 * Delete a grocery list
 */
export async function deleteGroceryList(
  listId: number,
  token: string
): Promise<void> {
  return del<void>(`/api/grocery-lists/${listId}`, token)
}

/**
 * Add an item to a grocery list
 */
export async function addGroceryItem(
  listId: number,
  data: CreateGroceryItemRequest,
  token: string
): Promise<GroceryItemResponse> {
  return post<GroceryItemResponse>(
    `/api/grocery-lists/${listId}/items`,
    data,
    token
  )
}

/**
 * Update a grocery item
 */
export async function updateGroceryItem(
  listId: number,
  itemId: number,
  data: UpdateGroceryItemRequest,
  token: string
): Promise<GroceryItemResponse> {
  return put<GroceryItemResponse>(
    `/api/grocery-lists/${listId}/items/${itemId}`,
    data,
    token
  )
}

/**
 * Delete a grocery item
 */
export async function deleteGroceryItem(
  listId: number,
  itemId: number,
  token: string
): Promise<void> {
  return del<void>(`/api/grocery-lists/${listId}/items/${itemId}`, token)
}

/**
 * Get grocery items filtered by category
 */
export async function getGroceryItemsByCategory(
  listId: number,
  category: string,
  token: string
): Promise<GroceryItemResponse[]> {
  return get<GroceryItemResponse[]>(
    `/api/grocery-lists/${listId}/items?category=${encodeURIComponent(category)}`,
    token
  )
}

/**
 * Toggle item checked status (convenience function)
 */
export async function toggleGroceryItemChecked(
  listId: number,
  itemId: number,
  checked: boolean,
  token: string
): Promise<GroceryItemResponse> {
  return updateGroceryItem(listId, itemId, { checked }, token)
}

