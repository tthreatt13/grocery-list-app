// Core type definitions for the Grocery List App

export interface GroceryItem {
  id: string
  name: string
  quantity: number
  unit?: string
  category: ItemCategory
  mealType?: MealType
  checked: boolean
  notes?: string
  addedBy?: string
  addedAt: Date
}

export interface GroceryList {
  id: string
  name: string
  householdId?: string
  items: GroceryItem[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  sharedWith: string[]
  isArchived: boolean
}

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit?: string
  category: ItemCategory
  expirationDate?: Date
  lowStockThreshold?: number
  imageUrl?: string
  addedAt: Date
  updatedAt: Date
}

export interface Meal {
  id: string
  name?: string
  mealType: MealType
  date: Date
  notes?: string
  ingredients?: string[]
  imageUrl?: string
  createdBy: string
  mealCategory?: 'normal' | 'quick_meal' | 'eat_out'
}

export interface HouseholdMember {
  id: string
  name: string
  email: string
  role: MemberRole
  avatarUrl?: string
  joinedAt: Date
  lastActive?: Date
}

export interface Household {
  id: string
  name: string
  members: HouseholdMember[]
  createdAt: Date
}

// Enums
export enum ItemCategory {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy',
  MEAT = 'Meat',
  BAKERY = 'Bakery',
  PANTRY = 'Pantry',
  FROZEN = 'Frozen',
  BEVERAGES = 'Beverages',
  SNACKS = 'Snacks',
  OTHER = 'Other',
}

export enum MealType {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
  SNACK = 'Snack',
}

export enum MemberRole {
  ADMIN = 'Admin',
  MEMBER = 'Member',
  VIEWER = 'Viewer',
}

export enum SortMethod {
  ENTRY_ORDER = 'Entry Order',
  CATEGORY = 'Category',
  MEAL_TIME = 'Meal Time',
  LOW_STOCK = 'Low Stock',
}

// AI Meal Planning Types
export interface MealSuggestion {
  meal_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  day_of_week: number // 0=Monday, 6=Sunday
  ingredients: string[]
  uses_pantry_items: string[]
  notes?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AISuggestRequest {
  household_id: number
  week_start_date: string // ISO date string (YYYY-MM-DD)
  user_message: string
  conversation_history?: ChatMessage[]
}

export interface AISuggestResponse {
  suggestions: MealSuggestion[]
  conversation_history: ChatMessage[]
}

// AI Grocery Review Types
export interface GrocerySuggestion {
  action: 'add' | 'remove' | 'swap'
  name: string
  quantity?: string
  category?: string
  meal_type?: string
  target_item_id?: number
  reason?: string
}

export interface AIReviewRequest {
  user_message: string
  conversation_history?: ChatMessage[]
}

export interface AIReviewResponse {
  gap_analysis: string
  suggestions: GrocerySuggestion[]
  conversation_history: ChatMessage[]
}
