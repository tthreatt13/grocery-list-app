/**
 * Time of day categories
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Day of week names
 */
export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

/**
 * Dashboard view modes based on user context
 */
export type DashboardViewMode =
  | 'morning_planning'
  | 'shopping'
  | 'routine_review'

/**
 * User context information
 */
export interface UserContext {
  timeOfDay: TimeOfDay
  dayOfWeek: DayOfWeek
  isShoppingDay: boolean
  viewMode: DashboardViewMode
}

/**
 * Gets the time of day category based on the current hour
 * @param date - Optional date to check (defaults to current time)
 * @returns Time of day category
 */
export function getTimeOfDay(date?: Date): TimeOfDay {
  const now = date || new Date()
  const hour = now.getHours()

  if (hour >= 5 && hour < 12) {
    return 'morning'
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon'
  } else if (hour >= 17 && hour < 22) {
    return 'evening'
  } else {
    return 'night'
  }
}

/**
 * Gets the day of week name
 * @param date - Optional date to check (defaults to current time)
 * @returns Day of week name in lowercase
 */
export function getDayOfWeek(date?: Date): DayOfWeek {
  const now = date || new Date()
  const dayIndex = now.getDay()
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return days[dayIndex]
}

/**
 * Checks if the current day is a typical shopping day
 * @param shoppingDays - Optional array of shopping days (defaults to ['saturday', 'sunday'])
 * @param date - Optional date to check (defaults to current time)
 * @returns True if current day is a shopping day
 */
export function isShoppingDay(
  shoppingDays: DayOfWeek[] = ['saturday', 'sunday'],
  date?: Date
): boolean {
  const dayOfWeek = getDayOfWeek(date)
  return shoppingDays.includes(dayOfWeek)
}

/**
 * Gets the user context including time of day, day of week, and view mode
 * @param shoppingDays - Optional array of shopping days (defaults to ['saturday', 'sunday'])
 * @param date - Optional date to check (defaults to current time)
 * @returns User context object
 */
export function getUserContext(
  shoppingDays: DayOfWeek[] = ['saturday', 'sunday'],
  date?: Date
): UserContext {
  const timeOfDay = getTimeOfDay(date)
  const dayOfWeek = getDayOfWeek(date)
  const isShopping = isShoppingDay(shoppingDays, date)

  // Determine view mode based on context
  let viewMode: DashboardViewMode
  if (isShopping) {
    viewMode = 'shopping'
  } else if (timeOfDay === 'morning') {
    viewMode = 'morning_planning'
  } else {
    viewMode = 'routine_review'
  }

  return {
    timeOfDay,
    dayOfWeek,
    isShoppingDay: isShopping,
    viewMode,
  }
}
