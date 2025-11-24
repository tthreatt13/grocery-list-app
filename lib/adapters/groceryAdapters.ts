/**
 * Adapter functions to transform API responses to frontend types
 */

import {
  GroceryListWithItems as ApiGroceryListWithItems,
  GroceryItemResponse as ApiGroceryItem,
} from '@/lib/api/grocery'
import { GroceryList, GroceryItem, ItemCategory, MealType } from '@/lib/types'

/**
 * Map API category string to ItemCategory enum
 */
function mapCategory(category?: string): ItemCategory {
  if (!category) return ItemCategory.OTHER

  const categoryMap: Record<string, ItemCategory> = {
    produce: ItemCategory.PRODUCE,
    dairy: ItemCategory.DAIRY,
    meat: ItemCategory.MEAT,
    bakery: ItemCategory.BAKERY,
    pantry: ItemCategory.PANTRY,
    frozen: ItemCategory.FROZEN,
    beverages: ItemCategory.BEVERAGES,
    snacks: ItemCategory.SNACKS,
  }

  return categoryMap[category.toLowerCase()] || ItemCategory.OTHER
}

/**
 * Map API meal_type string to MealType enum
 */
function mapMealType(mealType?: string): MealType | undefined {
  if (!mealType) return undefined

  const mealTypeMap: Record<string, MealType> = {
    breakfast: MealType.BREAKFAST,
    lunch: MealType.LUNCH,
    dinner: MealType.DINNER,
    snack: MealType.SNACK,
  }

  return mealTypeMap[mealType.toLowerCase()]
}

/**
 * Transform API grocery item to frontend grocery item
 */
export function transformGroceryItem(apiItem: ApiGroceryItem): GroceryItem {
  // Extract quantity number from string like "2 lbs" -> 2
  const extractQuantity = (quantityStr?: string): number => {
    if (!quantityStr) return 1
    const match = quantityStr.match(/^(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 1
  }

  return {
    id: apiItem.id.toString(),
    name: apiItem.name,
    quantity: extractQuantity(apiItem.quantity),
    unit: extractUnit(apiItem.quantity),
    category: mapCategory(apiItem.category),
    mealType: mapMealType(apiItem.meal_type),
    checked: apiItem.checked,
    notes: apiItem.notes,
    addedAt: new Date(apiItem.created_at),
  }
}

/**
 * Extract unit from quantity string (e.g., "2 gallons" -> "gallons")
 */
function extractUnit(quantity?: string): string | undefined {
  if (!quantity) return undefined

  const match = quantity.match(/\d+\s*(.+)/)
  return match ? match[1].trim() : undefined
}

/**
 * Transform API grocery list to frontend grocery list
 */
export function transformGroceryList(
  apiList: ApiGroceryListWithItems
): GroceryList {
  return {
    id: apiList.id.toString(),
    name: apiList.name,
    items: Array.isArray(apiList.items)
      ? apiList.items.map(transformGroceryItem)
      : [],
    createdBy: apiList.created_by.toString(),
    createdAt: new Date(apiList.created_at),
    updatedAt: new Date(apiList.updated_at),
    sharedWith: [], // TODO: Get this from household members
    isArchived: false, // TODO: Add archived field to API
  }
}

/**
 * Transform array of API grocery lists to frontend grocery lists
 */
export function transformGroceryLists(
  apiLists: ApiGroceryListWithItems[]
): GroceryList[] {
  if (!Array.isArray(apiLists)) {
    return []
  }
  return apiLists.map(transformGroceryList)
}
