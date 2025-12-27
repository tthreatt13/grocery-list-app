/**
 * Utility functions for managing dismissed suggestions and urgent items
 * in sessionStorage. Dismissed items persist for the browser session
 * and are cleared when the tab is closed.
 */

const DISMISSED_SUGGESTIONS_KEY = 'dismissed_suggestions'
const DISMISSED_URGENT_ITEMS_KEY = 'dismissed_urgent_items'

/**
 * Check if sessionStorage is available (handles SSR and private browsing)
 */
function isSessionStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const test = '__sessionStorage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get dismissed suggestion IDs from sessionStorage
 */
export function getDismissedSuggestions(): Set<string> {
  if (!isSessionStorageAvailable()) {
    return new Set()
  }

  try {
    const stored = sessionStorage.getItem(DISMISSED_SUGGESTIONS_KEY)
    if (!stored) {
      return new Set()
    }
    const ids = JSON.parse(stored) as string[]
    return new Set(ids)
  } catch {
    return new Set()
  }
}

/**
 * Get dismissed urgent item IDs from sessionStorage
 */
export function getDismissedUrgentItems(): Set<number> {
  if (!isSessionStorageAvailable()) {
    return new Set()
  }

  try {
    const stored = sessionStorage.getItem(DISMISSED_URGENT_ITEMS_KEY)
    if (!stored) {
      return new Set()
    }
    const ids = JSON.parse(stored) as number[]
    return new Set(ids)
  } catch {
    return new Set()
  }
}

/**
 * Dismiss a suggestion by adding its ID to sessionStorage
 */
export function dismissSuggestion(id: string): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    const dismissed = getDismissedSuggestions()
    dismissed.add(id)
    sessionStorage.setItem(
      DISMISSED_SUGGESTIONS_KEY,
      JSON.stringify(Array.from(dismissed))
    )
  } catch (error) {
    // Silently fail if sessionStorage is unavailable (e.g., quota exceeded)
    console.error('Failed to save dismissed suggestion:', error)
  }
}

/**
 * Dismiss an urgent item by adding its ID to sessionStorage
 */
export function dismissUrgentItem(id: number): void {
  if (!isSessionStorageAvailable()) {
    return
  }

  try {
    const dismissed = getDismissedUrgentItems()
    dismissed.add(id)
    sessionStorage.setItem(
      DISMISSED_URGENT_ITEMS_KEY,
      JSON.stringify(Array.from(dismissed))
    )
  } catch (error) {
    // Silently fail if sessionStorage is unavailable (e.g., quota exceeded)
    console.error('Failed to save dismissed urgent item:', error)
  }
}

