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
