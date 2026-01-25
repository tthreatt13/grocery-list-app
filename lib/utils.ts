import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ItemCategory, GroceryItem, PantryItem, MealType, Meal } from './types'

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * Useful for conditional class application and avoiding style conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date | string, format?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'EEEE, MMMM d') {
    // Full weekday name, full month name, day
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(dateObj)
  }

  if (format === 'EEE') {
    // Short weekday name (Mon, Tue, Wed)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
    }).format(dateObj)
  }

  if (format === 'MMM d') {
    // Short month name and day (Nov 10)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  }

  // Default format
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`

  return formatDate(dateObj)
}

/**
 * Checks if a date is within the next N days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInDays = Math.floor(
    (dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  return diffInDays >= 0 && diffInDays <= days
}

/**
 * Checks if a date has passed
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getTime() < new Date().getTime()
}

/**
 * Formats a quantity with its unit
 */
export function formatQuantity(quantity: number, unit?: string): string {
  if (!unit) return quantity.toString()
  return `${quantity} ${unit}`
}

/**
 * Generates a random ID (simple implementation for prototype)
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Formats a date to a distance string from now (e.g., "2 hours ago")
 * Alias for formatRelativeTime for semantic clarity
 */
export function formatDistanceToNow(date: Date | string): string {
  return formatRelativeTime(date)
}

/**
 * Custom grocery store category order for sorting
 * Lower numbers appear first in the list
 */
const CATEGORY_ORDER: Record<ItemCategory, number> = {
  [ItemCategory.PRODUCE]: 0,
  [ItemCategory.DAIRY]: 1,
  [ItemCategory.MEAT]: 2,
  [ItemCategory.BAKERY]: 3,
  [ItemCategory.PANTRY]: 4,
  [ItemCategory.FROZEN]: 5,
  [ItemCategory.BEVERAGES]: 6,
  [ItemCategory.SNACKS]: 7,
  [ItemCategory.OTHER]: 8,
}

/**
 * Gets the sort order for a category
 * Returns 999 for unknown categories to put them at the end
 */
export function getCategoryOrder(category: ItemCategory): number {
  return CATEGORY_ORDER[category] ?? 999
}

/**
 * Sorts grocery items by category in grocery store layout order,
 * then alphabetically by name within each category
 */
export function sortItemsByCategory(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort((a, b) => {
    // First, sort by category order
    const categoryA = a.category || ItemCategory.OTHER
    const categoryB = b.category || ItemCategory.OTHER
    const categoryOrderA = getCategoryOrder(categoryA)
    const categoryOrderB = getCategoryOrder(categoryB)

    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB
    }

    // If same category, sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Sorts pantry items by category in grocery store layout order,
 * then alphabetically by name within each category
 */
export function sortPantryItemsByCategory(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => {
    // First, sort by category order
    const categoryA = a.category || ItemCategory.OTHER
    const categoryB = b.category || ItemCategory.OTHER
    const categoryOrderA = getCategoryOrder(categoryA)
    const categoryOrderB = getCategoryOrder(categoryB)

    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB
    }

    // If same category, sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Meal time order for sorting
 * Lower numbers appear first in the list
 */
const MEAL_ORDER: Record<MealType, number> = {
  [MealType.BREAKFAST]: 0,
  [MealType.LUNCH]: 1,
  [MealType.DINNER]: 2,
  [MealType.SNACK]: 3,
}

/**
 * Gets the sort order for a meal type
 * Returns 999 for unknown meal types to put them at the end
 */
export function getMealOrder(mealType?: MealType): number {
  if (!mealType) return 999 // No meal assignment goes last
  return MEAL_ORDER[mealType] ?? 999
}

/**
 * Sorts grocery items by meal time order (Breakfast → Lunch → Dinner → Snack → No meal),
 * then alphabetically by name within each meal type
 */
export function sortItemsByMealTime(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort((a, b) => {
    // First, sort by meal order
    const mealOrderA = getMealOrder(a.mealType)
    const mealOrderB = getMealOrder(b.mealType)

    if (mealOrderA !== mealOrderB) {
      return mealOrderA - mealOrderB
    }

    // If same meal type, sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Sorts grocery items by entry order (chronological order by addedAt timestamp)
 */
export function sortItemsByEntryOrder(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort((a, b) => {
    // Sort by addedAt timestamp (earliest first)
    return a.addedAt.getTime() - b.addedAt.getTime()
  })
}

/**
 * Normalizes ingredient input from various formats (bullets, numbers, newlines, commas)
 * into a consistent comma-separated string format.
 *
 * Handles:
 * - Newline-separated lists (one ingredient per line)
 * - Comma-separated lists
 * - Bulleted lists (-, *, •)
 * - Numbered lists (1., 2), etc.)
 * - Mixed formats
 *
 * @param raw - Raw ingredient string from user input (may contain bullets, numbers, newlines, etc.)
 * @returns Normalized comma-separated string (e.g., "Eggs, Milk, Bread") or empty string if no valid ingredients
 */
export function normalizeIngredientsInput(raw: string): string {
  if (!raw || !raw.trim()) {
    return ''
  }

  // Split by newlines first (for list format)
  let items: string[]
  if (raw.includes('\n')) {
    items = raw.split('\n')
  } else {
    // Split by comma for comma-separated format
    items = raw.split(',')
  }

  // Clean up items: remove empty strings, bullet points, numbers
  const cleanedItems: string[] = []
  for (let item of items) {
    // Trim whitespace
    item = item.trim()
    if (!item) {
      continue
    }

    // Remove trailing commas (from mixed comma+newline format)
    item = item.replace(/,\s*$/, '')

    // Remove common prefixes like "- ", "* ", "• ", etc.
    item = item.replace(/^[-*•]\s*/, '')

    // Remove leading numbers followed by punctuation (list markers like "1. ", "2) ", "3 - ")
    // But preserve numbers that are part of ingredient names (e.g., "2 cups", "1/2 cup")
    // Only match if number is followed by list punctuation (. or ) or space+dash
    item = item.replace(/^\d+[.)]\s*/, '') // "1. " or "2) "
    item = item.replace(/^\d+\s+-\s*/, '') // "3 - "

    // Trim again after removing prefixes
    item = item.trim()

    if (item) {
      cleanedItems.push(item)
    }
  }

  // Join with comma and space
  return cleanedItems.join(', ')
}

/**
 * Formats meal display name. If meal has no name, returns category with "TBD" placeholder.
 * @param meal - Meal object (may have optional name)
 * @returns Display name for the meal
 */
export function getMealDisplayName(meal: Meal): string {
  if (meal.name && meal.name.trim()) {
    return meal.name
  }
  const categoryLabels = {
    normal: 'Normal',
    quick_meal: 'Quick Meal',
    eat_out: 'Eat Out',
  }
  const categoryLabel = categoryLabels[meal.mealCategory || 'normal']
  return `${categoryLabel} - TBD`
}

/**
 * Parsed recipe step structure
 */
export interface RecipeStep {
  number: number
  instruction: string
}

/**
 * Parsed recipe instructions structure
 */
export interface ParsedRecipeInstructions {
  cookTime?: string
  steps: RecipeStep[]
  isStructured: boolean
}

/**
 * Parses recipe instructions from notes string.
 * Handles both structured format (with cook time and numbered steps) and legacy plain text.
 *
 * Structured format:
 * "Cook Time: 30 minutes\n\nStep 1: [instruction]\nStep 2: [instruction]"
 *
 * @param notes - Notes string that may contain recipe instructions
 * @returns Parsed recipe instructions with cook time and steps, or null if not a recipe format
 */
export function parseRecipeInstructions(
  notes?: string
): ParsedRecipeInstructions | null {
  if (!notes) {
    return null
  }

  const trimmedNotes = notes.trim()

  // Empty or whitespace-only string returns null
  if (!trimmedNotes) {
    return null
  }

  // Check if it's structured format (has "Step" markers)
  const hasSteps = /Step \d+:/i.test(trimmedNotes)

  // If it has steps (with or without cook time), parse as structured format
  if (hasSteps) {
    const cookTimeMatch = trimmedNotes.match(/Cook Time:\s*([^\n]+)/i)
    const cookTime = cookTimeMatch ? cookTimeMatch[1].trim() : undefined

    // Extract steps - match "Step X: [instruction]"
    const stepRegex = /Step (\d+):\s*([^\n]+(?:\n(?!Step \d+:)[^\n]+)*)/gi
    const steps: RecipeStep[] = []
    let match

    while ((match = stepRegex.exec(trimmedNotes)) !== null) {
      const stepNumber = parseInt(match[1], 10)
      const instruction = match[2].trim()
      if (instruction) {
        steps.push({ number: stepNumber, instruction })
      }
    }

    // Sort steps by number in case they're out of order
    steps.sort((a, b) => a.number - b.number)

    // If we found steps, return structured format
    if (steps.length > 0) {
      return {
        cookTime,
        steps,
        isStructured: true,
      }
    }
  }

  // Legacy plain text format - return as single step
  return {
    steps: [{ number: 1, instruction: trimmedNotes }],
    isStructured: false,
  }
}
